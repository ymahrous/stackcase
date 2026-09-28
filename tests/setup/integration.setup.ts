import { afterAll, beforeEach, vi } from "vitest";
import { outbox, pendingAfter, request } from "./request-context";

/* Next.js request APIs, backed by an in-memory request the tests control. */
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      request.cookies.has(name) ? { name, value: request.cookies.get(name)! } : undefined,
    has: (name: string) => request.cookies.has(name),
    set: (name: string, value: string, options?: { expires?: Date }) => {
      request.cookies.set(name, value);
      request.cookieOptions.set(name, options ?? {});
    },
    delete: (name: string) => {
      request.cookies.delete(name);
    },
  }),
  headers: async () => new Headers({ "x-forwarded-for": request.ip }),
}));

vi.mock("next/navigation", async () => {
  const { RedirectSignal, NotFoundSignal } = await import("./request-context");
  return {
    redirect: (url: string) => {
      throw new RedirectSignal(url, 307);
    },
    permanentRedirect: (url: string) => {
      throw new RedirectSignal(url, 308);
    },
    notFound: () => {
      throw new NotFoundSignal();
    },
    usePathname: () => "/dashboard",
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, prefetch: () => {} }),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

// Work scheduled after the response runs immediately in tests, so its effects can be asserted.
vi.mock("@/lib/after-response", () => ({
  afterResponse: (_label: string, task: () => Promise<unknown>) => {
    pendingAfter.push(task().catch(() => undefined));
  },
}));

vi.mock("@/lib/email/send", async () => {
  const { outbox: box } = await import("./request-context");
  return {
    sendEmail: vi.fn(async (email: (typeof box)[number]) => {
      box.push(email);
      return { ok: true, id: `test-${box.length}` };
    }),
  };
});

beforeEach(async () => {
  request.reset();
  outbox.length = 0;
  const { db } = await import("@/lib/db");
  await db.$executeRawUnsafe(
    'TRUNCATE "RateLimit", "EmailToken", "UsernameRedirect", "Skill", "Project", "Portfolio", "Session", "User" CASCADE',
  );
});

afterAll(async () => {
  const { db } = await import("@/lib/db");
  await db.$disconnect();
});
