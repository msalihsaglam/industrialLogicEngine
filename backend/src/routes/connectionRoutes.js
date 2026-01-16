const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { addNewConnection, createConnection, stopConnection } = require("../services/opcuaService");

// 1. Tüm bağlantıları listele
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM connections ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yeni bağlantı ekle
router.post("/", async (req, res) => {
    const { name, endpoint_url } = req.body;
    try {
        const query = "INSERT INTO connections (name, endpoint_url, enabled, status) VALUES ($1, $2, true, false) RETURNING *";
        const result = await pool.query(query, [name, endpoint_url]);
        
        const newConn = result.rows[0];
        await addNewConnection(newConn.id); 
        
        res.json(newConn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Bağlantı Düzenleme ve Durum Güncelleme (EDIT & TOGGLE)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, endpoint_url, enabled } = req.body;
    
    try {
        // COALESCE kullanarak sadece gönderilen alanları güncelliyoruz, diğerleri aynı kalıyor
        const query = `
            UPDATE connections 
            SET name = COALESCE($1, name), 
                endpoint_url = COALESCE($2, endpoint_url), 
                enabled = COALESCE($3, enabled) 
            WHERE id = $4 
            RETURNING *`;
        
        const result = await pool.query(query, [name, endpoint_url, enabled, id]);
        const updatedConn = result.rows[0];

        // --- CANLI YÖNETİM MANTIĞI ---
        
        if (updatedConn.enabled === false) {
            // Durum 'Pasif'e çekildiyse bağlantıyı her durumda durdur
            console.log(`🛑 [${updatedConn.name}] Bağlantısı durduruluyor...`);
            await stopConnection(id);
        } 
        else {
            // Eğer durum 'Aktif' ise (veya aktif kalmaya devam ediyorsa):
            // Ayarlar (URL/İsim) değişmiş olabileceği için eskisini kapatıp yenisini başlatıyoruz (Restart)
            console.log(`🔄 [${updatedConn.name}] Ayarlar güncelleniyor, bağlantı tazeleniyor...`);
            await stopConnection(id);
            await createConnection(updatedConn);
        }

        res.json(updatedConn);
    } catch (err) {
        console.error("Bağlantı güncelleme hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Bağlantıyı SİL
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await stopConnection(id);
        await pool.query("DELETE FROM connections WHERE id = $1", [id]);
        res.json({ message: "Bağlantı başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;