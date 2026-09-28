import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET as usernameApi } from "@/app/api/username/route";
import PortfolioPage, { generateMetadata, generateStaticParams } from "@/app/[username]/page";
import { GET as llms } from "@/app/[username]/llms.txt/route";
import { GET as og } from "@/app/[username]/og/route";
import { GET as siteLlms } from "@/app/llms.txt/route";
import sitemap from "@/app/sitemap";
import { db } from "@/lib/db";
import {
  countPublishedPortfolios,
  listPublishedPortfolios,
  lookupPublicPortfolio,
} from "@/lib/portfolio/queries";
import { NotFoundSignal, RedirectSignal } from "../setup/request-context";
import { addProject, createUser } from "./helpers";

const params = (username: string) => ({ params: Promise.resolve({ username }) });

async function publishedUser(username: string) {
  const user = await createUser(username, { published: true, headline: "Data engineer" });
  await addProject(user.portfolio!.id, "Pipeline", 0);
  await db.portfolio.update({
    where: { userId: user.id },
    data: { displayName: "Ivy Park", bio: "I move data around." },
  });
  return user;
}

describe("lookupPublicPortfolio", () => {
  it("finds published portfolios only", async () => {
    await publishedUser("ivy");
    await createUser("draft");
    expect(await lookupPublicPortfolio("IVY")).toMatchObject({
      type: "found",
      portfolio: { username: "ivy" },
    });
    expect(await lookupPublicPortfolio("draft")).toEqual({ type: "missing" });
    expect(await lookupPublicPortfolio("nobody")).toEqual({ type: "missing" });
    expect(await lookupPublicPortfolio("bad_name!")).toEqual({ type: "missing" });
  });

  it("follows recent renames and forgets expired ones", async () => {
    const ivy = await publishedUser("ivy");
    await db.usernameRedirect.create({ data: { username: "ivy-old", userId: ivy.id } });
    expect(await lookupPublicPortfolio("ivy-old")).toEqual({ type: "redirect", username: "ivy" });
    await db.usernameRedirect.update({
      where: { username: "ivy-old" },
      data: { createdAt: new Date(2020, 0, 1) },
    });
    expect(await lookupPublicPortfolio("ivy-old")).toEqual({ type: "missing" });
  });

  it("counts published portfolios", async () => {
    await publishedUser("ivy");
    await createUser("draft");
    expect(await countPublishedPortfolios()).toBe(1);
  });
});

describe("portfolio page", () => {
  it("has no build-time params: pages render on first visit", () => {
    expect(generateStaticParams()).toEqual([]);
  });

  it("builds canonical, Open Graph and Twitter metadata at the portfolio path", async () => {
    await publishedUser("ivy");
    const meta = await generateMetadata(params("ivy"));
    expect(meta.title).toEqual({ absolute: "Ivy Park · Data engineer" });
    expect(meta.description).toBe("I move data around.");
    expect(meta.alternates?.canonical).toBe("https://stackcase.test/ivy");
    expect(meta.openGraph).toMatchObject({
      type: "profile",
      url: "https://stackcase.test/ivy",
      firstName: "Ivy",
      lastName: "Park",
      username: "ivy",
      images: [{ url: "https://stackcase.test/ivy/og", width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toMatchObject({ index: true });
  });

  it("noindexes missing portfolios", async () => {
    expect((await generateMetadata(params("ghost"))).robots).toMatchObject({ index: false });
  });

  it("renders published portfolios with JSON-LD", async () => {
    await publishedUser("ivy");
    const tree = await PortfolioPage(params("ivy"));
    const json = JSON.stringify(tree);
    expect(json).toContain('"@type":"Person"');
    expect(json).toContain('"image":"https://stackcase.test/ivy/og"');
  });

  it("308s an old username to the new address and 404s the rest", async () => {
    const ivy = await publishedUser("ivy");
    await db.usernameRedirect.create({ data: { username: "ivy-old", userId: ivy.id } });
    await expect(PortfolioPage(params("ivy-old"))).rejects.toMatchObject({
      url: "https://stackcase.test/ivy",
      status: 308,
    } satisfies Partial<RedirectSignal>);
    await expect(PortfolioPage(params("ghost"))).rejects.toBeInstanceOf(NotFoundSignal);
  });
});

describe("portfolio SEO files", () => {
  it("serve llms.txt and a social image for published portfolios", async () => {
    await publishedUser("ivy");
    const l = await llms(new Request("http://x"), params("ivy"));
    expect(l.headers.get("content-type")).toContain("text/plain");
    expect(await l.text()).toMatch(/^# Ivy Park/);
    expect((await og(new Request("http://x"), params("ivy"))).headers.get("content-type")).toBe("image/png");
  });

  it("404 for missing portfolios", async () => {
    expect((await llms(new Request("http://x"), params("ghost"))).status).toBe(404);
    expect((await og(new Request("http://x"), params("ghost"))).status).toBe(404);
  });
});

describe("site-wide crawler files", () => {
  it("the sitemap lists every published portfolio with its image", async () => {
    await publishedUser("ivy");
    await createUser("draft");
    const entries = await sitemap();
    expect(entries.map((e) => e.url)).toEqual([
      "https://stackcase.test/",
      "https://stackcase.test/signup",
      "https://stackcase.test/privacy",
      "https://stackcase.test/terms",
      "https://stackcase.test/accessibility",
      "https://stackcase.test/ivy",
    ]);
    const ivy = entries.at(-1)!;
    expect(ivy).toMatchObject({ images: ["https://stackcase.test/ivy/og"], priority: 0.8 });
    expect(ivy.lastModified).toBeInstanceOf(Date);
  });

  it("llms.txt describes Stackcase and links public portfolios", async () => {
    await publishedUser("ivy");
    const res = await siteLlms();
    const body = await res.text();
    expect(body.startsWith("# Stackcase\n\n> Stackcase is a free portfolio builder")).toBe(true);
    expect(body).toContain("- [Ivy Park](https://stackcase.test/ivy): Data engineer");
  });

  it("listPublishedPortfolios returns newest first and survives a database outage", async () => {
    await publishedUser("ivy");
    expect((await listPublishedPortfolios()).map((p) => p.username)).toEqual(["ivy"]);
    const { db: client } = await import("@/lib/db");
    const spy = vi.spyOn(client.portfolio, "findMany").mockRejectedValueOnce(new Error("down"));
    expect(await listPublishedPortfolios()).toEqual([]);
    spy.mockRestore();
  });
});

describe("GET /api/username", () => {
  function call(u: string, ip = "198.51.100.20") {
    return usernameApi(
      new NextRequest(`https://stackcase.test/api/username?u=${u}`, { headers: { "x-forwarded-for": ip } }),
    );
  }

  it("reports availability without caching", async () => {
    await createUser("jules");
    const res = await call("jules");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toMatchObject({
      available: false,
      suggestions: ["jules-dev", "jules-2", "jules-3"],
    });
    expect(await (await call("julia")).json()).toMatchObject({ available: true });
  });

  it("rate-limits per IP", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 61; i++) last = await call("someone", "198.51.100.99");
    expect(last!.status).toBe(429);
    expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
