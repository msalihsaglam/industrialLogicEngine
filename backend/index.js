const { OPCUAClient, AttributeIds, TimestampsToReturn } = require("node-opcua");
const { Pool } = require("pg");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// 1. Web Sunucusu ve Socket Ayarları
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 2. Veritabanı Bağlantısı
const pool = new Pool({
    user: 'admin', host: 'localhost', database: 'logic_engine',
    password: 'password123', port: 5432,
});

const endpointUrl = "opc.tcp://localhost:4840/UA/MyLittleServer";
const nodeIdToMonitor = "ns=1;s=Pressure";

// 3. API Endpoint: Kuralları Listele
app.get("/api/rules", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM rules ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 4. Logic Engine ve Kural Kontrolü
async function checkRules(tagName, currentValue) {
    try {
        const res = await pool.query("SELECT * FROM rules WHERE tag_name = $1 AND is_active = true", [tagName]);
        res.rows.forEach(rule => {
            let isTriggered = false;
            if (rule.operator === '>' && currentValue > rule.threshold) isTriggered = true;
            if (rule.operator === '<' && currentValue < rule.threshold) isTriggered = true;

            if (isTriggered) {
                // Alarmı hem konsola hem Web'e gönder
                io.emit("alarm", { message: rule.alert_message, value: currentValue, time: new Date().toLocaleTimeString() });
            }
        });
    } catch (err) { console.error("Kural hatası:", err.message); }
}

async function main() {
    const client = OPCUAClient.create({ endpointMustExist: false });
    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        console.log("✅ OPC UA Bağlantısı Tamam");

        const subscription = await session.createSubscription2({ requestedPublishingInterval: 1000, publishingEnabled: true });
        const monitoredItem = await subscription.monitor(
            { nodeId: nodeIdToMonitor, attributeId: AttributeIds.Value },
            { samplingInterval: 500, discardOldest: true, queueSize: 1 },
            TimestampsToReturn.Both
        );

        monitoredItem.on("changed", (dataValue) => {
            const val = dataValue.value.value;
            // Canlı veriyi Web'e gönder
            io.emit("liveData", { tag: "Pressure", value: val });
            checkRules('Pressure', val);
        });
    } catch (err) { console.error("❌ Hata:", err.message); }
}

main();
server.listen(3001, () => console.log("🌐 Web Sunucusu 3001 portunda hazır"));