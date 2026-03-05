const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "senin_cok_gizli_anahtarin_123";

// 1. KULLANICI LİSTELEME (Admin İçin)
router.get("/users", async (req, res) => {
    console.log("🔍 [Auth:Users] Tüm kullanıcılar listeleniyor...");
    try {
        // Şifreleri (password_hash) güvenlik nedeniyle ÇEKMİYORUZ.
        const result = await pool.query(
            "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
        );
        console.log(`✅ [Auth:Users] ${result.rows.length} kullanıcı getirildi.`);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ [Auth:Users] Hata:", err.message);
        res.status(500).json({ error: "Kullanıcı listesi alınamadı." });
    }
});

// 2. YENİ KULLANICI TANIMLAMA (Register/Admin Tarafından)
router.post("/register", async (req, res) => {
    console.log("📥 [Auth:Register] Kayıt isteği:", req.body);
    const { username, password, role } = req.body; // 'role' artık body'den gelebilir

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Eğer role gönderilmemişse varsayılan 'operator' olsun
        const userRole = role || 'operator';

        const result = await pool.query(
            "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role",
            [username, passwordHash, userRole]
        );
        
        console.log("✅ [Auth:Register] Yeni kullanıcı oluşturuldu:", result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ [Auth:Register] Hata:", err.message);
        res.status(500).json({ error: "Username already exists or database error." });
    }
});

// 3. GİRİŞ YAP (Login)
router.post("/login", async (req, res) => {
    console.log("📥 [Auth:Login] Giriş denemesi:", req.body.username);
    const { username, password } = req.body;

    try {
        const userRes = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        
        if (userRes.rows.length === 0) {
            console.warn(`❌ [Auth:Login] Kullanıcı bulunamadı: ${username}`);
            return res.status(400).json({ error: "Kullanıcı bulunamadı." });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            console.warn(`❌ [Auth:Login] Şifre yanlış: ${username}`);
            return res.status(400).json({ error: "Şifre hatalı." });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

        console.log(`✅ [Auth:Login] Giriş başarılı: ${username} (Role: ${user.role})`);
        res.json({
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (err) {
        console.error("❌ [Auth:Login] Hata:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. KULLANICI SİLME (Admin İçin Ekstra)
router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ [Auth:Delete] Kullanıcı siliniyor: ID ${id}`);
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ message: "Kullanıcı başarıyla sistemden kaldırıldı." });
    } catch (err) {
        res.status(500).json({ error: "Kullanıcı silinemedi." });
    }
});

module.exports = router;