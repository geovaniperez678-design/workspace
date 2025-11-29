const path = require("path");
const { execSync } = require("child_process");

function ensurePrismaClient() {
  if (process.env.SKIP_PRISMA_GENERATE === "true") {
    return;
  }
  try {
    execSync("npx prisma generate", {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
    });
  } catch (error) {
    console.error("[prisma] Falha ao executar prisma generate automaticamente.");
    throw error;
  }
}

ensurePrismaClient();

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
