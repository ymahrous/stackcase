import "server-only";
import { after } from "next/server";
import { log } from "@/lib/log";

/**
 * Runs work after the response is sent (Vercel keeps the function alive for it). Used for emails:
 * responses stay fast, and the password reset form answers in the same time whether or not the account
 * exists, so response timing can't reveal registered emails. Errors are logged, never thrown.
 */
export function afterResponse(label: string, task: () => Promise<unknown>): void {
  after(async () => {
    try {
      await task();
    } catch (error) {
      log("error", "after_response.failed", { task: label, error });
    }
  });
}
