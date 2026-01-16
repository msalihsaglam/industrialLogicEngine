import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Trash2, Activity, Info, AlertTriangle, Zap, ArrowRightLeft } from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh }) => {
  // 1. Yeni Kural State'i (Yeni Tablo Yapısına Uygun)
  const [newRule, setNewRule] = useState({
    name: '',
    tag_id: '',
    logic_type: 'static', // 'static' veya 'compare'
    operator: '>',
    static_value: '',
    target_tag_id: '',
    offset_value: 0,
    severity: 'warning',
    message: ''
  });

  // 2. Form Kontrol State'leri
  const [sourceConnId, setSourceConnId] = useState(''); // Tetikleyici sistem
  const [targetConnId, setTargetConnId] = useState(''); // Kıyaslanacak sistem
  const [sourceTags, setSourceTags] = useState([]);
  const [targetTags, setTargetTags] = useState([]);

  // Tetikleyici Tag listesini çek
  useEffect(() => {
    if (sourceConnId) {
      api.getTags(sourceConnId).then(res => setSourceTags(res.data));
    } else {
      setSourceTags([]);
    }
  }, [sourceConnId]);

  // Kıyaslanacak (Target) Tag listesini çek
  useEffect(() => {
    if (targetConnId) {
      api.getTags(targetConnId).then(res => setTargetTags(res.data));
    } else {
      setTargetTags([]);
    }
  }, [targetConnId]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.name || !newRule.tag_id || !newRule.message) {
      return alert("Lütfen zorunlu alanları (İsim, Tag, Mesaj) doldurun.");
    }

    try {
      await api.addRule(newRule);
      setNewRule({
        name: '', tag_id: '', logic_type: 'static', operator: '>',
        static_value: '', target_tag_id: '', offset_value: 0,
        severity: 'warning', message: ''
      });
      setSourceConnId('');
      setTargetConnId('');
      onRefresh();
    } catch (err) {
      alert("Kural eklenemedi. Veritabanı sütunlarını kontrol edin.");
    }
  };

  // Severity Renk Belirleyici
  const getSevColor = (sev) => {
    if (sev === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (sev === 'warning') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* KURAL EKLEME FORMU (Lego Builder) */}
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl h-fit sticky top-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
            <Zap size={20} /> Logic Builder
          </h3>
          
          <form onSubmit={handleAddRule} className="space-y-4">
            {/* Kural İsmi */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-black tracking-widest">Rule Name</label>
              <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. Pump Delta Check" />
            </div>

            {/* Severity */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-black tracking-widest">Severity</label>
              <div className="flex gap-2">
                {['info', 'warning', 'critical'].map(s => (
                  <button key={s} type="button" onClick={() => setNewRule({...newRule, severity: s})}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${newRule.severity === s ? getSevColor(s) : 'bg-slate-800 border-transparent text-slate-500'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-800 my-4" />

            {/* TETİKLEYİCİ (SOURCE) */}
            <div className="space-y-3">
              <label className="text-[10px] text-blue-500 block uppercase font-black tracking-widest italic">Trigger Source</label>
              <select value={sourceConnId} onChange={(e) => setSourceConnId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none">
                <option value="">Select System...</option>
                {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={newRule.tag_id} onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})} disabled={!sourceConnId} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none disabled:opacity-20">
                <option value="">Select Tag...</option>
                {sourceTags.map(t => <option key={t.id} value={t.id}>{t.tag_name}</option>)}
              </select>
            </div>

            {/* OPERATOR & LOGIC TYPE */}
            <div className="flex items-center gap-4 py-2">
                <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm font-bold text-blue-400">
                   {['>', '<', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <div className="flex-1 flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'static'})} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${newRule.logic_type === 'static' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>STATIC</button>
                    <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'compare'})} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${newRule.logic_type === 'compare' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>COMPARE</button>
                </div>
            </div>

            {/* DİNAMİK HEDEF ALANI */}
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-dashed border-slate-800">
              {newRule.logic_type === 'static' ? (
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Static Threshold</label>
                  <input type="number" step="0.1" value={newRule.static_value} onChange={e => setNewRule({...newRule, static_value: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm outline-none" placeholder="Enter value..." />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Target Comparison</label>
                  <select value={targetConnId} onChange={(e) => setTargetConnId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs outline-none">
                    <option value="">Target System...</option>
                    {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={newRule.target_tag_id} onChange={(e) => setNewRule({...newRule, target_tag_id: e.target.value})} disabled={!targetConnId} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs outline-none">
                    <option value="">Target Tag...</option>
                    {targetTags.map(t => <option key={t.id} value={t.id}>{t.tag_name}</option>)}
                  </select>
                  <div className="pt-2">
                    <label className="text-[9px] text-slate-600 block mb-1 font-bold">OFFSET (+/-)</label>
                    <input type="number" value={newRule.offset_value} onChange={e => setNewRule({...newRule, offset_value: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none" placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-widest">Alert Message</label>
              <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs outline-none h-20 resize-none" placeholder="What should the operator know?" />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              <Save size={18} /> DEPLOY LOGIC
            </button>
          </form>
        </div>

        {/* KURALLAR LİSTESİ */}
        <div className="xl:col-span-3 space-y-4">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <ArrowRightLeft size={16}/> Active Heuristics
              </h3>
              <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-3 py-1 rounded-full">{rules.length} Rules Active</span>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {rules.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[2rem]">
                  <p className="text-slate-600 italic">No custom logic deployed for the current shift.</p>
                </div>
              ) : rules.map((rule) => (
                <div key={rule.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${getSevColor(rule.severity)}`}>
                       <AlertTriangle size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-100">{rule.name}</h4>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border ${getSevColor(rule.severity)}`}>
                          {rule.severity}
                        </span>
                      </div>
                      <div className="text-xs font-mono">
                        <span className="text-blue-400">IF</span> [Tag:{rule.tag_id}] 
                        <span className="text-white mx-2">{rule.operator}</span> 
                        {rule.logic_type === 'static' ? (
                          <span className="text-emerald-400">{rule.static_value}</span>
                        ) : (
                          <span className="text-orange-400">TargetTag:{rule.target_tag_id} {Number(rule.offset_value) !== 0 && `+ ${rule.offset_value}`}</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-2 italic">"{rule.message}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-3 bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default RuleManagement;