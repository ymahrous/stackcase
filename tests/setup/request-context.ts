/** Tasks scheduled with afterResponse() during a test; await flushAfter() before asserting on their effects. */
export const pendingAfter: Promise<unknown>[] = [];
export async function flushAfter() {
  while (pendingAfter.length) await pendingAfter.shift();
}

/** Emails "sent" during a test, captured instead of going to Resend. */
export const outbox: { to: string; tag: string; subject: string; html: string; text: string }[] = [];

/** The first URL in the most recent email with this tag. */
export function lastLink(tag: string): string {
  const email = [...outbox].reverse().find((e) => e.tag === tag);
  if (!email) throw new Error(`No "${tag}" email was sent`);
  const match = /https?:\/\/\S+/.exec(email.text);
  if (!match) throw new Error(`No link in "${tag}" email`);
  return match[0];
}

/** The fake incoming request that mocked next/headers reads from. */
export const request = {
  cookies: new Map<string, string>(),
  cookieOptions: new Map<
    string,
    { expires?: Date; httpOnly?: boolean; secure?: boolean; sameSite?: string }
  >(),
  ip: "203.0.113.1",
  reset() {
    this.cookies.clear();
    this.cookieOptions.clear();
    this.ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
  },
};

export class RedirectSignal extends Error {
  constructor(
    public url: string,
    public status: number,
  ) {
    super(`NEXT_REDIRECT ${status} ${url}`);
  }
}

export class NotFoundSignal extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
  }
}

/** Runs an action that is expected to redirect and returns where it went. */
export async function expectRedirect(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.url;
    throw error;
  }
  throw new Error("Expected a redirect");
}

export function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}
