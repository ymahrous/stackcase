# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini and others) working in this repository. Humans should start with [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md); this file is the short, operational version of both.

## What this is

Stackcase is a multi-user portfolio builder for software engineers: Next.js 16 (App Router), React 19, TypeScript (strict), Prisma 7 on Postgres, Resend and React Email, deployed on Vercel. Portfolios are public at `<NEXT_PUBLIC_SITE_URL>/<username>`; everything else (landing, auth, dashboard, legal pages) lives on the same origin.

## Commands

```bash
npm install                  # runs `prisma generate` (client in lib/generated/prisma)
npm run dev                  # http://localhost:3000
npm run lint                 # ESLint
npm run typecheck            # tsc --noEmit
npm run format               # Prettier (write); CI runs format:check
npm test                     # unit + integration (needs Postgres, see below)
npm run test:unit            # jsdom only, no database
npm run test:coverage        # thresholds: 98% lines, 97% statements/functions, 92% branches
npm run test:e2e             # Playwright + axe against a production build on :3100
npm run email:dev            # React Email preview at http://localhost:3001
npm run brand:assets         # regenerate logo/icon files from lib/brand-mark.ts
npm run db:reset             # drop and re-apply migrations to DATABASE_URL (refuses in production)
```

Databases: integration tests use `TEST_DATABASE_URL` (default `postgresql://postgres@localhost:5432/stackcase_test`) and e2e uses `E2E_DATABASE_URL` (default `.../stackcase_e2e`). Both are reset from `prisma/migrations` automatically.

End-to-end run: `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build && npm run test:e2e`. If Playwright can't find its browser, set `PLAYWRIGHT_CHROMIUM_PATH` to a Chromium binary instead of downloading one. Stop any server already on port 3100 first.

## Before you finish a change

Run, in order, and fix everything they report:

1. `npm run format`
2. `npm run lint && npm run typecheck`
3. `npm test` (or `npm run test:coverage`)
4. For UI, routing, auth, email or SEO changes: the production build and `npm run test:e2e`

Prettier reformats code after you write it; re-read a file before making a follow-up edit to it.

## Map

| Path               | Purpose                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(marketing)`  | Landing page; copy and FAQ in `content.ts`                                                                                                               |
| `app/(auth)`       | Sign-up, login, forgot/reset password, verify email; Server Actions in `actions.ts`                                                                      |
| `app/(legal)`      | `/privacy`, `/terms`, `/accessibility` (static, built on `components/legal`)                                                                             |
| `app/dashboard`    | Editors (profile, design, projects, skills), settings, `/dashboard/export`; Server Actions in `actions.ts`                                               |
| `app/[username]`   | Public portfolio, `og` image, `llms.txt`                                                                                                                 |
| `app/api/username` | Username availability check                                                                                                                              |
| `emails/`          | React Email templates; pure, take `site: SiteInfo` as a prop                                                                                             |
| `lib/auth/`        | Passwords (scrypt), sessions, hashed email tokens                                                                                                        |
| `lib/email/`       | Transport selection, sending (`send.ts`), rendering (`templates.tsx`)                                                                                    |
| `lib/`             | `site.ts` (URLs), `brand.ts`, `seo.ts`, `routing.ts`, `rate-limit.ts`, `legal.ts`, `username.ts`, `validation.ts`, `telemetry.ts`, `events.ts`, `log.ts` |
| `proxy.ts`         | Next.js 16 proxy (formerly middleware): applies `lib/routing.ts`                                                                                         |
| `prisma/`          | `schema.prisma` and SQL migrations                                                                                                                       |
| `tests/`           | `unit/` (jsdom), `integration/` (real Postgres), `setup/` (mocks for Next.js APIs)                                                                       |
| `e2e/`             | Playwright journeys; emails are read from a file outbox                                                                                                  |

## Rules

**URLs and branding**

- Never hard-code the domain or protocol. Use `siteConfig`, `absoluteUrl()`, `portfolioUrl()` and `portfolioAddress()` from `lib/site.ts`. Production builds fail without `NEXT_PUBLIC_SITE_URL`.
- Brand facts (name, tagline, definition, keywords) come from `lib/brand.ts`. The product is "Stackcase", one word, capital S.
- Stackcase is the legal name, operator and copyright holder. Copyright lines read `© <year> Stackcase. All rights reserved.` Don't add personal names or postal addresses to legal pages. Users' own portfolio footers keep the owner's copyright.
- There is no contact email. The UI, legal pages, emails and `security.txt` link GitHub instead: `contactLinks` in `lib/legal.ts` (issues, and private vulnerability reporting for anything confidential), built from `brand.repository`. Don't add `mailto:` links except users' own portfolio contact.

**Next.js**

- `next.config.ts` may only import modules with no imports of their own (`lib/site-url.ts`, `lib/security-headers.ts`); anything else breaks the config loader.
- A `"use server"` file may export only async functions. Put shared constants elsewhere (for example `lib/auth/messages.ts`).
- Work that shouldn't delay the response (emails, analytics events) goes through `afterResponse()` in `lib/after-response.ts`.
- After changing portfolio data, revalidate `/${username}`, `/sitemap.xml` and `/llms.txt` (see `revalidatePortfolio` in `app/dashboard/actions.ts`).
- A new top-level route or route-group folder must be added to `RESERVED_USERNAMES` in `lib/username.ts`; `tests/unit/username.test.ts` scans `app/` and fails otherwise.

**Security**

- Every Server Action re-checks the session (`requireUser()`) and scopes queries to that user. Validate input with the Zod schemas in `lib/validation.ts`.
- Store only hashes of tokens and session IDs. Abusable endpoints need a limit from `lib/rate-limit.ts`.
- Redirect targets from user input go through `safeNextPath()` in `lib/routing.ts`.
- The CSP (`lib/security-headers.ts`) allows only our own origin. Don't add third-party scripts, styles, fonts or images.
- Never log secrets, tokens, passwords or email bodies; use `log()` from `lib/log.ts`.
- Vercel Analytics renders only when `process.env.VERCEL` is set and the visitor has allowed it in the cookie banner (`analytics_consent` cookie, `lib/consent.ts`; Global Privacy Control counts as a refusal). URLs pass through `redactUrl()` in `lib/telemetry.ts`. Pages whose links carry secrets go in `UNTRACKED_PATHS`. Add any new browser measurement inside `components/telemetry/Telemetry.tsx` so it stays behind consent.

**Database**

- Prisma 7 with the `@prisma/adapter-pg` driver adapter; import the client from `lib/db.ts`, types from `lib/generated/prisma`.
- To change the schema, edit `prisma/schema.prisma` and add a new folder in `prisma/migrations/` with hand-written SQL (the migrations also contain `CHECK` constraints). Never edit an applied migration. CI fails if migrations and schema drift.
- Usernames and emails are stored lowercase; normalize before querying.

**Portfolio design**

- Options (accent, color mode, font, layout, section order and visibility) are enums in `prisma/schema.prisma`, validated by `designSchema`, defaulted by `DEFAULT_DESIGN`.
- `PortfolioView` applies them only via `designAttributes()` (data attributes); styles live in `app/globals.css` under "Portfolio design". Every accent needs `--accent-l`/`--accent-d` values; forced `[data-theme]` blocks must mirror the device themes (the contrast test enforces both).
- Hidden sections must also be dropped from `llms.txt` and JSON-LD.

**Email**

- The sender is always `Stackcase <onboarding@resend.dev>` (`EMAIL_SENDER` in `lib/email/config.ts`); there is no `EMAIL_FROM`. Resend delivers from it only to the Resend account owner's address and rejects others with a 403, logged as `email.rejected`.
- Templates in `emails/` use `EmailLayout` and its `Paragraph`, `Action`, `Facts`, `Notice` helpers, export a `PreviewProps` sample and a subject helper, and never import app modules (so the preview server works).
- Render through `lib/email/templates.tsx` (async; returns `{ subject, html, text }`) and send from `lib/account-email.ts`. The first URL in the plain-text version must be the action link; e2e tests rely on it.

**Accessibility**

- WCAG 2.2 AA: semantic landmarks, one `h1` per page, labelled fields, visible focus, and colors that pass `tests/unit/contrast.test.ts`. Add new pages to an e2e test that calls `expectAccessible()`.

**Legal and privacy**

- A change that collects new personal data, adds a processor, adds a cookie or changes retention must update `app/(legal)/privacy/page.tsx`; bump `LEGAL_VERSION` (format `YYYY-NNN`) and `LEGAL_UPDATED` in `lib/legal.ts` for material changes. The legal texts are templates, not legal advice; don't present edits as legally verified.
- The texts are worldwide: one policy for everyone, no region-specific sections, no EU/UK representatives, and international governing law (`GOVERNING_LAW`). Keep new text jurisdiction-neutral and keep the "local mandatory rights still apply" wording.

**Tests**

- Integration tests mock `next/headers`, `next/navigation`, `next/cache`, `@/lib/email/send` (captured in `outbox`) and `@/lib/after-response` (run with `flushAfter()`); see `tests/setup/`.
- Kinds of tests and where they go: unit and component (`tests/unit`, jsdom), property-based with fast-check (`tests/unit/properties.test.ts`), email text snapshots (`tests/unit/__snapshots__`, update with `npx vitest -u`), integration against Postgres (`tests/integration`, unhappy paths in `edge-cases.test.ts`), and Playwright e2e (`e2e/`). Coverage includes every source folder; only `lib/generated` is excluded.
- E2E specs are serial per file. Logins are rate limited per IP, so reuse one signed-in context per spec instead of logging in per test. `e2e/design.spec.ts` holds a performance budget for portfolio pages.
- Test fixtures must respect database constraints (usernames are 3 to 30 characters).
- Bug fixes include a test that fails without the fix. Don't lower coverage thresholds or skip tests to get green.

**Docs**

- Update `README.md` (features, env vars, setup), `.env.example` (new variables), `CONTRIBUTING.md` (new conventions) and this file (new commands or rules) in the same change.

## Don'ts

- Don't commit `.env*` files other than `.env.example`, generated files (`lib/generated/`, `.next/`, `coverage/`, `test-results/`) or real personal data.
- Don't add dependencies without a reason; run `npm audit` after adding one.
- Don't run `prisma migrate dev` against shared databases, and never run `db:reset` against production.
