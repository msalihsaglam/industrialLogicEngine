const { OPCUAClient, AttributeIds, TimestampsToReturn } = require("node-opcua");
const socketManager = require("../socket/socketManager");
const { checkRules } = require("./logicEngine");
const pool = require("../config/db");

// Aktif istemcileri (client, session, subscription) saklamak için hafıza
const activeClients = {};

/**
 * Tek bir bağlantı oluşturur ve DB'deki tag'leri izlemeye başlar
 */
async function createConnection(conn) {
    const { id, name, endpoint_url } = conn; // DB'den gelen isimler: id, name, endpoint_url
    const io = socketManager.getIo();

    const client = OPCUAClient.create({ 
        endpointMustExist: false,
        connectionStrategy: {
            maxRetry: 10,
            initialDelay: 2000
        }
    });

    try {
        console.log(`📡 [${name}] Sistemine bağlanılıyor: ${endpoint_url}`);
        
        // HATA DÜZELTİLDİ: endpointUrl -> endpoint_url
        await client.connect(endpoint_url); 
        
        const session = await client.createSession();

        // Bu bağlantıya ait tag'leri veritabanından çekiyoruz
        const tagsResult = await pool.query("SELECT * FROM tags WHERE connection_id = $1", [id]);
        const dbTags = tagsResult.rows;

        if (dbTags.length === 0) {
            console.warn(`⚠️ [${name}] için tanımlı tag bulunamadı. İzleme başlatılamadı.`);
            return;
        }

        const subscription = await session.createSubscription2({ 
            requestedPublishingInterval: 1000, 
            publishingEnabled: true 
        });

        // Her bir tag için monitor başlat
        for (let tag of dbTags) {
            const monitoredItem = await subscription.monitor(
                { nodeId: tag.node_id, attributeId: AttributeIds.Value },
                { samplingInterval: 500, discardOldest: true, queueSize: 1 },
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue) => {
                const val = dataValue.value.value;
                
                // Frontend'e veri paketini gönder
                io.emit("liveData", { 
                    tagId: tag.id,
                    tagName: tag.tag_name, 
                    value: val, 
                    unit: tag.unit,
                    sourceId: id,
                    sourceName: name
                });

                // Logic Engine kontrolü (ID üzerinden)
                checkRules(tag.id, val); 
            });
        }

        // İleride yönetebilmek için hafızaya kaydet
        activeClients[id] = { client, session, subscription, name };
        
        console.log(`✅ [${name}] Bağlantısı kuruldu ve ${dbTags.length} tag izleniyor.`);

    } catch (err) {
        console.error(`❌ [${name}] Bağlantı Hatası:`, err.message);
    }
}

/**
 * Başlangıçta DB'deki tüm aktif (status=true) bağlantıları ayağa kaldırır
 */
async function startOPCUA() {
    try {
        const res = await pool.query("SELECT * FROM connections WHERE status = true");
        
        if (res.rows.length === 0) {
            console.warn("⚠️ Aktif bağlantı tanımı yok. Lütfen Connection sayfasından ekleme yapın.");
            return;
        }

        for (let conn of res.rows) {
            await createConnection(conn);
        }

    } catch (err) {
        console.error("CRITICAL: Veritabanı bağlantı hatası:", err.message);
    }
}

/**
 * Arayüzden yeni bir kaynak eklendiğinde çalışma anında tetiklenir
 */
async function addNewConnection(connId) {
    // Eğer zaten bağlıysak tekrar bağlanma
    if (activeClients[connId]) return;

    const res = await pool.query("SELECT * FROM connections WHERE id = $1", [connId]);
    if (res.rows[0]) {
        await createConnection(res.rows[0]);
    }
}

module.exports = { startOPCUA, addNewConnection };