<p align="center"><img src="public/logo.svg" width="72" height="72" alt="Stackcase logo"></p>

# Stackcase

**Stackcase is a free portfolio builder for software engineers.** You write each project as a short case study (problem, what you built, stack, result), and Stackcase publishes it as a fast, search-ready page at your own address:

```
https://stackcase.vercel.app/yourname
```

Built with Next.js 16 (App Router), React 19, TypeScript, Prisma 7, Postgres, Resend and React Email. Deploys to Vercel.

---

## Features

### Landing page (`/`)

- **Username claim in the hero.** Visitors see live whether `stackcase.vercel.app/name` is free, with alternatives if it isn't. It is a plain GET form, so it works before JavaScript loads and carries the name into sign-up.
- **Live example.** The hero shows a real render of the template, labelled as a fictional example.
- **Answer-first copy.** A definition up top, an "At a glance" facts block, recruiter-focused benefits, three steps, features, and an FAQ that opens with "What is Stackcase?".
- **Honest social proof.** The published-portfolio count only appears once it reaches 25. There are no invented testimonials.
- **Repeated single call to action.** "Claim your URL" appears in the nav, hero and closing block.
- **Referral loop.** Every portfolio footer links back with `?ref=username`.

### Dashboard (`/dashboard`)

- Email and password accounts. Sign-up requires agreeing to the Terms and confirming the minimum age (16); the accepted terms version and time are stored.
- Email confirmation, with a banner and a resend button until the address is confirmed.
- **Forgot password** by email: single-use links that expire after 60 minutes.
- A setup checklist with a progress bar, and editors for profile, projects and skills.
- **Profile extras:** optional pronouns, a résumé link (adds a Résumé button), and a custom search title and description for Google and link previews.
- **Design tab** (`/dashboard/design`) with a live miniature preview that updates before you save:
  - **Color:** six accents, each checked for WCAG AA contrast in both themes, and a color mode: match the visitor's device, always light, or always dark.
  - **Headings:** Grotesk, Serif or Mono. Serif uses system fonts, so it adds no download.
  - **Project layout:** case studies (details beside each project), a compact list, or a card grid.
  - **Sections:** show or hide the "At a glance" card, the skills table and the closing contact section, and put skills before or after projects.
  - **Reset to defaults** in one click.
- A full-page preview, and publishing that requires a headline and at least one project.
- **Settings:**
  - **Change username**, with a live availability check. The old link permanently redirects for 30 days, and nobody else can claim the old name during that time. Changes are limited to once every 7 days, and each one is confirmed by email.
  - **Change password.** Other devices are signed out and you get an email notice.
  - **Delete account.** Everything is deleted and you get a confirmation email.
  - **Download my data.** A JSON export of everything stored about you (GDPR Art. 15/20, CCPA right to know, LGPD), without password or token hashes.

### Public portfolios (`/<username>`)

- Three layouts, three heading fonts, six accent colors, and light, dark or device-matched themes, all driven by data attributes on one element (`data-accent`, `data-theme`, `data-font`, `data-layout`), so switching costs no extra CSS or JavaScript.
- Owners can hide sections and reorder skills and projects. Hidden content is also left out of `llms.txt`, so machine-readable summaries match what visitors see.
- Portfolios forced to dark mode also get a dark social image.
- Canonical URL, Open Graph `profile` and Twitter card tags, a generated 1200×630 image at `/<username>/og`, JSON-LD (`Person`, `ProfilePage`, and an `ItemList` of projects), and `/<username>/llms.txt`.
- User-supplied links carry `rel="nofollow ugc"`, and profile links also carry `rel="me"`.
- Pages are cached and refresh as soon as the owner saves.
- The footer shows the owner's own copyright (users keep ownership of their content under the Terms), a "Made with Stackcase" badge and links to the Stackcase legal pages.

---

## Why `/username` and not `username.domain`

Wildcard subdomains (`*.example.com`) need a domain whose DNS you control, so Vercel can issue wildcard certificates ([Vercel docs](https://vercel.com/docs/platforms/multi-tenant-platforms/configuring-domains)). `*.vercel.app` belongs to Vercel, so `alice.stackcase.vercel.app` can't be routed to your project. Portfolios therefore live at `stackcase.vercel.app/alice`.

This also keeps things simpler:

- one host, so one sitemap lists every portfolio
- one TLS certificate
- no cross-subdomain cookie concerns

Usernames still follow DNS-label rules, so subdomains can come back later on a custom domain.

- Every top-level route (`dashboard`, `login`, `og`, `verify-email`…) is a reserved username. A unit test scans `app/` and fails if a new route isn't reserved.
- `/Alice` redirects (308) to `/alice`, and links from the old subdomain version (`/sites/alice`) redirect to `/alice`.

---

## Email with Resend

| Email                         | Sent when                                                 |
| ----------------------------- | --------------------------------------------------------- |
| Confirm your email            | Sign-up, or "Resend link" in the dashboard (24-hour link) |
| Reset your password           | "Forgot your password?" (60-minute, single-use link)      |
| Your password was changed     | After a reset or a change in Settings                     |
| Your portfolio has a new link | After a username change                                   |
| Your account was deleted      | After deletion                                            |

### Templates

The templates are built with [React Email](https://react.email), Resend's open-source framework, and live in `emails/`:

```
emails/
├── components/EmailLayout.tsx   shared frame: logo header, card, legal footer, button, facts list, notice
├── components/theme.ts          colors, fonts, SiteInfo type, preview data, UTC date formatting
├── VerifyEmail.tsx              ├── PasswordReset.tsx      ├── PasswordChanged.tsx
├── UsernameChanged.tsx          └── AccountDeleted.tsx
```

- **Consistent design** that matches the site: the Stackcase logo, one clear call to action, a fallback link for clients that block buttons, a facts table for security notices (what changed, old and new values, time in UTC), and a highlighted "Wasn't you?" note.
- **Built for mail clients.** Table layout with inline styles, a 560 px container, and a bulletproof button that also renders in Outlook. Dark-mode colors apply in Apple Mail and other clients that support `prefers-color-scheme`.
- **Accessible and deliverable.** Every email has `lang`, inbox preview text, a real heading, WCAG AA contrast, a plain-text part generated from the same template (the header and duplicate link are left out of it), and a footer that says why it was sent.
- **Legal footer** on every email: `© <year> Stackcase. All rights reserved.`, links to Privacy and Terms, and a Help link when `LEGAL_CONTACT_EMAIL` is set.
- **Safe by default.** React escapes all user text (names, usernames), and every link points at `NEXT_PUBLIC_SITE_URL`.
- **Pure and previewable.** Templates receive the site details as props, so they don't depend on the app. `lib/email/templates.tsx` renders them to HTML and text with `@react-email/render`.

Preview and edit them live, with hot reload and client-compatibility warnings:

```bash
npm run email:dev   # http://localhost:3001, using each template's PreviewProps
```

To add an email: create `emails/MyEmail.tsx` with a default-exported component, a `PreviewProps` sample and a subject helper, add a wrapper in `lib/email/templates.tsx`, and send it from `lib/account-email.ts`.

### Security

- **Tokens** are 256-bit and stored only as SHA-256 hashes. They are single-use, enforced atomically, and a new one revokes the previous one.
- **Confirmation** happens on a button press, not on page load, because email security scanners open links automatically.
- **Reset requests** get the same response whether or not the account exists, and are rate-limited per IP and per address.

### Important: sending to real users needs a domain you own

Resend only delivers to other people from a **domain you have verified in Resend**. Without one, the fallback sender `onboarding@resend.dev` can only email the address that owns your Resend account ([Resend docs](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)). You can't verify `vercel.app`.

To send to users:

1. Buy any domain, even a cheap one used only for email. The site can stay on `stackcase.vercel.app`.
2. In Resend, go to **Domains**, add it (for example `mail.yourdomain.com`), and add the DNS records it shows.
3. Set `EMAIL_FROM="Stackcase <hello@mail.yourdomain.com>"`.

### Transports

| Condition                                         | What happens                                         |
| ------------------------------------------------- | ---------------------------------------------------- |
| `RESEND_API_KEY` set                              | Sent through Resend                                  |
| `EMAIL_TRANSPORT=file` and `EMAIL_OUTBOX_DIR` set | Written as JSON files (used by the end-to-end tests) |
| Development without a key                         | Printed to the server log, links included            |
| Production without a key                          | Skipped with a warning; no content is logged         |

A failed send never breaks sign-up or other account actions.

---

## Brand and logo

The mark is an "S" drawn as three stacked lines, with the bottom line in cobalt: the case the stack rests on. It is defined once in `lib/brand-mark.ts` (32×32 grid) and used everywhere:

| Surface                          | File                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Nav, auth, dashboard, legal, 404 | `components/brand/Logo.tsx` (inline SVG, `LogoMark` + wordmark)                         |
| Browser tab                      | `app/icon.svg`, `app/favicon.ico`                                                       |
| iOS home screen                  | `app/apple-icon.png` (180×180, square; iOS applies its own mask)                        |
| PWA / Android                    | `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` (manifest) |
| Search engines (`Organization`)  | `public/logo.png` (512×512) in JSON-LD                                                  |
| Emails                           | `public/email-logo.png` (PNG, since many email clients block SVG)                       |
| Social images                    | `/og` and `/<username>/og` draw the mark with `next/og`                                 |
| Portfolio footers                | a small "Made with Stackcase" badge                                                     |

After changing the mark, run `npm run brand:assets` to regenerate the PNG and SVG files (uses Playwright's Chromium). `favicon.ico` is packed from the 16/32/48 px renders.

---

## SEO, AEO and GEO

| Goal                                        | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEO** (search engines)                    | Title "Stackcase: free portfolio builder for software engineers", a 151-character description, keywords, canonical URLs and generated Open Graph images. `/sitemap.xml` lists the landing page, sign-up and every published portfolio with its image; it refreshes hourly and immediately when someone publishes, renames or edits. `robots.txt` blocks private paths.                                                                                                                                                       |
| **AEO** (answer engines, featured snippets) | An answer-first definition in the hero; an "At a glance" facts list rendered as HTML; JSON-LD `FAQPage` (12 questions, including how to customize a portfolio), `HowTo` (3 steps, cost 0, 15 minutes) and `WebApplication` (free offer, audience, feature list).                                                                                                                                                                                                                                                             |
| **GEO** (AI assistants)                     | `/llms.txt` gives the definition, facts, steps, the full FAQ and links to published portfolios; each portfolio has its own `/<username>/llms.txt`; the root file also links the legal documents in an `## Optional` section. `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and others. Brand facts live in one file (`lib/brand.ts`), so every surface describes Stackcase the same way. `Organization` JSON-LD carries the logo, so the brand is identified consistently. |

---

## Analytics, performance and observability

| Tool                                                                            | What it does here                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Vercel Web Analytics](https://vercel.com/docs/analytics)                       | Page views, referrers and countries, without cookies. URLs are cleaned in the browser first (`lib/telemetry.ts`): query strings are dropped except `ref` and `utm_*`, and the password-reset and email-confirmation pages, whose links carry secrets, aren't recorded at all.                           |
| Custom events (`lib/events.ts`)                                                 | Server-side funnel events: `signup_completed`, `email_confirmed`, `portfolio_published`, `username_changed`, `account_deleted`. No personal data in properties. They run after the response is sent and only on Vercel; custom events need a Vercel plan that includes them.                            |
| [Vercel Speed Insights](https://vercel.com/docs/speed-insights)                 | Core Web Vitals (LCP, INP, CLS) from real visitors, per route, with the same URL redaction.                                                                                                                                                                                                             |
| [Vercel Observability](https://vercel.com/docs/observability) and OpenTelemetry | `instrumentation.ts` registers `@vercel/otel` (service `stackcase`), so request and function traces show in Observability and any OpenTelemetry-compatible tool. Server logs are one JSON object per line (`lib/log.ts`: `email.sent`, `email.failed`, `after.failed`...), easy to filter and alert on. |

To turn them on: in the Vercel project, open **Analytics** and **Speed Insights** and click **Enable**, then redeploy. Observability is on by default for every project. Nothing is collected in development or tests. The CSP allows only same-origin scripts in production, and Vercel serves the analytics scripts from your own domain under `/_vercel/`.

---

## Legal pages and compliance

`/privacy`, `/terms` and `/accessibility` are linked from every footer (platform pages, dashboard, auth pages, 404s and every public portfolio), are in the sitemap and are marked up with `WebPage` + `BreadcrumbList` JSON-LD. They are written in plain language, with a summary box and a table of contents, and print cleanly.

| Area             | What's covered                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy          | Controller identity, data table with purposes and legal bases (GDPR Art. 6), processors (Vercel, your database host, Resend), international transfers, a retention table, rights and how to use them, and region-specific sections: EEA/UK/Switzerland, US states (CCPA/CPRA categories, no sale or sharing), Canada, Brazil (LGPD), Egypt and the Middle East, Asia-Pacific (APPI, PIPA, PDPA, DPDP, PIPL) and Africa (POPIA, NDPA). |
| Cookies          | One strictly necessary session cookie, so no consent banner is needed under the ePrivacy Directive; analytics is cookieless.                                                                                                                                                                                                                                                                                                          |
| Terms            | Eligibility (16+), content license, acceptable use, an EU Digital Services Act notice-and-action process with statements of reasons and appeals, DMCA §512 notices and counter-notices, consumer-law carve-outs in the disclaimers and liability limits, and international governing law (the UNIDROIT Principles of International Commercial Contracts) that keeps consumers' home-country protections and courts.                   |
| Accessibility    | WCAG 2.2 AA target with an honest "partially conformant" status, what is tested, known limitations, a feedback route with a response time, and enforcement bodies (EAA, UK, ADA, AODA, Australia).                                                                                                                                                                                                                                    |
| Product features | Required consent checkbox at sign-up (version and time stored), data export in Settings, account deletion with confirmation email, username rules for impersonation.                                                                                                                                                                                                                                                                  |

**Stackcase is the legal name** used throughout: the operator and data controller in the Privacy Policy, the party to the Terms, the `legalName` and copyright holder in structured data, and the copyright line on every page and email (`© <year> Stackcase. All rights reserved.`). No postal address is published. The only required setting is `LEGAL_CONTACT_EMAIL` (or `EMAIL_REPLY_TO`); until one is set, each legal page shows a notice that contact details are incomplete. The pages are static, so redeploy after changing it. When you change a document materially, update `LEGAL_VERSION` and `LEGAL_UPDATED` in `lib/legal.ts`; the governing law is `GOVERNING_LAW` in the same file.

> **These texts are a well-researched starting point, not legal advice.** Have a lawyer in your jurisdiction review them before launch, especially these choices: a contract can't be governed by international principles alone in every country (courts may apply a national law instead, and EU law lets consumers rely on their home law), and some countries require a registered legal entity and a postal address for online services, for example an imprint in Germany and Austria. Also check whether you need EU/UK representatives, and anything specific to how you run the service.

---

## Environment variables

| Variable                                             | Required                               | Example                                                               |
| ---------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`                                       | yes                                    | `postgresql://…`                                                      |
| `NEXT_PUBLIC_SITE_URL`                               | yes; production builds fail without it | `https://stackcase.vercel.app`                                        |
| `RESEND_API_KEY`                                     | for email                              | `re_…` from [resend.com/api-keys](https://resend.com/api-keys)        |
| `EMAIL_FROM`                                         | to reach users                         | `Stackcase <hello@mail.yourdomain.com>` (a verified Resend domain)    |
| `EMAIL_REPLY_TO`                                     | no                                     | `support@yourdomain.com`                                              |
| `NEXT_PUBLIC_APP_NAME`                               | no                                     | Overrides the brand name                                              |
| `SECURITY_CONTACT`                                   | no                                     | `mailto:security@yourdomain.com` (serves `/.well-known/security.txt`) |
| `LEGAL_CONTACT_EMAIL`                                | before launch                          | `privacy@yourdomain.com` (falls back to `EMAIL_REPLY_TO`)             |
| `LEGAL_EU_REPRESENTATIVE`, `LEGAL_UK_REPRESENTATIVE` | if outside the EU/UK                   | Name and address of your GDPR Art. 27 representative                  |
| `LEGAL_DATABASE_PROVIDER`                            | no                                     | `Neon Inc. (USA)`                                                     |
| `LEGAL_BACKUP_RETENTION_DAYS`                        | no (default 30)                        | `7`                                                                   |

Every absolute URL comes from `NEXT_PUBLIC_SITE_URL`: canonical tags, sitemap, Open Graph, JSON-LD, email links and portfolio addresses.

---

## Local development

Requirements: Node 22.18 or newer, and Postgres 14 or newer.

```bash
npm install                  # also runs `prisma generate`
cp .env.example .env.local   # set DATABASE_URL (RESEND_API_KEY optional: emails print to the terminal)
npx prisma migrate deploy
npm run dev                  # http://localhost:3000, portfolios at http://localhost:3000/<username>
```

## Deploying to Vercel as `stackcase.vercel.app`

1. Create a Postgres database (Neon, Supabase, Vercel Postgres).
2. Import the repository into Vercel. Name the project `stackcase`, or rename the production domain under **Settings → Domains** to `stackcase.vercel.app` if it's free.
3. Set the environment variables: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL=https://stackcase.vercel.app`, `RESEND_API_KEY`, `EMAIL_FROM` and `LEGAL_CONTACT_EMAIL`.
4. Enable **Analytics** and **Speed Insights** in the project.
5. Deploy. `vercel-build` runs `prisma migrate deploy` and then `next build`.
6. Submit `https://stackcase.vercel.app/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

---

## Architecture

- **Routing** (`lib/routing.ts`, applied by `proxy.ts`) is a pure function with unit tests. It handles case canonicalization, redirects from old `/sites/` links, and the fast path that sends signed-out visitors from `/dashboard` to login. Every dashboard page also checks the session in the database.
- **Server Actions** handle every mutation. Each one re-checks the session and scopes writes to the signed-in user, and Next.js checks the Origin header on Server Actions, which covers CSRF.

**Data model:**

| Model                           | Purpose                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `User`                          | Email, scrypt password hash, username, email-confirmed time, accepted terms version and time |
| `Session`                       | Server-side sessions, stored as SHA-256 hashes of the cookie tokens                          |
| `Portfolio`, `Project`, `Skill` | Portfolio content, profile extras (pronouns, résumé, search overrides) and design choices    |
| `UsernameRedirect`              | Previous usernames and their 30-day hold                                                     |
| `EmailToken`                    | Confirmation and reset links, stored hashed and single-use                                   |
| `RateLimit`                     | Rate-limit counters in Postgres, shared across serverless instances                          |

The migrations add `CHECK` constraints for the username format, lowercase emails and the length of pronouns and search overrides. Design options are Postgres enums (`ColorMode`, `FontStyle`, `Layout`, `SectionOrder`, `Accent`), so invalid values can't be stored.

## Security

### Controls

| Area               | How it's handled                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passwords          | scrypt (N=2^17, r=8, p=1) with per-user salts and Unicode normalization, upgraded on login. Minimum 10 characters, a deny-list, and no username or email inside the password.                                                                                                                                                                                                    |
| Sessions           | 256-bit random tokens, stored only as SHA-256 hashes. The cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` with the `__Host-` prefix over HTTPS. Sessions last 30 days and extend with use.                                                                                                                                                                                    |
| Session fixation   | Logging in deletes any session the browser already carried. A password change or reset replaces every session with a new one.                                                                                                                                                                                                                                                    |
| Login              | One generic error message, and a dummy hash comparison for unknown emails, so timing doesn't reveal accounts. Every attempt counts against the IP (10 per 15 min). Only failures count against the email (5 per 15 min), so users are never locked out by their own successful logins.                                                                                           |
| Password reset     | Responds identically whether or not the account exists. The lookup and the email run after the response (`after()`), so response timing reveals nothing. Links are single-use (enforced atomically), stored hashed, expire after 60 minutes, and a new link revokes the old one. Reset pages send no referrer.                                                                   |
| Email confirmation | Needs a click, because email security scanners open links automatically.                                                                                                                                                                                                                                                                                                         |
| Other rate limits  | Sign-up: 5 per IP per hour. Username checks: 60 per minute. Reset: 5 per IP per 15 min and 3 per email per hour. Settings actions: 10 per 15 min. Counters live in Postgres, and expired rows are pruned automatically.                                                                                                                                                          |
| Authorization      | Every Server Action re-checks the session in the database and scopes writes to the signed-in user (`where: { id, portfolio: { userId } }`). Integration tests confirm one user can't edit another's data.                                                                                                                                                                        |
| CSRF               | Server Actions check the Origin header, and the session cookie is `SameSite=Lax`.                                                                                                                                                                                                                                                                                                |
| Open redirects     | `?next=` must resolve to this origin. Control characters, whitespace and backslashes are rejected, which blocks tricks like `/\t/evil.com` that browsers normalize to `//evil.com`.                                                                                                                                                                                              |
| Injection          | Prisma parameterizes every query. The one raw query (rate limiting) is a parameterized tagged template.                                                                                                                                                                                                                                                                          |
| XSS                | React escapes all user text; there is no user-controlled HTML. URLs must be http(s), so `javascript:` and `data:` are rejected. JSON-LD is serialized with `<`, `>`, `&`, U+2028 and U+2029 escaped. Email templates escape all user-supplied text.                                                                                                                              |
| Headers            | A Content-Security-Policy that allows only this origin, with `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`, and `upgrade-insecure-requests` over HTTPS. Also HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Cross-Origin-Opener-Policy: same-origin` and a restrictive `Permissions-Policy`. There is no `X-Powered-By`. |
| Data integrity     | Database `CHECK` constraints enforce the username format and lowercase emails. Deleting an account cascades to everything it owns.                                                                                                                                                                                                                                               |
| Secrets            | `RESEND_API_KEY` and `DATABASE_URL` are server-only (never `NEXT_PUBLIC_`). `.env*.local` is gitignored. In production, emails are never logged.                                                                                                                                                                                                                                 |
| Dependencies       | `npm audit` reports 0 vulnerabilities. `package.json` overrides pin patched versions of `deepmerge-ts` and `mysql2`, which the Prisma CLI pulls in.                                                                                                                                                                                                                              |
| Disclosure         | Set `SECURITY_CONTACT` to serve `/.well-known/security.txt` (RFC 9116).                                                                                                                                                                                                                                                                                                          |

### Accepted trade-offs

- **`script-src 'unsafe-inline'`.** Next.js inlines its bootstrap scripts. A nonce-based policy would force every page to render per request and lose static caching. The risk is limited because user content is never rendered as HTML and the other directives block framing, plugins, `<base>` hijacking and foreign form targets.
- **Duplicate-email message at sign-up.** Sign-up says when an email already has an account, which is clearer for users but confirms that the account exists. It is rate-limited to 5 per IP per hour. For stricter privacy, replace it with a generic "check your inbox" response and email the existing user instead.
- **Lockout as a nuisance attack.** Five wrong passwords block an email for 15 minutes, so someone could deliberately lock out a known address. This is the standard trade-off against password guessing; the lock clears itself.
- **Tokens in link query strings.** They are single-use, short-lived, sent with no referrer, and stored hashed. Avoid logging full request URLs in any proxy you add in front of the app.
- **Client IP from `X-Forwarded-For`.** Vercel overwrites this header, so it can be trusted there. Behind another proxy, make sure it does the same.

-------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Passwords | scrypt (N=2^17) with per-user salts, upgraded on login |
| Session cookie | `HttpOnly`, `SameSite=Lax`, and `Secure` with the `__Host-` prefix over HTTPS |
| Login | Errors don't reveal which accounts exist, and response timing is equalized |
| Rate limits | Login, sign-up, username checks, reset requests and settings changes |
| Redirects | `?next=` only accepts same-site paths |
| User content | URLs must be http(s); JSON-LD is serialized with `<`, `>` and `&` escaped; reset and confirmation pages send no referrer |
| Headers | HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` |

---

## Scripts

```bash
npm run dev | build | start | lint | typecheck | format
npm test                  # unit + integration
npm run test:coverage     # with enforced coverage thresholds
npm run test:e2e          # Playwright against a production build
npm run db:migrate        # prisma migrate deploy
npm run email:dev         # preview the email templates at http://localhost:3001
npm run brand:assets      # regenerate logo and icon files from lib/brand-mark.ts
npm run db:reset          # drop and recreate the schema in DATABASE_URL (refuses in production)
```

## Testing

Every layer is tested, and coverage includes every source folder (`app`, `components`, `emails`, `lib`, `proxy.ts`, `instrumentation.ts`; only generated Prisma code is excluded). Current coverage is about 99% of lines and 94% of branches. CI fails below 98% lines, 97% statements and functions, and 92% branches.

| Kind                              | Where                           | What it covers                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit** (Vitest, jsdom)          | `tests/unit`                    | Routing, URL helpers, the reserved-route guard, usernames, passwords and tokens, validation (including design options), SEO/AEO/GEO builders and search overrides, social-card palettes, email templates and transports, analytics redaction, custom events, legal settings, the brand mark, icons |
| **Component** (Testing Library)   | `tests/unit/*.test.tsx`         | Portfolio rendering for every design option; the Design editor's live preview, spoken summary and submitted values; every client form's error, preserved-input, reset and pending states                                                                                                           |
| **Property-based** (fast-check)   | `tests/unit/properties.test.ts` | Thousands of generated and hostile inputs: redirects never leave the site, URL fields only accept http(s), username suggestions are always valid, JSON-LD can't break out of its script tag, analytics never forwards unlisted query parameters                                                    |
| **Snapshot**                      | `tests/unit/__snapshots__`      | The plain-text version of every email, so wording or layout changes are deliberate (`vitest -u` to accept)                                                                                                                                                                                         |
| **Design tokens and contrast**    | `tests/unit/contrast.test.ts`   | Parses `globals.css`: every accent has light and dark values, forced themes match device themes exactly, and text, muted text, accents and button text meet WCAG AA in both themes                                                                                                                 |
| **Integration** (real Postgres)   | `tests/integration`             | Every Server Action and route handler: auth and email flows, token reuse and races, rate limits, user isolation, design save/reset, public pages and metadata, sitemap, llms.txt, social images, data export, database `CHECK` constraints, and the unhappy paths in `edge-cases.test.ts`          |
| **End-to-end** (Playwright + axe) | `e2e/`                          | Full user journeys on a production build, described below                                                                                                                                                                                                                                          |

End-to-end suites:

- **`journey.spec.ts`**: claim a username, sign up, confirm the email from the sent message, fill in and publish a portfolio, check SEO tags, JSON-LD, llms.txt, the social image and sitemap, case-insensitive URLs, renaming with redirects and an email notice, forgot password, data download, and log out.
- **`design.spec.ts`**: build a portfolio, restyle it in the Design tab (live preview, keyboard navigation between options), and check that the public page follows every choice (computed colors, fonts, grid layout, hidden sections, custom title). Hostile profile text (`<script>`, `onerror`) must render as text and never run. Three design combinations covering every theme, font, layout and several accents must pass WCAG 2.2 AA in light and dark device settings and fit a 360 px screen. A **performance budget** fails the build if a portfolio ships more than 200 KB of JavaScript, 40 KB of CSS, 160 KB of fonts or 30 requests, or loads any images.
- **`marketing.spec.ts`**: landing-page SEO in the server HTML, crawler files and security headers, the Content Security Policy with zero violations, legal links on every page, and WCAG checks for the marketing, auth and legal pages in light and dark mode, on desktop and mobile.

axe runs the WCAG 2.0, 2.1 and 2.2 A/AA rule sets.

```bash
createdb stackcase_test && createdb stackcase_e2e
npm run test:coverage
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build && npm run test:e2e
```

CI (`.github/workflows/ci.yml`) runs all of this against a Postgres 16 service. It also fails if the migrations and `schema.prisma` drift apart.

## Not included yet

- Custom domains per user.
- Image uploads (avatars, screenshots); these need object storage.
- Changing the account email address.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions and the checks a pull request must pass. AI coding agents follow [AGENTS.md](AGENTS.md); Claude Code also reads [CLAUDE.md](CLAUDE.md), which imports it.

## License

[MIT](LICENSE) © 2026 Stackcase. The name and logo are not covered by the code license; see the Terms of Service.
