import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string[]>) { super(message); }
}

export const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { void handler(req, res, next).catch(next); };

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found`));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  let appError = error instanceof AppError ? error : new AppError(500, "INTERNAL_ERROR", "Something went wrong");
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) (fields[issue.path.join(".")] ??= []).push(issue.message);
    appError = new AppError(422, "VALIDATION_ERROR", "Please check the submitted information", fields);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    appError = new AppError(409, "CONFLICT", "A record with these details already exists");
  }
  if (appError.status >= 500) console.error({ requestId: req.id, error: error instanceof Error ? error.message : error });
  res.status(appError.status).json({ success: false, error: { code: appError.code, message: appError.message, fields: appError.fields, requestId: req.id } });
}
