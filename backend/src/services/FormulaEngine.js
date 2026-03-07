const { create, all } = require('mathjs');
const math = create(all);
const pool = require('../config/db');
const socketManager = require('../socket/socketManager');

// 💡 KRİTİK: tagCache artık boş başlamıyor, 0 ile initialize ediliyor
let tagCache = {}; 
let calculatedTags = [];

const FormulaEngine = {
// FormulaEngine.js içindeki init fonksiyonunu bu şekilde güncelle:

init: async () => {
    try {
        const res = await pool.query("SELECT id, tag_name, formula FROM tags WHERE source_type = 'calculated'");
        calculatedTags = res.rows;
        
        // 💡 KRİTİK LOG: Bunu terminalde görmelisin!
        console.log("-----------------------------------------");
        console.log("🧠 [FormulaEngine] YÜKLENEN TAGLER:");
        calculatedTags.forEach(t => console.log(`> ID: ${t.id} | Name: ${t.tag_name} | Formula: ${t.formula}`));
        console.log("-----------------------------------------");
        
    } catch (err) { console.error(err); }
},

    reload: async () => { await FormulaEngine.init(); },

// FormulaEngine.js -> process fonksiyonu
process: (incomingData) => {
        console.log(`🎯 [FormulaEngine] process icerisindeyim`);
        const { tagId, value } = incomingData;
        const tagKey = `T${tagId}`;
        tagCache[tagKey] = parseFloat(value);

        const results = [];

        calculatedTags.forEach(ctag => {
            // Tam kelime eşleşmesi (T1, T10'u tetiklemesin diye \b kullanıyoruz)
            const regex = new RegExp(`\\b${tagKey}\\b`);
            
            if (regex.test(ctag.formula)) {
                console.log(`🎯 [FormulaEngine] Tetiklendi: ${tagKey} -> Formül: ${ctag.formula}`);
                const res = FormulaEngine.calculate(ctag);
                if (res) results.push(res);
            }
        });
        
        return results;
    },

    calculate: (ctag) => {
        try {
            // 💡 ÇÖZÜM: Formülde olan ama henüz verisi gelmemiş tagleri 0 kabul et
            // Yoksa mathjs "Undefined symbol" hatası verir.
            const scope = { ...tagCache };
            
            // Formüldeki tüm T{id} yapılarını bul ve eksik olanları 0'la
            const symbols = ctag.formula.match(/T\d+/g) || [];
            symbols.forEach(sym => {
                if (scope[sym] === undefined) scope[sym] = 0;
            });

            const result = math.evaluate(ctag.formula, scope);
            
            if (result !== undefined && !isNaN(result)) {
                const finalValue = parseFloat(result.toFixed(2));
                
                // Dashboard yayını... (socket logic)
                
                // Cache'e yaz
                tagCache[`T${ctag.id}`] = finalValue;
                return { tagId: ctag.id, value: finalValue };
            }
        } catch (err) {
            // 🚨 HATA LOGU: Burası neden 16'nın oluşmadığını söyleyecek
            console.error(`❌ [FormulaEngine] HESAPLAMA HATASI (${ctag.tag_name}):`, err.message);
            return null;
        }
        return null;
    }
};

module.exports = FormulaEngine;