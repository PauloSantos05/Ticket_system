import express from "express";
import bcrypt from "bcrypt";
import { query } from "../db.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireOwner);

router.get("/", async (_req, res) => {
  const result = await query(
    `SELECT id, username, email, role, job_title, employment_status, created_at, updated_at
     FROM employees
     ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const { username, email, password, role, jobTitle, employmentStatus } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Campos obrigatórios: username, email, password, role." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO employees (username, email, password_hash, role, job_title, employment_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email, role, job_title, employment_status, created_at, updated_at`,
    [username, email, passwordHash, role, jobTitle || role, employmentStatus || "active"]
  );
  res.status(201).json(result.rows[0]);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, role, jobTitle, employmentStatus, password } = req.body;

  const current = await query("SELECT * FROM employees WHERE id = $1", [id]);
  if (!current.rowCount) return res.status(404).json({ error: "Funcionário não encontrado." });

  const user = current.rows[0];
  const nextPasswordHash = password ? await bcrypt.hash(password, 10) : user.password_hash;
  const result = await query(
    `UPDATE employees
     SET username = $1, email = $2, role = $3, job_title = $4, employment_status = $5, password_hash = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING id, username, email, role, job_title, employment_status, created_at, updated_at`,
    [
      username || user.username,
      email || user.email,
      role || user.role,
      jobTitle || user.job_title,
      employmentStatus || user.employment_status,
      nextPasswordHash,
      id
    ]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await query("DELETE FROM employees WHERE id = $1", [id]);
  res.json({ ok: true });
});

export default router;
