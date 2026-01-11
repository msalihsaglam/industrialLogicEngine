const { OPCUAClient, AttributeIds, TimestampsToReturn } = require("node-opcua");
const socketManager = require("../socket/socketManager");
const { checkRules } = require("./logicEngine");
const pool = require("../config/db"); // Veritabanı bağlantısı

// Takip edilecek standart tag listesi (İleride bunlar da DB'den gelebilir)
const tags = [
    { name: "Pressure", node: "ns=1;s=Pressure" },
    { name: "Temperature", node: "ns=1;s=Temperature" }
];

// Aktif istemcileri (clients) saklamak için bir hafıza (Cache)
const activeClients = {};

/**
 * Tek bir bağlantı oluşturur ve izlemeyi başlatır
 */
async function createConnection(conn) {
    const { id, name, endpoint_url } = conn;
    const io = socketManager.getIo();

    const client = OPCUAClient.create({ 
        endpointMustExist: false,
        connectionStrategy: { maxRetry: 10, initialDelay: 2000 }
    });

    try {
        console.log(`📡 [${name}] Sistemine bağlanılıyor: ${endpoint_url}`);
        await client.connect(endpoint_url);
        const session = await client.createSession();

        const subscription = await session.createSubscription2({ 
            requestedPublishingInterval: 1000, 
            publishingEnabled: true 
        });

        for (let tag of tags) {
            const monitoredItem = await subscription.monitor(
                { nodeId: tag.node, attributeId: AttributeIds.Value },
                { samplingInterval: 500, discardOldest: true, queueSize: 1 },
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue) => {
                const val = dataValue.value.value;
                
                // Veriyi hangi sistemden geldiği bilgisiyle (sourceId) gönderiyoruz
                io.emit("liveData", { 
                    tag: tag.name, 
                    value: val, 
                    sourceId: id, 
                    sourceName: name 
                });

                // Kural motorunu çalıştır
                checkRules(tag.name, val);
            });
        }

        // Başarılı bağlantıyı hafızaya kaydet
        activeClients[id] = { client, session, name };
        console.log(`✅ [${name}] Bağlantısı ve abonelikleri başarıyla başlatıldı.`);

    } catch (err) {
        console.error(`❌ [${name}] Bağlantı hatası (${endpoint_url}):`, err.message);
    }
}

/**
 * Veritabanındaki tüm aktif bağlantıları başlatır
 */
async function startOPCUA() {
    try {
        // Sadece durumu true (aktif) olan bağlantıları çek
        const res = await pool.query("SELECT * FROM connections WHERE status = true");
        
        if (res.rows.length === 0) {
            console.warn("⚠️ Veritabanında aktif bağlantı tanımı bulunamadı! Lütfen connections tablosunu doldurun.");
            return;
        }

        for (let conn of res.rows) {
            await createConnection(conn);
        }

    } catch (err) {
        console.error("CRITICAL: Connections tablosu okunamadı:", err.message);
    }
}

/**
 * Çalışma anında yeni bir bağlantı eklemek için (Arayüzden 'Add Source' denildiğinde çağrılır)
 */
async function addNewConnection(connId) {
    const res = await pool.query("SELECT * FROM connections WHERE id = $1", [connId]);
    if (res.rows[0]) {
        await createConnection(res.rows[0]);
    }
}

module.exports = { startOPCUA, addNewConnection };