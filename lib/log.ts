/**
 * Structured logs: one JSON object per line, so Vercel Observability (and any log drain) can filter by
 * event and level. Never pass secrets, tokens, passwords or email bodies.
 */
type Level = "info" | "warn" | "error";

export function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  const entry = { level, event, time: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry, (_key, value) =>
    value instanceof Error ? { name: value.name, message: value.message } : value,
  );
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
