const pool = require("../config/db");
const socketManager = require("../socket/socketManager");

const lastValues = {}; 

/**
 * REKÜRSİF MANTIK ÇÖZÜCÜ
 * Frontend'den gelen 'static_value' ve 'offset_value' isimlerine göre güncellendi.
 */
function evaluateNode(node, values) {
    if (node.type === 'group') {
        if (node.operator === 'AND') {
            return node.children.every(child => evaluateNode(child, values));
        } else if (node.operator === 'OR') {
            return node.children.some(child => evaluateNode(child, values));
        }
    } else if (node.type === 'condition') {
        const currentVal = Number(values[node.tag_id] || 0);
        
        // Frontend'den 'val' yerine 'static_value' ve 'offset_value' gelme ihtimaline karşı:
        const targetVal = node.val_type === 'static' 
            ? Number(node.static_value || node.val || 0) 
            : Number(values[node.target_tag_id] || 0) + Number(node.offset_value || node.offset || 0);

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

/**
 * ANA KONTROL MOTORU
 */
async function checkRules(tagId, currentValue) {
    const io = socketManager.getIo();
    if (!io) return; 

    lastValues[tagId] = parseFloat(currentValue);

    try {
        // Sadece aktif kuralları çekiyoruz
        const res = await pool.query("SELECT * FROM rules WHERE enabled = true");
        const allRules = res.rows;

        for (let rule of allRules) {
            let isTriggered = false;
            let displayThreshold = rule.static_value;

            // 1. COMPLEX MANTIK
            if (rule.is_complex && rule.logic_json) {
                isTriggered = evaluateNode(rule.logic_json, lastValues);
                displayThreshold = "DYNAMIC";
            } 
            // 2. BASİT MANTIK (Sadece ilgili tag değiştiğinde tetiklenir)
            else if (rule.tag_id == tagId) {
                if (rule.logic_type === 'compare') {
                    const targetVal = parseFloat(lastValues[rule.target_tag_id] || 0);
                    const offset = parseFloat(rule.offset_value || 0);
                    const totalThreshold = targetVal + offset;
                    displayThreshold = `${targetVal} + ${offset} (${totalThreshold})`;
                    isTriggered = evaluateOperator(parseFloat(currentValue), rule.operator, totalThreshold);
                } else {
                    const target = parseFloat(rule.static_value);
                    displayThreshold = target;
                    isTriggered = evaluateOperator(parseFloat(currentValue), rule.operator, target);
                }
            }

            // 🚨 İZOLASYON FİLTRESİ
            if (isTriggered) {
                const userRoom = `user_${rule.user_id}`;
                
                // KANKA DİKKAT: io.emit() kullanırsan herkes duyar!
                // io.to(userRoom).emit() kullanırsan sadece odaya özel gider.
                io.to(userRoom).emit("alarm", {
                    id: Date.now() + Math.random(), // Frontend'de benzersiz key için
                    ruleId: rule.id,
                    ruleName: rule.name,
                    message: rule.message,
                    severity: rule.severity,
                    value: rule.is_complex ? "COMPLEX" : parseFloat(currentValue).toFixed(2), 
                    threshold: displayThreshold,
                    is_complex: rule.is_complex,
                    user_id: rule.user_id, 
                    time: new Date().toLocaleTimeString('tr-TR')
                });
                
                // console.log(`[Engine] Alarm sent to room: ${userRoom}`);
            }
        }
    } catch (err) {
        console.error("Logic Engine Hatası:", err.message);
    }
}

function evaluateOperator(val1, op, val2) {
    switch (op) {
        case '>': return val1 > val2;
        case '<': return val1 < val2;
        case '==': return val1 == val2;
        case '!=': return val1 != val2;
        case '>=': return val1 >= val2;
        case '<=': return val1 <= val2;
        default: return false;
    }
}

module.exports = { checkRules };