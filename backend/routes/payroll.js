import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Generate payroll for employee
router.post("/generate", async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;

    const empResult = await pool.query(
      "SELECT salary FROM employee_profiles WHERE user_id=$1",
      [employee_id]
    );

    if (empResult.rows.length === 0) {
      return res.status(400).json({ message: "Employee profile not found" });
    }

    const basic_salary = Number(empResult.rows[0].salary) || 0;
    const hra = basic_salary * 0.40;
    const allowances = basic_salary * 0.20;
    const gross_salary = basic_salary + hra + allowances;
    const tds = gross_salary * 0.10;
    const pf = basic_salary * 0.12;
    const esi = gross_salary > 21000 ? 0 : gross_salary * 0.0075;
    const total_deductions = tds + pf + esi;
    const net_salary = gross_salary - total_deductions;

    const existing = await pool.query(
      "SELECT * FROM payroll WHERE employee_id=$1 AND month=$2 AND year=$3",
      [employee_id, month, year]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Payroll already generated for this month" });
    }

    const result = await pool.query(
      `INSERT INTO payroll (employee_id,month,year,basic_salary,hra,allowances,gross_salary,tds,pf,esi,total_deductions,net_salary,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Paid') RETURNING *`,
      [employee_id, month, year, basic_salary, hra, allowances, gross_salary, tds, pf, esi, total_deductions, net_salary]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payroll by employee
router.get("/employee/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as employee_name
       FROM payroll p
       JOIN users u ON p.employee_id = u.id
       WHERE p.employee_id=$1
       ORDER BY p.year DESC, p.month DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all payroll
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as employee_name, d.department_name
       FROM payroll p
       JOIN users u ON p.employee_id = u.id
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       LEFT JOIN departments d ON ep.department_id = d.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payroll summary stats
router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        SUM(gross_salary) as total_gross,
        SUM(net_salary) as total_net,
        SUM(tds) as total_tds,
        SUM(pf) as total_pf,
        COUNT(*) as total_payslips
      FROM payroll
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;