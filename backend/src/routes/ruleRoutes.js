const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Listeleme
router.get("/", async (req, res) => {
    const result = await pool.query("SELECT * FROM rules ORDER BY id ASC");
    res.json(result.rows);
});

// Ekleme
router.post("/", async (req, res) => {
    const { tag_id, operator, threshold, alert_message } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO rules (tag_id, operator, threshold, alert_message) VALUES ($1, $2, $3, $4) RETURNING *",
            [tag_id, operator, threshold, alert_message]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Silme
router.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM rules WHERE id = $1", [req.params.id]);
    res.json({ message: "Silindi" });
});

module.exports = router;