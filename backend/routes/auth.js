import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../database/db.js";
import nodemailer from "nodemailer";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// SIGNUP — only one admin allowed
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExist = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ message: "Email already exists" });

    // Check if admin already exists
    if (role === "admin") {
      const adminExist = await pool.query("SELECT * FROM users WHERE role='admin'");
      if (adminExist.rows.length > 0) return res.status(400).json({ message: "Admin account already exists! Please login or contact your administrator." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role`,
      [name, email, hashedPassword, role || "employee"]
    );

    res.status(201).json({ message: "Account created successfully! Please login.", user: newUser.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: "No account found with this email. Please sign up first." });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ message: "Wrong password. Please try again." });

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role, name: user.rows[0].name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login Success", token, user: { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: "Email not found" });

    const resetToken = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `https://full-stack-developer-project-1.vercel.app/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "iSoftzone HRMS - Password Reset",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#534AB7">🏢 iSoftzone HRMS</h2>
          <h3>Password Reset Request</h3>
          <p>Hello <strong>${user.rows[0].name}</strong>,</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display:inline-block;background:#534AB7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
          <p style="color:#888;font-size:13px">This link expires in 1 hour.</p>
          <p style="color:#888;font-size:12px">Team iSoftzone | HRMS Platform</p>
        </div>
      `
    });
    res.json({ message: "Password reset email sent! Check your inbox." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashedPassword, decoded.id]);
    res.json({ message: "Password reset successful!" });
  } catch (error) {
    res.status(500).json({ message: "Invalid or expired token" });
  }
});

export default router;