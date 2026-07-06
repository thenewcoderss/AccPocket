import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, requireUnlock } from "../../middleware/security.js";
import { asyncRoute } from "../../utils/errors.js";

export const meRouter = Router();
meRouter.use(authenticate);
meRouter.get("/", asyncRoute(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, include: { passcode: true, settings: true } });
  res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, defaultCurrency: user.defaultCurrency, timezone: user.timezone, locale: user.locale, passcodeEnabled: Boolean(user.passcode?.enabled), settings: user.settings } });
}));
meRouter.patch("/", asyncRoute(async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(80).optional(), timezone: z.string().min(1).max(80).optional(), locale: z.string().min(2).max(20).optional() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId! }, data: input });
  res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, defaultCurrency: user.defaultCurrency, timezone: user.timezone } });
}));

export const settingsRouter = Router();
settingsRouter.use(authenticate, requireUnlock);
settingsRouter.get("/", asyncRoute(async (req, res) => res.json({ success: true, data: await prisma.userSettings.findUniqueOrThrow({ where: { userId: req.userId! } }) })));
settingsRouter.patch("/", asyncRoute(async (req, res) => {
  const input = z.object({ theme: z.enum(["light", "dark", "system"]).optional(), weekStartsOn: z.number().int().min(0).max(6).optional(), reportPeriod: z.enum(["day", "week", "month"]).optional(), passcodeTimeoutMinutes: z.number().int().min(1).max(60).optional(), allowNegativeBalances: z.boolean().optional() }).parse(req.body);
  res.json({ success: true, data: await prisma.userSettings.update({ where: { userId: req.userId! }, data: input }) });
}));
