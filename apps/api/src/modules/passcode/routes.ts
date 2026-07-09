import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/security.js";
import { AppError, asyncRoute } from "../../utils/errors.js";
import { signUnlock } from "../../services/tokens.js";
import { passcodeChangeInput, passcodeDisableInput, passcodeSetupInput } from "./validation.js";

export const passcodeRouter = Router();
passcodeRouter.use(authenticate);

passcodeRouter.post("/setup", asyncRoute(async (req, res) => {
  const { passcode } = passcodeSetupInput.parse(req.body);
  const existing = await prisma.passcodeCredential.findUnique({ where: { userId: req.userId! }, select: { enabled: true } });
  if (existing?.enabled) throw new AppError(409, "PASSCODE_ALREADY_ENABLED", "Use the change-passcode flow to update your passcode");
  const hash = await bcrypt.hash(passcode, 12);
  await prisma.passcodeCredential.upsert({ where: { userId: req.userId! }, create: { userId: req.userId!, hash }, update: { hash, enabled: true, failedAttempts: 0, lockedUntil: null } });
  res.json({ success: true, data: { unlockToken: signUnlock(req.userId!) } });
}));

passcodeRouter.post("/verify", asyncRoute(async (req, res) => {
  const { passcode } = passcodeSetupInput.parse(req.body);
  const credential = await prisma.passcodeCredential.findUnique({ where: { userId: req.userId! } });
  if (!credential?.enabled) throw new AppError(409, "PASSCODE_DISABLED", "Passcode protection is not enabled");
  if (credential.lockedUntil && credential.lockedUntil > new Date()) throw new AppError(429, "PASSCODE_LOCKED", "Too many attempts; try again later");
  if (!await bcrypt.compare(passcode, credential.hash)) {
    const attempts = credential.failedAttempts + 1;
    await prisma.passcodeCredential.update({ where: { userId: req.userId! }, data: { failedAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + Math.min(30, attempts) * 60000) : null } });
    throw new AppError(401, "INVALID_PASSCODE", "Passcode is incorrect");
  }
  await prisma.passcodeCredential.update({ where: { userId: req.userId! }, data: { failedAttempts: 0, lockedUntil: null } });
  res.json({ success: true, data: { unlockToken: signUnlock(req.userId!) } });
}));

passcodeRouter.post("/change", asyncRoute(async (req, res) => {
  const input = passcodeChangeInput.parse(req.body);
  const credential = await prisma.passcodeCredential.findUnique({ where: { userId: req.userId! } });
  if (!credential || !await bcrypt.compare(input.currentPasscode, credential.hash)) throw new AppError(401, "INVALID_PASSCODE", "Current passcode is incorrect");
  await prisma.passcodeCredential.update({ where: { userId: req.userId! }, data: { hash: await bcrypt.hash(input.newPasscode, 12), failedAttempts: 0 } });
  res.json({ success: true, data: { unlockToken: signUnlock(req.userId!) } });
}));

passcodeRouter.post("/disable", asyncRoute(async (req, res) => {
  const input = passcodeDisableInput.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (!await bcrypt.compare(input.password, user.passwordHash)) throw new AppError(401, "INVALID_PASSWORD", "Password is incorrect");
  await prisma.passcodeCredential.updateMany({ where: { userId: req.userId! }, data: { enabled: false } });
  res.json({ success: true, data: null });
}));
