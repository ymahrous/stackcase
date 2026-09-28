"use client";

import { useEffect, useState } from "react";
import { checkUsernameFormat, normalizeUsername, usernameProblemMessages } from "@/lib/username";

export type CheckState =
  | { state: "idle" }
  | { state: "checking"; username: string }
  | { state: "available"; username: string; message: string }
  | { state: "unavailable"; username: string; message: string; suggestions: string[] }
  | { state: "error"; username: string; message: string };

/**
 * Debounced availability check against /api/username. Format errors are reported instantly, without a request.
 * `current` is the signed-in user's own username, reported as "your current username".
 */
export function useUsernameCheck(raw: string, current?: string, delay = 350): CheckState {
  const [result, setResult] = useState<CheckState>({ state: "idle" });
  const username = normalizeUsername(raw);
  const problem = username ? checkUsernameFormat(username) : null;

  useEffect(() => {
    if (!username || problem || username === current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult({ state: "checking", username });
      try {
        const res = await fetch(`/api/username?u=${encodeURIComponent(username)}`, {
          signal: controller.signal,
        });
        if (res.status === 429) {
          setResult({ state: "error", username, message: "Checking too fast. Pause a moment." });
          return;
        }
        const data = (await res.json()) as { available: boolean; message: string; suggestions?: string[] };
        setResult(
          data.available
            ? { state: "available", username, message: data.message }
            : { state: "unavailable", username, message: data.message, suggestions: data.suggestions ?? [] },
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResult({ state: "error", username, message: "Couldn't check right now." });
        }
      }
    }, delay);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [username, problem, current, delay]);

  if (!username) return { state: "idle" };
  if (problem)
    return { state: "unavailable", username, message: usernameProblemMessages[problem], suggestions: [] };
  if (username === current)
    return { state: "available", username, message: "This is your current username." };
  if (result.state !== "idle" && result.username === username) return result;
  return { state: "checking", username };
}
