import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config({ path: path.resolve(process.cwd(), process.cwd().endsWith(path.join("apps", "api")) ? "../../.env" : ".env") });

export const performanceLimit = z.coerce.number().int().min(1).max(1_000_000);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_UNLOCK_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  REPORT_DETAIL_ROW_LIMIT: performanceLimit.default(5_000),
  PDF_EXPORT_ROW_LIMIT: performanceLimit.default(10_000),
  EXCEL_EXPORT_ROW_LIMIT: performanceLimit.default(50_000)
}).superRefine((value, context) => {
  const secrets = [value.JWT_ACCESS_SECRET, value.JWT_REFRESH_SECRET, value.JWT_UNLOCK_SECRET];
  if (new Set(secrets).size !== secrets.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_ACCESS_SECRET"], message: "JWT secrets must be distinct" });
});

export const env = schema.parse(process.env);
