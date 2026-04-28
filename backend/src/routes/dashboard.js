import express from "express";
import { query } from "../db.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireOwner);

function getStartDate(period) {
  if (period === "today") return "CURRENT_DATE";
  if (period === "week") return "NOW() - INTERVAL '7 days'";
  return "NOW() - INTERVAL '30 days'";
}

router.get("/employee-metrics", async (req, res) => {
  const period = req.query.period || "month";
  const startDate = getStartDate(period);

  const result = await query(
    `SELECT e.id, e.username, e.email, e.role, e.employment_status,
      COUNT(t.id) FILTER (WHERE t.created_at >= ${startDate}) AS assigned_tickets,
      COUNT(t.id) FILTER (WHERE t.status = 'Finished' AND t.updated_at >= ${startDate}) AS closed_tickets,
      COUNT(t.id) FILTER (WHERE t.status IN ('Opened', 'Follow up') AND t.updated_at >= ${startDate}) AS in_progress_tickets
     FROM employees e
     LEFT JOIN tickets t ON t.applied_by_employee_id = e.id
     GROUP BY e.id
     ORDER BY closed_tickets DESC, assigned_tickets DESC`
  );

  res.json(result.rows);
});

export default router;
