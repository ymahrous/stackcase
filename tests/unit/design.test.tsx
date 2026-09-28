import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { DEFAULT_DESIGN, type DesignData, designAttributes } from "@/lib/portfolio/types";
import { makePortfolio } from "./fixtures";

const updateDesign = vi.fn(async () => ({ status: "success" as const, message: "Design saved." }));
const resetDesign = vi.fn(async () => ({
  status: "success" as const,
  message: "Design reset to the defaults.",
}));
vi.mock("@/app/dashboard/actions", () => ({ updateDesign, resetDesign }));

const { DesignForm, DesignPreview, describeDesign } = await import("@/components/dashboard/DesignForm");

const design: DesignData = { ...DEFAULT_DESIGN };

describe("designAttributes", () => {
  it("maps each choice to the data attribute the CSS reads", () => {
    expect(
      designAttributes({ accent: "AMBER", colorMode: "DARK", fontStyle: "SERIF", layout: "CASE_STUDY" }),
    ).toEqual({
      "data-accent": "AMBER",
      "data-theme": "dark",
      "data-font": "serif",
      "data-layout": "case-study",
    });
  });
  it("sets no theme for 'Match device', so the visitor's setting wins", () => {
    expect(designAttributes({ ...DEFAULT_DESIGN })["data-theme"]).toBeUndefined();
    expect(designAttributes({ ...DEFAULT_DESIGN, colorMode: "LIGHT" })["data-theme"]).toBe("light");
  });
  it("uses kebab-case layout names that exist in the stylesheet", () => {
    expect(designAttributes({ ...DEFAULT_DESIGN, layout: "GRID" })["data-layout"]).toBe("grid");
    expect(designAttributes({ ...DEFAULT_DESIGN, layout: "COMPACT" })["data-layout"]).toBe("compact");
  });
});

describe("describeDesign", () => {
  it("summarizes every choice in plain words", () => {
    expect(describeDesign(design)).toBe(
      "Cobalt accent, match device, grotesk headings, case studies, showing summary card, skills, contact",
    );
    expect(
      describeDesign({ ...design, showGlance: false, showSkills: false, showContact: false, layout: "GRID" }),
    ).toContain("card grid, projects only");
  });
});

describe("PortfolioView design options", () => {
  const view = (overrides = {}) => {
    const { container } = render(<PortfolioView portfolio={makePortfolio(overrides)} />);
    return container.querySelector(".pf") as HTMLElement;
  };

  it("applies theme, font and layout attributes", () => {
    const root = view({ colorMode: "DARK", fontStyle: "MONO", layout: "GRID", accent: "EMERALD" });
    expect(root.dataset).toMatchObject({ accent: "EMERALD", theme: "dark", font: "mono", layout: "grid" });
    expect(root.querySelector(".proj-list")?.children).toHaveLength(2);
  });

  it("shows pronouns next to the name, labelled for screen readers", () => {
    view({ pronouns: "they/them" });
    expect(screen.getByText("they/them").closest("p")).toHaveTextContent("Pronouns: they/them");
  });

  it("adds a Résumé button in the hero and contact section", () => {
    view({ resumeUrl: "https://alice.dev/cv.pdf" });
    const links = screen.getAllByRole("link", { name: /Résumé/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://alice.dev/cv.pdf");
    expect(links[0]).toHaveAttribute("rel", expect.stringContaining("nofollow"));
  });

  it("a résumé alone is enough for the contact section", () => {
    view({
      linkedinUrl: null,
      contactEmail: null,
      websiteUrl: null,
      githubUrl: null,
      resumeUrl: "https://a.dev/cv",
    });
    expect(screen.getByRole("heading", { name: /Want to work with Alice/ })).toBeInTheDocument();
  });

  it("hides the glance card, skills and contact sections when switched off", () => {
    const root = view({ showGlance: false, showSkills: false, showContact: false });
    expect(screen.queryByRole("complementary", { name: "At a glance" })).toBeNull();
    expect(root.querySelector("#skills")).toBeNull();
    expect(root.querySelector("#contact")).toBeNull();
    expect(root.querySelector("#work")).not.toBeNull();
  });

  it("puts skills before projects when asked", () => {
    const root = view({ sectionOrder: "SKILLS_FIRST" });
    const ids = [...root.querySelectorAll("main > section")].map((s) => s.id);
    expect(ids).toEqual(["skills", "work", "contact"]);
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s.indexOf("What I work with")).toBeLessThan(h2s.indexOf("Projects"));
  });
});

describe("DesignForm", () => {
  beforeEach(() => {
    updateDesign.mockClear();
    resetDesign.mockClear();
  });
  const preview = () => document.querySelector(".dp") as HTMLElement;

  it("starts from the saved design and previews it", () => {
    render(
      <DesignForm design={{ ...design, accent: "VIOLET" }} name="Ada Quinn" headline="Backend engineer" />,
    );
    expect(screen.getByRole("radio", { name: "Violet" })).toBeChecked();
    expect(preview().dataset).toMatchObject({ accent: "VIOLET", font: "grotesk", layout: "case-study" });
    expect(within(preview()).getByText("Ada Quinn")).toBeInTheDocument();
    expect(preview()).toHaveAttribute("aria-hidden", "true");
  });

  it("updates the preview and the spoken summary on every change, before saving", () => {
    render(<DesignForm design={design} name="" headline="" />);
    fireEvent.click(screen.getByRole("radio", { name: /^Dark/ }));
    fireEvent.click(screen.getByRole("radio", { name: /^Serif/ }));
    fireEvent.click(screen.getByRole("radio", { name: /^Card grid/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Crimson" }));
    expect(preview().dataset).toMatchObject({
      theme: "dark",
      font: "serif",
      layout: "grid",
      accent: "CRIMSON",
    });
    expect(screen.getByText(/^Preview: Crimson accent, dark, serif headings, card grid/)).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(within(preview()).getByText("Your name")).toBeInTheDocument();
    expect(updateDesign).not.toHaveBeenCalled();
  });

  it("disables the order when skills are hidden but still submits the saved order", () => {
    render(<DesignForm design={{ ...design, sectionOrder: "SKILLS_FIRST" }} name="A" headline="B" />);
    const order = screen.getByLabelText("Order");
    expect(order).toBeEnabled();
    expect(
      within(preview()).getByText("Skills").compareDocumentPosition(within(preview()).getByText("Projects")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    fireEvent.click(screen.getByRole("checkbox", { name: "Skills table" }));
    expect(order).toBeDisabled();
    const hidden = document.querySelector('input[type="hidden"][name="sectionOrder"]') as HTMLInputElement;
    expect(hidden.value).toBe("SKILLS_FIRST");
    expect(within(preview()).queryByText("Skills")).toBeNull();
  });

  it("changes the order from the select", () => {
    render(<DesignForm design={design} name="A" headline="B" />);
    fireEvent.change(screen.getByLabelText("Order"), { target: { value: "SKILLS_FIRST" } });
    const labels = [...preview().querySelectorAll(".dp-label")].map((l) => l.textContent);
    expect(labels).toEqual(["Skills", "Projects"]);
  });

  it("toggles the glance card and contact section in the preview", () => {
    render(<DesignForm design={design} name="A" headline="B" />);
    fireEvent.click(screen.getByRole("checkbox", { name: /At a glance/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Work with me/ }));
    expect(preview().querySelector(".dp-glance")).toBeNull();
    expect(preview().querySelector(".dp-contact")).toBeNull();
  });

  it("submits every field to the save action", async () => {
    render(<DesignForm design={design} name="A" headline="B" />);
    fireEvent.click(screen.getByRole("radio", { name: /^Compact list/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /At a glance/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save design" }));
    });
    expect(updateDesign).toHaveBeenCalledOnce();
    const data = (updateDesign.mock.calls[0] as unknown as [unknown, FormData])[1];
    expect(Object.fromEntries(data)).toEqual({
      accent: "COBALT",
      colorMode: "AUTO",
      fontStyle: "GROTESK",
      layout: "COMPACT",
      sectionOrder: "PROJECTS_FIRST",
      showSkills: "on",
      showContact: "on",
    });
    expect(await screen.findByText("Design saved.")).toBeInTheDocument();
  });

  it("resets to the defaults with a separate action", async () => {
    render(<DesignForm design={design} name="A" headline="B" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    });
    expect(resetDesign).toHaveBeenCalledOnce();
    expect(await screen.findByText("Design reset to the defaults.")).toBeInTheDocument();
  });
});

describe("DesignPreview", () => {
  it("renders three sample projects in every layout", () => {
    for (const layout of ["CASE_STUDY", "COMPACT", "GRID"] as const) {
      const { container, unmount } = render(
        <DesignPreview design={{ ...design, layout }} name="A" headline="B" />,
      );
      expect(container.querySelectorAll(".dp-proj")).toHaveLength(3);
      unmount();
    }
  });
});
