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

// 2. Yeni Kural Ekleme
router.post("/", async (req, res) => {
    const { 
        name, tag_id, logic_type, operator, 
        static_value, target_tag_id, offset_value, 
        severity, message 
    } = req.body;

    try {
        const query = `
            INSERT INTO rules (
                name, tag_id, logic_type, operator, 
                static_value, target_tag_id, offset_value, 
                severity, message
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`;

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
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Kural Güncelleme (EDIT) - YENİ EKLENDİ
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
        name, tag_id, logic_type, operator, 
        static_value, target_tag_id, offset_value, 
        severity, message 
    } = req.body;

    try {
        const query = `
            UPDATE rules SET 
                name = $1, 
                tag_id = $2, 
                logic_type = $3, 
                operator = $4, 
                static_value = $5, 
                target_tag_id = $6, 
                offset_value = $7, 
                severity = $8, 
                message = $9
            WHERE id = $10 
            RETURNING *`;

        const values = [
            name, 
            tag_id || null, 
            logic_type, 
            operator, 
            static_value === "" ? null : static_value, 
            target_tag_id === "" ? null : target_tag_id, 
            offset_value || 0, 
            severity, 
            message,
            id
        ];

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Kural bulunamadı." });
        }

        console.log(`📝 Kural güncellendi: ${name}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Kural güncelleme hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Kural Silme
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