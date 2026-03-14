const { OPCUAClient, AttributeIds, TimestampsToReturn } = require("node-opcua");
const socketManager = require("../socket/socketManager");
const LogicEngine = require("./logicEngine"); 
const pool = require("../config/db");

// Aktif istemcileri saklamak için hafıza
const activeClients = {};

/**
 * Tek bir bağlantı oluşturur ve DB'deki tag'leri izlemeye başlar
 */
async function createConnection(conn) {
    const { id, name, endpoint_url } = conn;
    const io = socketManager.getIo();

    if (activeClients[id]) {
        await stopConnection(id);
    }

    const client = OPCUAClient.create({ 
        endpointMustExist: false,
        connectionStrategy: {
            maxRetry: 10,
            initialDelay: 2000
        }
    });

    try {
        console.log(`📡 [${name}] Sistemine bağlanılıyor: ${endpoint_url}`);
        await client.connect(endpoint_url); 
        const session = await client.createSession();

        // 🎯 BAĞLANTI BAŞARILI: DB Durumunu Güncelle
        await pool.query("UPDATE connections SET status = $1 WHERE id = $2", ["Connected", id]);
        if (io) io.emit("connectionStatusUpdate", { id, status: "Connected" });

        const tagsResult = await pool.query("SELECT * FROM tags WHERE connection_id = $1", [id]);
        const dbTags = tagsResult.rows;

        if (dbTags.length === 0) {
            console.warn(`⚠️ [${name}] için tanımlı tag bulunamadı.`);
            await session.close();
            await client.disconnect();
            return;
        }

        const subscription = await session.createSubscription2({ 
            requestedPublishingInterval: 1000, 
            publishingEnabled: true 
        });

        for (let tag of dbTags) {
            const monitoredItem = await subscription.monitor(
                { nodeId: tag.node_id, attributeId: AttributeIds.Value },
                { samplingInterval: 500, discardOldest: true, queueSize: 1 },
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue) => {
                const val = dataValue.value.value;
                
                // 1. Dashboard'a canlı veriyi gönder
                if (io) {
                    io.emit("liveData", { 
                        tagId: tag.id,
                        tagName: tag.tag_name, 
                        value: val, 
                        unit: tag.unit,
                        sourceId: id,
                        sourceName: name
                    });
                }

                // 2. LogicEngine İşleme (Historian + Alarmlar)
                LogicEngine.processData(name, tag.tag_name, tag.id, val); 
            });
        }

        activeClients[id] = { client, session, subscription, name };
        console.log(`✅ [${name}] Bağlantısı kuruldu ve ${dbTags.length} tag izleniyor.`);

    } catch (err) {
        console.error(`❌ [${name}] Bağlantı Hatası:`, err.message);
        // 🎯 BAĞLANTI HATALI: DB Durumunu Offline Yap
        await pool.query("UPDATE connections SET status = $1 WHERE id = $2", ["Offline", id]);
        if (io) io.emit("connectionStatusUpdate", { id, status: "Offline" });
    }
}

/**
 * Canlı bağlantıyı tamamen koparır
 */
async function stopConnection(id) {
    const active = activeClients[id];
    const io = socketManager.getIo();

    if (active) {
        console.log(`🛑 [${active.name}] Bağlantısı kesiliyor...`);
        try {
            if (active.subscription) await active.subscription.terminate();
            await active.session.close();
            await active.client.disconnect();
            
            // 🎯 BAĞLANTI DURDURULDU: DB Durumunu Güncelle
            await pool.query("UPDATE connections SET status = $1 WHERE id = $2", ["Offline", id]);
            if (io) io.emit("connectionStatusUpdate", { id, status: "Offline" });

            delete activeClients[id];
            console.log(`📴 [${active.name}] Başarıyla durduruldu.`);
        } catch (err) {
            console.error(`❌ [${active.name}] Durdurma hatası:`, err.message);
        }
    }
}

/**
 * Başlangıçta aktif bağlantıları ayağa kaldırır
 */
async function startOPCUA() {
    try {
        const res = await pool.query("SELECT * FROM connections WHERE enabled = true");
        // Başlangıçta her şeyi offline olarak işaretle (Temizlik)
        await pool.query("UPDATE connections SET status = 'Offline'");

        if (res.rows.length === 0) return;

        for (let conn of res.rows) {
            await createConnection(conn);
        }
    } catch (err) {
        console.error("CRITICAL SQL ERROR:", err.message);
    }
}

async function addNewConnection(connId) {
    const res = await pool.query("SELECT * FROM connections WHERE id = $1", [connId]);
    if (res.rows[0] && res.rows[0].enabled) {
        await createConnection(res.rows[0]);
    }
}

module.exports = { startOPCUA, createConnection, stopConnection, addNewConnection };