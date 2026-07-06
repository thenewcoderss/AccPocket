import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const hashToken = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
export const signAccess = (userId: string) => jwt.sign({ sub: userId, kind: "access" }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
export const signRefresh = (userId: string, sessionId: string, familyId: string) => jwt.sign({ sub: userId, sid: sessionId, fid: familyId, kind: "refresh" }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
export const signUnlock = (userId: string) => jwt.sign({ sub: userId, kind: "unlock" }, env.JWT_UNLOCK_SECRET, { expiresIn: "10m" });
const options: jwt.VerifyOptions = { algorithms: ["HS256"] };
export const verifyAccess = (value: string) => jwt.verify(value, env.JWT_ACCESS_SECRET, options) as jwt.JwtPayload;
export const verifyRefresh = (value: string) => jwt.verify(value, env.JWT_REFRESH_SECRET, options) as jwt.JwtPayload;
export const verifyUnlock = (value: string) => jwt.verify(value, env.JWT_UNLOCK_SECRET, options) as jwt.JwtPayload;
