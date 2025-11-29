const express = require("express");
const { prisma } = require("./prismaClient");
const { requireAuth } = require("./authMiddleware");

const router = express.Router();
router.use(requireAuth);

const TASK_STATUSES = ["TODO", "DOING", "DONE"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
};

async function logActivity({ userId, entityId, action, metadata }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        entityType: "TASK",
        entityId,
        action,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.warn("[tasks] falha ao registrar log", error.message);
  }
}

function parseDueDate(input) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.get("/", async (req, res) => {
  try {
    const where = { ownerId: req.user.id };
    if (req.query.status) {
      const normalized = String(req.query.status).toUpperCase();
      if (TASK_STATUSES.includes(normalized)) {
        where.status = normalized;
      }
    }
    const tasks = await prisma.task.findMany({
      where,
      select: taskSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (error) {
    console.error("[tasks] erro ao listar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "titulo_obrigatorio", message: "Informe um título para a tarefa." });
    }

    const data = {
      title: title.trim(),
      ownerId: req.user.id,
    };
    if (typeof description === "string") data.description = description;
    if (status && TASK_STATUSES.includes(status)) data.status = status;
    if (priority && TASK_PRIORITIES.includes(priority)) data.priority = priority;
    const parsedDueDate = parseDueDate(dueDate);
    if (parsedDueDate) data.dueDate = parsedDueDate;

    const task = await prisma.task.create({ data, select: taskSelect });
    await logActivity({
      userId: req.user.id,
      entityId: task.id,
      action: "TASK_CREATED",
      metadata: { title: task.title },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("[tasks] erro ao criar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findFirst({
      where: { id, ownerId: req.user.id },
      select: taskSelect,
    });
    if (!task) {
      return res.status(404).json({ error: "task_nao_encontrada" });
    }

    const { title, description, status, priority, dueDate } = req.body || {};
    const data = {};
    if (typeof title === "string") data.title = title;
    if (typeof description === "string" || description === null) data.description = description;
    if (status && TASK_STATUSES.includes(status)) data.status = status;
    if (priority && TASK_PRIORITIES.includes(priority)) data.priority = priority;
    if (dueDate !== undefined) {
      const parsed = parseDueDate(dueDate);
      data.dueDate = parsed;
    }

    if (Object.keys(data).length === 0) {
      return res.json(task);
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data,
      select: taskSelect,
    });

    if (data.status && data.status !== task.status) {
      await logActivity({
        userId: req.user.id,
        entityId: task.id,
        action: "TASK_STATUS_CHANGED",
        metadata: { from: task.status, to: data.status },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("[tasks] erro ao atualizar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findFirst({
      where: { id, ownerId: req.user.id },
      select: taskSelect,
    });
    if (!task) {
      return res.status(404).json({ error: "task_nao_encontrada" });
    }

    await prisma.task.delete({ where: { id: task.id } });
    await logActivity({
      userId: req.user.id,
      entityId: task.id,
      action: "TASK_DELETED",
      metadata: { title: task.title },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[tasks] erro ao deletar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

/**
 * Exemplos cURL:
 * curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/tasks
 * curl -X POST http://localhost:4000/api/tasks -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"title":"Nova task"}'
 * curl -X PATCH http://localhost:4000/api/tasks/{id} -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"status":"DONE"}'
 * curl -X DELETE http://localhost:4000/api/tasks/{id} -H "Authorization: Bearer TOKEN"
 */

module.exports = router;
