const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Tüm bağlantıları listele
router.get("/", async (req, res) => {
    const result = await pool.query("SELECT * FROM connections ORDER BY id ASC");
    res.json(result.rows);
});

// Yeni bir PLC/Sistem ekle
router.post("/", async (req, res) => {
    const { name, endpoint_url, description } = req.body;
    const query = "INSERT INTO connections (name, endpoint_url, description) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [name, endpoint_url, description]);
    res.json(result.rows[0]);
    // TODO: Burada OPC UA servisine "yeni bağlantıyı başlat" komutu gönderilecek
});

module.exports = router;