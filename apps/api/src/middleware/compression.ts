import compression from "compression";
import type { Request, Response } from "express";

export function shouldCompress(req: Request, res: Response) {
  const contentType = String(res.getHeader("Content-Type") ?? "").toLowerCase();
  if (contentType.includes("application/pdf") || contentType.includes("spreadsheetml") || contentType.includes("application/zip")) return false;
  return compression.filter(req, res);
}

export const responseCompression = compression({ threshold: 1024, filter: shouldCompress });
