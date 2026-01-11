const express = require("express");
const http = require("http");
const cors = require("cors");
const socketManager = require("./src/socket/socketManager");
const { startOPCUA } = require("./src/services/opcuaService");
const ruleRoutes = require("./src/routes/ruleRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Servisleri Başlat
socketManager.init(server);
startOPCUA();

// API Rotaları
app.use("/api/rules", ruleRoutes);

server.listen(3001, () => {
    console.log("🚀 Endüstriyel Sistem Modüler Yapıda Başlatıldı (Port 3001)");
});