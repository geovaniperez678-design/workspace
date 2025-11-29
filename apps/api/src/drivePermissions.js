const ROLE_PRIORITY = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

function hasDrivePermission(userRole, requiredRole) {
  return ROLE_PRIORITY[userRole] >= ROLE_PRIORITY[requiredRole];
}

function verifyDrivePermission(requiredRole = "VIEWER") {
  return (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    if (!req.user) {
      return res.status(401).json({ error: "nao_autorizado" });
    }
    if (!hasDrivePermission(req.user.role, requiredRole)) {
      return res.status(403).json({ error: "sem_permissao" });
    }
    next();
  };
}

module.exports = { verifyDrivePermission, hasDrivePermission };
