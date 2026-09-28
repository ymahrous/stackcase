import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo } from "@/components/brand/Logo";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { ClaimForm } from "@/components/marketing/ClaimForm";
import { ArrowsIcon, BoltIcon, EyeIcon, LinkIcon, PaletteIcon, SearchIcon } from "@/components/Icons";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { countPublishedPortfolios } from "@/lib/portfolio/queries";
import { samplePortfolio } from "@/lib/sample";
import { marketingJsonLd } from "@/lib/seo";
import { portfolioAddress, siteConfig } from "@/lib/site";
import { facts, faqs, features, heroCopy, recruiterQuestions, steps } from "./content";

/** Static, refreshed hourly so the portfolio count stays current without a database hit per visit. */
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Only show the count once it is meaningful; a small number reads as the opposite of social proof. */
export const SOCIAL_PROOF_MIN = 25;

const featureIcons: Record<(typeof features)[number]["icon"], ReactNode> = {
  link: <LinkIcon />,
  search: <SearchIcon />,
  arrows: <ArrowsIcon />,
  bolt: <BoltIcon />,
  palette: <PaletteIcon />,
  eye: <EyeIcon />,
};

export default async function HomePage() {
  const count = await countPublishedPortfolios();
  const prefix = `${siteConfig.host}/`;
  return (
    <>
      <JsonLd data={marketingJsonLd({ faqs, steps, features })} />
      <nav className="nav mk-nav" aria-label="Primary">
        <div className="wrap">
          <Link className="mark" href="/">
            <Logo />
          </Link>
          <ul>
            <li>
              <a href="#why">Why it works</a>
            </li>
            <li>
              <a href="#how">How it works</a>
            </li>
            <li>
              <a href="#faq">FAQ</a>
            </li>
          </ul>
          <Link className="mk-login" href="/login">
            Log in
          </Link>
          <Link className="btn primary" href="/signup">
            Claim your URL
          </Link>
        </div>
      </nav>

      <main id="main">
        <header className="mk-hero">
          <div className="wrap mk-hero-grid">
            <div>
              <span className="mk-eyebrow">
                <b>{siteConfig.name}</b> · {heroCopy.eyebrow}
              </span>
              <h1>{heroCopy.title}</h1>
              <p className="mk-lede">{heroCopy.lede}</p>
              <ClaimForm prefix={prefix} />
              {count !== null && count >= SOCIAL_PROOF_MIN ? (
                <p className="mk-proof">
                  <span>{count.toLocaleString("en-US")} portfolios published so far.</span>
                </p>
              ) : null}
            </div>
            <figure>
              <div className="mk-frame">
                <div className="mk-frame-bar" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <span className="mk-frame-url">
                    {siteConfig.host}/<b>{samplePortfolio.username}</b>
                  </span>
                </div>
                <div className="mk-frame-body" inert aria-hidden="true">
                  <div className="mk-shot">
                    <PortfolioView portfolio={samplePortfolio} embedded />
                  </div>
                </div>
              </div>
              <figcaption className="mk-frame-note">
                Example portfolio at {portfolioAddress(samplePortfolio.username)}. Maya is fictional; your
                page uses the same layout.
              </figcaption>
            </figure>
          </div>
        </header>

        <section className="wrap mk-section" id="about" aria-labelledby="about-h">
          <div className="mk-head">
            <span className="label">At a glance</span>
            <h2 id="about-h">What is {siteConfig.name}?</h2>
          </div>
          <dl className="mk-facts">
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="wrap mk-section" id="why" aria-labelledby="why-h">
          <div className="mk-head">
            <span className="label">Why it works</span>
            <h2 id="why-h">Built for how recruiters actually read</h2>
            <p>
              A recruiter decides in under a minute whether to keep reading. Every portfolio answers their
              three questions in order.
            </p>
          </div>
          <div className="mk-split">
            {recruiterQuestions.map((item) => (
              <div key={item.q}>
                <span className="mk-q">{item.q}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap mk-section" id="how" aria-labelledby="how-h">
          <div className="mk-head">
            <span className="label">How it works</span>
            <h2 id="how-h">From sign-up to shareable link</h2>
          </div>
          <ol className="mk-steps">
            {steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="wrap mk-section" id="features" aria-labelledby="features-h">
          <div className="mk-head">
            <span className="label">What you get</span>
            <h2 id="features-h">The details are handled</h2>
          </div>
          <div className="mk-features">
            {features.map((f) => (
              <div key={f.title}>
                <h3>
                  {featureIcons[f.icon]}
                  {f.title}
                </h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap mk-section" id="faq" aria-labelledby="faq-h">
          <div className="mk-head">
            <span className="label">FAQ</span>
            <h2 id="faq-h">Questions, answered</h2>
          </div>
          <div className="mk-faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="wrap" aria-labelledby="final-h">
          <div className="mk-final">
            <div>
              <h2 id="final-h">Short usernames go first.</h2>
              <p>Claim yours now. You can fill in the portfolio whenever you&apos;re ready.</p>
            </div>
            <ClaimForm prefix={prefix} cta="Claim my URL" />
          </div>
        </section>
      </main>

      <SiteFooter
        extra={[
          { href: "/signup", label: "Create a portfolio" },
          { href: "/login", label: "Log in" },
          { href: "#faq", label: "FAQ", plain: true },
          { href: "/llms.txt", label: "llms.txt", plain: true },
        ]}
      />
    </>
  );
}
