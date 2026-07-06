import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config({ path: path.resolve(process.cwd(), process.cwd().endsWith(path.join("apps", "api")) ? "../../.env" : ".env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_UNLOCK_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173")
}).superRefine((value, context) => {
  const secrets = [value.JWT_ACCESS_SECRET, value.JWT_REFRESH_SECRET, value.JWT_UNLOCK_SECRET];
  if (new Set(secrets).size !== secrets.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_ACCESS_SECRET"], message: "JWT secrets must be distinct" });
});

export const env = schema.parse(process.env);
