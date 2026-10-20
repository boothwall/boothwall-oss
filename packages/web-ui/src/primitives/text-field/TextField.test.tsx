import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as foundations from "#foundations";
import { TextSetting } from "#patterns";

import { TextField } from "./TextField";

const fields = (
  <>
    <TextField label="Name" hint="Your name" />
    <TextSetting label="Caption" showLabel value="Hello" maxLength={30} onChange={() => {}} />
  </>
);

describe("form field sizing", () => {
  it("preserves the standalone defaults without a provider", () => {
    render(fields);
    expect(screen.getByLabelText("Name").classList.contains("h-11")).toBe(true);
    expect(screen.getByLabelText("Caption").classList.contains("h-12")).toBe(true);
    expect(screen.getByLabelText("Name").getAttribute("aria-describedby")).toBe(
      screen.getByText("Your name").id,
    );
  });

  it("scopes large fields to their provider and allows a nested default override", () => {
    expect(foundations.FieldScaleProvider).toBeTypeOf("function");
    const { FieldScaleProvider } = foundations;
    render(
      <>
        <FieldScaleProvider scale="lg">
          {fields}
          <FieldScaleProvider scale="md">
            <TextField label="Nested default" />
          </FieldScaleProvider>
        </FieldScaleProvider>
        <TextField label="Outside provider" />
      </>,
    );
    expect(screen.getByLabelText("Name").classList.contains("h-14")).toBe(true);
    expect(screen.getByLabelText("Caption").classList.contains("h-14")).toBe(true);
    expect(screen.getByLabelText("Nested default").classList.contains("h-11")).toBe(true);
    expect(screen.getByLabelText("Outside provider").classList.contains("h-11")).toBe(true);
  });
});
