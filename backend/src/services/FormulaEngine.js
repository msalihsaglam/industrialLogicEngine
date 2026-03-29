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
        // SELECT kısmına initial_value ekledik
        const res = await pool.query("SELECT id, tag_name, formula, initial_value, source_type FROM tags WHERE connection_id IS NULL");
        calculatedTags = res.rows.filter(t => t.source_type === 'calculated');
        
        // 🧠 Cache'i veritabanındaki değerlerle doldur (Böylece 0 görünmez)
        res.rows.forEach(t => {
            tagCache[`T${t.id}`] = parseFloat(t.initial_value) || 0;
        });

        console.log("🧠 [FormulaEngine] Infrastructure Mapped & Cache Primed.");
    } catch (err) { console.error(err); }
},

    reload: async () => { await FormulaEngine.init(); },

// FormulaEngine.js -> process fonksiyonu
process: (incomingData) => {
        //console.log(`🎯 [FormulaEngine] process icerisindeyim`);
        const { tagId, value } = incomingData;
        const tagKey = `T${tagId}`;
        tagCache[tagKey] = parseFloat(value);

        const results = [];

        calculatedTags.forEach(ctag => {
            // Tam kelime eşleşmesi (T1, T10'u tetiklemesin diye \b kullanıyoruz)
            const regex = new RegExp(`\\b${tagKey}\\b`);
            
            if (regex.test(ctag.formula)) {
                //console.log(`🎯 [FormulaEngine] Tetiklendi: ${tagKey} -> Formül: ${ctag.formula}`);
                const res = FormulaEngine.calculate(ctag);
                if (res) results.push(res);
            }
        });
        
        return results;
    },

calculate: (ctag) => {
    try {
      const scope = { ...tagCache };
      const symbols = ctag.formula.match(/T\d+/g) || [];
      symbols.forEach(sym => {
          if (scope[sym] === undefined) scope[sym] = 0;
      });

      const result = math.evaluate(ctag.formula, scope);
      
      if (result !== undefined && !isNaN(result)) {
          const finalValue = parseFloat(result.toFixed(2));
          
          // 🚀 [BURAYI GÜNCELLEDİK] Dashboard yayını buraya geliyor:
          const io = socketManager.getIo();
          if (io) {
              io.emit('liveData', { 
                  sourceName: 'VIRTUAL WORKSPACE', // Frontend'in beklediği isim
                  tagName: ctag.tag_name, 
                  tagId: ctag.id,
                  value: finalValue 
              });
              // console.log(`🧠 [FormulaStream] Dashboard'a gönderildi: ${ctag.tag_name} -> ${finalValue}`);
          }
          
          // Cache'e yaz
          tagCache[`T${ctag.id}`] = finalValue;
          return { tagId: ctag.id, value: finalValue };
      }
    } catch (err) {
      console.error(`❌ [FormulaEngine] HESAPLAMA HATASI (${ctag.tag_name}):`, err.message);
      return null;
    }
    return null;
}
};

module.exports = FormulaEngine;