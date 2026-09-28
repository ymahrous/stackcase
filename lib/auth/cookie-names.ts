import { sessionCookieName } from "./tokens";

/** Both possible names, so the proxy works on http (local) and https (deployed) without importing server-only code. */
export const SESSION_COOKIE_NAMES = [sessionCookieName("https:"), sessionCookieName("http:")] as const;
