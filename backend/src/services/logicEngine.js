const pool = require("../config/db");
const socketManager = require("../socket/socketManager");
const FormulaEngine = require('./FormulaEngine');

// Formül motorunu hemen başlat
FormulaEngine.init();

const lastValues = {}; 
// 💾 Historian için son kayıt zamanı ve değerini RAM'de tutalım
const lastRecordedStates = {}; 

/**
 * ANA KONTROL VE HESAPLAMA MOTORU
 */
async function processData(sourceName, tagName, tagId, currentValue) {
    const val = parseFloat(currentValue);
    const numericId = Number(tagId);
    
    // 1. Gelen ham veriyi hafızaya (cache) yaz
    lastValues[numericId] = val;

    // 2. 🗄️ HISTORIAN: Ham veri (Fiziksel Tag) arşivlensin mi?
    await checkAndArchive(numericId, val);

    // 3. ⚡ FORMÜL MOTORUNU TETİKLE
    const calculatedResults = FormulaEngine.process({ tagId: numericId, value: val });

    // 4. Ham veri (Fiziksel Tag) için alarmları kontrol et
    await checkRules(numericId, val);

    // 5. 🚀 HESAPLANAN (VIRTUAL) SONUÇLAR VARSA ONLARI İŞLE
    if (calculatedResults && calculatedResults.length > 0) {
        for (const res of calculatedResults) {
            const vId = Number(res.tagId);
            const vVal = res.value;

            // Sanal tag değerini hafızaya yaz
            lastValues[vId] = vVal;

            // 🗄️ HISTORIAN: Sanal Tag arşivlensin mi?
            await checkAndArchive(vId, vVal);

            // Sanal tag için alarmları kontrol et
            await checkRules(vId, vVal);
        }
    }
}

/**
 * 🗄️ ARŞİVLEME KONTROLÜ (Interval & Deadband)
 */
async function checkAndArchive(tagId, currentValue) {
    try {
        // Tag'in arşivleme ayarlarını çek (Not: Performans için bu ayarlar cache'lenebilir)
        const tagRes = await pool.query(
            "SELECT is_historian, log_interval, deadband FROM tags WHERE id = $1", 
            [tagId]
        );
        const settings = tagRes.rows[0];

        if (!settings || !settings.is_historian) return;

        const now = Date.now();
        const state = lastRecordedStates[tagId] || { lastValue: null, lastTime: 0 };
        
        const timeDiff = (now - state.lastTime) / 1000; // Saniye
        const valueDiff = state.lastValue !== null ? Math.abs(currentValue - state.lastValue) : Infinity;
        
        // 🎯 Kayıt Şartları:
        // 1. Süre doldu mu? (Interval)
        const isIntervalReached = timeDiff >= (settings.log_interval || 10);
        // 2. Değişim Deadband'den büyük mü?
        const isDeadbandExceeded = valueDiff > (settings.deadband || 0);

        if (isIntervalReached || isDeadbandExceeded) {
            await pool.query(
                "INSERT INTO historian_logs (tag_id, val, ts) VALUES ($1, $2, NOW())",
                [tagId, currentValue]
            );

            // RAM'deki durumu güncelle
            lastRecordedStates[tagId] = {
                lastValue: currentValue,
                lastTime: now
            };
            
            // console.log(`💾 [Historian] Saved Tag ${tagId}: ${currentValue}`);
        }
    } catch (err) {
        console.error("❌ checkAndArchive Hatası:", err.message);
    }
}

/**
 * KURAL KONTROL MOTORU (Mevcut kodun, değişmedi)
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

            if (isComplex && rule.logic_json) {
                const logicStr = JSON.stringify(rule.logic_json);
                if (logicStr.includes(`"tag_id":"${numericTriggerId}"`) || logicStr.includes(`"tag_id":${numericTriggerId}`)) {
                    isTriggered = evaluateNode(rule.logic_json, lastValues);
                }
            } 
            else if (ruleTagId === numericTriggerId) {
                const val1 = parseFloat(currentValue);
                const val2 = parseFloat(rule.static_value);
                isTriggered = evaluateOperator(val1, rule.operator, val2);
            }

            if (isTriggered) {
                const userRoom = `user_${rule.user_id}`;
                if (io) {
                    io.to(userRoom).emit("alarm", {
                        id: Date.now() + Math.random(),
                        ruleName: rule.name,
                        message: rule.message,
                        value: parseFloat(currentValue).toFixed(2),
                        severity: rule.severity,
                        time: new Date().toLocaleTimeString('tr-TR')
                    });
                }
            }
        }
    } catch (err) { console.error("checkRules Hatası:", err); }
}

function evaluateNode(node, values) {
    if (node.type === 'condition') {
        const tagVal = values[Number(node.tag_id)];
        if (tagVal === undefined) return false;
        return evaluateOperator(tagVal, node.op, parseFloat(node.val));
    }
    if (node.type === 'group') {
        const results = node.children.map(child => evaluateNode(child, values));
        return node.operator === 'AND' ? results.every(r => r) : results.some(r => r);
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