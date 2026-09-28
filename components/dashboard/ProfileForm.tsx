"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/dashboard/actions";
import { TextAreaField, TextField } from "@/components/forms/Field";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { idleState } from "@/lib/action-state";
import type { PortfolioData } from "@/lib/portfolio/types";
import { AVAILABILITY, availabilityLabels, limits } from "@/lib/validation";

export function ProfileForm({ portfolio }: { portfolio: PortfolioData }) {
  const [state, action] = useActionState(updateProfile, idleState);
  const v = state.values;
  const val = (key: keyof PortfolioData & string) => v?.[key] ?? (portfolio[key] as string | null) ?? "";
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="ui-form" noValidate>
      <div className="ui-card">
        <h2>About you</h2>
        <p>This is the first screen a recruiter sees. Lead with your role.</p>
        <div className="ui-form">
          <div className="ui-row">
            <TextField
              name="displayName"
              label="Name"
              required
              maxLength={limits.displayName}
              autoComplete="name"
              defaultValue={val("displayName")}
              error={e.displayName}
            />
            <TextField
              name="pronouns"
              label="Pronouns"
              maxLength={limits.pronouns}
              placeholder="Optional, e.g. she/her"
              defaultValue={val("pronouns")}
              error={e.pronouns}
            />
          </div>
          <TextField
            name="location"
            label="Location"
            maxLength={limits.location}
            placeholder="Berlin, Germany · Remote"
            defaultValue={val("location")}
            error={e.location}
          />
          <TextField
            name="headline"
            label="Headline"
            maxLength={limits.headline}
            placeholder="Full-stack engineer who ships whole products"
            hint="Your role in a few words. It becomes your page title in search results."
            defaultValue={val("headline")}
            error={e.headline}
          />
          <TextAreaField
            name="bio"
            label="Intro"
            maxLength={limits.bio}
            rows={4}
            placeholder="Two sentences: what you build, and what you're looking for."
            hint={`Up to ${limits.bio} characters. Also used as your search description.`}
            defaultValue={val("bio")}
            error={e.bio}
          />
          <div className="ui-field">
            <label htmlFor="f-availability">Availability</label>
            <select
              id="f-availability"
              name="availability"
              className="ui-select"
              defaultValue={val("availability")}
            >
              {AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {availabilityLabels[a]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ui-card">
        <h2>How to reach you</h2>
        <p>Your main button uses LinkedIn if set, then email, then your website.</p>
        <div className="ui-form">
          <div className="ui-row">
            <TextField
              name="linkedinUrl"
              label="LinkedIn"
              inputMode="url"
              placeholder="linkedin.com/in/you"
              defaultValue={val("linkedinUrl")}
              error={e.linkedinUrl}
            />
            <TextField
              name="githubUrl"
              label="GitHub"
              inputMode="url"
              placeholder="github.com/you"
              defaultValue={val("githubUrl")}
              error={e.githubUrl}
            />
          </div>
          <div className="ui-row">
            <TextField
              name="websiteUrl"
              label="Website"
              inputMode="url"
              placeholder="you.dev"
              defaultValue={val("websiteUrl")}
              error={e.websiteUrl}
            />
            <TextField
              name="resumeUrl"
              label="Résumé"
              inputMode="url"
              placeholder="Link to a PDF, e.g. on Google Drive"
              hint="Adds a Résumé button. Make sure the link is viewable by anyone."
              defaultValue={val("resumeUrl")}
              error={e.resumeUrl}
            />
          </div>
          <TextField
            name="contactEmail"
            type="email"
            label="Public email"
            placeholder="Optional"
            hint="Shown on your portfolio. Leave blank to keep it private."
            defaultValue={val("contactEmail")}
            error={e.contactEmail}
          />
        </div>
      </div>

      <div className="ui-card">
        <h2>Search and sharing</h2>
        <p>
          How your page appears in Google and when the link is shared. Leave these blank and we&apos;ll write
          them from your name, headline and intro.
        </p>
        <div className="ui-form">
          <TextField
            name="seoTitle"
            label="Search title"
            maxLength={limits.seoTitle}
            placeholder={
              portfolio.headline ? `${portfolio.displayName} · ${portfolio.headline}` : portfolio.displayName
            }
            hint={`Up to ${limits.seoTitle} characters; search engines cut longer titles.`}
            defaultValue={val("seoTitle")}
            error={e.seoTitle}
          />
          <TextAreaField
            name="seoDescription"
            label="Search description"
            maxLength={limits.seoDescription}
            rows={3}
            placeholder="One or two sentences that make a recruiter click."
            hint={`Up to ${limits.seoDescription} characters.`}
            defaultValue={val("seoDescription")}
            error={e.seoDescription}
          />
        </div>
      </div>

      <div className="ui-actions">
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
