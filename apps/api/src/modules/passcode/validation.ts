import { z } from "zod";

export const passcodeField = z.string().regex(/^\d{4,6}$/, "Passcode must be 4 to 6 digits");
export const passcodeSetupInput = z.object({ passcode: passcodeField });
export const passcodeChangeInput = z.object({ currentPasscode: passcodeField, newPasscode: passcodeField });
export const passcodeDisableInput = z.object({ password: z.string().min(1) });
