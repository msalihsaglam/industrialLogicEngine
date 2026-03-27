const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/**
 * 📊 Enerji Tüketim Raporu (Hourly Delta)
 * Kullanıcının seçtiği tarih aralığına göre saatlik tüketim farklarını döner.
 */
router.get("/energy-delta", async (req, res) => {
    const { tagId, start, end } = req.query; 

    // 🎯 DÜZELTME: SQL kodunu parametre içine gömmüyoruz, mühürlü tarih formatı yapıyoruz
    const finalStart = start ? `${start} 00:00:00` : new Date(Date.now() - 86400000).toISOString();
    const finalEnd = end ? `${end} 23:59:59` : new Date().toISOString();

    try {
        const query = `
            SELECT 
                date_trunc('hour', ts) as period,
                (MAX(val) - MIN(val)) as consumption
            FROM historian_logs
            WHERE tag_id = $1::integer 
              AND ts >= $2::timestamp 
              AND ts <= $3::timestamp
            GROUP BY period
            ORDER BY period ASC;
        `;
        
        const result = await pool.query(query, [tagId, finalStart, finalEnd]);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ SQL Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * 🧪 Genel Geçmiş Veri (Raw Data)
 * Kullanıcının seçtiği günün TAMAMINI kapsayacak şekilde mühürlendi.
 */
router.get("/history", async (req, res) => {
    const { tagIds, start, end } = req.query; 

    try {
        if (!tagIds) return res.status(400).json({ error: "Tag ID listesi eksik!" });

        const ids = tagIds.split(',').map(id => parseInt(id.trim()));
        
        // 🎯 DÜZELTME: Seçilen 'end' tarihinin son saniyesine kadar veriyi alıyoruz
        // Yani 2026-03-20 seçildiyse, 20:00'deki veri de gelsin diye.
        const query = `
            SELECT tag_id, val, ts 
            FROM historian_logs 
            WHERE tag_id = ANY($1::integer[]) 
              AND ts >= $2::timestamp 
              AND ts <= ($3::timestamp + interval '1 day' - interval '1 second')
            ORDER BY ts ASC;
        `;

        const result = await pool.query(query, [ids, start, end]);
        
        console.log(`📡 [History Raw] Tags: ${tagIds} | Data Count: ${result.rows.length}`);
        
        res.json(result.rows);
    } catch (err) {
        console.error("❌ History SQL Hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;