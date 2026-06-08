import express from "express";
import pool from "../database/db.js";

const router = express.Router();

router.post("/apply", async (req, res) => {
  try {
    const { employee_id, leave_type_id, from_date, to_date, total_days, reason } = req.body;
    const result = await pool.query(
      `INSERT INTO leave_applications(employee_id,leave_type_id,from_date,to_date,total_days,reason,status)
       VALUES($1,$2,$3,$4,$5,$6,'Pending') RETURNING *`,
      [employee_id, leave_type_id, from_date, to_date, total_days, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT la.*, u.name as employee_name, lt.leave_name
      FROM leave_applications la
      JOIN users u ON la.employee_id = u.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
      ORDER BY la.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/approve/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { action, remarks, approved_by } = req.body;
    await client.query("BEGIN");
    await client.query("UPDATE leave_applications SET status=$1 WHERE id=$2", [action, req.params.id]);
    await client.query(
      `INSERT INTO approval_history(leave_id,approved_by,action,remarks) VALUES($1,$2,$3,$4)`,
      [req.params.id, approved_by, action, remarks]
    );
    await client.query("COMMIT");
    res.json({ message: `Leave ${action}` });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

router.get("/types", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leave_types");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;