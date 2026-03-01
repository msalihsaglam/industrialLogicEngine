const pool = require("../config/db");
const socketManager = require("../socket/socketManager");

// Bellekteki son tag değerlerini tutar (Hızlı erişim için)
const lastValues = {}; 

/**
 * REKÜRSİF MANTIK ÇÖZÜCÜ (Topic 3'ün Kalbi)
 * Bu fonksiyon, JSON ağacını en derin dallarından başlayarak yukarı doğru çözer.
 */
function evaluateNode(node, values) {
    if (node.type === 'group') {
        // Eğer bu bir grupsa (AND/OR), içindeki çocukları kontrol et
        if (node.operator === 'AND') {
            return node.children.every(child => evaluateNode(child, values));
        } else if (node.operator === 'OR') {
            return node.children.some(child => evaluateNode(child, values));
        }
    } else if (node.type === 'condition') {
        // Eğer bu bir kural ise (Basınç > 50 gibi), kıyasla
        const currentVal = Number(values[node.tag_id] || 0);
        const targetVal = node.val_type === 'static' 
            ? Number(node.val) 
            : Number(values[node.target_tag_id] || 0) + Number(node.offset || 0);

        switch (node.op) {
            case '>':  return currentVal >  targetVal;
            case '<':  return currentVal <  targetVal;
            case '==': return currentVal == targetVal;
            case '!=': return currentVal != targetVal;
            case '>=': return currentVal >= targetVal;
            case '<=': return currentVal <= targetVal;
            default:   return false;
        }
    }
    return false;
}

async function checkRules(tagId, currentValue) {
    const io = socketManager.getIo();
    lastValues[tagId] = parseFloat(currentValue);

    try {
        // Tüm aktif kuralları çek
        const res = await pool.query("SELECT * FROM rules WHERE enabled = true");
        const allRules = res.rows;

        for (let rule of allRules) {
            let isTriggered = false;

            // --- Topic 3: Karmaşık Mantık mı yoksa Klasik mi? ---
            if (rule.is_complex && rule.logic_json) {
                // Sınırsız mantık ağacını recursive olarak çöz
                isTriggered = evaluateNode(rule.logic_json, lastValues);
            } else if (rule.tag_id == tagId) {
                // Eski usul basit kural kontrolü (Geriye dönük uyumluluk)
                const target = parseFloat(rule.static_value);
                if (rule.operator === '>' && lastValues[tagId] > target) isTriggered = true;
                if (rule.operator === '<' && lastValues[tagId] < target) isTriggered = true;
                if (rule.operator === '==' && lastValues[tagId] == target) isTriggered = true;
            }

            // Eğer kural tetiklendiyse alarmı patlat!
            if (isTriggered) {
                io.emit("alarm", {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    message: rule.message,
                    severity: rule.severity,
                    time: new Date().toLocaleTimeString('tr-TR')
                });
            }
        }
    } catch (err) {
        console.error("Logic Engine Hatası:", err.message);
    }
}

module.exports = { checkRules };