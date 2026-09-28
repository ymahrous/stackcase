# CLAUDE.md

Guidance for Claude Code in this repository. The project rules, commands and map live in AGENTS.md, which is shared by every coding agent:

@AGENTS.md

## Working style for Claude

- **Plan, then verify.** For anything beyond a one-file fix, list the files you'll touch, make the change, then run the checks in "Before you finish a change" in AGENTS.md. Report what you ran and the result; don't claim tests pass without running them.
- **Read before editing.** Prettier rewrites files after you save them, so re-read a file before a follow-up edit rather than editing from memory.
- **Search, don't guess.** Find existing helpers with Grep before writing new ones: URL building (`lib/site.ts`), validation (`lib/validation.ts`), rate limits (`lib/rate-limit.ts`), logging (`lib/log.ts`), email rendering (`lib/email/templates.tsx`).
- **Keep changes scoped.** Don't reformat, rename or refactor unrelated code. If you notice a separate problem, mention it instead of fixing it silently.
- **Ask before** adding a dependency, changing the database schema, changing security headers, or editing legal text beyond what the task needs.
- **Long-running commands:** the e2e suite starts `next start` on port 3100. Make sure nothing else is on that port, and don't leave servers running when you finish.
- **Coverage:** after `npm run test:coverage`, check that files you touched are fully covered. Prefer a real test over a coverage exclusion; delete unused code instead.
- **Secrets:** never print or commit values from `.env.local`. Use fictional sample data (for example `ada@example.com`) in tests and previews.

## Useful entry points

| Task                           | Start here                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Change landing copy or FAQ     | `app/(marketing)/content.ts`, then `lib/brand.ts` for brand facts                                                                                                                       |
| Add a dashboard setting        | `app/dashboard/settings/page.tsx` and `app/dashboard/actions.ts`                                                                                                                        |
| Add a portfolio design option  | `prisma/schema.prisma`, `lib/validation.ts` (`designSchema`), `lib/portfolio/types.ts` (`DEFAULT_DESIGN`, `designAttributes`), `components/dashboard/DesignForm.tsx`, `app/globals.css` |
| Add or extend tests            | Kinds and locations in AGENTS.md → Tests; coverage report in `coverage/index.html`                                                                                                      |
| Add or change an account email | `emails/`, `lib/email/templates.tsx`, `lib/account-email.ts`                                                                                                                            |
| SEO, JSON-LD, llms.txt         | `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`                                                                                                                                         |
| Routing, redirects, auth gate  | `lib/routing.ts` (pure, unit-tested), applied by `proxy.ts`                                                                                                                             |
| Legal pages                    | `app/(legal)/*`, `lib/legal.ts`, `components/legal/LegalDocument.tsx`                                                                                                                   |
