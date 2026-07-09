import { describe, expect, it } from "vitest";
import { passcodeChangeInput, passcodeDisableInput, passcodeSetupInput } from "../src/modules/passcode/validation.js";

describe("passcode validation", () => {
  it("accepts 4 to 6 digit passcodes", () => {
    expect(passcodeSetupInput.parse({ passcode: "1234" })).toEqual({ passcode: "1234" });
    expect(passcodeSetupInput.parse({ passcode: "123456" })).toEqual({ passcode: "123456" });
  });

  it("rejects invalid setup and change passcodes", () => {
    expect(() => passcodeSetupInput.parse({ passcode: "123" })).toThrow();
    expect(() => passcodeSetupInput.parse({ passcode: "1234567" })).toThrow();
    expect(() => passcodeSetupInput.parse({ passcode: "12a4" })).toThrow();
    expect(() => passcodeChangeInput.parse({ currentPasscode: "1234", newPasscode: "12a4" })).toThrow();
  });

  it("requires a password before disabling passcode protection", () => {
    expect(passcodeDisableInput.parse({ password: "secret" })).toEqual({ password: "secret" });
    expect(() => passcodeDisableInput.parse({ password: "" })).toThrow();
  });
});
