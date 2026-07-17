import crypto from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { asyncRoute, AppError } from "../../utils/errors.js";
import { authenticate } from "../../middleware/security.js";
import { DEFAULT_CATEGORIES } from "@accpocket/shared";
import { hashToken, signAccess, signRefresh, verifyRefresh } from "../../services/tokens.js";

export const authRouter = Router();
const credentials = z.object({ email: z.string().email().transform(v => v.trim().toLowerCase()), password: z.string().min(10).max(128) });
const cookie = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax", path: "/api/v1/auth", maxAge: 30 * 86400000 };

async function createSession(userId: string, req: { headers: { [key: string]: unknown }; ip?: string }) {
  const familyId = crypto.randomUUID();
  const session = await prisma.refreshSession.create({ data: { userId, familyId, tokenHash: crypto.randomUUID(), expiresAt: new Date(Date.now() + 30 * 86400000), userAgent: String(req.headers["user-agent"] ?? ""), ipAddress: req.ip } });
  const refresh = signRefresh(userId, session.id, familyId);
  await prisma.refreshSession.update({ where: { id: session.id }, data: { tokenHash: hashToken(refresh) } });
  return { accessToken: signAccess(userId), refresh };
}

authRouter.post("/signup", asyncRoute(async (req, res) => {
  const input = credentials.extend({ name: z.string().trim().min(2).max(80), currency: z.string().regex(/^[A-Z]{3}$/).default("BDT"), timezone: z.string().default("Asia/Dhaka") }).parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.$transaction(async tx => {
    const created = await tx.user.create({ data: { name: input.name, email: input.email, passwordHash, defaultCurrency: input.currency, timezone: input.timezone, settings: { create: {} } } });
    await tx.category.createMany({ data: [...DEFAULT_CATEGORIES.EXPENSE.map((name, i) => ({ userId: created.id, name, type: "EXPENSE" as const, system: true, color: ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#ec4899"][i % 5] })), ...DEFAULT_CATEGORIES.INCOME.map(name => ({ userId: created.id, name, type: "INCOME" as const, system: true, color: "#10b981" }))] });
    return created;
  });
  const session = await createSession(user.id, req);
  res.cookie("refreshToken", session.refresh, cookie).status(201).json({ success: true, data: { accessToken: session.accessToken, user: { id: user.id, name: user.name, email: user.email, defaultCurrency: user.defaultCurrency, timezone: user.timezone, passcodeEnabled: false } } });
}));

authRouter.post("/login", asyncRoute(async (req, res) => {
  const input = credentials.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { passcode: true } });
  if (!user || user.status !== "ACTIVE" || !await bcrypt.compare(input.password, user.passwordHash)) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  const session = await createSession(user.id, req);
  await prisma.auditEvent.create({ data: { userId: user.id, type: "LOGIN" } });
  res.cookie("refreshToken", session.refresh, cookie).json({ success: true, data: { accessToken: session.accessToken, user: { id: user.id, name: user.name, email: user.email, defaultCurrency: user.defaultCurrency, timezone: user.timezone, passcodeEnabled: Boolean(user.passcode?.enabled) } } });
}));

authRouter.post("/refresh", asyncRoute(async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken) throw new AppError(401, "REFRESH_REQUIRED", "Please sign in again");
  let payload;
  try { payload = verifyRefresh(oldToken); } catch { throw new AppError(401, "INVALID_REFRESH", "Please sign in again"); }
  if (payload.kind !== "refresh" || typeof payload.sub !== "string" || typeof payload.sid !== "string" || typeof payload.fid !== "string") throw new AppError(401, "INVALID_REFRESH", "Please sign in again");
  const session = await prisma.refreshSession.findUnique({ where: { id: payload.sid }, include: { user: { select: { status: true } } } });
  if (!session || session.userId !== payload.sub || session.familyId !== payload.fid || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE" || session.tokenHash !== hashToken(oldToken)) {
    if (payload.fid) await prisma.refreshSession.updateMany({ where: { familyId: String(payload.fid) }, data: { revokedAt: new Date() } });
    throw new AppError(401, "REFRESH_REUSED", "Session revoked; please sign in again");
  }
  const next = signRefresh(session.userId, session.id, session.familyId);
  const rotated = await prisma.refreshSession.updateMany({ where: { id: session.id, tokenHash: hashToken(oldToken), revokedAt: null, expiresAt: { gt: new Date() } }, data: { tokenHash: hashToken(next) } });
  if (!rotated.count) {
    await prisma.refreshSession.updateMany({ where: { familyId: session.familyId }, data: { revokedAt: new Date() } });
    throw new AppError(401, "REFRESH_REUSED", "Session revoked; please sign in again");
  }
  res.cookie("refreshToken", next, cookie).json({ success: true, data: { accessToken: signAccess(session.userId) } });
}));

authRouter.post("/logout", asyncRoute(async (req, res) => {
  const value = req.cookies.refreshToken;
  if (value) await prisma.refreshSession.updateMany({ where: { tokenHash: hashToken(value) }, data: { revokedAt: new Date() } });
  res.clearCookie("refreshToken", cookie).json({ success: true, data: null });
}));

authRouter.post("/logout-all", authenticate, asyncRoute(async (req, res) => {
  await prisma.refreshSession.updateMany({ where: { userId: req.userId!, revokedAt: null }, data: { revokedAt: new Date() } });
  res.clearCookie("refreshToken", cookie).json({ success: true, data: null });
}));
