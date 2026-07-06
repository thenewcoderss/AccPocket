import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { verifyAccess, verifyUnlock } from "../services/tokens.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const value = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!value) return next(new AppError(401, "AUTH_REQUIRED", "Please sign in"));
  try {
    const payload = verifyAccess(value);
    if (payload.kind !== "access" || !payload.sub) throw new Error();
    req.userId = payload.sub;
    next();
  } catch { next(new AppError(401, "INVALID_TOKEN", "Your session has expired")); }
}

export async function requireUnlock(req: Request, _res: Response, next: NextFunction) {
  const credential = await prisma.passcodeCredential.findUnique({ where: { userId: req.userId! } });
  if (!credential?.enabled) return next();
  const value = req.header("x-unlock-token");
  if (!value) return next(new AppError(423, "APP_LOCKED", "Enter your passcode to continue"));
  try {
    const payload = verifyUnlock(value);
    if (payload.kind !== "unlock" || payload.sub !== req.userId) throw new Error();
    req.unlockVerified = true;
    next();
  } catch { next(new AppError(423, "APP_LOCKED", "Enter your passcode to continue")); }
}
