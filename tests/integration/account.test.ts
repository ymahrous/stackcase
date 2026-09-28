import { describe, expect, it } from "vitest";
import { changeUsername, getUsernameStatus, nextUsernameChangeAt } from "@/lib/account";
import { db } from "@/lib/db";
import { createUser } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;

describe("getUsernameStatus", () => {
  it("reports free, taken and invalid names", async () => {
    await createUser("erin");
    expect(await getUsernameStatus("Frank")).toMatchObject({ available: true, username: "frank" });
    expect(await getUsernameStatus("erin")).toMatchObject({
      available: false,
      suggestions: ["erin-dev", "erin-2", "erin-3"],
    });
    expect(await getUsernameStatus("www")).toMatchObject({
      available: false,
      message: expect.stringMatching(/reserved/),
    });
  });

  it("skips suggestions that are also taken", async () => {
    await createUser("erin");
    await createUser("erin-dev");
    expect(
      (await getUsernameStatus("erin")).available === false && (await getUsernameStatus("erin")),
    ).toMatchObject({
      suggestions: ["erin-2", "erin-3", "erin-4"],
    });
  });

  it("treats a user's own names as available to them", async () => {
    const erin = await createUser("erin");
    expect(await getUsernameStatus("erin", erin.id)).toMatchObject({ available: true });
  });

  it("holds released names for 30 days", async () => {
    const erin = await createUser("erin");
    await db.usernameRedirect.create({ data: { username: "old-erin", userId: erin.id } });
    expect(await getUsernameStatus("old-erin")).toMatchObject({ available: false });
    expect(await getUsernameStatus("old-erin", erin.id)).toMatchObject({ available: true });
    await db.usernameRedirect.update({
      where: { username: "old-erin" },
      data: { createdAt: new Date(Date.now() - 31 * DAY) },
    });
    expect(await getUsernameStatus("old-erin")).toMatchObject({ available: true });
  });
});

describe("changeUsername", () => {
  it("renames and leaves a redirect behind", async () => {
    const erin = await createUser("erin");
    const result = await changeUsername(erin.id, "Erin-Codes");
    expect(result).toEqual({ ok: true, previous: "erin", username: "erin-codes" });
    const after = await db.user.findUniqueOrThrow({ where: { id: erin.id } });
    expect(after.username).toBe("erin-codes");
    expect(after.usernameChangedAt).not.toBeNull();
    expect(await db.usernameRedirect.findUnique({ where: { username: "erin" } })).toMatchObject({
      userId: erin.id,
    });
  });

  it("enforces the cooldown between changes", async () => {
    const erin = await createUser("erin");
    await changeUsername(erin.id, "erin-two");
    const again = await changeUsername(erin.id, "erin-three");
    expect(again).toMatchObject({
      ok: false,
      message: expect.stringMatching(/change your username again on/),
    });
    const later = await changeUsername(erin.id, "erin-three", new Date(Date.now() + 8 * DAY));
    expect(later.ok).toBe(true);
  });

  it("lets a user take back their own previous name", async () => {
    const erin = await createUser("erin");
    await changeUsername(erin.id, "erin-two");
    const back = await changeUsername(erin.id, "erin", new Date(Date.now() + 8 * DAY));
    expect(back.ok).toBe(true);
    expect(await db.usernameRedirect.findUnique({ where: { username: "erin" } })).toBeNull();
    expect(await db.usernameRedirect.findUnique({ where: { username: "erin-two" } })).not.toBeNull();
  });

  it("refuses taken, held, invalid and unchanged names", async () => {
    const erin = await createUser("erin");
    const gus = await createUser("gus");
    await db.usernameRedirect.create({ data: { username: "held-name", userId: gus.id } });
    expect(await changeUsername(erin.id, "gus")).toMatchObject({
      ok: false,
      message: "That username is taken.",
    });
    expect(await changeUsername(erin.id, "held-name")).toMatchObject({ ok: false });
    expect(await changeUsername(erin.id, "erin")).toMatchObject({
      ok: false,
      message: "That's already your username.",
    });
    expect(await changeUsername(erin.id, "api")).toMatchObject({
      ok: false,
      message: expect.stringMatching(/reserved/),
    });
    expect(await changeUsername("missing", "whatever")).toMatchObject({
      ok: false,
      message: "Account not found.",
    });
  });

  it("claims an expired hold from someone else", async () => {
    const erin = await createUser("erin");
    const gus = await createUser("gus");
    await db.usernameRedirect.create({
      data: { username: "vintage", userId: gus.id, createdAt: new Date(Date.now() - 40 * DAY) },
    });
    expect((await changeUsername(erin.id, "vintage")).ok).toBe(true);
    expect(await db.usernameRedirect.findUnique({ where: { username: "vintage" } })).toBeNull();
  });
});

describe("nextUsernameChangeAt", () => {
  it("is null for users who never changed their name", () => {
    expect(nextUsernameChangeAt(null)).toBeNull();
    expect(nextUsernameChangeAt(new Date("2026-01-01T00:00:00Z"))?.toISOString()).toBe(
      "2026-01-08T00:00:00.000Z",
    );
  });
});
