import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Save, Trash2, AlertTriangle, Zap, 
  ArrowRightLeft, Edit3, XCircle, Layers, Plus, Target, Power 
} from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [isComplex, setIsComplex] = useState(false);
  const [allTags, setAllTags] = useState([]); 
  
  const [newRule, setNewRule] = useState({
    name: '',
    tag_id: '',
    logic_type: 'static',
    operator: '>',
    static_value: '',
    target_tag_id: '',
    offset_value: 0,
    severity: 'warning',
    message: '',
    is_complex: false,
    enabled: true // Varsayılan aktif
  });

  const [complexLogic, setComplexLogic] = useState({
    type: 'group',
    operator: 'AND',
    children: []
  });

  const [sourceConnId, setSourceConnId] = useState('');
  const [targetConnId, setTargetConnId] = useState('');
  const [sourceTags, setSourceTags] = useState([]);
  const [targetTags, setTargetTags] = useState([]);

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const tagPromises = connections.map(conn => api.getTags(conn.id));
        const results = await Promise.all(tagPromises);
        const combined = results.flatMap((res, index) => 
          res.data.map(t => ({ ...t, connName: connections[index].name }))
        );
        setAllTags(combined);
      } catch (err) {
        console.error("Tag listesi yüklenemedi:", err);
      }
    };
    if (connections.length > 0) fetchAllTags();
  }, [connections]);

  useEffect(() => {
    if (sourceConnId) api.getTags(sourceConnId).then(res => setSourceTags(res.data));
  }, [sourceConnId]);

  useEffect(() => {
    if (targetConnId) api.getTags(targetConnId).then(res => setTargetTags(res.data));
  }, [targetConnId]);

  // --- AKTİF / PASİF YAPMA FONKSİYONU ---
  const handleToggleEnable = async (rule) => {
    try {
      // Mevcut enabled durumunun tersini gönderiyoruz
      await api.updateRule(rule.id, { ...rule, enabled: !rule.enabled });
      onRefresh(); 
    } catch (err) {
      console.error("Kural durumu güncellenemedi:", err);
      alert("Durum güncellenirken hata oluştu.");
    }
  };

  const updateComplexNode = (path, newNode) => {
    const updateRecursive = (node, currentPath) => {
      if (currentPath.length === 0) return newNode;
      const [idx, ...rest] = currentPath;
      const newChildren = [...node.children];
      newChildren[idx] = updateRecursive(newChildren[idx], rest);
      return { ...node, children: newChildren };
    };
    setComplexLogic(updateRecursive(complexLogic, path));
  };

  const addComplexChild = (path, type) => {
    const addRecursive = (node, currentPath) => {
      if (currentPath.length === 0) {
        const newItem = type === 'condition' 
          ? { type: 'condition', tag_id: '', op: '>', val_type: 'static', val: '' }
          : { type: 'group', operator: 'AND', children: [] };
        return { ...node, children: [...node.children, newItem] };
      }
      const [idx, ...rest] = currentPath;
      const newChildren = [...node.children];
      newChildren[idx] = addRecursive(newChildren[idx], rest);
      return { ...node, children: newChildren };
    };
    setComplexLogic(addRecursive(complexLogic, path));
  };

  const removeComplexChild = (path) => {
    const removeRecursive = (node, currentPath) => {
      if (currentPath.length === 1) {
        const newChildren = node.children.filter((_, i) => i !== currentPath[0]);
        return { ...node, children: newChildren };
      }
      const [idx, ...rest] = currentPath;
      const newChildren = [...node.children];
      newChildren[idx] = removeRecursive(newChildren[idx], rest);
      return { ...node, children: newChildren };
    };
    if (path.length > 0) setComplexLogic(removeRecursive(complexLogic, path));
  };

  const handleEditInit = (rule) => {
    setEditingId(rule.id);
    const complexStatus = rule.is_complex === true || rule.is_complex === 't';
    setIsComplex(complexStatus);

    if (complexStatus && rule.logic_json) {
      setComplexLogic(rule.logic_json);
    } else {
      setComplexLogic({ type: 'group', operator: 'AND', children: [] });
    }

    setNewRule({
      name: rule.name || '',
      tag_id: rule.tag_id || '',
      logic_type: rule.logic_type || 'static',
      operator: rule.operator || '>',
      static_value: rule.static_value || '',
      target_tag_id: rule.target_tag_id || '',
      offset_value: rule.offset_value || 0,
      severity: rule.severity || 'warning',
      message: rule.message || '',
      is_complex: complexStatus,
      enabled: rule.enabled
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsComplex(false);
    setComplexLogic({ type: 'group', operator: 'AND', children: [] });
    setNewRule({
      name: '', tag_id: '', logic_type: 'static', operator: '>',
      static_value: '', target_tag_id: '', offset_value: 0,
      severity: 'warning', message: '', is_complex: false, enabled: true
    });
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const payload = {
      ...newRule,
      is_complex: isComplex,
      logic_json: isComplex ? complexLogic : null,
      tag_id: isComplex ? null : (newRule.tag_id || null),
      operator: isComplex ? null : newRule.operator,
      static_value: !isComplex && newRule.logic_type === 'static' ? newRule.static_value : null,
      target_tag_id: !isComplex && newRule.logic_type === 'compare' ? newRule.target_tag_id : null,
      offset_value: !isComplex && newRule.logic_type === 'compare' ? newRule.offset_value : 0
    };

    try {
      if (editingId) await api.updateRule(editingId, payload);
      else await api.addRule(payload);
      handleCancelEdit();
      onRefresh();
    } catch (err) {
      alert("İşlem başarısız oldu.");
    }
  };

  const getSevColor = (sev) => {
    if (sev === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (sev === 'warning') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  const renderLogicNode = (node, path = []) => {
    if (node.type === 'group') {
      return (
        <div key={path.join('-')} className="ml-2 pl-6 border-l-2 border-slate-700/50 space-y-4 my-4 relative">
          <div className="absolute left-0 top-0 w-3 h-[2px] bg-slate-700/50"></div>
          <div className="flex items-center gap-3 bg-slate-800/40 p-2 rounded-lg w-fit">
            <select 
              value={node.operator}
              onChange={(e) => updateComplexNode(path, { ...node, operator: e.target.value })}
              className="bg-slate-900 text-blue-400 text-xs font-black p-1.5 rounded border border-slate-700 outline-none focus:border-blue-500 transition-all"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
            <button type="button" onClick={() => addComplexChild(path, 'condition')} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"><PlusCircle size={18}/></button>
            <button type="button" onClick={() => addComplexChild(path, 'group')} className="p-1 text-purple-500 hover:bg-purple-500/10 rounded-md transition-colors"><Layers size={18}/></button>
            {path.length > 0 && (
              <button type="button" onClick={() => removeComplexChild(path)} className="p-1 text-red-500/50 hover:text-red-500 rounded-md"><Trash2 size={16}/></button>
            )}
          </div>
          <div className="space-y-3">
            {node.children.map((child, idx) => renderLogicNode(child, [...path, idx]))}
          </div>
        </div>
      );
    }
    return (
      <div key={path.join('-')} className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-lg hover:border-slate-600 transition-all group">
        <select 
          value={node.tag_id}
          onChange={(e) => updateComplexNode(path, { ...node, tag_id: e.target.value })}
          className="bg-slate-800 text-slate-200 text-sm outline-none flex-1 p-2 rounded-xl border border-slate-700 focus:border-blue-500 transition-all"
        >
          <option value="">Select Sensor...</option>
          {connections.map(conn => (
             <optgroup key={conn.id} label={conn.name} className="bg-slate-950 text-slate-500">
                {allTags.filter(t => t.connection_id === conn.id).map(t => (
                  <option key={t.id} value={t.id} className="text-slate-200">{t.tag_name}</option>
                ))}
             </optgroup>
          ))}
        </select>
        <select 
          value={node.op} 
          onChange={(e) => updateComplexNode(path, { ...node, op: e.target.value })}
          className="bg-transparent text-blue-400 font-black text-sm outline-none w-12"
        >
          {['>', '<', '==', '!=', '>=', '<='].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <input 
          type="number" 
          value={node.val} 
          onChange={(e) => updateComplexNode(path, { ...node, val: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm w-24 outline-none text-white focus:border-emerald-500 transition-all"
          placeholder="Value"
        />
        <button type="button" onClick={() => removeComplexChild(path)} className="text-slate-600 hover:text-red-500 p-1 transition-colors"><Trash2 size={18}/></button>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20 px-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        
        {/* KURAL FORMU */}
        <div className={`xl:col-span-2 border rounded-[2.5rem] p-8 shadow-2xl h-fit sticky top-8 transition-all duration-500 ${editingId ? 'bg-slate-800/40 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-bold flex items-center gap-3 ${editingId ? 'text-amber-400' : 'text-blue-400'}`}>
              {editingId ? <Edit3 size={24} /> : <Zap size={24} />}
              {editingId ? 'Edit Logic Rule' : 'Logic Builder Engine'}
            </h3>
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
               <button type="button" onClick={() => setIsComplex(false)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${!isComplex ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}>SIMPLE</button>
               <button type="button" onClick={() => setIsComplex(true)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${isComplex ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}>COMPLEX</button>
            </div>
          </div>
          
          <form onSubmit={handleSaveRule} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
               <div>
                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest">Rule Name</label>
                <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-all" placeholder="e.g. Tank Pressure Check" />
               </div>

               <div>
                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest text-center">Severity Level</label>
                <div className="flex gap-2">
                  {[
                    { id: 'info', label: 'INFO', activeClass: 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]' },
                    { id: 'warning', label: 'WARNING', activeClass: 'bg-amber-600 text-white border-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' },
                    { id: 'critical', label: 'CRITICAL', activeClass: 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewRule({ ...newRule, severity: s.id })}
                      className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] transition-all duration-300 tracking-widest ${
                        newRule.severity === s.id 
                        ? s.activeClass 
                        : 'bg-slate-800 border-transparent text-slate-600 opacity-50 hover:opacity-100 hover:bg-slate-750'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
               </div>
            </div>

            <hr className="border-slate-800" />

            {!isComplex ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-inner">
                  <label className="text-[10px] text-blue-500 block uppercase font-black tracking-widest italic text-center">Trigger Source</label>
                  <select value={sourceConnId} onChange={(e) => setSourceConnId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 outline-none">
                    <option value="">Sistem Seçiniz...</option>
                    {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={newRule.tag_id} onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})} disabled={!sourceConnId} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 outline-none disabled:opacity-20">
                    <option value="">Sensör Seçiniz...</option>
                    {sourceTags.map(t => <option key={t.id} value={t.id}>{t.tag_name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                    <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-bold text-blue-400">
                       {['>', '<', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <div className="flex-1 flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'static'})} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${newRule.logic_type === 'static' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>STATIC</button>
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'compare'})} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${newRule.logic_type === 'compare' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}>COMPARE</button>
                    </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 shadow-inner min-h-[120px] flex flex-col justify-center">
                  {newRule.logic_type === 'static' ? (
                    <div className="animate-in fade-in duration-300">
                      <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black">Sabit Eşik Değer (Threshold)</label>
                      <input type="number" step="0.1" value={newRule.static_value} onChange={e => setNewRule({...newRule, static_value: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500" placeholder="Değer..." />
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                      <label className="text-[10px] text-orange-500 block mb-2 uppercase font-black text-center italic">Kıyaslanacak Hedef (Target)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <select value={targetConnId} onChange={(e) => setTargetConnId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                          <option value="">Hedef Sistem...</option>
                          {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={newRule.target_tag_id} onChange={(e) => setNewRule({...newRule, target_tag_id: e.target.value})} disabled={!targetConnId} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                          <option value="">Hedef Tag...</option>
                          {targetTags.map(t => <option key={t.id} value={t.id}>{t.tag_name}</option>)}
                        </select>
                      </div>
                      <div className="pt-2">
                        <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Offset / Tolerans (+/-)</label>
                        <input type="number" value={newRule.offset_value} onChange={e => setNewRule({...newRule, offset_value: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" placeholder="Fark değeri..." />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in zoom-in-95 duration-500">
                <div className="bg-slate-950/80 p-6 rounded-[2.5rem] border border-purple-500/20 shadow-inner">
                  <label className="text-[10px] text-purple-400 block mb-4 uppercase font-black tracking-widest italic text-center">Recursive Logic Architecture</label>
                  {renderLogicNode(complexLogic)}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest">Alert Message</label>
              <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} 
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-slate-300 outline-none h-20 resize-none focus:border-blue-500 transition-all" placeholder="Instructions for operator..." />
            </div>

            <button type="submit" className={`w-full text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 hover:scale-[1.01] ${editingId ? 'bg-amber-600 shadow-amber-900/40' : isComplex ? 'bg-purple-600 shadow-purple-900/40' : 'bg-blue-600 shadow-blue-900/40'}`}>
              <Save size={20} /> {editingId ? 'UPDATE LOGIC' : 'DEPLOY LOGIC ENGINE'}
            </button>
          </form>
        </div>

        {/* KURALLAR LİSTESİ */}
        <div className="xl:col-span-3 space-y-6">
           <div className="flex justify-between items-center px-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <ArrowRightLeft size={18} className="text-blue-500" /> ACTIVE HEURISTICS
              </h3>
              <div className="bg-slate-900 px-5 py-2 rounded-full border border-slate-800 text-[10px] font-black text-slate-400 shadow-lg">
                {rules.length} RULES DEPLOYED
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-5">
             {rules.map((rule) => {
               // Durum kontrolü için değişken
               const isEnabled = rule.enabled !== false; 

               return (
                <div key={rule.id} className={`p-8 rounded-[2.5rem] border flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all group relative overflow-hidden ${
                  !isEnabled 
                    ? 'bg-slate-950/50 border-slate-900 opacity-60 grayscale-[0.5]' 
                    : editingId === rule.id 
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-2xl' 
                      : 'bg-slate-900 border-slate-800 shadow-xl'
                }`}>
                  <div className="flex items-center gap-8">
                    <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center shrink-0 shadow-lg transition-all ${
                      isEnabled ? getSevColor(rule.severity) : 'bg-slate-800 border-slate-700 text-slate-600'
                    }`}>
                       {rule.is_complex ? <Layers size={32} /> : <Zap size={32} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`text-lg font-black transition-colors ${isEnabled ? 'text-slate-100' : 'text-slate-500'}`}>{rule.name}</h4>
                        {rule.is_complex && (
                          <span className={`text-[9px] px-3 py-1 rounded-full border font-black tracking-widest uppercase ${
                            isEnabled ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-600 border-slate-700'
                          }`}>COMPLEX</span>
                        )}
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase border shadow-sm transition-all ${
                          isEnabled ? getSevColor(rule.severity) : 'bg-slate-800 border-slate-700 text-slate-600'
                        }`}>
                          {isEnabled ? rule.severity : 'PASSIVE'}
                        </span>
                      </div>
                      <div className={`text-sm font-mono mb-2 transition-colors ${isEnabled ? 'text-slate-500' : 'text-slate-700'}`}>
                        {rule.is_complex ? (
                          <span className="italic tracking-tight">"Hierarchical multi-tag decision tree logic"</span>
                        ) : (
                          <span>IF [Tag:{rule.tag_id}] {rule.operator} {rule.logic_type === 'static' ? rule.static_value : `Target:${rule.target_tag_id} (±${rule.offset_value})`}</span>
                        )}
                      </div>
                      <p className={`text-sm italic font-medium leading-relaxed transition-colors ${isEnabled ? 'text-slate-500' : 'text-slate-800'}`}>"{rule.message}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end lg:self-center z-10">
                    {/* AKTİF / PASİF TOGGLE BUTONU */}
                    <button 
                      onClick={() => handleToggleEnable(rule)} 
                      className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border ${
                        isEnabled 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                      }`}
                      title={isEnabled ? "Deactivate Rule" : "Activate Rule"}
                    >
                      <Power size={18} />
                      <span className="hidden sm:inline">{isEnabled ? "Active" : "Passive"}</span>
                    </button>

                    <button onClick={() => handleEditInit(rule)} className="p-4 bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 rounded-2xl transition-all shadow-md active:scale-90"><Edit3 size={20} /></button>
                    <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-4 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-md active:scale-90"><Trash2 size={20} /></button>
                  </div>
                </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );  
};

export default RuleManagement;