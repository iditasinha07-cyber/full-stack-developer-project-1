import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Get all assets
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM assets ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Allocate asset
router.post("/allocate", async (req, res) => {
  const client = await pool.connect();
  try {
    const { asset_id, employee_id } = req.body;
    await client.query("BEGIN");

    const allocation = await client.query(
      `INSERT INTO asset_allocations (asset_id, employee_id, status)
       VALUES ($1, $2, 'Allocated') RETURNING *`,
      [asset_id, employee_id]
    );

    await client.query(
      "UPDATE assets SET status='Allocated' WHERE id=$1",
      [asset_id]
    );

    const asset = await client.query("SELECT asset_name FROM assets WHERE id=$1", [asset_id]);

    await client.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)`,
      [employee_id, `Asset "${asset.rows[0].asset_name}" has been allocated to you.`]
    );

    await client.query(
      `INSERT INTO audit_trail (table_name, action, new_value, performed_by)
       VALUES ('asset_allocations', 'INSERT', $1, $2)`,
      [JSON.stringify(allocation.rows[0]), employee_id]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Asset allocated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// Return asset
router.put("/return/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const alloc = await client.query(
      "UPDATE asset_allocations SET status='Returned', return_date=CURRENT_DATE WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    await client.query(
      "UPDATE assets SET status='Available' WHERE id=$1",
      [alloc.rows[0].asset_id]
    );
    await client.query("COMMIT");
    res.json({ message: "Asset returned" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// Get all allocations with details
router.get("/allocations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT aa.*, a.asset_name, a.asset_type, a.serial_number, u.name as employee_name
      FROM asset_allocations aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN users u ON aa.employee_id = u.id
      ORDER BY aa.allocated_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;