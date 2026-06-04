import express from "express";
import pool from "../database/db.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// CREATE employee
router.post("/", upload.single("profile_image"), async (req, res) => {
  try {
    const { name, email, phone, department_id } = req.body;
    const profile_image = req.file ? req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO employees (name, email, phone, department_id, profile_image)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, email, phone, department_id, profile_image]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all employees with department name
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single employee
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE employee
router.put("/:id", upload.single("profile_image"), async (req, res) => {
  try {
    const { name, email, phone, department_id } = req.body;
    const profile_image = req.file ? req.file.filename : req.body.existing_image;

    const result = await pool.query(
      `UPDATE employees SET name=$1, email=$2, phone=$3, department_id=$4, profile_image=$5
       WHERE id=$6 RETURNING *`,
      [name, email, phone, department_id, profile_image, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM employees WHERE id=$1", [req.params.id]);
    res.json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all departments
router.get("/departments/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM departments");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const employees = await pool.query("SELECT COUNT(*) FROM employees");
    const departments = await pool.query("SELECT COUNT(*) FROM departments");
    res.json({
      totalEmployees: employees.rows[0].count,
      totalDepartments: departments.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;