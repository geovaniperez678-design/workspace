const express = require("express");
const { prisma } = require("./prismaClient");
const { verifyDrivePermission } = require("./drivePermissions");

const router = express.Router();

router.use(verifyDrivePermission("VIEWER"));

const serializeFolder = (folder) => ({
  id: folder.id,
  name: folder.name,
  parentFolderId: folder.parentFolderId,
  deleted: folder.deleted,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
});

const serializeFile = (file) => ({
  id: file.id,
  name: file.name,
  size: file.size,
  type: file.type,
  folderId: file.folderId,
  deleted: file.deleted,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

async function logDriveActivity(userId, entityType, entityId, action, metadata = {}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        entityType,
        entityId,
        action,
        metadata,
      },
    });
  } catch (error) {
    console.warn("[drive] Falha ao registrar activity log", error);
  }
}

async function ensureFolderAccess(userId, folderId) {
  const folder = await prisma.driveFolder.findFirst({
    where: { id: folderId, ownerId: userId, deleted: false },
  });
  if (!folder) {
    const error = new Error("Pasta não encontrada");
    error.statusCode = 404;
    throw error;
  }
  return folder;
}

async function ensureFileAccess(userId, fileId) {
  const file = await prisma.driveFile.findFirst({
    where: { id: fileId, ownerId: userId, deleted: false },
  });
  if (!file) {
    const error = new Error("Arquivo não encontrado");
    error.statusCode = 404;
    throw error;
  }
  return file;
}

async function buildPath(userId, folder) {
  const path = [{ id: null, name: "Meu Drive" }];
  if (!folder) {
    return path;
  }
  const segments = [];
  let current = folder;
  while (current) {
    segments.unshift({ id: current.id, name: current.name });
    if (!current.parentFolderId) break;
    current = await prisma.driveFolder.findFirst({
      where: { id: current.parentFolderId, ownerId: userId },
    });
    if (!current) break;
  }
  return path.concat(segments);
}

async function listFolderContents(userId, folderId) {
  const whereFolder = {
    ownerId: userId,
    deleted: false,
    parentFolderId: folderId,
  };
  const whereFile = {
    ownerId: userId,
    deleted: false,
    folderId,
  };

  const [folders, files] = await Promise.all([
    prisma.driveFolder.findMany({ where: whereFolder, orderBy: { name: "asc" } }),
    prisma.driveFile.findMany({ where: whereFile, orderBy: { updatedAt: "desc" } }),
  ]);

  return {
    folders: folders.map(serializeFolder),
    files: files.map(serializeFile),
  };
}

router.get("/root", async (req, res) => {
  const userId = req.user.id;
  const contents = await listFolderContents(userId, null);
  const path = await buildPath(userId, null);
  res.json({ path, ...contents });
});

router.get("/folder/:id", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const folder = await ensureFolderAccess(userId, req.params.id);
    const contents = await listFolderContents(userId, folder.id);
    const path = await buildPath(userId, folder);
    res.json({ folder: serializeFolder(folder), path, ...contents });
  } catch (error) {
    next(error);
  }
});

router.get("/folders", async (req, res) => {
  const userId = req.user.id;
  const folders = await prisma.driveFolder.findMany({
    where: { ownerId: userId, deleted: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, parentFolderId: true },
  });
  res.json({ folders });
});

router.post("/folder", verifyDrivePermission("EDITOR"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, parentFolderId } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "nome_obrigatorio" });
    }
    if (parentFolderId) {
      await ensureFolderAccess(userId, parentFolderId);
    }
    const folder = await prisma.driveFolder.create({
      data: {
        name,
        parentFolderId: parentFolderId || null,
        ownerId: userId,
      },
    });
    await logDriveActivity(userId, "folder", folder.id, "created_folder", { name });
    res.status(201).json({ folder: serializeFolder(folder) });
  } catch (error) {
    next(error);
  }
});

router.post("/file/metadata", verifyDrivePermission("EDITOR"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, size = 0, type = "application/octet-stream", folderId } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "nome_obrigatorio" });
    }
    if (folderId) {
      await ensureFolderAccess(userId, folderId);
    }
    const file = await prisma.driveFile.create({
      data: {
        name,
        size,
        type,
        folderId: folderId || null,
        ownerId: userId,
      },
    });
    await prisma.driveVersion.create({
      data: {
        fileId: file.id,
        versionNumber: 1,
        metadata: { source: "fake_upload", size, type },
      },
    });
    await logDriveActivity(userId, "file", file.id, "created_file", { name, size, type });
    res.status(201).json({ file: serializeFile(file) });
  } catch (error) {
    next(error);
  }
});

router.patch("/folder/:id", verifyDrivePermission("EDITOR"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, parentFolderId } = req.body || {};
    const folder = await ensureFolderAccess(userId, req.params.id);
    const data = {};
    const metadata = {};

    if (name && name !== folder.name) {
      data.name = name;
      metadata.name = name;
    }
    if (typeof parentFolderId !== "undefined" && parentFolderId !== folder.parentFolderId) {
      if (parentFolderId) {
        if (parentFolderId === folder.id) {
          return res.status(400).json({ error: "pasta_invalida" });
        }
        await ensureFolderAccess(userId, parentFolderId);
      }
      data.parentFolderId = parentFolderId || null;
      metadata.parentFolderId = parentFolderId || null;
    }

    if (!Object.keys(data).length) {
      return res.json({ folder: serializeFolder(folder) });
    }

    const updated = await prisma.driveFolder.update({ where: { id: folder.id }, data });

    if (metadata.name) {
      await logDriveActivity(userId, "folder", folder.id, "renamed", metadata);
    }
    if (Object.prototype.hasOwnProperty.call(metadata, "parentFolderId")) {
      await logDriveActivity(userId, "folder", folder.id, "moved", metadata);
    }

    res.json({ folder: serializeFolder(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch("/file/:id", verifyDrivePermission("EDITOR"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, folderId } = req.body || {};
    const file = await ensureFileAccess(userId, req.params.id);
    const data = {};
    const metadata = {};

    if (name && name !== file.name) {
      data.name = name;
      metadata.name = name;
    }
    if (typeof folderId !== "undefined" && folderId !== file.folderId) {
      if (folderId) {
        await ensureFolderAccess(userId, folderId);
      }
      data.folderId = folderId || null;
      metadata.folderId = folderId || null;
    }

    if (!Object.keys(data).length) {
      return res.json({ file: serializeFile(file) });
    }

    const updated = await prisma.driveFile.update({ where: { id: file.id }, data });

    if (metadata.name) {
      await logDriveActivity(userId, "file", file.id, "renamed", metadata);
    }
    if (Object.prototype.hasOwnProperty.call(metadata, "folderId")) {
      await logDriveActivity(userId, "file", file.id, "moved", metadata);
    }

    res.json({ file: serializeFile(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete("/folder/:id", verifyDrivePermission("EDITOR"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const folder = await ensureFolderAccess(userId, req.params.id);
    const deleted = await prisma.driveFolder.update({
      where: { id: folder.id },
      data: { deleted: true },
    });
    await logDriveActivity(userId, "folder", folder.id, "deleted", {});
    res.json({ folder: serializeFolder(deleted) });
  } catch (error) {
    next(error);
  }
});

router.delete("/file/:id", verifyDrivePermission("EDITOR"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = await ensureFileAccess(userId, req.params.id);
    const deleted = await prisma.driveFile.update({
      where: { id: file.id },
      data: { deleted: true },
    });
    await logDriveActivity(userId, "file", file.id, "deleted", {});
    res.json({ file: serializeFile(deleted) });
  } catch (error) {
    next(error);
  }
});

router.get("/recent", async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await prisma.driveFile.findMany({
      where: { ownerId: userId, deleted: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });
    return res.json(files);
  } catch (error) {
    console.error("[drive] Falha ao carregar arquivos recentes", error);
    return res.status(200).json([]);
  }
});

module.exports = router;
