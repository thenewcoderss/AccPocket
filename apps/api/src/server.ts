import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => console.log(`AccPocket API listening on ${env.PORT}`));
async function shutdown(signal: string) { console.log(`${signal}: shutting down`); server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on("SIGTERM", () => void shutdown("SIGTERM")); process.on("SIGINT", () => void shutdown("SIGINT"));
