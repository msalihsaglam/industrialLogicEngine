const express = require("express");
const router = express.Router();
//const pool = require("../../config/db"); // db bağlantı yoluna dikkat kanka
const pool = require("../config/db"); // Sadece bir tane ../ kullandık

// 1. Kullanıcıya özel dashboard düzenini getir
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            "SELECT layout FROM dashboard_layouts WHERE user_id = $1",
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.json({ layout: [] }); // Kayıt yoksa boş liste dön
        }
        
        res.json(result.rows[0].layout);
    } catch (err) {
        console.error("❌ Dashboard Yükleme Hatası:", err.message);
        res.status(500).json({ error: "Dashboard düzeni yüklenemedi." });
    }
});

// 2. Dashboard düzenini kaydet veya güncelle (UPSERT)
router.post("/save", async (req, res) => {
    const { userId, layout } = req.body;

    if (!userId || !layout) {
        return res.status(400).json({ error: "User ID ve Layout verisi eksik." });
    }

    try {
        const query = `
            INSERT INTO dashboard_layouts (user_id, layout, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET layout = EXCLUDED.layout, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        
        const result = await pool.query(query, [userId, JSON.stringify(layout)]);
        res.json({ message: "Layout saved successfully", data: result.rows[0] });
    } catch (err) {
        console.error("❌ Dashboard Kaydetme Hatası:", err.message);
        res.status(500).json({ error: "Dashboard düzeni kaydedilemedi." });
    }
});

module.exports = router;