import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Trash2, Activity } from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh }) => {
  const [newRule, setNewRule] = useState({ 
    tag_id: '', 
    operator: '>', 
    threshold: '', 
    alert_message: '' 
  });
  
  const [selectedConnId, setSelectedConnId] = useState('');
  const [availableTags, setAvailableTags] = useState([]); // State ismimiz bu

  // Sistem seçildiğinde tagleri getiren fonksiyon
  useEffect(() => {
    if (selectedConnId) {
      console.log(`📡 ${selectedConnId} için tagler çekiliyor...`);
      api.getTags(selectedConnId)
        .then(res => {
          console.log("✅ Gelen Tagler:", res.data);
          setAvailableTags(res.data); // BURASI DÜZELTİLDİ: setAvailableTags kullanıyoruz
        })
        .catch(err => console.error("❌ Tag çekme hatası:", err));
    } else {
      setAvailableTags([]);
    }
  }, [selectedConnId]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.tag_id || !newRule.threshold || !newRule.alert_message) {
      return alert("Lütfen tüm alanları doldurun.");
    }
    
    try {
      await api.addRule(newRule);
      setNewRule({ tag_id: '', operator: '>', threshold: '', alert_message: '' });
      setSelectedConnId(''); // Formu sıfırla
      onRefresh(); // Listeyi güncelle
    } catch (err) {
      alert("Kural eklenemedi.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KURAL EKLEME FORMU */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
            <PlusCircle size={20} /> New Logic Rule
          </h3>
          <form onSubmit={handleAddRule} className="space-y-4">
            
            {/* 1. SİSTEM SEÇİMİ */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-widest">1. Select System</label>
              <select 
                value={selectedConnId} 
                onChange={(e) => setSelectedConnId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Choose a Connection...</option>
                {connections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 2. TAG SEÇİMİ */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-widest">2. Select Tag</label>
              <select 
                disabled={!selectedConnId}
                value={newRule.tag_id} 
                onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 disabled:opacity-30 transition-opacity"
              >
                <option value="">{selectedConnId ? 'Choose a Tag...' : 'Select a system first'}</option>
                {availableTags.map(t => (
                  <option key={t.id} value={t.id}>{t.tag_name} ({t.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-widest">Operator</label>
                <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none">
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="==">==</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-widest">Threshold</label>
                <input type="number" step="0.1" value={newRule.threshold} onChange={(e) => setNewRule({...newRule, threshold: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none" placeholder="e.g. 50" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-widest">Alert Message</label>
              <textarea value={newRule.alert_message} onChange={(e) => setNewRule({...newRule, alert_message: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none h-20 resize-none" placeholder="Alarm description..." />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
              <Save size={18} /> Deploy Rule
            </button>
          </form>
        </div>

        {/* KURALLAR TABLOSU AYNI KALIYOR */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
           <h3 className="text-sm font-bold mb-6 text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
            <Activity size={16}/> Active Systems Logic Engine
           </h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                    <th className="pb-4">Condition</th>
                    <th className="pb-4">Alert Message</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rules.length === 0 ? (
                    <tr><td colSpan="3" className="py-10 text-center text-slate-600 italic">No rules deployed yet.</td></tr>
                  ) : rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4">
                        <span className="text-blue-400 font-mono font-bold">Value</span> <span className="text-slate-400">{rule.operator}</span> <span className="text-blue-400 font-mono font-bold">{rule.threshold}</span>
                      </td>
                      <td className="py-4 text-slate-300 text-xs">{rule.alert_message}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RuleManagement;