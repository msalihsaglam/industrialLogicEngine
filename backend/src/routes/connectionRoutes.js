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
    // 🎯 connection_type'ı body'den çekiyoruz
    const { name, endpoint_url, connection_type } = req.body; 
    try {
        // SQL sorgusuna connection_type alanını ekledik
        const query = `
            INSERT INTO connections (name, endpoint_url, enabled, status, connection_type) 
            VALUES ($1, $2, true, false, $3) 
            RETURNING *`;
        
        const result = await pool.query(query, [
            name, 
            endpoint_url, 
            connection_type || 'standard' // Eğer boş gelirse varsayılan 'standard' olsun
        ]);
        
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
    // 🎯 connection_type'ı body'den çekiyoruz
    const { name, endpoint_url, enabled, connection_type } = req.body; 
    
    try {
        // COALESCE mantığına connection_type eklendi ($4 oldu)
        const query = `
            UPDATE connections 
            SET name = COALESCE($1, name), 
                endpoint_url = COALESCE($2, endpoint_url), 
                enabled = COALESCE($3, enabled),
                connection_type = COALESCE($4, connection_type) 
            WHERE id = $5 
            RETURNING *`;
        
        // Parametreleri sırasıyla gönderiyoruz (id artık $5)
        const result = await pool.query(query, [name, endpoint_url, enabled, connection_type, id]);
        const updatedConn = result.rows[0];

        // --- CANLI YÖNETİM MANTIĞI ---
        if (updatedConn.enabled === false) {
            console.log(`🛑 [${updatedConn.name}] Bağlantısı durduruluyor...`);
            await stopConnection(id);
        } 
        else {
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