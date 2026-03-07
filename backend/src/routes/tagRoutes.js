const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const socketManager = require("../socket/socketManager");
const FormulaEngine = require('../services/FormulaEngine');
const LogicEngine = require('../services/logicEngine'); // LogicEngine'i de ekledik kanka

// 1. Tagleri Getir (Fiziksel veya Sanal)
router.get("/:connectionId", async (req, res) => {
    try {
        const { connectionId } = req.params;
        let result;

        if (connectionId === "0" || connectionId === "null") {
            result = await pool.query(
                "SELECT id, connection_id, tag_name, node_id, unit, source_type, formula FROM tags WHERE connection_id IS NULL ORDER BY id ASC"
            );
        } else {
            result = await pool.query(
                "SELECT id, connection_id, tag_name, node_id, unit, source_type, formula FROM tags WHERE connection_id = $1 ORDER BY id ASC", 
                [connectionId]
            );
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yeni Tag Ekle
router.post("/", async (req, res) => {
    const { connection_id, tag_name, node_id, unit, source_type, formula } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO tags (connection_id, tag_name, node_id, unit, source_type, formula) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
                connection_id || null, 
                tag_name, 
                node_id || null, 
                unit || '', 
                source_type || 'opc_ua', 
                formula || null
            ]
        );

        // ✅ KRİTİK: Yeni Calculated tag eklendiyse motoru hemen reload et
        if (source_type === 'calculated') {
            await FormulaEngine.reload();
            console.log(`🧠 [FormulaEngine] New calculated tag added, engine reloaded: ${tag_name}`);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ [Tags:Post] Hata:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Dahili (Internal) Tag Değerini Manuel Güncelleme (Setpoint Ayarı)
router.post("/update-value", async (req, res) => {
    const { tagId, tagName, value, sourceName } = req.body;
    const io = socketManager.getIo();

    try {
        console.log(`🧠 [Internal Update] ID: ${tagId} | ${tagName} -> ${value}`);

        // 1. Dashboard'lara canlı veriyi fırlat
        if (io) {
            io.emit('liveData', { 
                sourceName: sourceName || 'INTERNAL', 
                tagName: tagName, 
                tagId: tagId,
                value: parseFloat(value) 
            });
        }
        
        // 2. ✅ ZİNCİRLEME REAKSİYON: Bu değişim formülleri veya kuralları tetikliyor mu?
        // Sanki PLC'den veri gelmiş gibi LogicEngine'e paslıyoruz
        await LogicEngine.processData(
            sourceName || 'INTERNAL', 
            tagName, 
            tagId, 
            value
        );

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Update Value Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Tag Silme
router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM tags WHERE id = $1", [req.params.id]);
        
        // Tag silindiğinde de motoru reload edelim ki eski formül havada kalmasın
        await FormulaEngine.reload();
        
        res.json({ message: "Tag deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;