const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const socketManager = require("../socket/socketManager");
const FormulaEngine = require('../services/FormulaEngine');
const LogicEngine = require('../services/logicEngine');

// 🚀 1. TÜM TAGLERİ GETİR (Eklenecek Kısım - EN ÜSTE ALINDI)
// NOT: Bu rota parametrik olan /:connectionId rotasından ÖNCE gelmeli.
router.get("/all", async (req, res) => {
    try {
        console.log("📡 [LogicEngine] Fetching all system tags for Energy Module...");
        const result = await pool.query(
            "SELECT id, connection_id, tag_name, node_id, unit, tag_role, initial_value FROM tags ORDER BY id ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("🚨 SQL Error in /tags/all:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 🎯 2. Bağlantıya Göre Tagleri Getir (Fiziksel veya Sanal)
router.get("/:connectionId", async (req, res) => {
    try {
        const { connectionId } = req.params;
        let result;

        const selectFields = "id, connection_id, tag_name, node_id, unit, source_type, formula, is_historian, log_interval, deadband, initial_value, tag_role";

        if (connectionId === "0" || connectionId === "null" || connectionId === null) {
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

// 🚀 3. YENİ TAG EKLE
router.post("/", async (req, res) => {
    const { 
        connection_id, tag_name, node_id, unit, 
        source_type, formula, is_historian, 
        log_interval, deadband, value,
        tag_role 
    } = req.body;

    try {
        const finalConnId = (connection_id === "null" || !connection_id) ? null : connection_id;

        const result = await pool.query(
            `INSERT INTO tags (
                connection_id, tag_name, node_id, unit, 
                source_type, formula, is_historian, log_interval, deadband, initial_value, tag_role
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING *`,
            [
                finalConnId, tag_name, node_id || null, unit || '', 
                source_type || 'opc_ua', formula || null,
                is_historian || false, log_interval || 10, deadband || 0,
                parseFloat(value) || 0,
                tag_role || 'general'
            ]
        );

        const createdTag = result.rows[0];

        if (createdTag.source_type === 'calculated') {
            await FormulaEngine.reload();
        }

        const io = socketManager.getIo();
        if (io) {
            io.emit('liveData', { 
                sourceName: finalConnId ? 'PHYSICAL' : 'VIRTUAL WORKSPACE', 
                tagName: createdTag.tag_name, 
                tagId: createdTag.id,
                value: parseFloat(createdTag.initial_value) 
            });
        }

        res.status(201).json(createdTag);
    } catch (err) {
        console.error("🚨 Tag Insert Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Değer Güncelleme (Setpoint & Dashboard Update)
router.post("/update-value", async (req, res) => {
    const { tagId, tagName, value, sourceName } = req.body;
    const io = socketManager.getIo();

    try {
        console.log(`📡 [Update Request] ID: ${tagId} | New Value: ${value}`);

        const dbResult = await pool.query(
            "UPDATE tags SET initial_value = $1 WHERE id = $2 RETURNING *",
            [parseFloat(value), tagId]
        );

        if (dbResult.rowCount === 0) {
            return res.status(404).json({ error: "Tag not found in DB" });
        }

        if (io) {
            io.emit('liveData', { 
                sourceName: sourceName || 'SYSTEM', 
                tagName: tagName, 
                tagId: tagId,
                value: parseFloat(value) 
            });
        }
        
        FormulaEngine.process({ tagId, value });
        await LogicEngine.processData(sourceName || 'SYSTEM', tagName, tagId, value);

        res.json({ success: true, updatedValue: value });
    } catch (err) {
        console.error("🚨 Update-Value Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 5. Tag Silme
router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM tags WHERE id = $1", [req.params.id]);
        await FormulaEngine.reload();
        res.json({ message: "Tag deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Tekil Tag Güncelleme
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
        tag_name, node_id, unit, 
        is_historian, log_interval, deadband,
        source_type, formula,
        tag_role 
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
                source_type = $7,
                formula = $8,
                tag_role = $9
            WHERE id = $10 
            RETURNING *`;
        
        const values = [
            tag_name, 
            node_id || null, 
            unit || '', 
            is_historian === true || is_historian === 't',
            parseInt(log_interval) || 10, 
            parseFloat(deadband) || 0,
            source_type || 'opc_ua',
            formula || null,
            tag_role || 'general',
            id
        ];

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tag bulunamadı." });
        }

        const updatedTag = result.rows[0];

        if (updatedTag.source_type === 'calculated') {
            await FormulaEngine.reload();
        }

        res.json(updatedTag);

    } catch (err) {
        console.error("🚨 SQL Hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;