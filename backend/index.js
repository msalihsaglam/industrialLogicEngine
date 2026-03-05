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
const dashboardRoutes = require("./src/routes/dashboardRoutes"); // YENİ: Dashboard persistence

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 📡 1. Socket.io Başlat ve Oda Yönetimi
const io = socketManager.init(server);

io.on('connection', (socket) => {
    console.log(`🔌 Yeni bir istemci bağlandı: ${socket.id}`);

    // Kullanıcı giriş yaptığında kendi özel odasına katılır
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
// OPCUA servisine io örneğini gönderiyoruz ki alarmları odalara fısıldayabilsin
startOPCUA(io); 

// 🚪 3. API Rotaları
app.use("/api/rules", ruleRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes); // YENİ: Dashboard yerleşimi kaydetme

// Hata Yakalama Middleware (Opsiyonel ama candır)
app.use((err, req, res, next) => {
    console.error("💥 Beklenmedik Hata:", err.stack);
    res.status(500).json({ error: "Sistem hatası oluştu!" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 LOGIC.IO Modüler Sistem Başlatıldı: http://localhost:${PORT}`);
    console.log(`🛡️  Auth, Rules ve Dashboard servisleri aktif.`);
});