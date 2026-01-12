const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Belirli bir bağlantıya ait tagleri getir
router.get("/:connectionId", async (req, res) => {
    try {
        const { connectionId } = req.params;
        console.log(`🔍 [Backend] ${connectionId} ID'li cihaz için tagler isteniyor...`);

        const result = await pool.query("SELECT * FROM tags WHERE connection_id = $1", [connectionId]);
        
        console.log(`📊 [Backend] DB'den dönen satır sayısı: ${result.rows.length}`);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ [Backend] SQL Hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Yeni tag ekle
router.post("/", async (req, res) => {
    const { connection_id, tag_name, node_id, unit } = req.body;
    const result = await pool.query(
        "INSERT INTO tags (connection_id, tag_name, node_id, unit) VALUES ($1, $2, $3, $4) RETURNING *",
        [connection_id, tag_name, node_id, unit]
    );
    res.json(result.rows[0]);
});

module.exports = router;