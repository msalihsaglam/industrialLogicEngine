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
        // Yeni bağlantıyı 'enabled' (aktif) olarak kaydediyoruz
        const query = "INSERT INTO connections (name, endpoint_url, enabled, status) VALUES ($1, $2, true, false) RETURNING *";
        const result = await pool.query(query, [name, endpoint_url]);
        
        const newConn = result.rows[0];
        
        // Cihaz eklendiği an bağlantı girişimini başlat
        await addNewConnection(newConn.id); 
        
        res.json(newConn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Bağlantı durumunu (Enabled/Disabled) GÜNCELLE
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;
    
    try {
        // Veritabanını güncelle
        const result = await pool.query(
            "UPDATE connections SET enabled = $1 WHERE id = $2 RETURNING *",
            [enabled, id]
        );
        
        const updatedConn = result.rows[0];

        // --- CANLI TETİKLEME MANTIĞI ---
        if (enabled === false) {
            // Kullanıcı 'Pasif' yaptıysa: Canlı bağlantıyı anında kopar
            console.log(`🔌 [${updatedConn.name}] kullanıcı tarafından pasif yapıldı.`);
            await stopConnection(id);
        } else {
            // Kullanıcı 'Aktif' yaptıysa: Bağlantıyı yeniden kur
            console.log(`🔌 [${updatedConn.name}] kullanıcı tarafından aktif edildi.`);
            await createConnection(updatedConn);
        }

        res.json(updatedConn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Bağlantıyı SİL
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Önce canlı bağlantıyı durdur
        await stopConnection(id);
        
        // Sonra veritabanından sil
        await pool.query("DELETE FROM connections WHERE id = $1", [id]);
        
        res.json({ message: "Bağlantı başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;