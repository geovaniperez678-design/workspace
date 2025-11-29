const express = require("express");
const { prisma } = require("./prismaClient");
const { requireAuth, requireRole } = require("./authMiddleware");

const router = express.Router();

const BASE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: BASE_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return res.json({ users });
  } catch (error) {
    console.error("[users] Erro ao listar usuários", error);
    return res.status(500).json({ error: "erro_interno", message: "Não foi possível listar usuários." });
  }
});

router.patch("/:id/role", requireAuth, requireRole("OWNER"), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const allowedRoles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "role_invalida", message: "Role informada não é permitida." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: BASE_SELECT,
    });

    return res.json({ user: updated });
  } catch (error) {
    console.error("[users] Erro ao alterar role", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "usuario_nao_encontrado", message: "Usuário não localizado." });
    }
    return res.status(500).json({ error: "erro_interno", message: "Não foi possível alterar a role." });
  }
});

router.patch("/:id/status", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "status_invalido", message: "Informe isActive como boolean." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: BASE_SELECT,
    });

    return res.json({ user: updated });
  } catch (error) {
    console.error("[users] Erro ao atualizar status", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "usuario_nao_encontrado", message: "Usuário não localizado." });
    }
    return res.status(500).json({ error: "erro_interno", message: "Não foi possível atualizar o status." });
  }
});

module.exports = router;
