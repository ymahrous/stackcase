# Contributing to Stackcase

Thanks for helping make Stackcase better. This guide covers setup, how the code is organized, the conventions we follow and what a pull request needs before it can be merged.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) of this repository. The Stackcase name and logo are not part of that license.

## Using AI coding agents

You're welcome to use AI assistants. [AGENTS.md](AGENTS.md) gives them the commands, project map and rules in this guide; [CLAUDE.md](CLAUDE.md) adds Claude Code specifics and imports AGENTS.md. You're responsible for every line you submit: review generated code, run the checks yourself, and keep both files up to date when conventions change.

## Ground rules

- **Be respectful.** Assume good faith, keep feedback about the code, and help newcomers.
- **Security issues are private.** Don't open a public issue for a vulnerability. Email the address in `/.well-known/security.txt` (or `LEGAL_CONTACT_EMAIL`) with steps to reproduce. We'll acknowledge it and keep you updated.
- **Discuss big changes first.** For a new feature, a new dependency or a schema change, open an issue describing the problem before writing the code.
- **Never commit secrets** or real personal data. Use `.env.local` (git-ignored) and fictional sample data.

## Setup

Requirements: Node 22.18 or newer (scripts run TypeScript directly), and Postgres 14 or newer.

```bash
npm install                                   # also runs `prisma generate`
cp .env.example .env.local                    # set DATABASE_URL at minimum
for db in stackcase_dev stackcase_test stackcase_e2e; do createdb $db; done
DATABASE_URL=postgresql://localhost/stackcase_dev npm run db:reset   # apply migrations
npm run dev                                   # http://localhost:3000
```

Without `RESEND_API_KEY`, account emails print to the terminal, links included. Preview and edit the email templates with `npm run email:dev` (http://localhost:3001).

## Project layout

| Path                              | What lives there                                                             |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `app/(marketing)`                 | Landing page and its content (`content.ts`)                                  |
| `app/(auth)`                      | Sign-up, login, password reset, email confirmation, and their Server Actions |
| `app/(legal)`                     | Privacy Policy, Terms of Service, Accessibility Statement                    |
| `app/dashboard`                   | Editors, settings, data export, and their Server Actions                     |
| `app/[username]`                  | Public portfolios, their Open Graph image and `llms.txt`                     |
| `components/`                     | UI components (`brand/`, `forms/`, `portfolio/`, `legal/`, `telemetry/`...)  |
| `emails/`                         | React Email templates and their shared layout                                |
| `lib/`                            | Domain logic: auth, rate limits, routing, SEO, email sending, legal settings |
| `prisma/`                         | Schema and hand-reviewed SQL migrations                                      |
| `tests/unit`, `tests/integration` | Vitest (jsdom, and real Postgres)                                            |
| `e2e/`                            | Playwright journeys with axe accessibility checks                            |
| `scripts/`                        | Database reset, migrations for tests, brand asset generation                 |

## Conventions

**Code**

- TypeScript strict mode; no `any` without a comment explaining why.
- Keep logic in `lib/` as small, pure functions with unit tests. Pages and actions stay thin.
- Every mutation is a Server Action that re-checks the session with `requireUser()` and scopes queries to that user.
- Validate all input with the Zod schemas in `lib/validation.ts`. Never trust form data or URL parameters.
- Put new user-facing brand facts in `lib/brand.ts` and deployment values in `lib/site.ts`. Never hard-code the domain: every absolute URL comes from `NEXT_PUBLIC_SITE_URL`.
- Log with `log()` from `lib/log.ts`, never with personal data, tokens or passwords.
- Formatting is Prettier's; run `npm run format`.

**Security**

- Hash secrets before storing them and compare them in constant time (see `lib/auth/tokens.ts` and `lib/auth/password.ts`).
- New endpoints that can be abused (anything that sends email, checks credentials or is expensive) need a rate limit from `lib/rate-limit.ts`.
- Don't add third-party scripts, fonts or images: the Content Security Policy allows only our own origin. If you must, update `lib/security-headers.ts` and explain why in the PR.
- A new top-level route must be added to `RESERVED_USERNAMES` in `lib/username.ts`. A unit test fails if you forget.

**Database**

- Change `prisma/schema.prisma`, then add a migration folder in `prisma/migrations/` with the SQL. CI fails if the migrations and schema drift apart.
- Migrations must be backward compatible with the running version (add columns as nullable or with defaults, backfill, then tighten).

**Emails**

- Templates go in `emails/`, use the shared `EmailLayout`, and export a `PreviewProps` sample and a subject helper.
- Say why the email was sent (`reason`), keep one primary action, and add a "Wasn't you?" note to security notices.
- Account emails only. Marketing email needs consent and an unsubscribe flow, which the platform doesn't have.

**Portfolio design options**

- Design choices are Postgres enums plus a Zod schema (`designSchema` in `lib/validation.ts`) and live in `DEFAULT_DESIGN` (`lib/portfolio/types.ts`).
- The portfolio reads them only through `designAttributes()`, which sets `data-accent`, `data-theme`, `data-font` and `data-layout`; all styling lives in CSS keyed on those attributes. Keep it that way: no inline styles or per-option JavaScript.
- A new option needs: a schema enum and migration, a label and hint, CSS for every value, a live-preview case in `DesignPreview`, and a combination in the e2e accessibility matrix.
- Hidden sections must also be left out of machine-readable output (JSON-LD, `llms.txt`).

**Accessibility**

- Target WCAG 2.2 AA. Use semantic HTML, label every field, keep one `h1` per page and don't skip heading levels.
- Check new pages with the keyboard and in both color themes. Add them to an e2e test that calls `expectAccessible()`.
- New colors must pass `tests/unit/contrast.test.ts`.

**Legal and privacy**

- If a change collects new personal data, adds a processor or changes retention, update `app/(legal)/privacy/page.tsx` in the same PR and bump `LEGAL_VERSION` and `LEGAL_UPDATED` in `lib/legal.ts` for material changes.
- Stackcase is the operator's legal name and copyright holder everywhere. Don't add personal names or postal addresses to the legal pages.
- Analytics must stay cookieless and must not record personal data; new URL patterns that carry secrets belong in `UNTRACKED_PATHS` in `lib/telemetry.ts`.

**Copy**

- Plain, direct English. Short sentences, active voice, no jargon, no invented claims or testimonials.
- Use "Stackcase" (capital S, one word). Portfolio addresses are written `stackcase.vercel.app/username`.

## Tests

```bash
npm run lint && npm run typecheck && npm run format:check
TEST_DATABASE_URL=postgresql://localhost/stackcase_test npm run test:coverage
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build && npm run test:e2e
```

- Bug fixes come with a test that fails without the fix.
- New features need unit tests for the logic, a component test for new client UI, and an integration test for the Server Action or route handler. User journeys get an e2e step.
- Pick the right kind of test (see [Testing in the README](README.md#testing)):
  - **Property-based** (`tests/unit/properties.test.ts`, fast-check) for anything that parses or sanitizes input: URLs, redirects, usernames, escaping. State the invariant, not examples.
  - **Snapshots** only for output a human reviews as a whole, like email text. Update them with `npx vitest -u` and review the diff.
  - **Design tokens:** new colors go in `app/globals.css` in both themes; `tests/unit/contrast.test.ts` reads the file and checks AA contrast.
  - **E2E:** use unique usernames (`uniqueName()`), reuse one signed-in context per serial spec (logins are rate limited per IP), and call `expectAccessible()` on every new page.
- Coverage is measured across every source folder and thresholds are enforced (98% lines, 97% statements and functions, 92% branches); don't lower them. Remove dead code rather than excluding it.
- The performance budget in `e2e/design.spec.ts` fails if a portfolio page grows past its limits. If a change needs more, explain why in the PR and raise the budget in the same change.

## Commits and pull requests

1. Branch from `main` (`fix/reset-link-expiry`, `feat/custom-domains`).
2. Write commits in the imperative mood with a short subject line: `Fix expired reset links showing a generic error`. Use [Conventional Commits](https://www.conventionalcommits.org) prefixes if you like (`feat:`, `fix:`, `docs:`).
3. Keep pull requests focused on one change. Describe what changed, why, and how you tested it. Include screenshots for UI changes (light and dark, desktop and mobile).
4. Update the docs in the same PR: the README for features, setup or environment variables; `.env.example` for new variables; this file and AGENTS.md for new conventions or commands.
5. CI must pass: formatting, lint, typecheck, migration drift check, unit and integration tests with coverage, build, and the Playwright suite.

A maintainer reviews every pull request. We may ask for changes; that's normal and not a judgment of your work.
