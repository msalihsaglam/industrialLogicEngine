const { OPCUAClient, AttributeIds, TimestampsToReturn } = require("node-opcua");
const { Pool } = require("pg"); // PostgreSQL bağlantısı için

// 1. Veritabanı Bağlantı Ayarı
const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'logic_engine',
    password: 'password123',
    port: 5432,
});

const endpointUrl = "opc.tcp://localhost:4840/UA/MyLittleServer";
const nodeIdToMonitor = "ns=1;s=Pressure";

async function checkRules(tagName, currentValue) {
    try {
        // DB'den bu tag için aktif olan kuralları getir
        const res = await pool.query(
            "SELECT * FROM rules WHERE tag_name = $1 AND is_active = true", 
            [tagName]
        );

        res.rows.forEach(rule => {
            let isTriggered = false;
            if (rule.operator === '>' && currentValue > rule.threshold) isTriggered = true;
            if (rule.operator === '<' && currentValue < rule.threshold) isTriggered = true;
            if (rule.operator === '=' && currentValue == rule.threshold) isTriggered = true;

            if (isTriggered) {
                console.log(`\x1b[33m[KURAL TETİKLENDİ]\x1b[0m ${rule.alert_message} (Değer: ${currentValue.toFixed(2)})`);
                // Buraya ileride: insertIntoAlertHistory(rule.id, currentValue) eklenebilir.
            }
        });
    } catch (err) {
        console.error("Kural kontrol hatası:", err.message);
    }
}

async function main() {
    const client = OPCUAClient.create({ endpointMustExist: false });

    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        console.log("✅ Logic Engine Yayında ve DB'ye Bağlı!");

        const subscription = await session.createSubscription2({
            requestedPublishingInterval: 1000,
            publishingEnabled: true
        });

        const monitoredItem = await subscription.monitor(
            { nodeId: nodeIdToMonitor, attributeId: AttributeIds.Value },
            { samplingInterval: 500, discardOldest: true, queueSize: 1 },
            TimestampsToReturn.Both
        );

        monitoredItem.on("changed", (dataValue) => {
            const val = dataValue.value.value;
            console.log(`📊 Anlık Veri: ${val.toFixed(2)}`);
            
            // HER DEĞİŞİMDE DB'DEKİ KURALLARI KONTROL ET
            checkRules('Pressure', val);
        });

    } catch (err) {
        console.error("❌ Hata:", err.message);
    }
}

main();