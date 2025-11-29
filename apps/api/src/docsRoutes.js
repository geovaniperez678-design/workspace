const express = require("express");
const { prisma } = require("./prismaClient");
const { requireAuth } = require("./authMiddleware");

const router = express.Router();
router.use(requireAuth);

const serializeDoc = (doc) => ({
  id: doc.id,
  title: doc.title,
  content: doc.content,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

router.get("/", async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { authorId: req.user.id },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(docs);
  } catch (error) {
    console.error("[docs] erro ao listar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title = "Sem título", content = "" } = req.body || {};
    const doc = await prisma.document.create({
      data: { title, content, authorId: req.user.id },
    });
    res.status(201).json(serializeDoc(doc));
  } catch (error) {
    console.error("[docs] erro ao criar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { authorId: req.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true },
    });
    console.log("[DOCS RECENT] user", req.user.id, "=>", docs.length, "docs");
    res.json(docs);
  } catch (error) {
    console.error("[DOCS RECENT] erro", error);
    res.json([]);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, authorId: req.user.id },
    });
    if (!doc) {
      return res.status(404).json({ error: "doc_nao_encontrado" });
    }
    res.json(serializeDoc(doc));
  } catch (error) {
    console.error("[docs] erro ao buscar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, authorId: req.user.id },
    });
    if (!doc) {
      return res.status(404).json({ error: "doc_nao_encontrado" });
    }
    const data = {};
    if (typeof req.body?.title === "string") data.title = req.body.title;
    if (typeof req.body?.content === "string") data.content = req.body.content;
    const updated = await prisma.document.update({ where: { id: doc.id }, data });
    res.json(serializeDoc(updated));
  } catch (error) {
    console.error("[docs] erro ao atualizar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, authorId: req.user.id },
    });
    if (!doc) {
      return res.status(404).json({ error: "doc_nao_encontrado" });
    }
    await prisma.document.delete({ where: { id: doc.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("[docs] erro ao deletar", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

module.exports = router;
