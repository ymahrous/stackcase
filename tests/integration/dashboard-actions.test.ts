import { revalidatePath } from "next/cache";
import { describe, expect, it } from "vitest";
import {
  changePassword,
  deleteAccount,
  deleteProject,
  deleteSkill,
  moveProject,
  moveSkill,
  saveProject,
  saveSkill,
  setPublished,
  updateProfile,
  updateUsername,
} from "@/app/dashboard/actions";
import { idleState } from "@/lib/action-state";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { expectRedirect, form, request } from "../setup/request-context";
import { COOKIE, addProject, createUser, signInAs } from "./helpers";

const profile = {
  displayName: "Hana Sato",
  headline: "Platform engineer",
  location: "Tokyo",
  availability: "FREELANCE",
  bio: "I run Kubernetes so product teams don't have to think about it.",
  pronouns: "she/her",
  githubUrl: "github.com/hana",
  linkedinUrl: "",
  websiteUrl: "",
  resumeUrl: "hana.dev/cv.pdf",
  contactEmail: "Hana@Example.com",
  seoTitle: "Hana Sato, platform engineer in Tokyo",
  seoDescription: "",
};

const project = {
  name: "Shipyard",
  label: "Open source",
  tagline: "Preview environments per pull request",
  summary: "Spins up an isolated stack for every PR.",
  stack: "Go, Kubernetes, Go",
  highlights: "Used by 40 engineers\nCut review time in half",
  liveUrl: "",
  sourceUrl: "github.com/hana/shipyard",
};

describe("actions require a signed-in user", () => {
  it("redirects to login", async () => {
    expect(await expectRedirect(() => updateProfile(idleState, form(profile)))).toBe(
      "/login?next=%2Fdashboard%2Fprofile",
    );
  });
});

describe("updateProfile", () => {
  it("saves normalized values and refreshes the public page", async () => {
    const user = await createUser("hana", { signIn: true });
    const state = await updateProfile(idleState, form(profile));
    expect(state).toEqual({ status: "success", message: "Profile saved." });
    const p = await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } });
    expect(p).toMatchObject({
      displayName: "Hana Sato",
      availability: "FREELANCE",
      pronouns: "she/her",
      resumeUrl: "https://hana.dev/cv.pdf",
      seoTitle: "Hana Sato, platform engineer in Tokyo",
      seoDescription: "",
      githubUrl: "https://github.com/hana",
      linkedinUrl: null,
      contactEmail: "hana@example.com",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/hana");
  });

  it("returns field errors and keeps what was typed", async () => {
    await createUser("hana", { signIn: true });
    const state = await updateProfile(
      idleState,
      form({ ...profile, displayName: "", websiteUrl: "javascript:alert(1)" }),
    );
    expect(state.status).toBe("error");
    expect(Object.keys(state.fieldErrors!).sort()).toEqual(["displayName", "websiteUrl"]);
    expect(state.values?.bio).toBe(profile.bio);
  });
});

describe("setPublished", () => {
  it("blocks publishing an empty portfolio with a clear reason", async () => {
    await createUser("hana", { signIn: true });
    const state = await setPublished(idleState, form({ publish: "true" }));
    expect(state.message).toBe("Almost there: Add a headline. Add at least one project.");
  });

  it("publishes and unpublishes", async () => {
    const user = await createUser("hana", { signIn: true, headline: "Engineer" });
    await addProject(user.portfolio!.id, "One", 0);
    expect((await setPublished(idleState, form({ publish: "true" }))).message).toBe(
      "Your portfolio is live.",
    );
    const live = await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } });
    expect(live.published).toBe(true);
    expect(live.publishedAt).not.toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledWith("/llms.txt");
    await setPublished(idleState, form({ publish: "false" }));
    expect((await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } })).published).toBe(false);
  });
});

describe("projects", () => {
  it("adds projects in order with parsed lists", async () => {
    const user = await createUser("hana", { signIn: true });
    expect((await saveProject(idleState, form(project))).message).toBe("Project added.");
    await saveProject(idleState, form({ ...project, name: "Second" }));
    const rows = await db.project.findMany({
      where: { portfolioId: user.portfolio!.id },
      orderBy: { position: "asc" },
    });
    expect(rows.map((r) => [r.name, r.position])).toEqual([
      ["Shipyard", 0],
      ["Second", 1],
    ]);
    expect(rows[0]).toMatchObject({
      stack: ["Go", "Kubernetes"],
      highlights: ["Used by 40 engineers", "Cut review time in half"],
      sourceUrl: "https://github.com/hana/shipyard",
      liveUrl: null,
    });
  });

  it("edits, reorders and deletes", async () => {
    const user = await createUser("hana", { signIn: true });
    const a = await addProject(user.portfolio!.id, "A", 0);
    const b = await addProject(user.portfolio!.id, "B", 1);
    expect((await saveProject(idleState, form({ ...project, id: a.id, name: "A2" }))).message).toBe(
      "Project saved.",
    );
    await moveProject(form({ id: b.id, direction: "up" }));
    let order = await db.project.findMany({ orderBy: { position: "asc" }, select: { name: true } });
    expect(order.map((o) => o.name)).toEqual(["B", "A2"]);
    await moveProject(form({ id: b.id, direction: "up" })); // already first: no-op
    await moveProject(form({ id: b.id, direction: "down" }));
    order = await db.project.findMany({ orderBy: { position: "asc" }, select: { name: true } });
    expect(order.map((o) => o.name)).toEqual(["A2", "B"]);
    await deleteProject(form({ id: a.id }));
    expect(await db.project.count()).toBe(1);
  });

  it("never touches another user's projects", async () => {
    const owner = await createUser("owner");
    const theirs = await addProject(owner.portfolio!.id, "Theirs", 0);
    await createUser("intruder", { signIn: true });
    const state = await saveProject(idleState, form({ ...project, id: theirs.id, name: "Hacked" }));
    expect(state.message).toBe("That project no longer exists.");
    await deleteProject(form({ id: theirs.id }));
    await moveProject(form({ id: theirs.id, direction: "down" }));
    expect(await db.project.findUniqueOrThrow({ where: { id: theirs.id } })).toMatchObject({
      name: "Theirs",
    });
  });

  it("caps the number of projects", async () => {
    const user = await createUser("hana", { signIn: true });
    for (let i = 0; i < 20; i++) await addProject(user.portfolio!.id, `P${i}`, i);
    expect((await saveProject(idleState, form(project))).message).toMatch(/up to 20 projects/);
  });

  it("validates input", async () => {
    await createUser("hana", { signIn: true });
    const state = await saveProject(idleState, form({ ...project, name: "", liveUrl: "ftp://x.y" }));
    expect(Object.keys(state.fieldErrors!).sort()).toEqual(["liveUrl", "name"]);
  });
});

describe("skills", () => {
  it("adds, edits, reorders and deletes", async () => {
    await createUser("hana", { signIn: true });
    await saveSkill(idleState, form({ area: "Cloud", tools: "AWS" }));
    await saveSkill(idleState, form({ area: "Backend", tools: "Go" }));
    const [cloud, backend] = await db.skill.findMany({ orderBy: { position: "asc" } });
    expect(
      (await saveSkill(idleState, form({ id: cloud!.id, area: "Cloud", tools: "AWS, GCP" }))).message,
    ).toBe("Skill saved.");
    await moveSkill(form({ id: backend!.id, direction: "up" }));
    const order = await db.skill.findMany({
      orderBy: { position: "asc" },
      select: { area: true, tools: true },
    });
    expect(order).toEqual([
      { area: "Backend", tools: "Go" },
      { area: "Cloud", tools: "AWS, GCP" },
    ]);
    await deleteSkill(form({ id: cloud!.id }));
    expect(await db.skill.count()).toBe(1);
    expect((await saveSkill(idleState, form({ area: "", tools: "" }))).fieldErrors).toHaveProperty("area");
    expect((await saveSkill(idleState, form({ id: "missing", area: "X", tools: "Y" }))).message).toMatch(
      /no longer/,
    );
  });
});

describe("updateUsername", () => {
  it("renames, keeps a redirect and refreshes both addresses", async () => {
    await createUser("hana", { signIn: true });
    const state = await updateUsername(idleState, form({ username: "hana-sato" }));
    expect(state.message).toBe(
      "Your address is now hana-sato. Links to hana redirect here for the next 30 days.",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/hana");
    expect(revalidatePath).toHaveBeenCalledWith("/hana-sato");
  });

  it("explains why a name can't be used", async () => {
    await createUser("taken");
    await createUser("hana", { signIn: true });
    expect((await updateUsername(idleState, form({ username: "taken" }))).fieldErrors?.username).toBe(
      "That username is taken.",
    );
    expect((await updateUsername(idleState, form({ username: "A" }))).fieldErrors?.username).toMatch(
      /at least 3/,
    );
  });

  it("is rate limited", async () => {
    await createUser("hana", { signIn: true });
    for (let i = 0; i < 10; i++) await updateUsername(idleState, form({ username: "x" }));
    expect((await updateUsername(idleState, form({ username: "hana-new" }))).message).toMatch(/too many/i);
  });
});

describe("changePassword", () => {
  it("requires the current password and signs out other devices", async () => {
    const user = await createUser("hana", { password: "old password here", signIn: true });
    const current = request.cookies.get(COOKIE)!;
    await signInAs(user.id); // a second device
    request.cookies.set(COOKIE, current);

    expect(
      (await changePassword(idleState, form({ current: "wrong", next: "new password here" }))).fieldErrors,
    ).toEqual({
      current: "That isn't your current password.",
    });
    expect(
      (await changePassword(idleState, form({ current: "old password here", next: "short" }))).fieldErrors
        ?.next,
    ).toMatch(/at least 10/);
    const ok = await changePassword(
      idleState,
      form({ current: "old password here", next: "brand new passphrase" }),
    );
    expect(ok.message).toMatch(/Other devices have been signed out/);
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("brand new passphrase", after.passwordHash)).toBe(true);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
  });
});

describe("deleteAccount", () => {
  it("needs the username typed and the password", async () => {
    await createUser("hana", { password: "my password 123", signIn: true });
    expect(
      (await deleteAccount(idleState, form({ confirm: "nope", password: "my password 123" }))).fieldErrors,
    ).toEqual({
      confirm: "Type hana to confirm.",
    });
    expect(
      (await deleteAccount(idleState, form({ confirm: "hana", password: "wrong" }))).fieldErrors,
    ).toEqual({
      password: "That isn't your password.",
    });
  });

  it("deletes everything and signs out", async () => {
    const user = await createUser("hana", { password: "my password 123", signIn: true });
    await addProject(user.portfolio!.id, "P", 0);
    await db.usernameRedirect.create({ data: { username: "hana-old", userId: user.id } });
    const to = await expectRedirect(() =>
      deleteAccount(idleState, form({ confirm: " Hana ", password: "my password 123" })),
    );
    expect(to).toBe("/?deleted=1");
    for (const count of await Promise.all([
      db.user.count(),
      db.portfolio.count(),
      db.project.count(),
      db.session.count(),
      db.usernameRedirect.count(),
    ])) {
      expect(count).toBe(0);
    }
    expect(request.cookies.has(COOKIE)).toBe(false);
  });
});
