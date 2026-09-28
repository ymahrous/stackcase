/**
 * Unhappy paths and defensive branches: rate limits, missing data, races and malformed input.
 * These are the cases users rarely hit and attackers aim for.
 */
import { describe, expect, it } from "vitest";
import { confirmEmail, logIn, requestPasswordReset, resetPassword, signUp } from "@/app/(auth)/actions";
import {
  changePassword,
  deleteAccount,
  deleteProject,
  deleteSkill,
  logOutAction,
  moveSkill,
  saveSkill,
  setPublished,
} from "@/app/dashboard/actions";
import { idleState } from "@/lib/action-state";
import { hashSessionToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { expectRedirect, form, request } from "../setup/request-context";
import { COOKIE, addProject, createUser } from "./helpers";

const PASSWORD = "a long test password";

describe("sign-up and log-in edge cases", () => {
  it("suggests free alternatives when the username is taken", async () => {
    await createUser("grace");
    const state = await signUp(
      idleState,
      form({ email: "g@example.com", password: "purple tractor sings", username: "grace", accept: "yes" }),
    );
    expect(state.fieldErrors?.username).toMatch(/Try grace-dev/);
  });

  it("treats malformed log-in input as wrong credentials, without revealing why", async () => {
    const state = await logIn(idleState, form({ email: `${"x".repeat(300)}@example.com`, password: "x" }));
    expect(state).toMatchObject({ status: "error", message: expect.stringMatching(/email or password/i) });
  });

  it("handles a reset request with no email field", async () => {
    const state = await requestPasswordReset(idleState, new FormData());
    expect(state.status).toBe("error");
  });

  it("rate-limits reset submissions per IP", async () => {
    let state = idleState;
    for (let i = 0; i < 6; i++)
      state = await resetPassword(idleState, form({ token: "nope", password: "x" }));
    expect(state.message).toMatch(/Too many attempts|Try again/i);
  });

  it("rejects a confirmation without a token", async () => {
    const state = await confirmEmail(idleState, new FormData());
    expect(state).toMatchObject({ status: "error", message: expect.stringMatching(/expired|invalid|used/i) });
  });
});

describe("dashboard edge cases", () => {
  it("recreates a missing portfolio instead of failing", async () => {
    const user = await createUser("hopper", { signIn: true });
    await db.portfolio.delete({ where: { userId: user.id } });
    const state = await saveSkill(idleState, form({ area: "Compilers", tools: "COBOL" }));
    expect(state.status).toBe("success");
    const portfolio = await db.portfolio.findUniqueOrThrow({
      where: { userId: user.id },
      include: { skills: true },
    });
    expect(portfolio.skills.map((s) => s.area)).toEqual(["Compilers"]);
  });

  it("won't publish when the portfolio is missing", async () => {
    const user = await createUser("hopper", { signIn: true });
    await db.portfolio.delete({ where: { userId: user.id } });
    const state = await setPublished(idleState, form({ publish: "true" }));
    expect(state.message).toMatch(/Portfolio not found/);
  });

  it("caps the number of skill areas", async () => {
    const user = await createUser("hopper", { signIn: true });
    await db.skill.createMany({
      data: Array.from({ length: 20 }, (_, i) => ({
        portfolioId: user.portfolio!.id,
        position: i,
        area: `Area ${i}`,
        tools: "x",
      })),
    });
    const state = await saveSkill(idleState, form({ area: "One more", tools: "y" }));
    expect(state.message).toMatch(/up to 20 skill areas/);
    expect(state.values).toMatchObject({ area: "One more" });
  });

  it("delete and move with a missing id change nothing", async () => {
    const user = await createUser("hopper", { signIn: true });
    await addProject(user.portfolio!.id, "Keep me", 0);
    await db.skill.create({ data: { portfolioId: user.portfolio!.id, position: 0, area: "A", tools: "B" } });
    await deleteProject(new FormData());
    await deleteSkill(new FormData());
    await moveSkill(new FormData());
    expect(await db.project.count()).toBe(1);
    expect(await db.skill.count()).toBe(1);
  });

  it("rate-limits password changes and rejects weak new passwords", async () => {
    await createUser("hopper", { signIn: true });
    const weak = await changePassword(idleState, form({ current: PASSWORD, next: "password123" }));
    expect(weak.fieldErrors?.next).toMatch(/common/);
    let state = weak;
    for (let i = 0; i < 10; i++)
      state = await changePassword(idleState, form({ current: "wrong", next: "x" }));
    expect(state.message).toMatch(/Too many attempts|Try again/i);
  });

  it("rate-limits account deletion attempts", async () => {
    await createUser("hopper", { signIn: true });
    let state = idleState;
    for (let i = 0; i < 11; i++)
      state = await deleteAccount(idleState, form({ confirm: "hopper", password: "wrong" }));
    expect(state.message).toMatch(/Too many attempts|Try again/i);
    expect(await db.user.count()).toBe(1);
  });

  it("deletes an account even if its portfolio is already gone", async () => {
    const user = await createUser("hopper", { signIn: true });
    await db.portfolio.delete({ where: { userId: user.id } });
    await expectRedirect(() => deleteAccount(idleState, form({ confirm: "hopper", password: PASSWORD })));
    expect(await db.user.count()).toBe(0);
  });

  it("logging out ends the session and returns home", async () => {
    await createUser("hopper", { signIn: true });
    const token = request.cookies.get(COOKIE)!;
    expect(await expectRedirect(() => logOutAction())).toBe("/");
    expect(await db.session.findUnique({ where: { id: hashSessionToken(token) } })).toBeNull();
  });
});
