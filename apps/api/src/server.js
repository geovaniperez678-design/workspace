const path = require("path");
const { execSync } = require("child_process");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcrypt");
const { prisma } = require("./prismaClient");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const driveRoutes = require("./driveRoutes");
const docsRoutes = require("./docsRoutes");
const taskRoutes = require("./taskRoutes");
const calendarRoutes = require("./calendarRoutes");
const { requireAuth } = require("./authMiddleware");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Allokapri API rodando" });
});

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/users", userRoutes);

app.use("/api/drive", requireAuth, driveRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/calendar", calendarRoutes);

const meHandler = (req, res) => {
  res.json({ user: req.user });
};
app.get("/api/me", requireAuth, meHandler);
app.get("/me", requireAuth, meHandler);

app.use((err, req, res, next) => {
  console.error("[api] erro", err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "erro_interno" });
});

function ensureDatabaseMigrations() {
  if (process.env.SKIP_PRISMA_MIGRATE === "true") {
    console.log("[prisma] SKIP_PRISMA_MIGRATE habilitado, pulando migrate deploy.");
    return;
  }
  try {
    execSync("npx prisma migrate deploy", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
  } catch (error) {
    console.error("[prisma] Erro ao aplicar migrations automaticamente.");
    throw error;
  }
}

async function ensureSeedOwnerUser() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@allokapri.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "Allokapri123!";
  const ownerName = process.env.SEED_OWNER_NAME || "Owner";

  const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existing) {
    let updated = false;
    if (!existing.isActive) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      updated = true;
    }
    const passwordMatches = await bcrypt.compare(ownerPassword, existing.passwordHash);
    if (!passwordMatches) {
      const newHash = await bcrypt.hash(ownerPassword, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: newHash },
      });
      updated = true;
      console.log(`[seed] Owner senha resetada para valor padrão (${ownerEmail}).`);
    }
    if (!updated) {
      console.log(`[seed] Owner pronto: ${ownerEmail}`);
    } else {
      console.log(`[seed] Owner atualizado: ${ownerEmail}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);
  await prisma.user.create({
    data: {
      name: ownerName,
      email: ownerEmail,
      passwordHash,
      role: "OWNER",
    },
  });

  console.log(`[seed] Owner criado: ${ownerEmail} / ${ownerPassword}`);
}

async function start() {
  try {
    ensureDatabaseMigrations();
    await ensureSeedOwnerUser();
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("[server] Erro ao iniciar API", error);
    process.exit(1);
  }
}

start();
