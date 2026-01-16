const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 1. Tüm Kuralları Listele
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM rules ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yeni Nesil Kural Ekleme (Yeni sütunlarla uyumlu)
router.post("/", async (req, res) => {
    const { 
        name, 
        tag_id, 
        logic_type, 
        operator, 
        static_value, 
        target_tag_id, 
        offset_value, 
        severity, 
        message 
    } = req.body;

    try {
        // Postgres'e gönderilecek sorguyu yeni sütunlara göre hazırlıyoruz
        const query = `
            INSERT INTO rules (
                name, tag_id, logic_type, operator, 
                static_value, target_tag_id, offset_value, 
                severity, message
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`;

        // Boş string gelmesi durumunda DB'nin hata vermemesi için null kontrolü yapıyoruz
        const values = [
            name, 
            tag_id || null, 
            logic_type || 'static', 
            operator, 
            static_value === "" ? null : static_value, 
            target_tag_id === "" ? null : target_tag_id, 
            offset_value || 0, 
            severity || 'warning', 
            message
        ];

        const result = await pool.query(query, values);
        console.log(`✅ Yeni kural eklendi: ${name}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Kural ekleme hatası:", err.message);
        res.status(500).json({ error: "Veritabanı hatası: " + err.message });
    }
});

// 3. Kural Silme
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM rules WHERE id = $1", [id]);
        res.json({ message: "Kural başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;