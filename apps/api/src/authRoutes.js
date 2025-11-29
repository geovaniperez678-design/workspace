const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("./prismaClient");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_WINDOW_MS = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || "7d", 1000 * 60 * 60 * 24 * 7);

function parseDuration(value, fallback) {
  if (!value) return fallback;
  const match = /^([0-9]+)([smhd])$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * (map[unit] || 1000);
}

function buildUserPayload(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function signAccessToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

async function createSession(userId) {
  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_WINDOW_MS);

  try {
    await prisma.session.create({
      data: { userId, refreshToken, expiresAt },
    });
    return { refreshToken, expiresAt, persisted: true };
  } catch (error) {
    console.warn("[auth] Não foi possível salvar sessão, usando fallback somente em memória:", error.message);
    return { refreshToken, expiresAt, persisted: false };
  }
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    console.log("[auth] login attempt", email);
    if (!email || !password) {
      return res.status(400).json({ error: "dados_invalidos", message: "Informe e-mail e senha." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log("[auth] login user found?", Boolean(user));
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "credenciais_invalidas", message: "E-mail ou senha incorretos." });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    console.log("[auth] password ok?", passwordOk);
    if (!passwordOk) {
      return res.status(401).json({ error: "credenciais_invalidas", message: "E-mail ou senha incorretos." });
    }

    const session = await createSession(user.id);
    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
      refreshToken: session.refreshToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("[auth] Erro no login", error);
    return res.status(500).json({ error: "erro_interno", message: "Falha ao processar login." });
  }
});

router.post("/refresh", async (req, res) => {
  return res.status(501).json({ error: "nao_suportado", message: "Renovação de token indisponível nesta build." });
});

module.exports = router;
