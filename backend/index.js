require('dotenv').config(); // BU SATIR EN ÜSTTE OLMALI

const express = require("express");
const http = require("http");
const cors = require("cors");
const socketManager = require("./src/socket/socketManager");
const { startOPCUA } = require("./src/services/opcuaService");

// Rotaları Import Et
const ruleRoutes = require("./src/routes/ruleRoutes");
const connectionRoutes = require("./src/routes/connectionRoutes");
const tagRoutes = require("./src/routes/tagRoutes");
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const app = express();

// 🔧 Middleware
app.use(cors()); // CORS hatası almamak için önemli
app.use(express.json());

app.use("/api/reports", reportRoutes);

const server = http.createServer(app);

// 📡 1. Socket.io Başlat
const io = socketManager.init(server);

io.on('connection', (socket) => {
    console.log(`🔌 Yeni bir istemci bağlandı: ${socket.id}`);

    socket.on('join_user_room', (userId) => {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        console.log(`👤 Kullanıcı [${userId}] odaya giriş yaptı: ${roomName}`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ İstemci ayrıldı: ${socket.id}`);
    });
});

// 🏗️ 2. Endüstriyel Servisleri Başlat
startOPCUA(io); 

// 🚪 3. API Rotaları
app.use("/api/rules", ruleRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/tags", tagRoutes); // 🎯 BURASI ÖNEMLİ: İstekler /api/tags/... şeklinde gelmeli
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 💥 Hata Yakalama Middleware
app.use((err, req, res, next) => {
    console.error("🚨 Sunucu Hatası:", err.stack);
    res.status(500).json({ error: "Sistem hatası oluştu kanka!" });
});

// 🚀 PORT AYARI: Senin frontend 3001'e gittiği için burayı 5000 yapıyoruz
const PORT = process.env.PORT || 3001; 

server.listen(PORT, () => {
    console.log(`🚀 LOGIC.IO Modüler Sistem Başlatıldı: http://localhost:${PORT}`);
    console.log(`🛡️  Auth, Rules ve Dashboard servisleri aktif.`);
    console.log(`📂 Tag Rotaları: http://localhost:${PORT}/api/tags`);
});