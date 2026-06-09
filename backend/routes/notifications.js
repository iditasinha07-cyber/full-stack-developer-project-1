import express from "express";
import pool from "../database/db.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC",
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/read/:id", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read=TRUE WHERE id=$1", [req.params.id]);
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;