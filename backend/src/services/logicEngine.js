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
            let displayThreshold = rule.static_value; // Logda görünecek eşik değer

            // --- 1. DURUM: COMPLEX (KARMAŞIK) MANTIK ---
            if (rule.is_complex && rule.logic_json) {
                isTriggered = evaluateNode(rule.logic_json, lastValues);
                displayThreshold = "DYNAMIC";
            } 
            
            // --- 2. DURUM: BASİT MANTIK (Sadece kuralın ana tag'i güncellendiğinde çalışır) ---
            else if (rule.tag_id == tagId) {
                
                // A) COMPARE (KIYASLAMA) MODU: Sensör vs Sensör
                if (rule.logic_type === 'compare') {
                    const targetVal = parseFloat(lastValues[rule.target_tag_id] || 0);
                    const offset = parseFloat(rule.offset_value || 0);
                    const totalThreshold = targetVal + offset;
                    
                    displayThreshold = `${targetVal} + ${offset} (${totalThreshold})`;
                    
                    // Kıyaslama denklemi
                    isTriggered = evaluateOperator(parseFloat(currentValue), rule.operator, totalThreshold);
                } 
                
                // B) STATIC (SABİT) MOD: Sensör vs Sayı
                else {
                    const target = parseFloat(rule.static_value);
                    displayThreshold = target;
                    isTriggered = evaluateOperator(parseFloat(currentValue), rule.operator, target);
                }
            }

            // --- ALARMI FIRLAT ---
            if (isTriggered) {
                io.emit("alarm", {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    message: rule.message,
                    severity: rule.severity,
                    // Değerleri formatlıyoruz
                    value: rule.is_complex ? "COMPLEX" : parseFloat(currentValue).toFixed(2), 
                    threshold: displayThreshold,
                    is_complex: rule.is_complex,
                    time: new Date().toLocaleTimeString('tr-TR')
                });
            }
        }
    } catch (err) {
        console.error("Logic Engine Hatası:", err.message);
    }
}

// Yardımcı Fonksiyon: Operatörleri Çözümler
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