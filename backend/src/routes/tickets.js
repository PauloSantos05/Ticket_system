import express from "express";
import { query } from "../db.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const {
    id,
    title,
    description,
    createdAt,
    priority,
    updatedAt,
    roleGroup,
    appliedBy,
    status,
    scope = "all",
    sortBy = "updated_at",
    sortOrder = "desc"
  } = req.query;

  const conditions = [];
  const values = [];
  let index = 1;

  if (id) {
    conditions.push(`t.id::text ILIKE $${index++}`);
    values.push(`%${id}%`);
  }
  if (title) {
    conditions.push(`t.title ILIKE $${index++}`);
    values.push(`%${title}%`);
  }
  if (description) {
    conditions.push(`t.description ILIKE $${index++}`);
    values.push(`%${description}%`);
  }
  if (createdAt) {
    conditions.push(`DATE(t.created_at) = $${index++}`);
    values.push(createdAt);
  }
  if (priority) {
    conditions.push(`t.priority = $${index++}`);
    values.push(priority);
  }
  if (updatedAt) {
    conditions.push(`DATE(t.updated_at) = $${index++}`);
    values.push(updatedAt);
  }
  if (roleGroup) {
    conditions.push(`t.role_group = $${index++}`);
    values.push(roleGroup);
  }
  if (appliedBy) {
    conditions.push(`e.username ILIKE $${index++}`);
    values.push(`%${appliedBy}%`);
  }
  if (status) {
    conditions.push(`t.status = $${index++}`);
    values.push(status);
  }

  if (scope === "mine") {
    conditions.push(`t.applied_by_employee_id = $${index++}`);
    values.push(req.user.id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const allowedSort = new Set(["id", "title", "created_at", "updated_at", "priority", "status"]);
  const finalSortBy = allowedSort.has(sortBy) ? sortBy : "updated_at";
  const finalSortOrder = String(sortOrder).toLowerCase() === "asc" ? "ASC" : "DESC";

  const result = await query(
    `SELECT t.*, e.username as applied_by_username, e.email as applied_by_email, e.role as applied_by_role, e.job_title as applied_by_job_title, e.employment_status as applied_by_employment_status
     FROM tickets t
     LEFT JOIN employees e ON e.id = t.applied_by_employee_id
     ${where}
     ORDER BY t.${finalSortBy} ${finalSortOrder}`,
    values
  );

  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const { title, description, priority, roleGroup, status = "Opened", appliedByEmployeeId = null } = req.body;
  if (!title || !description || !priority || !roleGroup) {
    return res.status(400).json({ error: "Campos obrigatórios: title, description, priority, roleGroup." });
  }

  const result = await query(
    `INSERT INTO tickets (title, description, priority, role_group, status, applied_by_employee_id, created_by_employee_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, description, priority, roleGroup, status, appliedByEmployeeId, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const current = await query("SELECT * FROM tickets WHERE id = $1", [id]);
  if (!current.rowCount) return res.status(404).json({ error: "Ticket não encontrado." });

  const ticket = current.rows[0];
  if (req.user.role !== "Owner" && ticket.applied_by_employee_id !== req.user.id) {
    return res.status(403).json({ error: "Sem permissão para alterar este ticket." });
  }

  const { title, description, priority, roleGroup, appliedByEmployeeId, status } = req.body;
  const result = await query(
    `UPDATE tickets
     SET title = $1, description = $2, priority = $3, role_group = $4, applied_by_employee_id = $5, status = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      title ?? ticket.title,
      description ?? ticket.description,
      priority ?? ticket.priority,
      roleGroup ?? ticket.role_group,
      appliedByEmployeeId ?? ticket.applied_by_employee_id,
      status ?? ticket.status,
      id
    ]
  );
  res.json(result.rows[0]);
});

router.post("/:id/follow-up", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Mensagem é obrigatória." });

  const ticket = await query("SELECT * FROM tickets WHERE id = $1", [id]);
  if (!ticket.rowCount) return res.status(404).json({ error: "Ticket não encontrado." });
  if (req.user.role !== "Owner" && ticket.rows[0].applied_by_employee_id !== req.user.id) {
    return res.status(403).json({ error: "Sem permissão para comentar neste ticket." });
  }

  const result = await query(
    `INSERT INTO follow_ups (ticket_id, employee_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, req.user.id, message]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/:id/follow-up", async (req, res) => {
  const { id } = req.params;
  const result = await query(
    `SELECT f.id, f.ticket_id, f.message, f.created_at, e.username, e.email, e.role
     FROM follow_ups f
     INNER JOIN employees e ON e.id = f.employee_id
     WHERE f.ticket_id = $1
     ORDER BY f.created_at ASC`,
    [id]
  );
  res.json(result.rows);
});

router.delete("/:id", requireOwner, async (req, res) => {
  const { id } = req.params;
  await query("DELETE FROM tickets WHERE id = $1", [id]);
  res.json({ ok: true });
});

router.post("/bulk-delete", requireOwner, async (req, res) => {
  const { mode, ids } = req.body;
  if (mode === "all") {
    await query("DELETE FROM tickets");
    return res.json({ ok: true, deleted: "all" });
  }
  if (mode === "selected" && Array.isArray(ids) && ids.length) {
    await query("DELETE FROM tickets WHERE id = ANY($1::int[])", [ids]);
    return res.json({ ok: true, deleted: ids.length });
  }
  return res.status(400).json({ error: "Modo inválido para exclusão." });
});

export default router;
