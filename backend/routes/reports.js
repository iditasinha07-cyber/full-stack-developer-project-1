import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Employee report
router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.name, u.email, u.role, ep.designation, ep.salary, ep.phone, d.department_name
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      ORDER BY d.department_name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave report
router.get("/leaves", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.name as employee_name, lt.leave_name, la.from_date, la.to_date, la.total_days, la.status, la.reason
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

// Asset report
router.get("/assets", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.asset_name, a.asset_type, a.serial_number, a.status,
             u.name as assigned_to, aa.allocated_date, aa.return_date
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status='Allocated'
      LEFT JOIN users u ON aa.employee_id = u.id
      ORDER BY a.asset_type
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Department stats
router.get("/department-stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.department_name,
             COUNT(ep.id) as total_employees,
             AVG(ep.salary) as avg_salary,
             SUM(ep.salary) as total_salary
      FROM departments d
      LEFT JOIN employee_profiles ep ON d.id = ep.department_id
      GROUP BY d.department_name
      ORDER BY total_employees DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;