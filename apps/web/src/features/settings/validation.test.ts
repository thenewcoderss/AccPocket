import { describe, expect, it } from "vitest";
import { validatePasscodeSetup } from "./validation";

describe("settings passcode validation", () => {
  it("accepts matching 4 to 6 digit passcodes", () => {
    expect(() => validatePasscodeSetup("1234", "1234")).not.toThrow();
    expect(() => validatePasscodeSetup("123456", "123456")).not.toThrow();
  });

  it("rejects non-digit, short, long, or mismatched passcodes", () => {
    expect(() => validatePasscodeSetup("123", "123")).toThrow("Passcode must be 4 to 6 digits.");
    expect(() => validatePasscodeSetup("1234567", "1234567")).toThrow("Passcode must be 4 to 6 digits.");
    expect(() => validatePasscodeSetup("12a4", "12a4")).toThrow("Passcode must be 4 to 6 digits.");
    expect(() => validatePasscodeSetup("1234", "4321")).toThrow("Passcodes do not match.");
  });
});
