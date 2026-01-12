const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { addNewConnection } = require("../services/opcuaService");

// Tüm bağlantıları listele
router.get("/", async (req, res) => {
    const result = await pool.query("SELECT * FROM connections ORDER BY id ASC");
    res.json(result.rows);
});

router.post("/", async (req, res) => {
    const { name, endpoint_url, description } = req.body;
    try {
        const query = "INSERT INTO connections (name, endpoint_url, status) VALUES ($1, $2, true) RETURNING *";
        const result = await pool.query(query, [name, endpoint_url]);
        
        // KRİTİK: Yeni bağlantıyı hemen başlat!
        const newConn = result.rows[0];
        addNewConnection(newConn.id); 
        
        res.json(newConn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

