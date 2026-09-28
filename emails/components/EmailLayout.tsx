import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { link, type SiteInfo, theme } from "./theme";

const text = { margin: "0 0 16px", fontSize: "16px", lineHeight: "26px", color: theme.body };

/**
 * Dark-mode overrides for clients that support them (Apple Mail, iOS Mail, some Outlook versions).
 * Gmail and others apply their own inversion; the light design holds up there too.
 */
const darkCss = `
@media (prefers-color-scheme: dark) {
  body, .sc-bg, body > table, body > table > tbody > tr > td { background-color: #0D1110 !important; }
  .sc-card { background-color: #161C1A !important; border-color: #2A3330 !important; }
  .sc-ink, .sc-ink a { color: #E7ECE9 !important; }
  .sc-body { color: #C9D1CD !important; }
  .sc-muted, .sc-muted a { color: #9AA59F !important; }
  .sc-notice { background-color: #1A2138 !important; border-color: #33427A !important; }
  .sc-link { color: #8FA6FF !important; }
}`;

interface LayoutProps {
  site: SiteInfo;
  /** Inbox preview text, shown after the subject. Keep it under ~90 characters. */
  preview: string;
  heading: string;
  children: ReactNode;
  /** Why the recipient got this email. Required for trust and good deliverability. */
  reason?: string;
}

/** The shared frame: logo header, white card, and a legal footer with the Stackcase copyright. */
export function EmailLayout({ site, preview, heading, children, reason }: LayoutProps) {
  const year = new Date().getFullYear();
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{darkCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body className="sc-bg" style={{ margin: 0, backgroundColor: theme.bg, fontFamily: theme.font }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 16px" }}>
          <Section style={{ padding: "0 8px 24px" }} data-skip-in-text={true}>
            <Link href={link(site, "/")} style={{ textDecoration: "none" }}>
              <Row>
                <Column style={{ width: "40px", verticalAlign: "middle" }}>
                  <Img
                    src={link(site, "/email-logo.png")}
                    width="32"
                    height="32"
                    alt={`${site.name} logo`}
                    style={{ display: "block", borderRadius: "8px" }}
                  />
                </Column>
                <Column style={{ verticalAlign: "middle" }}>
                  <Text
                    className="sc-ink"
                    style={{
                      margin: 0,
                      fontSize: "19px",
                      fontWeight: 700,
                      letterSpacing: "-0.2px",
                      color: theme.ink,
                    }}
                  >
                    {site.name}
                  </Text>
                </Column>
              </Row>
            </Link>
          </Section>

          <Section
            className="sc-card"
            style={{
              backgroundColor: theme.card,
              border: `1px solid ${theme.line}`,
              borderRadius: "16px",
              padding: "40px 36px 32px",
            }}
          >
            <Heading
              as="h1"
              className="sc-ink"
              style={{
                margin: "0 0 20px",
                fontSize: "26px",
                lineHeight: "32px",
                fontWeight: 700,
                letterSpacing: "-0.4px",
                color: theme.ink,
              }}
            >
              {heading}
            </Heading>
            {children}
          </Section>

          <Section style={{ padding: "28px 8px 0" }}>
            {reason ? (
              <Text className="sc-muted" style={{ ...small, margin: "0 0 12px" }}>
                {reason}
              </Text>
            ) : null}
            <Text className="sc-muted" style={{ ...small, margin: "0 0 12px" }}>
              <Link className="sc-muted" href={link(site, "/")} style={footerLink}>
                {site.host}
              </Link>
              {"  ·  "}
              <Link className="sc-muted" href={link(site, "/privacy")} style={footerLink}>
                Privacy
              </Link>
              {"  ·  "}
              <Link className="sc-muted" href={link(site, "/terms")} style={footerLink}>
                Terms
              </Link>
              {site.supportEmail ? (
                <>
                  {"  ·  "}
                  <Link className="sc-muted" href={`mailto:${site.supportEmail}`} style={footerLink}>
                    Help
                  </Link>
                </>
              ) : null}
            </Text>
            <Text className="sc-muted" style={{ ...small, margin: 0 }}>
              {`© ${year} ${site.name}. All rights reserved.`}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const small = { fontSize: "12px", lineHeight: "18px", color: theme.muted };
const footerLink = { color: theme.muted, textDecoration: "underline" };

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text className="sc-body" style={text}>
      {children}
    </Text>
  );
}

/**
 * Primary action, plus the raw link underneath for clients that block buttons and for the plain-text
 * version. Links are https and point only at our own origin.
 */
export function Action({ href, label }: { href: string; label: string }) {
  return (
    <>
      <Section style={{ margin: "8px 0 24px" }}>
        <Button
          href={href}
          style={{
            backgroundColor: theme.accent,
            color: theme.accentInk,
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
            padding: "14px 24px",
            display: "inline-block",
          }}
        >
          {label}
        </Button>
      </Section>
      <Text
        className="sc-muted"
        style={{ ...small, fontSize: "13px", lineHeight: "20px", margin: "0 0 20px" }}
        data-skip-in-text={true}
      >
        Button not working? Paste this link into your browser:
        <br />
        <Link className="sc-link" href={href} style={{ color: theme.accent, wordBreak: "break-all" }}>
          {href}
        </Link>
      </Text>
    </>
  );
}

/** Key facts about the event (time, old and new values), as a compact two-column list. */
export function Facts({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <Section
      style={{
        margin: "0 0 24px",
        border: `1px solid ${theme.line}`,
        borderRadius: "12px",
        padding: "6px 18px",
      }}
    >
      {rows.map(([label, value], i) => (
        <Row
          key={label}
          style={i < rows.length - 1 ? { borderBottom: `1px solid ${theme.line}` } : undefined}
        >
          <Column
            className="sc-muted"
            style={{ ...small, fontSize: "13px", padding: "10px 12px 10px 0", width: "34%" }}
          >
            {label}
          </Column>
          <Column
            className="sc-ink"
            style={{ fontSize: "14px", lineHeight: "20px", color: theme.ink, padding: "10px 0" }}
          >
            {value}
          </Column>
        </Row>
      ))}
    </Section>
  );
}

/** A highlighted note, used for "wasn't you?" security guidance. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <Section
      className="sc-notice"
      style={{
        backgroundColor: theme.noticeBg,
        border: `1px solid ${theme.noticeLine}`,
        borderRadius: "12px",
        padding: "14px 18px",
        margin: "4px 0 8px",
      }}
    >
      <Text
        className="sc-body"
        style={{ margin: 0, fontSize: "14px", lineHeight: "22px", color: theme.body }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: theme.mono, fontSize: "13px", wordBreak: "break-all" }}>{children}</span>;
}
