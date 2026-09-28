/** "ada-lovelace" -> "Ada Lovelace". A starting display name the user can change. */
export function displayNameFromUsername(username: string): string {
  return username
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
