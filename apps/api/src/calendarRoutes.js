const express = require("express");
const { prisma } = require("./prismaClient");
const { requireAuth } = require("./authMiddleware");

const router = express.Router();
router.use(requireAuth);

const baseSelect = {
  id: true,
  title: true,
  date: true,
  description: true,
  createdAt: true,
  updatedAt: true,
};

router.get("/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { authorId: req.user.id },
      select: baseSelect,
      orderBy: { date: "asc" },
    });
    res.json(events);
  } catch (error) {
    console.error("[calendar] erro ao listar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.get("/events/recent", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { authorId: req.user.id },
      select: baseSelect,
      orderBy: { date: "asc" },
      take: 5,
    });
    res.json(events);
  } catch (error) {
    console.error("[calendar] erro ao listar recentes", error);
    res.json([]);
  }
});

router.post("/events", async (req, res) => {
  try {
    const { title, date, description } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "titulo_obrigatorio", message: "Informe o título do evento." });
    }
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "data_invalida", message: "Informe uma data válida." });
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        date: new Date(date),
        description: typeof description === "string" ? description : undefined,
        authorId: req.user.id,
      },
      select: baseSelect,
    });
    res.status(201).json(event);
  } catch (error) {
    console.error("[calendar] erro ao criar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findFirst({
      where: { id, authorId: req.user.id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "evento_nao_encontrado" });
    }

    const data = {};
    if (typeof req.body?.title === "string") data.title = req.body.title.trim();
    if (typeof req.body?.description === "string" || req.body?.description === null) data.description = req.body.description;
    if (req.body?.date) {
      const parsed = new Date(req.body.date);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "data_invalida", message: "Informe uma data válida." });
      }
      data.date = parsed;
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
      select: baseSelect,
    });
    res.json(updated);
  } catch (error) {
    console.error("[calendar] erro ao atualizar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findFirst({
      where: { id, authorId: req.user.id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "evento_nao_encontrado" });
    }

    await prisma.event.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("[calendar] erro ao deletar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

/**
 * Exemplos curl:
 * curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/calendar/events
 * curl -X POST http://localhost:4000/api/calendar/events -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"title":"Reunião","date":"2025-12-01T10:00:00Z"}'
 * curl -X PUT http://localhost:4000/api/calendar/events/{id} -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"title":"Atualizado"}'
 * curl -X DELETE http://localhost:4000/api/calendar/events/{id} -H "Authorization: Bearer TOKEN"
 */

module.exports = router;
