import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortfolioView, firstName, initials } from "@/components/portfolio/PortfolioView";
import { makePortfolio } from "./fixtures";

describe("PortfolioView", () => {
  it("leads with name, role, status and location", () => {
    render(<PortfolioView portfolio={makePortfolio()} year={2030} />);
    expect(screen.getByRole("heading", { level: 1, name: "Alice Chen" })).toBeInTheDocument();
    expect(screen.getByText("Frontend engineer")).toBeInTheDocument();
    expect(screen.getByText(/Open to new roles · Berlin/)).toBeInTheDocument();
  });

  it("renders landmarks and a heading per project", () => {
    render(<PortfolioView portfolio={makePortfolio()} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Chartroom",
      "Notes",
    ]);
  });

  it("uses LinkedIn as the primary contact, then email, then website", () => {
    const { unmount } = render(<PortfolioView portfolio={makePortfolio()} />);
    expect(screen.getAllByRole("link", { name: /message on linkedin/i })[0]).toHaveClass("primary");
    unmount();
    const r2 = render(<PortfolioView portfolio={makePortfolio({ linkedinUrl: null })} />);
    expect(screen.getAllByRole("link", { name: /email alice/i })[0]).toHaveAttribute(
      "href",
      "mailto:alice@example.com",
    );
    r2.unmount();
    render(
      <PortfolioView
        portfolio={makePortfolio({ linkedinUrl: null, contactEmail: null, websiteUrl: "https://a.dev" })}
      />,
    );
    expect(screen.getAllByRole("link", { name: /visit website/i })[0]).toHaveAttribute(
      "href",
      "https://a.dev",
    );
  });

  it("marks user links nofollow and profile links rel=me", () => {
    render(<PortfolioView portfolio={makePortfolio()} />);
    const github = screen.getAllByRole("link", { name: "GitHub" })[0]!;
    expect(github.getAttribute("rel")).toContain("me");
    expect(github.getAttribute("rel")).toContain("nofollow");
    expect(github).toHaveAttribute("target", "_blank");
    const source = screen.getByRole("link", { name: "View source: Chartroom" });
    expect(source.getAttribute("rel")).toContain("ugc");
    expect(source.getAttribute("rel")).not.toContain("me");
  });

  it("omits empty sections", () => {
    render(
      <PortfolioView
        portfolio={makePortfolio({
          projects: [],
          skills: [],
          linkedinUrl: null,
          contactEmail: null,
          websiteUrl: null,
          githubUrl: null,
        })}
      />,
    );
    expect(screen.queryByRole("region", { name: /projects/i })).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText(/want to work with/i)).toBeNull();
  });

  it("links the footer badge back to the platform with a referral", () => {
    render(<PortfolioView portfolio={makePortfolio()} year={2030} />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/© 2030 Alice Chen/)).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: /made with stackcase/i })).toHaveAttribute(
      "href",
      "https://stackcase.test/?ref=alice",
    );
  });

  it("applies the chosen accent", () => {
    const { container } = render(<PortfolioView portfolio={makePortfolio({ accent: "EMERALD" })} />);
    expect(container.firstElementChild).toHaveAttribute("data-accent", "EMERALD");
  });

  it("renders no headings or landmarks when embedded in another page", () => {
    render(<PortfolioView portfolio={makePortfolio()} embedded />);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
  });

  it("keeps headings but drops landmarks when nested", () => {
    render(<PortfolioView portfolio={makePortfolio()} nested />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("shows an empty-state hint in embedded previews without projects", () => {
    render(<PortfolioView portfolio={makePortfolio({ projects: [] })} embedded />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });
});

describe("name helpers", () => {
  it("builds initials and first names", () => {
    expect(initials("Alice Chen")).toBe("AC");
    expect(initials("Ada Byron Lovelace")).toBe("AL");
    expect(initials("cher")).toBe("CH");
    expect(firstName("Alice Chen")).toBe("Alice");
  });
});
