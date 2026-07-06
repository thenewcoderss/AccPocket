import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() { console.log("AccPocket categories are seeded per user during signup."); }
main().finally(() => prisma.$disconnect());
