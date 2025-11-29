const path = require("path");
const { PrismaClient } = require("@prisma/client");

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:./")) {
  const relative = process.env.DATABASE_URL.replace("file:./", "");
  const prismaDir = path.join(__dirname, "..", "prisma");
  const absolutePath = path.join(prismaDir, relative);
  process.env.DATABASE_URL = `file:${absolutePath}`;
}

console.log("[db] url", process.env.DATABASE_URL);

const prisma = new PrismaClient();

module.exports = { prisma };
