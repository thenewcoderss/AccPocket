export function validatePasscodeSetup(passcode: string, confirm: string) {
  if (!/^\d{4,6}$/.test(passcode)) throw new Error("Passcode must be 4 to 6 digits.");
  if (passcode !== confirm) throw new Error("Passcodes do not match.");
}
