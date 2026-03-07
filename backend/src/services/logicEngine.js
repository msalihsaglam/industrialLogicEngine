const pool = require("../config/db");
const socketManager = require("../socket/socketManager");
const FormulaEngine = require('./FormulaEngine');

// Formül motorunu hemen başlat
FormulaEngine.init();

const lastValues = {}; 

/**
 * ANA KONTROL VE HESAPLAMA MOTORU
 */
async function processData(sourceName, tagName, tagId, currentValue) {
    const val = parseFloat(currentValue);
    const numericId = Number(tagId);
    
    // 1. Gelen ham veriyi hafızaya (cache) yaz
    lastValues[numericId] = val;

    console.log(`\n--------------------------------------------`);
    console.log(`📥 [LogicEngine] Ham Veri Girişi: ID ${numericId} = ${val}`);

    // 2. ⚡ FORMÜL MOTORUNU TETİKLE
    const calculatedResults = FormulaEngine.process({ tagId: numericId, value: val });

    // 3. Ham veri (Fiziksel Tag) için alarmları kontrol et
    await checkRules(numericId, val);

    // 4. 🚀 HESAPLANAN (VIRTUAL) SONUÇLAR VARSA ONLARI İŞLE
    if (calculatedResults && calculatedResults.length > 0) {
        for (const res of calculatedResults) {
            console.log(`🚀 [LogicEngine] Sanal Tag İşleniyor -> ID: ${res.tagId}, Değer: ${res.value}`);
            
            // 💡 ÖNEMLİ: Sanal tag değerini hafızaya (Complex kural için) yaz
            lastValues[Number(res.tagId)] = res.value;

            // Sanal tag için alarmları kontrol et
            await checkRules(res.tagId, res.value);
        }
    }
    console.log(`--------------------------------------------\n`);
}

/**
 * KURAL KONTROL MOTORU
 */
async function checkRules(tagId, currentValue) {
    const io = socketManager.getIo();
    const numericTriggerId = Number(tagId);

    try {
        const res = await pool.query("SELECT * FROM rules WHERE enabled = true");
        const allRules = res.rows;

        for (let rule of allRules) {
            const isComplex = rule.is_complex === true || rule.is_complex === 't';
            const ruleTagId = Number(rule.tag_id);
            let isTriggered = false;

            // 🎯 A: COMPLEX LOGIC (AND/OR Ağacı)
            if (isComplex && rule.logic_json) {
                // Performans için: Sadece kuralın içinde bu tag geçiyorsa hesapla
                const logicStr = JSON.stringify(rule.logic_json);
                if (logicStr.includes(`"tag_id":"${numericTriggerId}"`) || logicStr.includes(`"tag_id":${numericTriggerId}`)) {
                    console.log(`🧠 [LogicEngine] Complex Kural Analiz Ediliyor: ${rule.name}`);
                    isTriggered = evaluateNode(rule.logic_json, lastValues);
                }
            } 
            // 🎯 B: SIMPLE LOGIC (Statik/Compare)
            else if (ruleTagId === numericTriggerId) {
                const val1 = parseFloat(currentValue);
                const val2 = parseFloat(rule.static_value);
                isTriggered = evaluateOperator(val1, rule.operator, val2);
            }

            // 🚨 ALARM TETİKLENDİ
            if (isTriggered) {
                console.log(`🚨 ALARM! ${rule.name} tetiklendi.`);
                const userRoom = `user_${rule.user_id}`;
                if (io) {
                    io.to(userRoom).emit("alarm", {
                        id: Date.now() + Math.random(),
                        ruleName: rule.name,
                        message: rule.message,
                        value: parseFloat(currentValue).toFixed(2),
                        threshold: rule.is_complex ? "COMPLEX" : rule.static_value,
                        severity: rule.severity,
                        time: new Date().toLocaleTimeString('tr-TR')
                    });
                }
            }
        }
    } catch (err) { console.error("checkRules Hatası:", err); }
}

/**
 * COMPLEX LOGIC YARDIMCI FONKSİYONLARI (RECURSIVE)
 */
function evaluateNode(node, values) {
    if (node.type === 'condition') {
        const tagVal = values[Number(node.tag_id)];
        if (tagVal === undefined) return false; // Veri gelmediyse false

        return evaluateOperator(tagVal, node.op, parseFloat(node.val));
    }

    if (node.type === 'group') {
        const results = node.children.map(child => evaluateNode(child, values));
        return node.operator === 'AND' 
            ? results.every(res => res === true)
            : results.some(res => res === true);
    }
    return false;
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

module.exports = { processData, checkRules };