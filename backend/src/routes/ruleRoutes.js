const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 1. Kullanıcıya Özel Kuralları Listele
// Örn: GET /api/rules?userId=1
router.get("/", async (req, res) => {
    const { userId } = req.query; // Query string'den userId bekliyoruz
    
    try {
        let query = "SELECT * FROM rules";
        let values = [];

        if (userId) {
            query += " WHERE user_id = $1";
            values.push(userId);
        }

        query += " ORDER BY id DESC";
        
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yeni Kural Ekleme (Kullanıcı İlişkili)
router.post("/", async (req, res) => {
    const { 
        name, tag_id, logic_type, operator, 
        static_value, target_tag_id, offset_value, 
        severity, message,
        is_complex, logic_json,
        enabled,
        user_id // <--- YENİ: Kuralın sahibi kim?
    } = req.body;

    console.log(`📥 Kural ekleme isteği: User ID = ${user_id}`);
if (!user_id) {
        return res.status(400).json({ error: "Kural eklemek için kullanıcı ID'si zorunludur!" });
    }
    try {
        const query = `
            INSERT INTO rules (
                name, tag_id, logic_type, operator, 
                static_value, target_tag_id, offset_value, 
                severity, message,
                is_complex, logic_json,
                enabled,
                user_id -- <--- YENİ: Sütun eklendi
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`;

        const values = [
            name, 
            tag_id || null, 
            logic_type || 'static', 
            operator || null, 
            static_value === "" ? null : static_value, 
            target_tag_id === "" ? null : target_tag_id, 
            offset_value || 0, 
            severity || 'warning', 
            message,
            is_complex || false,
            logic_json || null,
            enabled !== undefined ? enabled : true,
            user_id || 1 // Şimdilik default 1, auth gelince auth'tan alınacak
        ];

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Kural ekleme hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Kural Güncelleme (Güvenlik için user_id kontrolü eklenebilir)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
        name, tag_id, logic_type, operator, 
        static_value, target_tag_id, offset_value, 
        severity, message,
        is_complex, logic_json,
        enabled,
        user_id // <--- YENİ: Sahibini de güncelliyoruz veya kontrol ediyoruz
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
                message = $9,
                is_complex = $10,
                logic_json = $11,
                enabled = $12,
                user_id = $13 -- <--- YENİ
            WHERE id = $14 
            RETURNING *`;

        const values = [
            name, 
            tag_id || null, 
            logic_type, 
            operator || null, 
            static_value === "" ? null : static_value, 
            target_tag_id === "" ? null : target_tag_id, 
            offset_value || 0, 
            severity, 
            message,
            is_complex || false,
            logic_json || null,
            enabled,
            user_id || 1,
            id
        ];

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Kural bulunamadı veya yetkiniz yok." });
        }

        console.log(`📝 Kural/Status güncellendi (ID: ${id}, User: ${user_id})`);
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