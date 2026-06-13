import express from "express";
import pool from "../database/db.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET all employees
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role,
             ep.id as profile_id, ep.phone, ep.address, ep.designation, ep.salary, ep.profile_image, ep.department_id,
             d.department_name
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      ORDER BY u.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET departments — must be before /:id
router.get("/meta/departments", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM departments");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET stats — must be before /:id
router.get("/meta/stats", async (req, res) => {
  try {
    const employees = await pool.query("SELECT COUNT(*) FROM users");
    const departments = await pool.query("SELECT COUNT(*) FROM departments");
    const skills = await pool.query("SELECT COUNT(*) FROM skills");
    const pending = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status='Pending'");
    const approved = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status='Approved'");
    const rejected = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status='Rejected'");
    const salary = await pool.query("SELECT SUM(salary) FROM employee_profiles");
    res.json({
      totalEmployees: employees.rows[0].count,
      totalDepartments: departments.rows[0].count,
      totalSkills: skills.rows[0].count,
      pending: pending.rows[0].count,
      approved: approved.rows[0].count,
      rejected: rejected.rows[0].count,
      totalSalary: salary.rows[0].sum
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single employee
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role,
             ep.id as profile_id, ep.phone, ep.address, ep.designation, ep.salary, ep.profile_image, ep.department_id,
             d.department_name
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE u.id = $1
    `, [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE employee
router.put("/:id", upload.single("profile_image"), async (req, res) => {
  try {
    const { name, email, phone, address, designation, salary, department_id } = req.body;
    await pool.query("UPDATE users SET name=$1, email=$2 WHERE id=$3", [name, email, req.params.id]);
    const imageUpdate = req.file ? `, profile_image='${req.file.filename}'` : "";
    await pool.query(
      `UPDATE employee_profiles SET phone=$1, address=$2, designation=$3, salary=$4, department_id=$5${imageUpdate} WHERE user_id=$6`,
      [phone, address, designation, salary, department_id, req.params.id]
    );
    res.json({ message: "Employee updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM employee_profiles WHERE user_id=$1", [req.params.id]);
    await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;