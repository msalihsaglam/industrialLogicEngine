const pool = require("../config/db");
const socketManager = require("../socket/socketManager");

/**
 * Bellekteki son tag değerleri (Kıyaslamalı kurallar için gerekli)
 * { "1": 45.2, "2": 38.5 } -> ID: Değer formatında tutulur
 */
const lastValues = {};

async function checkRules(tagId, currentValue) {
    const io = socketManager.getIo();
    const currentVal = parseFloat(currentValue);
    
    // 1. Gelen değeri hafızaya kaydet/güncelle
    lastValues[tagId] = currentVal;

    try {
        // 2. Bu tag ile ilgili tüm AKTİF kuralları yeni tablo yapısına göre çek
        const res = await pool.query(
            "SELECT * FROM rules WHERE tag_id = $1 AND enabled = true", 
            [tagId]
        );

        const activeRules = res.rows;

        for (let rule of activeRules) {
            let isTriggered = false;
            let targetThreshold = 0;

            // --- HEDEF DEĞER BELİRLEME (STATİK VEYA KIYASLAMALI) ---
            if (rule.logic_type === 'static') {
                // Klasik: Değer vs Sabit Eşik (Örn: Pressure > 80)
                targetThreshold = parseFloat(rule.static_value);
            } 
            else if (rule.logic_type === 'compare') {
                // Yeni Nesil: Değer vs Başka Bir Tag + Offset (Örn: In_Temp > Out_Temp + 5)
                const otherTagValue = lastValues[rule.target_tag_id] || 0;
                targetThreshold = parseFloat(otherTagValue) + parseFloat(rule.offset_value || 0);
            }

            // --- OPERATÖR KONTROLÜ ---
            switch (rule.operator) {
                case ">":  if (currentVal > targetThreshold)  isTriggered = true; break;
                case "<":  if (currentVal < targetThreshold)  isTriggered = true; break;
                case "==": if (currentVal == targetThreshold) isTriggered = true; break;
                case "!=": if (currentVal != targetThreshold) isTriggered = true; break;
                case ">=": if (currentVal >= targetThreshold) isTriggered = true; break;
                case "<=": if (currentVal <= targetThreshold) isTriggered = true; break;
            }

            // 3. EĞER KURAL İHLAL EDİLDİYSE ALARM ÜRET
            if (isTriggered) {
                const alarmPayload = {
                    id: Date.now() + Math.random(), // Unique ID
                    ruleId: rule.id,
                    ruleName: rule.name,
                    tagId: tagId,
                    message: rule.message || `${rule.name} ihlal edildi!`,
                    value: currentVal.toFixed(2),
                    threshold: targetThreshold.toFixed(2),
                    severity: rule.severity, // DB'den gelen 'critical', 'warning', 'info'
                    time: new Date().toLocaleTimeString('tr-TR'),
                    logicType: rule.logic_type
                };

                // Frontend'e alarmı fırlat
                io.emit("alarm", alarmPayload);
                
                // Geliştirici konsoluna log bas
                console.log(`🚨 [${rule.severity.toUpperCase()}] ${rule.name} TETİKLENDİ: ${currentVal} ${rule.operator} ${targetThreshold.toFixed(2)}`);
            }
        }
    } catch (err) {
        console.error("Logic Engine Kritik Hatası:", err.message);
    }
}

module.exports = { checkRules };