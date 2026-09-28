import { revalidatePath } from "next/cache";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PortfolioPage, { generateMetadata } from "@/app/[username]/page";
import { GET as llms } from "@/app/[username]/llms.txt/route";
import { GET as portfolioOg } from "@/app/[username]/og/route";
import { resetDesign, updateDesign, updateProfile } from "@/app/dashboard/actions";
import DesignPage from "@/app/dashboard/design/page";
import { GET as siteOg } from "@/app/og/route";
import { idleState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { exportUserData } from "@/lib/export";
import { DEFAULT_DESIGN } from "@/lib/portfolio/types";
import { expectRedirect, form } from "../setup/request-context";
import { addProject, createUser, signInAs } from "./helpers";

const params = (username: string) => ({ params: Promise.resolve({ username }) });
const html = async (el: Promise<React.ReactElement> | React.ReactElement) => renderToStaticMarkup(await el);

const bold = {
  accent: "CRIMSON",
  colorMode: "DARK",
  fontStyle: "SERIF",
  layout: "GRID",
  sectionOrder: "SKILLS_FIRST",
  showGlance: "on",
  showSkills: "on",
  showContact: "",
};

async function published(username: string) {
  const user = await createUser(username, { published: true, headline: "Data engineer", signIn: true });
  await addProject(user.portfolio!.id, "Pipeline", 0);
  await db.skill.create({
    data: { portfolioId: user.portfolio!.id, position: 0, area: "Data", tools: "dbt, Airflow" },
  });
  return user;
}

describe("updateDesign", () => {
  beforeEach(() => vi.mocked(revalidatePath).mockClear());

  it("requires a session", async () => {
    expect(await expectRedirect(() => updateDesign(idleState, form(bold)))).toBe(
      "/login?next=%2Fdashboard%2Fdesign",
    );
    expect(await expectRedirect(() => resetDesign())).toBe("/login?next=%2Fdashboard%2Fdesign");
  });

  it("saves every choice and refreshes the public page, sitemap and llms.txt", async () => {
    const user = await createUser("june", { signIn: true });
    expect(await updateDesign(idleState, form(bold))).toEqual({
      status: "success",
      message: "Design saved.",
    });
    const p = await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } });
    expect(p).toMatchObject({
      accent: "CRIMSON",
      colorMode: "DARK",
      fontStyle: "SERIF",
      layout: "GRID",
      sectionOrder: "SKILLS_FIRST",
      showGlance: true,
      showSkills: true,
      showContact: false,
    });
    const paths = vi.mocked(revalidatePath).mock.calls.map((c) => c[0]);
    expect(paths).toEqual(expect.arrayContaining(["/june", "/sitemap.xml", "/llms.txt", "/dashboard"]));
  });

  it("rejects unknown options without saving anything", async () => {
    const user = await createUser("june", { signIn: true });
    const state = await updateDesign(idleState, form({ ...bold, layout: "CAROUSEL", colorMode: "<script>" }));
    expect(state.status).toBe("error");
    expect(Object.keys(state.fieldErrors ?? {}).sort()).toEqual(["colorMode", "layout"]);
    expect(await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } })).toMatchObject(
      DEFAULT_DESIGN,
    );
  });

  it("only changes the signed-in user's portfolio", async () => {
    const other = await createUser("other");
    await createUser("june", { signIn: true });
    await updateDesign(idleState, form(bold));
    expect(await db.portfolio.findUniqueOrThrow({ where: { userId: other.id } })).toMatchObject(
      DEFAULT_DESIGN,
    );
  });

  it("resets to the defaults", async () => {
    const user = await createUser("june", { signIn: true });
    await updateDesign(idleState, form(bold));
    expect(await resetDesign()).toEqual({ status: "success", message: "Design reset to the defaults." });
    expect(await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } })).toMatchObject(
      DEFAULT_DESIGN,
    );
  });
});

describe("design page", () => {
  it("requires a session", async () => {
    expect(await expectRedirect(() => DesignPage())).toBe("/login?next=%2Fdashboard%2Fdesign");
  });

  it("shows the saved choices", async () => {
    await createUser("june", { signIn: true });
    await updateDesign(idleState, form(bold));
    const out = await html(DesignPage());
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain(`name="accent" checked="" value="CRIMSON"`);
    expect(out).toContain(`name="layout" checked="" value="GRID"`);
    expect(out).toContain('data-theme="dark"');
  });
});

describe("public portfolio with a custom design", () => {
  it("renders the chosen theme, font, layout and section order", async () => {
    await published("kai");
    await updateDesign(idleState, form(bold));
    const out = await html(PortfolioPage(params("kai")));
    expect(out).toMatch(
      /class="pf" data-accent="CRIMSON" data-theme="dark" data-font="serif" data-layout="grid"/,
    );
    expect(out.indexOf('id="skills"')).toBeLessThan(out.indexOf('id="work"'));
    expect(out).not.toContain('id="contact"');
  });

  it("hidden skills disappear from the page and from llms.txt", async () => {
    await published("kai");
    await updateDesign(idleState, form({ ...bold, showSkills: "" }));
    expect(await html(PortfolioPage(params("kai")))).not.toContain('id="skills"');
    expect(await (await llms(new Request("http://x"), params("kai"))).text()).not.toContain("## Skills");
  });

  it("uses the custom search title and description, and shows pronouns and the résumé", async () => {
    await published("kai");
    await updateProfile(
      idleState,
      form({
        displayName: "Kai Moreno",
        headline: "Data engineer",
        availability: "OPEN",
        pronouns: "he/him",
        resumeUrl: "kai.dev/cv.pdf",
        seoTitle: "Kai Moreno, data engineer (dbt, Airflow)",
        seoDescription: "I build reliable data pipelines for analytics teams.",
      }),
    );
    const meta = await generateMetadata(params("kai"));
    expect(meta.title).toEqual({ absolute: "Kai Moreno, data engineer (dbt, Airflow)" });
    expect(meta.description).toBe("I build reliable data pipelines for analytics teams.");
    expect(meta.openGraph).toMatchObject({ title: "Kai Moreno, data engineer (dbt, Airflow)" });
    const out = await html(PortfolioPage(params("kai")));
    expect(out).toContain('<span class="sr-only">Pronouns: </span>he/him');
    expect(out).toContain('href="https://kai.dev/cv.pdf"');
  });

  it("dark-mode portfolios get a social image too", async () => {
    await published("kai");
    await updateDesign(idleState, form(bold));
    const res = await portfolioOg(new Request("http://x"), params("kai"));
    expect(res.headers.get("content-type")).toBe("image/png");
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });
});

describe("the site's own social image", () => {
  it("renders a PNG", async () => {
    const res = await siteOg();
    expect(res.headers.get("content-type")).toBe("image/png");
  });
});

describe("data export and database guarantees", () => {
  it("includes profile and design choices in the export", async () => {
    const user = await published("kai");
    await updateDesign(idleState, form(bold));
    const data = await exportUserData(user.id);
    expect(data!.account.portfolio).toMatchObject({
      colorMode: "DARK",
      layout: "GRID",
      showContact: false,
      pronouns: "",
      resumeUrl: null,
      seoTitle: "",
    });
  });

  it("CHECK constraints stop over-long text even if the app is bypassed", async () => {
    const user = await createUser("kai");
    for (const data of [
      { pronouns: "x".repeat(31) },
      { seoTitle: "x".repeat(71) },
      { seoDescription: "x".repeat(161) },
    ]) {
      await expect(db.portfolio.update({ where: { userId: user.id }, data })).rejects.toThrow();
    }
  });

  it("new portfolios start with the default design", async () => {
    const user = await createUser("kai");
    await signInAs(user.id);
    expect(await db.portfolio.findUniqueOrThrow({ where: { userId: user.id } })).toMatchObject(
      DEFAULT_DESIGN,
    );
  });
});
