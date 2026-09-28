"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, successState } from "@/lib/action-state";
import { changeUsername } from "@/lib/account";
import {
  sendAccountDeletedEmail,
  sendPasswordChangedEmail,
  sendUsernameChangedEmail,
  sendVerificationEmail,
} from "@/lib/account-email";
import { checkPasswordStrength, hashPassword, verifyPassword } from "@/lib/auth/password";
import { afterResponse } from "@/lib/after-response";
import { trackEvent } from "@/lib/events";
import { endSession, refreshSessionCookie, requireUser, rotateSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPortfolioForUser } from "@/lib/portfolio/queries";
import { DEFAULT_DESIGN, publishBlockers } from "@/lib/portfolio/types";
import { consumeRateLimit, limits as rateLimits, retryMessage } from "@/lib/rate-limit";
import {
  designSchema,
  fieldErrors,
  limits,
  profileSchema,
  projectSchema,
  readForm,
  skillSchema,
  usernameSchema,
} from "@/lib/validation";

const FIX_FIELDS = "Check the highlighted fields.";

/**
 * Refreshes the cached public page, the site-wide crawler files that list portfolios,
 * and every dashboard view after a change.
 */
function revalidatePortfolio(...usernames: string[]) {
  for (const u of usernames) revalidatePath(`/${u}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/dashboard", "layout");
}

async function ownPortfolioId(userId: string): Promise<string> {
  const portfolio = await db.portfolio.findUnique({ where: { userId }, select: { id: true } });
  if (portfolio) return portfolio.id;
  // Accounts always get a portfolio at sign-up; recreate defensively if it is missing.
  const created = await db.portfolio.create({
    data: { userId, displayName: "Your name" },
    select: { id: true },
  });
  return created.id;
}

/* ---------- Profile ---------- */

const PROFILE_FIELDS = [
  "displayName",
  "headline",
  "location",
  "availability",
  "bio",
  "pronouns",
  "githubUrl",
  "linkedinUrl",
  "websiteUrl",
  "resumeUrl",
  "contactEmail",
  "seoTitle",
  "seoDescription",
] as const;

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/profile");
  const values = readForm(formData, PROFILE_FIELDS);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return errorState(FIX_FIELDS, fieldErrors(parsed.error), values);
  await db.portfolio.update({ where: { userId: user.id }, data: parsed.data });
  revalidatePortfolio(user.username);
  await refreshSessionCookie();
  return successState("Profile saved.");
}

/* ---------- Design ---------- */

const DESIGN_FIELDS = [
  "accent",
  "colorMode",
  "fontStyle",
  "layout",
  "sectionOrder",
  "showGlance",
  "showSkills",
  "showContact",
] as const;

export async function updateDesign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/design");
  const values = readForm(formData, DESIGN_FIELDS);
  const parsed = designSchema.safeParse(values);
  if (!parsed.success) return errorState(FIX_FIELDS, fieldErrors(parsed.error), values);
  await db.portfolio.update({ where: { userId: user.id }, data: parsed.data });
  revalidatePortfolio(user.username);
  return successState("Design saved.");
}

export async function resetDesign(): Promise<ActionState> {
  const user = await requireUser("/dashboard/design");
  await db.portfolio.update({ where: { userId: user.id }, data: { ...DEFAULT_DESIGN } });
  revalidatePortfolio(user.username);
  return successState("Design reset to the defaults.");
}

/* ---------- Publishing ---------- */

export async function setPublished(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const publish = formData.get("publish") === "true";
  if (publish) {
    const portfolio = await getPortfolioForUser(user.id);
    const blockers = portfolio ? publishBlockers(portfolio) : ["Portfolio not found."];
    if (blockers.length) return errorState(`Almost there: ${blockers.join(" ")}`);
  }
  await db.portfolio.update({
    where: { userId: user.id },
    data: publish ? { published: true, publishedAt: new Date() } : { published: false },
  });
  revalidatePortfolio(user.username);
  if (publish) afterResponse("track publish", () => trackEvent("portfolio_published"));
  return successState(publish ? "Your portfolio is live." : "Your portfolio is hidden. Only you can see it.");
}

/* ---------- Projects ---------- */

const PROJECT_FIELDS = [
  "name",
  "label",
  "tagline",
  "summary",
  "stack",
  "highlights",
  "liveUrl",
  "sourceUrl",
] as const;

export async function saveProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/projects");
  const values = readForm(formData, PROJECT_FIELDS);
  const id = formData.get("id");
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) return errorState(FIX_FIELDS, fieldErrors(parsed.error), values);

  if (typeof id === "string" && id) {
    const { count } = await db.project.updateMany({
      where: { id, portfolio: { userId: user.id } },
      data: parsed.data,
    });
    if (count === 0) return errorState("That project no longer exists.");
  } else {
    const portfolioId = await ownPortfolioId(user.id);
    const total = await db.project.count({ where: { portfolioId } });
    if (total >= limits.projects)
      return errorState(`You can show up to ${limits.projects} projects.`, undefined, values);
    const last = await db.project.findFirst({
      where: { portfolioId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await db.project.create({ data: { ...parsed.data, portfolioId, position: (last?.position ?? -1) + 1 } });
  }
  revalidatePortfolio(user.username);
  return successState(id ? "Project saved." : "Project added.");
}

export async function deleteProject(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard/projects");
  const id = String(formData.get("id") ?? "");
  await db.project.deleteMany({ where: { id, portfolio: { userId: user.id } } });
  revalidatePortfolio(user.username);
}

/** Swaps an item with its neighbour. Works for projects and skills. */
async function move(kind: "project" | "skill", userId: string, id: string, direction: "up" | "down") {
  await db.$transaction(async (tx) => {
    const repo = kind === "project" ? tx.project : tx.skill;
    const where = { portfolio: { userId } };
    // Both delegates share the fields used here; the cast keeps one code path for both.
    const r = repo as unknown as typeof tx.project;
    const item = await r.findFirst({ where: { id, ...where }, select: { id: true, position: true } });
    if (!item) return;
    const neighbour = await r.findFirst({
      where: { ...where, position: direction === "up" ? { lt: item.position } : { gt: item.position } },
      orderBy: { position: direction === "up" ? "desc" : "asc" },
      select: { id: true, position: true },
    });
    if (!neighbour) return;
    await r.update({ where: { id: item.id }, data: { position: neighbour.position } });
    await r.update({ where: { id: neighbour.id }, data: { position: item.position } });
  });
}

export async function moveProject(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard/projects");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  await move("project", user.id, String(formData.get("id") ?? ""), direction);
  revalidatePortfolio(user.username);
}

/* ---------- Skills ---------- */

export async function saveSkill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/skills");
  const values = readForm(formData, ["area", "tools"] as const);
  const id = formData.get("id");
  const parsed = skillSchema.safeParse(values);
  if (!parsed.success) return errorState(FIX_FIELDS, fieldErrors(parsed.error), values);

  if (typeof id === "string" && id) {
    const { count } = await db.skill.updateMany({
      where: { id, portfolio: { userId: user.id } },
      data: parsed.data,
    });
    if (count === 0) return errorState("That skill no longer exists.");
  } else {
    const portfolioId = await ownPortfolioId(user.id);
    const total = await db.skill.count({ where: { portfolioId } });
    if (total >= limits.skills)
      return errorState(`You can list up to ${limits.skills} skill areas.`, undefined, values);
    const last = await db.skill.findFirst({
      where: { portfolioId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await db.skill.create({ data: { ...parsed.data, portfolioId, position: (last?.position ?? -1) + 1 } });
  }
  revalidatePortfolio(user.username);
  return successState(id ? "Skill saved." : "Skill added.");
}

export async function deleteSkill(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard/skills");
  await db.skill.deleteMany({
    where: { id: String(formData.get("id") ?? ""), portfolio: { userId: user.id } },
  });
  revalidatePortfolio(user.username);
}

export async function moveSkill(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard/skills");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  await move("skill", user.id, String(formData.get("id") ?? ""), direction);
  revalidatePortfolio(user.username);
}

/* ---------- Settings ---------- */

export async function updateUsername(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/settings");
  const raw = String(formData.get("username") ?? "");
  const echo = { username: raw };
  const rl = await consumeRateLimit(`sensitive:${user.id}`, rateLimits.sensitive);
  if (!rl.ok) return errorState(retryMessage(rl.retryAfterSeconds), undefined, echo);

  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return errorState(FIX_FIELDS, { username: parsed.error.issues[0]!.message }, echo);

  const result = await changeUsername(user.id, parsed.data);
  if (!result.ok) return errorState(FIX_FIELDS, { username: result.message }, echo);

  revalidatePortfolio(result.previous, result.username);
  afterResponse("username changed email", () => sendUsernameChangedEmail(user.id, result.previous));
  afterResponse("track rename", () => trackEvent("username_changed"));
  return successState(
    `Your address is now ${result.username}. Links to ${result.previous} redirect here for the next 30 days.`,
  );
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/settings");
  const { current, next } = readForm(formData, ["current", "next"] as const);
  const rl = await consumeRateLimit(`sensitive:${user.id}`, rateLimits.sensitive);
  if (!rl.ok) return errorState(retryMessage(rl.retryAfterSeconds));

  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    return errorState(FIX_FIELDS, { current: "That isn't your current password." });
  }
  const weak = checkPasswordStrength(next, [user.username, user.email.split("@")[0] ?? ""]);
  if (weak) return errorState(FIX_FIELDS, { next: weak });

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  // New session id for this device, and every other device signed out.
  await rotateSessions(user.id);
  afterResponse("password changed email", () => sendPasswordChangedEmail(user.id));
  return successState("Password changed. Other devices have been signed out.");
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/settings");
  const { confirm, password } = readForm(formData, ["confirm", "password"] as const);
  const rl = await consumeRateLimit(`sensitive:${user.id}`, rateLimits.sensitive);
  if (!rl.ok) return errorState(retryMessage(rl.retryAfterSeconds));

  if (confirm.trim().toLowerCase() !== user.username) {
    return errorState(FIX_FIELDS, { confirm: `Type ${user.username} to confirm.` });
  }
  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(password, record.passwordHash))) {
    return errorState(FIX_FIELDS, { password: "That isn't your password." });
  }
  const portfolio = await db.portfolio.findUnique({
    where: { userId: user.id },
    select: { displayName: true },
  });
  // Sessions, portfolio, projects, skills, redirects and email tokens cascade.
  await db.user.delete({ where: { id: user.id } });
  const name = portfolio?.displayName.split(/\s+/)[0] || user.username;
  afterResponse("account deleted email", () => sendAccountDeletedEmail(user.email, name, user.username));
  afterResponse("track deletion", () => trackEvent("account_deleted"));
  revalidatePath(`/${user.username}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  await endSession();
  redirect("/?deleted=1");
}

export async function resendVerification(): Promise<ActionState> {
  const user = await requireUser();
  if (user.emailVerifiedAt) return successState("Your email is already confirmed.");
  const rl = await consumeRateLimit(`verify-resend:${user.id}`, rateLimits.verifyResend);
  if (!rl.ok) return errorState(retryMessage(rl.retryAfterSeconds));
  const sent = await sendVerificationEmail(user.id).catch(() => ({ ok: false as const, error: "failed" }));
  if (!sent.ok) return errorState("We couldn't send the email right now. Try again in a few minutes.");
  return successState(`Sent. Check ${user.email} for the link.`);
}

export async function logOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
