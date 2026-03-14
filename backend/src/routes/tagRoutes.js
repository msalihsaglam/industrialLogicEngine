const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const socketManager = require("../socket/socketManager");
const FormulaEngine = require('../services/FormulaEngine');
const LogicEngine = require('../services/logicEngine');

// 1. Tagleri Getir (Fiziksel veya Sanal)
// 🎯 GÜNCELLEME: Historian kolonları SELECT sorgusuna eklendi
router.get("/:connectionId", async (req, res) => {
    try {
        const { connectionId } = req.params;
        let result;

        const selectFields = "id, connection_id, tag_name, node_id, unit, source_type, formula, is_historian, log_interval, deadband";

        if (connectionId === "0" || connectionId === "null") {
            result = await pool.query(
                `SELECT ${selectFields} FROM tags WHERE connection_id IS NULL ORDER BY id ASC`
            );
        } else {
            result = await pool.query(
                `SELECT ${selectFields} FROM tags WHERE connection_id = $1 ORDER BY id ASC`, 
                [connectionId]
            );
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yeni Tag Ekle
// 🎯 GÜNCELLEME: Historian parametreleri INSERT sorgusuna eklendi
router.post("/", async (req, res) => {
    const { 
        connection_id, tag_name, node_id, unit, 
        source_type, formula, 
        is_historian, log_interval, deadband // 🔔 Yeni alanlar
    } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO tags (
                connection_id, tag_name, node_id, unit, 
                source_type, formula, is_historian, log_interval, deadband
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [
                connection_id || null, 
                tag_name, 
                node_id || null, 
                unit || '', 
                source_type || 'opc_ua', 
                formula || null,
                is_historian || false,         // $7
                log_interval || 10,           // $8
                deadband || 0                 // $9
            ]
        );

        if (source_type === 'calculated') {
            await FormulaEngine.reload();
            console.log(`🧠 [FormulaEngine] New calculated tag added: ${tag_name}`);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ [Tags:Post] Hata:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Dahili (Internal) Tag Değerini Manuel Güncelleme
router.post("/update-value", async (req, res) => {
    const { tagId, tagName, value, sourceName } = req.body;
    const io = socketManager.getIo();

    try {
        console.log(`🧠 [Internal Update] ID: ${tagId} | ${tagName} -> ${value}`);

        if (io) {
            io.emit('liveData', { 
                sourceName: sourceName || 'INTERNAL', 
                tagName: tagName, 
                tagId: tagId,
                value: parseFloat(value) 
            });
        }
        
        // LogicEngine üzerinden historian kaydı ve kural kontrolü tetiklenir
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
        await FormulaEngine.reload();
        res.json({ message: "Tag deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Tekil Tag Güncelleme (Historian Ayarları Dahil)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
        tag_name, node_id, unit, 
        is_historian, log_interval, deadband,
        source_type, formula // 🚀 YENİ: Sanal tag desteği için eklendi
    } = req.body;

    try {
        const query = `
            UPDATE tags SET 
                tag_name = $1, 
                node_id = $2, 
                unit = $3, 
                is_historian = $4, 
                log_interval = $5, 
                deadband = $6,
                source_type = $7, -- 🔔 Eklendi
                formula = $8      -- 🔔 Eklendi
            WHERE id = $9 
            RETURNING *`;
        
        const values = [
            tag_name, 
            node_id || null, 
            unit || '', 
            is_historian === true || is_historian === 't',
            parseInt(log_interval) || 10, 
            parseFloat(deadband) || 0,
            source_type || 'opc_ua', // $7
            formula || null,         // $8
            id                       // $9
        ];

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tag bulunamadı kanka." });
        }

        const updatedTag = result.rows[0];

        // ✅ KRİTİK: Eğer sanal tag güncellendiyse hesaplama motorunu reload et
        if (updatedTag.source_type === 'calculated') {
            const FormulaEngine = require('../services/FormulaEngine'); // Dinamik import
            await FormulaEngine.reload();
            console.log(`🧠 [FormulaEngine] Tag updated & engine reloaded: ${updatedTag.tag_name}`);
        }

        console.log(`✅ [Tag Updated] ID: ${id} | Historian: ${updatedTag.is_historian}`);
        res.json(updatedTag);

    } catch (err) {
        console.error("🚨 SQL Hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;