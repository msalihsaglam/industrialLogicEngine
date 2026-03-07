const pool = require("../config/db");
const socketManager = require("../socket/socketManager");
const FormulaEngine = require('./FormulaEngine');

// Formül motorunu hemen başlat
FormulaEngine.init();

const lastValues = {}; 

/**
 * ANA KONTROL VE HESAPLAMA MOTORU
 * Verinin girdiği ilk kapı burası kanka.
 */
async function processData(sourceName, tagName, tagId, currentValue) {

    const val = parseFloat(currentValue);
    const numericId = Number(tagId);
    
    // 1. Gelen ham veriyi hafızaya (cache) yaz
    lastValues[numericId] = val;

    // 💡 KRİTİK NOKTA: Buradaki logu görmen lazım
    console.log(`\n--------------------------------------------`);
    console.log(`📥 [LogicEngine] Ham Veri Girişi: ID ${numericId} = ${val}`);

    // 2. ⚡ FORMÜL MOTORUNU TETİKLE
    // Eğer bu ID (Örn: T2) bir formülde kullanılıyorsa hesaplama yapılacak
    const calculatedResults = FormulaEngine.process({ tagId: numericId, value: val });
    console.log(`🔗 [LogicEngine] Zincirleme Hesaplama: ${calculatedResults} `);
    // 3. Ham veri (T1, T2 vb.) için alarmları kontrol et
    await checkRules(numericId, val);

    // 4. 🚀 HESAPLANAN (VIRTUAL) SONUÇLAR VARSA ONLARI İŞLE
    if (calculatedResults && calculatedResults.length > 0) {
        console.log(`🔗 [LogicEngine] Zincirleme Hesaplama Bulundu: ${calculatedResults.length} adet`);
        
        for (const res of calculatedResults) {
            console.log(`🚀 [LogicEngine] Sanal Tag İşleniyor -> ID: ${res.tagId}, Değer: ${res.value}`);
            
            // Hesaplanan değeri de merkezi cache'e yaz
            lastValues[Number(res.tagId)] = res.value;

            // 🎯 İŞTE ŞİMDİ "Aranan Tag ID: 16" LOGU ÇALIŞACAK!
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

        // Senin eklediğin o debug logu
        console.log(`🧐 [LogicEngine] DB'den ${allRules.length} kural çekildi. Aranan Tag ID: ${numericTriggerId}`);

        for (let rule of allRules) {
            const ruleTagId = Number(rule.tag_id);
            const isComplex = rule.is_complex === true || rule.is_complex === 't';

            // EŞLEŞME KONTROLÜ
            if (isComplex || ruleTagId === numericTriggerId) {
                console.log(`✅ [EŞLEŞTİ] Tetikleniyor: ${rule.name}`);

                const val1 = parseFloat(currentValue);
                const val2 = parseFloat(rule.static_value);
                const isTriggered = evaluateOperator(val1, rule.operator, val2);

                if (isTriggered) {
                    console.log(`🚨 ALARM! ${rule.name} tetiklendi. Değer: ${val1} > ${val2}`);
                    const userRoom = `user_${rule.user_id}`;
                    if (io) {
                        io.to(userRoom).emit("alarm", {
                            id: Date.now() + Math.random(),
                            ruleName: rule.name,
                            message: rule.message,
                            value: val1.toFixed(2),
                            threshold: val2,
                            severity: rule.severity,
                            time: new Date().toLocaleTimeString('tr-TR')
                        });
                    }
                }
            }
        }
    } catch (err) { console.error("checkRules Hatası:", err); }
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