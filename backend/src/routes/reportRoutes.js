const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/**
 * 📊 Enerji Tüketim Raporu (Hourly Delta)
 * Bu sorgu her saat başındaki Max ve Min değer farkını alır.
 */
router.get("/energy-delta", async (req, res) => {
    const { tagId, days = 1 } = req.query;
    try {
        const query = `
            SELECT 
                date_trunc('hour', ts) as period,
                MAX(val) - MIN(val) as consumption
            FROM historian_logs
            WHERE tag_id = $1 AND ts > NOW() - INTERVAL '${days} days'
            GROUP BY period
            ORDER BY period ASC;
        `;
        const result = await pool.query(query, [tagId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * 🧪 Genel Geçmiş Veri (Raw Data)
 * Standart trend analizleri için kullanılır.
 */
router.get("/history", async (req, res) => {
    const { tagIds, start, end } = req.query; // tagIds: "10,11,12" formatında
    try {
        const ids = tagIds.split(',').map(Number);
        const query = `
            SELECT tag_id, val, ts 
            FROM historian_logs 
            WHERE tag_id = ANY($1) AND ts BETWEEN $2 AND $3 
            ORDER BY ts ASC;
        `;
        const result = await pool.query(query, [ids, start, end]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;