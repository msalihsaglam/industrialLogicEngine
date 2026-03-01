require('dotenv').config(); // BU SATIR EN ÜSTTE OLMALI

const express = require("express");
const http = require("http");
const cors = require("cors");
const socketManager = require("./src/socket/socketManager");
const { startOPCUA } = require("./src/services/opcuaService");
const ruleRoutes = require("./src/routes/ruleRoutes");
const connectionRoutes = require("./src/routes/connectionRoutes");
const tagRoutes = require("./src/routes/tagRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Servisleri Başlat
socketManager.init(server);
startOPCUA();

// API Rotaları
app.use("/api/rules", ruleRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/tags", tagRoutes);

server.listen(3001, () => {
    console.log("🚀 Endüstriyel Sistem Modüler Yapıda Başlatıldı (Port 3001)");
});