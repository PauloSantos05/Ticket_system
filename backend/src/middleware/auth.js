import jwt from "jsonwebtoken";

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: "Token ausente." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change-this-secret");
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido." });
  }
}

export function requireOwner(req, res, next) {
  if (req.user?.role !== "Owner") {
    return res.status(403).json({ error: "Apenas Owner pode acessar." });
  }
  return next();
}
