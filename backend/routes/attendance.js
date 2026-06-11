import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Check in
router.post("/checkin", async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await pool.query(
      "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
      [employee_id, today]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already checked in today" });
    }
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const status = (hours > 9 || (hours === 9 && minutes > 15)) ? "Late" : "Present";
    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, check_in, status)
       VALUES ($1, $2, CURRENT_TIME, $3) RETURNING *`,
      [employee_id, today, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check out
router.put("/checkout/:employeeId", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const result = await pool.query(
      `UPDATE attendance SET check_out=CURRENT_TIME,
       working_hours=ROUND(EXTRACT(EPOCH FROM (CURRENT_TIME - check_in))/3600, 2)
       WHERE employee_id=$1 AND date=$2 RETURNING *`,
      [req.params.employeeId, today]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No check-in found for today" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark absent (admin/hr only)
router.post("/absent", async (req, res) => {
  try {
    const { employee_id, date } = req.body;
    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, status)
       VALUES ($1, $2, 'Absent')
       ON CONFLICT DO NOTHING RETURNING *`,
      [employee_id, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance by employee
router.get("/employee/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM attendance WHERE employee_id=$1 ORDER BY date DESC LIMIT 30`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all attendance today
router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const result = await pool.query(`
      SELECT a.*, u.name as employee_name
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      WHERE a.date=$1
      ORDER BY a.check_in
    `, [today]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance stats
router.get("/stats/:employeeId", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='Present') as present,
        COUNT(*) FILTER (WHERE status='Absent') as absent,
        COUNT(*) FILTER (WHERE status='Late') as late,
        ROUND(AVG(working_hours)::numeric, 2) as avg_hours
      FROM attendance WHERE employee_id=$1
    `, [req.params.employeeId]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;