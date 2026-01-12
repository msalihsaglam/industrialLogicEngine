const pool = require("../config/db");
const socketManager = require("../socket/socketManager");

async function checkRules(tagId, currentValue) {
    const io = socketManager.getIo();

    try {
        // YENİ MANTIK: tag_name yerine tag_id ile sorguluyoruz
        const res = await pool.query(
            "SELECT * FROM rules WHERE tag_id = $1", 
            [tagId]
        );

        const activeRules = res.rows;

        activeRules.forEach(rule => {
            let isTriggered = false;
            const threshold = parseFloat(rule.threshold);

            // Operatör kontrolü
            if (rule.operator === ">" && currentValue > threshold) isTriggered = true;
            if (rule.operator === "<" && currentValue < threshold) isTriggered = true;
            if (rule.operator === "==" && currentValue == threshold) isTriggered = true;

            if (isTriggered) {
                const alarmPayload = {
                    id: Date.now(),
                    tagId: tagId,
                    message: rule.alert_message,
                    value: currentValue,
                    threshold: threshold,
                    time: new Date().toLocaleTimeString(),
                    severity: 'critical' // İleride dinamik yapılabilir
                };

                // Frontend'e alarmı gönder
                io.emit("alarm", alarmPayload);
                // console.log("🚨 ALARM TETİKLENDİ:", alarmPayload.message);
            }
        });
    } catch (err) {
        console.error("Logic Engine Hatası:", err.message);
    }
}

module.exports = { checkRules };