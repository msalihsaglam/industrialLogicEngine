import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Play, Trash2, Activity, Database } from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh }) => {
  const [newRule, setNewRule] = useState({ 
    tag_id: '', 
    operator: '>', 
    threshold: '', 
    alert_message: '' 
  });
  
  const [selectedConnId, setSelectedConnId] = useState('');
  const [availableTags, setAvailableTags] = useState([]);

  // Seçilen bağlantıya göre tagleri getir
  useEffect(() => {
    if (selectedConnId) {
      api.getTags(selectedConnId).then(res => setTags(res.data));
    } else {
      setAvailableTags([]);
    }
  }, [selectedConnId]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.tag_id || !newRule.threshold || !newRule.alert_message) {
      return alert("Lütfen sistem, tag ve eşik değerlerini doldurun.");
    }
    await api.addRule(newRule);
    setNewRule({ tag_id: '', operator: '>', threshold: '', alert_message: '' });
    onRefresh();
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
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">1. Select System</label>
              <select 
                value={selectedConnId} 
                onChange={(e) => setSelectedConnId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none"
              >
                <option value="">Choose a Connection...</option>
                {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 2. TAG SEÇİMİ (Bağlantı seçilince aktif olur) */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">2. Select Tag</label>
              <select 
                disabled={!selectedConnId}
                value={newRule.tag_id} 
                onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none disabled:opacity-50"
              >
                <option value="">{selectedConnId ? 'Choose a Tag...' : 'Select a system first'}</option>
                {availableTags.map(t => <option key={t.id} value={t.id}>{t.tag_name} ({t.unit})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Operator</label>
                <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none">
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="==">==</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Threshold</label>
                <input type="number" step="0.1" value={newRule.threshold} onChange={(e) => setNewRule({...newRule, threshold: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Alert Message</label>
              <textarea value={newRule.alert_message} onChange={(e) => setNewRule({...newRule, alert_message: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none h-20" />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <Save size={18} /> Deploy Rule
            </button>
          </form>
        </div>

        {/* AKTİF KURALLAR TABLOSU */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
           <h3 className="text-sm font-bold mb-6 text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16}/> Logic Engine Status
           </h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                    <th className="pb-4">Condition</th>
                    <th className="pb-4">Message</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4">
                        <span className="text-blue-400 font-mono">Value</span> {rule.operator} {rule.threshold}
                      </td>
                      <td className="py-4 text-slate-300">{rule.alert_message}</td>
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