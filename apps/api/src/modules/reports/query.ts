import { DateTime } from "luxon";
import { z } from "zod";

const reportDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => DateTime.fromISO(value, { zone: "utc" }).isValid, "Choose a valid report date");

export const reportQuery = z.object({ period: z.enum(["day", "week", "month"]).default("month"), from: reportDate.optional(), to: reportDate.optional() })
  .refine(value => Boolean(value.from) === Boolean(value.to), "from and to must be provided together")
  .refine(value => !value.from || !value.to || value.from <= value.to, "from must be on or before to")
  .transform(value => ({ period: value.period, from: value.from ? DateTime.fromISO(value.from, { zone: "utc" }).toJSDate() : undefined, to: value.to ? DateTime.fromISO(value.to, { zone: "utc" }).plus({ days: 1 }).toJSDate() : undefined }));
