const jwt = require("jsonwebtoken");
const { prisma } = require("./prismaClient");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const ROLE_ORDER = ["VIEWER", "EDITOR", "ADMIN", "OWNER"];

async function requireAuth(req, res, next) {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "nao_autorizado", message: "Token não informado." });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "nao_autorizado", message: "Usuário inválido." });
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) {
    console.error("[auth] Token inválido", error);
    return res.status(401).json({ error: "token_invalido", message: "Token não pôde ser verificado." });
  }
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "nao_autorizado", message: "Usuário não autenticado." });
    }
    if (!hasPermission(req.user.role, minRole)) {
      return res.status(403).json({ error: "sem_permissao", message: "Permissão insuficiente." });
    }
    next();
  };
}

function hasPermission(actualRole, minRole) {
  const currentIndex = ROLE_ORDER.indexOf(actualRole || "VIEWER");
  const minIndex = ROLE_ORDER.indexOf(minRole || "VIEWER");
  if (currentIndex === -1) return false;
  return currentIndex >= minIndex;
}

module.exports = { requireAuth, requireRole };
