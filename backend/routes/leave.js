import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Apply for leave
router.post("/apply", async (req, res) => {
  try {
    const { employee_id, leave_type_id, from_date, to_date, total_days, reason } = req.body;

    const result = await pool.query(
      `INSERT INTO leave_applications 
       (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,'Pending') RETURNING *`,
      [employee_id, leave_type_id, from_date, to_date, total_days, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all leave applications
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT la.*, e.name as employee_name, lt.leave_name
      FROM leave_applications la
      JOIN employees e ON la.employee_id = e.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
      ORDER BY la.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or Reject leave (with transaction)
router.put("/approve/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { action, remarks, approved_by } = req.body;

    await client.query("BEGIN");

    // Update leave status
    await client.query(
      "UPDATE leave_applications SET status=$1 WHERE id=$2",
      [action, req.params.id]
    );

    // Insert approval history
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks)
       VALUES ($1,$2,$3,$4)`,
      [req.params.id, approved_by, action, remarks]
    );

    // If approved, reduce leave balance
    if (action === "Approved") {
      const leave = await client.query(
        "SELECT * FROM leave_applications WHERE id=$1",
        [req.params.id]
      );
      const { employee_id, leave_type_id, total_days } = leave.rows[0];

      await client.query(
        `UPDATE leave_balance SET available_days = available_days - $1
         WHERE employee_id=$2 AND leave_type_id=$3`,
        [total_days, employee_id, leave_type_id]
      );
    }

    await client.query("COMMIT");
    res.json({ message: `Leave ${action} successfully` });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// Get leave types
router.get("/types", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leave_types");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard stats for leaves
router.get("/stats", async (req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*) FROM leave_applications");
    const pending = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status='Pending'");
    const approved = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status='Approved'");
    const rejected = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status='Rejected'");

    res.json({
      total: total.rows[0].count,
      pending: pending.rows[0].count,
      approved: approved.rows[0].count,
      rejected: rejected.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;