import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Save, Trash2, AlertTriangle, Zap, 
  ArrowRightLeft, Edit3, XCircle, Layers, Plus, Target, Power, Database, Cpu 
} from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh, userId }) => {
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
    enabled: true 
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

  // 📡 TÜM TAGLERİ (Fiziksel + Sanal) HAVUZDA TOPLA
  const fetchAllTags = async () => {
    try {
      // Fiziksel olanlar
      const tagPromises = connections.map(conn => api.getTags(conn.id));
      const physicalResults = await Promise.all(tagPromises);
      const physicalTags = physicalResults.flatMap((res, index) => 
        res.data.map(t => ({ ...t, connName: connections[index].name, type: 'physical' }))
      );
      
      // Sanal olanlar (Internal + Calculated)
      const virtualRes = await api.getTags(0);
      const virtualTags = virtualRes.data.map(t => ({ 
        ...t, 
        connName: 'VIRTUAL WORKSPACE', 
        type: t.source_type // 'internal' veya 'calculated'
      }));

      setAllSystemList([...connections, { id: '0', name: '🧠 VIRTUAL WORKSPACE' }]);
      setAllTags([...physicalTags, ...virtualTags]);
    } catch (err) {
      console.error("Tag listesi birleştirilemedi:", err);
    }
  };

  // Sistem listesi için state
  const [allSystemList, setAllSystemList] = useState([]);

  useEffect(() => {
    fetchAllTags();
  }, [connections]);

  // Source Tagleri Getir (Fiziksel veya Sanal)
  useEffect(() => {
    if (sourceConnId) {
        api.getTags(sourceConnId).then(res => setSourceTags(res.data));
    }
  }, [sourceConnId]);

  // Target Tagleri Getir (Fiziksel veya Sanal)
  useEffect(() => {
    if (targetConnId) {
        api.getTags(targetConnId).then(res => setTargetTags(res.data));
    }
  }, [targetConnId]);

  const handleToggleEnable = async (rule) => {
    try {
      await api.updateRule(rule.id, { 
        ...rule, 
        enabled: !rule.enabled,
        user_id: userId 
      });
      onRefresh(); 
    } catch (err) { alert("Durum güncellenirken hata oluştu."); }
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
    setSourceConnId('');
    setTargetConnId('');
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Oturum bilgisi eksik.");
      return;
    }

    const payload = {
      ...newRule,
      user_id: userId,
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
      alert("Kaydetme hatası oluştu.");
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
            <select value={node.operator} onChange={(e) => updateComplexNode(path, { ...node, operator: e.target.value })} className="bg-slate-900 text-blue-400 text-xs font-black p-1.5 rounded border border-slate-700 outline-none transition-all">
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
      <div key={path.join('-')} className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-lg group">
        <select 
          value={node.tag_id}
          onChange={(e) => updateComplexNode(path, { ...node, tag_id: e.target.value })}
          className="bg-slate-800 text-slate-200 text-[10px] outline-none flex-1 p-2 rounded-xl border border-slate-700 focus:border-blue-500"
        >
          <option value="">Select Sensor...</option>
          {/* Fiziksel Tagler */}
          <optgroup label="🌐 PHYSICAL SOURCES" className="bg-slate-950 text-blue-500">
             {allTags.filter(t => t.connection_id !== null).map(t => (
               <option key={t.id} value={t.id}>{t.tag_name} ({t.connName})</option>
             ))}
          </optgroup>
          {/* Sanal Tagler */}
          <optgroup label="🧠 VIRTUAL NODES" className="bg-slate-950 text-purple-500">
             {allTags.filter(t => t.connection_id === null).map(t => (
               <option key={t.id} value={t.id}>{t.tag_name} [{t.source_type.toUpperCase()}]</option>
             ))}
          </optgroup>
        </select>
        <select value={node.op} onChange={(e) => updateComplexNode(path, { ...node, op: e.target.value })} className="bg-transparent text-blue-400 font-black text-xs outline-none">
          {['>', '<', '==', '!=', '>=', '<='].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <input type="number" value={node.val} onChange={(e) => updateComplexNode(path, { ...node, val: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs w-20 outline-none text-white focus:border-emerald-500" placeholder="Value" />
        <button type="button" onClick={() => removeComplexChild(path)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20 px-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Logic Builder</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">
            Heuristic Engine & Complex Decision Mapping
          </p>
        </div>
        <div className="bg-slate-900 px-5 py-2 rounded-full border border-slate-800 text-[10px] font-black text-slate-400 shadow-xl">
            {rules.length} ACTIVE HEURISTICS
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 pt-4">
        
        {/* KURAL FORMU */}
        <div className={`xl:col-span-2 border rounded-[2.5rem] p-8 shadow-2xl h-fit sticky top-8 transition-all duration-500 ${editingId ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex justify-between items-center mb-10">
            <h3 className={`text-xl font-bold flex items-center gap-3 ${editingId ? 'text-amber-400' : 'text-blue-400'}`}>
              {editingId ? <Edit3 size={24} /> : <Zap size={24} />}
              {editingId ? 'Edit Logic Rule' : 'Logic Builder Engine'}
            </h3>
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
               <button type="button" onClick={() => setIsComplex(false)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${!isComplex ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-white'}`}>SIMPLE</button>
               <button type="button" onClick={() => setIsComplex(true)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${isComplex ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-white'}`}>COMPLEX</button>
            </div>
          </div>
          
          <form onSubmit={handleSaveRule} className="space-y-6">
             <div>
                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest">Rule Name</label>
                <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500 font-bold" placeholder="e.g. Tank Pressure Alert" />
             </div>

             <div>
                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest text-center">Severity Level</label>
                <div className="flex gap-2">
                  {['info', 'warning', 'critical'].map((s) => (
                    <button key={s} type="button" onClick={() => setNewRule({ ...newRule, severity: s })} className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] transition-all tracking-widest uppercase ${newRule.severity === s ? (s === 'critical' ? 'bg-red-600 border-red-400 text-white' : s === 'warning' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-blue-600 border-blue-400 text-white') : 'bg-slate-800 border-transparent text-slate-600 opacity-50'}`}> {s} </button>
                  ))}
                </div>
             </div>

            <hr className="border-slate-800/50" />

            {!isComplex ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <label className="text-[10px] text-blue-500 block uppercase font-black tracking-widest italic text-center">Trigger Source</label>
                  <select value={sourceConnId} onChange={(e) => setSourceConnId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 outline-none font-bold">
                    <option value="">Select System...</option>
                    <option value="0" className="text-purple-400 font-black tracking-widest">🧠 VIRTUAL WORKSPACE</option>
                    {connections.map(c => <option key={c.id} value={c.id}>🌐 {c.name}</option>)}
                  </select>
                  <select value={newRule.tag_id} onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})} disabled={!sourceConnId} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 outline-none disabled:opacity-20 font-bold">
                    <option value="">Select Tag...</option>
                    {sourceTags.map(t => <option key={t.id} value={t.id}>{t.tag_name} {t.source_type !== 'opc_ua' ? `[${t.source_type.toUpperCase()}]` : ''}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                    <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-black text-blue-400 outline-none">
                       {['>', '<', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <div className="flex-1 flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'static'})} className={`flex-1 py-2 text-[10px] font-black rounded-xl ${newRule.logic_type === 'static' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>STATIC</button>
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'compare'})} className={`flex-1 py-2 text-[10px] font-black rounded-xl ${newRule.logic_type === 'compare' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}>COMPARE</button>
                    </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 min-h-[120px] flex flex-col justify-center">
                  {newRule.logic_type === 'static' ? (
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black">Threshold Value</label>
                      <input type="number" value={newRule.static_value} onChange={e => setNewRule({...newRule, static_value: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none font-bold" placeholder="e.g. 50.5" />
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-2">
                      <label className="text-[10px] text-orange-500 block mb-2 uppercase font-black text-center italic">Target for Comparison</label>
                      <div className="grid grid-cols-2 gap-3">
                        <select value={targetConnId} onChange={(e) => setTargetConnId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-bold">
                          <option value="">System...</option>
                          <option value="0" className="text-purple-400 font-black">VIRTUAL</option>
                          {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={newRule.target_tag_id} onChange={(e) => setNewRule({...newRule, target_tag_id: e.target.value})} disabled={!targetConnId} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-bold">
                          <option value="">Tag...</option>
                          {targetTags.map(t => <option key={t.id} value={t.id}>{t.tag_name}</option>)}
                        </select>
                      </div>
                      <input type="number" value={newRule.offset_value} onChange={e => setNewRule({...newRule, offset_value: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none font-bold" placeholder="Offset (+/-)" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 p-6 rounded-[2.5rem] border border-purple-500/20 shadow-inner">
                <label className="text-[10px] text-purple-400 block mb-4 uppercase font-black tracking-widest italic text-center">Decision Tree Architecture</label>
                {renderLogicNode(complexLogic)}
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 block mb-2 uppercase font-black tracking-widest">Alert Message</label>
              <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} 
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-slate-300 outline-none h-20 resize-none italic" placeholder="Instructions..." />
            </div>

            <div className="flex gap-4">
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"> Cancel </button>
              )}
              <button type="submit" className={`flex-[2] text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px] ${editingId ? 'bg-amber-600' : isComplex ? 'bg-purple-600' : 'bg-blue-600'}`}>
                <Save size={20} /> {editingId ? 'UPDATE LOGIC' : 'DEPLOY ENGINE'}
              </button>
            </div>
          </form>
        </div>

        {/* KURALLAR LİSTESİ */}
        <div className="xl:col-span-3 space-y-6">
           {rules.map((rule) => {
             const isEnabled = rule.enabled !== false; 
             return (
              <div key={rule.id} className={`p-8 rounded-[3rem] border flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all relative overflow-hidden ${!isEnabled ? 'bg-slate-950/50 border-slate-900 opacity-60' : editingId === rule.id ? 'bg-amber-500/5 border-amber-400' : 'bg-slate-900/60 border-slate-800 shadow-xl'}`}>
                <div className="flex items-center gap-8">
                  <div className={`w-20 h-20 rounded-[1.5rem] border flex items-center justify-center shrink-0 shadow-xl transition-all ${isEnabled ? getSevColor(rule.severity) : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                     {rule.is_complex ? <Layers size={36} /> : <Zap size={36} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`text-xl font-black ${isEnabled ? 'text-slate-100' : 'text-slate-500'}`}>{rule.name}</h4>
                      {rule.is_complex && <span className="text-[9px] px-3 py-1 rounded-lg border font-black tracking-widest uppercase bg-purple-500/20 text-purple-400 border-purple-500/30">COMPLEX</span>}
                      <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase border ${isEnabled ? getSevColor(rule.severity) : 'bg-slate-800 text-slate-600'}`}> {rule.severity} </span>
                    </div>
                    <p className={`text-sm italic font-medium leading-relaxed ${isEnabled ? 'text-slate-400' : 'text-slate-800'}`}>"{rule.message}"</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end lg:self-center z-10">
                  <button onClick={() => handleToggleEnable(rule)} className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border ${isEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}> <Power size={18} /> </button>
                  <button onClick={() => handleEditInit(rule)} className="p-4 bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 rounded-2xl transition-all border border-transparent hover:border-amber-500/30"><Edit3 size={20} /></button>
                  <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-4 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/30"><Trash2 size={20} /></button>
                </div>
              </div>
             );
           })}
        </div>
      </div>
    </div>
  );   
};

export default RuleManagement;