/**
 * Client forms driven through their real React state, with the Server Actions replaced by stubs.
 * Covers what the user sees after each outcome: errors, preserved input, resets and pending states.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/lib/action-state";
import { makePortfolio } from "./fixtures";

type Stub = ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<ActionState>>>;
const stub = (): Stub => vi.fn(async () => ({ status: "success", message: "Saved." }) as ActionState);
const dash = {
  updateProfile: stub(),
  saveProject: stub(),
  saveSkill: stub(),
  updateUsername: stub(),
  changePassword: stub(),
  deleteAccount: stub(),
  resendVerification: stub(),
  setPublished: stub(),
};
const auth = { signUp: stub(), requestPasswordReset: stub() };
vi.mock("@/app/dashboard/actions", () => dash);
vi.mock("@/app/(auth)/actions", () => auth);
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/" }));

const { ProfileForm } = await import("@/components/dashboard/ProfileForm");
const { ProjectForm } = await import("@/components/dashboard/ProjectForm");
const { SkillForm } = await import("@/components/dashboard/SkillForm");
const { UsernameForm, PasswordForm } = await import("@/components/dashboard/SettingsForms");
const { VerifyEmailBanner } = await import("@/components/dashboard/VerifyEmailBanner");
const { ForgotPasswordForm } = await import("@/components/forms/ForgotPasswordForm");
const { SignupForm } = await import("@/components/forms/SignupForm");
const { SubmitButton } = await import("@/components/forms/SubmitButton");
const { ExternalLink } = await import("@/components/ExternalLink");
const { LogoMark } = await import("@/components/brand/Logo");

async function submit(name: RegExp | string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

beforeEach(() => {
  for (const fn of [...Object.values(dash), ...Object.values(auth)]) fn.mockClear();
});

describe("ProfileForm", () => {
  it("offers pronouns, a résumé link and search overrides, and no accent (that moved to Design)", () => {
    render(<ProfileForm portfolio={makePortfolio({ pronouns: "she/her" })} />);
    expect(screen.getByLabelText("Pronouns")).toHaveValue("she/her");
    expect(screen.getByLabelText("Résumé")).toHaveAttribute("inputmode", "url");
    expect(screen.getByLabelText("Search title")).toHaveAttribute(
      "placeholder",
      "Alice Chen · Frontend engineer",
    );
    expect(screen.getByLabelText("Search description")).toHaveAttribute("maxlength", "160");
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("uses the name alone as the title placeholder when there's no headline", () => {
    render(<ProfileForm portfolio={makePortfolio({ headline: "" })} />);
    expect(screen.getByLabelText("Search title")).toHaveAttribute("placeholder", "Alice Chen");
  });

  it("shows field errors and keeps what was typed", async () => {
    dash.updateProfile.mockResolvedValueOnce({
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { resumeUrl: "Résumé URL must be a web address starting with https://." },
      values: { resumeUrl: "javascript:alert(1)", displayName: "Alice Chen" },
    });
    render(<ProfileForm portfolio={makePortfolio()} />);
    await submit("Save profile");
    const field = screen.getByLabelText("Résumé");
    expect(field).toHaveValue("javascript:alert(1)");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(/must be a web address/);
  });
});

describe("new project and skill forms", () => {
  it("clear themselves after a successful save, ready for the next one", async () => {
    render(<ProjectForm />);
    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "Ledger" } });
    await submit(/Add project/);
    expect(dash.saveProject).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Project name")).toHaveValue("");
  });

  it("keep the input when saving fails", async () => {
    dash.saveSkill.mockResolvedValueOnce({
      status: "error",
      message: "You can list up to 20 skill areas.",
      values: { area: "Data", tools: "dbt" },
    });
    render(<SkillForm />);
    fireEvent.change(screen.getByLabelText("Area"), { target: { value: "Data" } });
    await submit(/Add skill/);
    expect(screen.getByLabelText("Area")).toHaveValue("Data");
    expect(screen.getByText("You can list up to 20 skill areas.")).toBeInTheDocument();
  });
});

describe("settings forms", () => {
  it("disables username changes during the cooldown", () => {
    render(<UsernameForm username="alice" prefix="stackcase.test/" nextChangeLabel="5 October" />);
    expect(screen.getByRole("button", { name: "Change username" })).toBeDisabled();
    expect(screen.getByText(/change it again on 5 October/)).toBeInTheDocument();
  });

  it("keeps a rejected username in the field", async () => {
    dash.updateUsername.mockResolvedValueOnce({
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { username: "That name is reserved. Try another." },
      values: { username: "admin" },
    });
    render(<UsernameForm username="alice" prefix="stackcase.test/" nextChangeLabel={null} />);
    await submit("Change username");
    expect(screen.getByRole("textbox")).toHaveValue("admin");
  });

  it("clears the password fields after a change", async () => {
    render(<PasswordForm />);
    const current = screen.getByLabelText("Current password");
    fireEvent.change(current, { target: { value: "old password here" } });
    await submit("Change password");
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });

  it("shows resend failures as errors", async () => {
    dash.resendVerification.mockResolvedValueOnce({ status: "error", message: "Try again in 5 minutes." });
    render(<VerifyEmailBanner email="alice@example.com" />);
    await submit("Resend link");
    expect(screen.getByText("Try again in 5 minutes.")).toHaveClass("ui-error");
  });
});

describe("auth forms", () => {
  it("sign-up links the consent error to the checkbox and keeps it ticked", async () => {
    auth.signUp.mockResolvedValueOnce({
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { accept: "Please confirm you agree to the Terms and are old enough to sign up." },
      values: { email: "a@b.co", username: "alice", accept: "yes" },
    });
    render(<SignupForm prefix="stackcase.test/" username="alice" />);
    await submit(/Create my portfolio/);
    const box = screen.getByRole("checkbox");
    expect(box).toBeChecked();
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAccessibleDescription(/agree to the Terms/);
  });

  it("forgot password replaces the form with the neutral confirmation", async () => {
    auth.requestPasswordReset.mockResolvedValueOnce({
      status: "success",
      message: "If an account uses that email, a reset link is on its way.",
    });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.co" } });
    await submit(/Send/);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText(/reset link is on its way/)).toBeInTheDocument();
  });
});

describe("small building blocks", () => {
  it("SubmitButton shows its pending label while the action runs", async () => {
    let release!: () => void;
    const action = () => new Promise<void>((r) => (release = r));
    render(
      <form action={action}>
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
      </form>,
    );
    await submit("Save");
    expect(screen.getByRole("button")).toHaveTextContent("Saving…");
    expect(screen.getByRole("button")).toBeDisabled();
    await act(async () => release());
    expect(screen.getByRole("button")).toHaveTextContent("Save");
  });

  it("ExternalLink always isolates the opener, with or without extra rel tokens", () => {
    render(
      <>
        <ExternalLink href="https://a.dev">A</ExternalLink>
        <ExternalLink href="https://b.dev" rel="me  nofollow">
          B
        </ExternalLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "A" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("rel", "noopener noreferrer me nofollow");
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("target", "_blank");
  });

  it("LogoMark is decorative unless given a title", () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    render(<LogoMark title="Stackcase" size={40} />);
    expect(screen.getByRole("img", { name: "Stackcase" })).toHaveAttribute("width", "40");
  });
});
