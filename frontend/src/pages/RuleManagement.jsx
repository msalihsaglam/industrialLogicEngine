import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Save, Trash2, AlertTriangle, Zap, 
  ArrowRightLeft, Edit3, XCircle, Layers, Plus, Target, Power, Database, Cpu, Info, Terminal, Settings2, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh, userId }) => {
  // --- 🔒 CORE STATE (PRESERVED) ---
  const [editingId, setEditingId] = useState(null);
  const [isComplex, setIsComplex] = useState(false);
  const [allTags, setAllTags] = useState([]); 
  const [allSystemList, setAllSystemList] = useState([]);
  const [newRule, setNewRule] = useState({
    name: '', tag_id: '', logic_type: 'static', operator: '>',
    static_value: '', target_tag_id: '', offset_value: 0,
    severity: 'warning', message: '', is_complex: false, enabled: true 
  });
  const [complexLogic, setComplexLogic] = useState({ type: 'group', operator: 'AND', children: [] });
  const [sourceConnId, setSourceConnId] = useState('');
  const [targetConnId, setTargetConnId] = useState('');

  // --- ⚙️ API & LOGIC HANDLERS (PRESERVED) ---
  const fetchAllTags = async () => {
    try {
      const tagPromises = connections.map(conn => api.getTags(conn.id));
      const physicalResults = await Promise.all(tagPromises);
      const physicalTags = physicalResults.flatMap((res, index) => 
        res.data.map(t => ({ ...t, connName: connections[index].name, type: 'physical' }))
      );
      const virtualRes = await api.getTags(0);
      const virtualTags = virtualRes.data.map(t => ({ 
        ...t, connName: 'VIRTUAL WORKSPACE', type: t.source_type 
      }));
      setAllSystemList([...connections, { id: '0', name: '🧠 VIRTUAL WORKSPACE' }]);
      setAllTags([...physicalTags, ...virtualTags]);
    } catch (err) { console.error("Tag sync error:", err); }
  };

  useEffect(() => { fetchAllTags(); }, [connections]);

  const currentSourceTags = useMemo(() => {
    return allTags.filter(t => (t.connection_id?.toString() || "0") === sourceConnId);
  }, [allTags, sourceConnId]);

  const currentTargetTags = useMemo(() => {
    return allTags.filter(t => (t.connection_id?.toString() || "0") === targetConnId);
  }, [allTags, targetConnId]);

  const handleToggleEnable = async (rule) => {
    try {
      await api.updateRule(rule.id, { ...rule, enabled: !rule.enabled, user_id: userId });
      onRefresh(); 
    } catch (err) { alert("Status update failed."); }
  };

  const handleEditInit = (rule) => {
    setEditingId(rule.id);
    const complexStatus = rule.is_complex === true || rule.is_complex === 't';
    setIsComplex(complexStatus);
    if (complexStatus && rule.logic_json) setComplexLogic(rule.logic_json);
    const sourceTagObj = allTags.find(t => Number(t.id) === Number(rule.tag_id));
    if (sourceTagObj) setSourceConnId(sourceTagObj.connection_id === null ? "0" : sourceTagObj.connection_id.toString());
    if (rule.logic_type === 'compare') {
        const targetTagObj = allTags.find(t => Number(t.id) === Number(rule.target_tag_id));
        if (targetTagObj) setTargetConnId(targetTagObj.connection_id === null ? "0" : targetTagObj.connection_id.toString());
    }
    setNewRule({ ...rule, is_complex: complexStatus, tag_id: rule.tag_id || '', target_tag_id: rule.target_tag_id || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null); setIsComplex(false); setSourceConnId(''); setTargetConnId('');
    setNewRule({ name: '', tag_id: '', logic_type: 'static', operator: '>', static_value: '', target_tag_id: '', offset_value: 0, severity: 'warning', message: '', is_complex: false, enabled: true });
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const payload = { ...newRule, user_id: userId, is_complex: isComplex, logic_json: isComplex ? complexLogic : null, tag_id: isComplex ? null : (newRule.tag_id || null), static_value: !isComplex && newRule.logic_type === 'static' ? newRule.static_value : null, target_tag_id: !isComplex && newRule.logic_type === 'compare' ? newRule.target_tag_id : null, offset_value: !isComplex && newRule.logic_type === 'compare' ? newRule.offset_value : 0 };
    try {
      if (editingId) await api.updateRule(editingId, payload);
      else await api.addRule(payload);
      handleCancelEdit(); onRefresh();
    } catch (err) { alert("Save Error"); }
  };

  // --- 🌳 COMPLEX LOGIC TREE HELPERS ---
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
        const newItem = type === 'condition' ? { type: 'condition', tag_id: '', op: '>', val_type: 'static', val: '' } : { type: 'group', operator: 'AND', children: [] };
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

  const getSevColor = (sev) => {
    if (sev === 'critical') return 'text-red-500 bg-red-950/20 border-red-500/30';
    if (sev === 'warning') return 'text-amber-500 bg-amber-950/20 border-amber-500/30';
    return 'text-[#00ffcc] bg-[#009999]/10 border-[#009999]/30';
  };

  const renderLogicNode = (node, path = []) => {
    if (node.type === 'group') {
      return (
        <div key={path.join('-')} className="ml-2 pl-6 border-l-2 border-slate-700 space-y-4 my-4 relative">
          <div className="absolute left-0 top-0 w-3 h-[2px] bg-slate-700"></div>
          <div className="flex items-center gap-3 bg-slate-800/60 p-2 rounded-xl border border-slate-700 w-fit">
            <select value={node.operator} onChange={(e) => updateComplexNode(path, { ...node, operator: e.target.value })} className="bg-slate-950 text-[#00ffcc] text-[10px] font-black p-1.5 rounded-lg border border-slate-700 outline-none">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
            <button type="button" onClick={() => addComplexChild(path, 'condition')} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg border border-transparent hover:border-emerald-500/30 transition-all"><PlusCircle size={16}/></button>
            <button type="button" onClick={() => addComplexChild(path, 'group')} className="p-1.5 text-purple-500 hover:bg-purple-500/10 rounded-lg border border-transparent hover:border-purple-500/30 transition-all"><Layers size={16}/></button>
            {path.length > 0 && (
              <button type="button" onClick={() => removeComplexChild(path)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16}/></button>
            )}
          </div>
          <div className="space-y-4">
            {node.children.map((child, idx) => renderLogicNode(child, [...path, idx]))}
          </div>
        </div>
      );
    }
    return (
      <div key={path.join('-')} className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner group">
        <select value={node.tag_id} onChange={(e) => updateComplexNode(path, { ...node, tag_id: e.target.value })} className="bg-slate-900 text-white text-[10px] font-bold outline-none flex-1 p-2 rounded-xl border border-slate-800 focus:border-[#009999]">
          <option value="">Select Node...</option>
          {allTags.map(t => (
            <option key={t.id} value={t.id}>{t.tag_name.toUpperCase()} ({t.connName})</option>
          ))}
        </select>
        <select value={node.op} onChange={(e) => updateComplexNode(path, { ...node, op: e.target.value })} className="bg-transparent text-[#00ffcc] font-black text-xs outline-none px-2">
          {['>', '<', '==', '!=', '>=', '<='].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <input type="number" value={node.val} onChange={(e) => updateComplexNode(path, { ...node, val: e.target.value })} className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-[11px] font-black w-16 outline-none text-white text-center focus:border-[#009999]" />
        <button type="button" onClick={() => removeComplexChild(path)} className="text-slate-600 hover:text-red-500 p-2 transition-all"><XCircle size={18}/></button>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED LOGIC GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Metadata */}
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Heuristic Logic Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Logic Builder</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Terminal size={14} className="text-[#009999]" /> Decision Mapping & Anomaly Orchestration
          </p>
          <div className="mt-8 bg-slate-900 px-6 py-3 rounded-xl border-2 border-slate-800 text-[11px] font-black text-[#00ffcc] shadow-2xl inline-block italic tracking-widest">
            {rules.length} ACTIVE HEURISTICS DEPLOYED
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED HEURISTIC LOGIC GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldAlert size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Heuristic Engine Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Static Mode</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Compares a field node against a fixed threshold constant.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Dynamic Compare</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Triggers logic by comparing two independent physical/virtual nodes.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-tighter italic">Complex Stack</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Boolean tree (AND/OR) for multi-level event dependencies.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
        {/* 🛠️ FORM SIDE (SIEMENS CONSOLE STYLE) */}
        <div className={`xl:col-span-2 border-2 rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] h-fit sticky top-10 transition-all duration-500 overflow-hidden ${editingId ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#0b1117] border-slate-800'}`}>
          
          <div className="flex justify-between items-center mb-12">
            <h3 className={`text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 ${editingId ? 'text-amber-400' : 'text-[#00ffcc]'}`}>
              {editingId ? <Edit3 size={28} /> : <Zap size={28} />}
              {editingId ? 'Modify Logic' : 'Establish Logic'}
            </h3>
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800">
               <button type="button" onClick={() => setIsComplex(false)} className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${!isComplex ? 'bg-[#009999] text-white shadow-xl' : 'text-slate-600'}`}>Simple</button>
               <button type="button" onClick={() => setIsComplex(true)} className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${isComplex ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-600'}`}>Complex</button>
            </div>
          </div>
          
          <form onSubmit={handleSaveRule} className="space-y-8">
             <div className="space-y-3">
                <label className="text-[10px] text-slate-600 block ml-2 uppercase font-black italic tracking-widest">Identification Label</label>
                <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-sm text-white font-black uppercase outline-none focus:border-[#009999] shadow-inner" placeholder="E.G. COMPRESSOR_TEMP_ANOMALY" />
             </div>

             <div className="space-y-3">
                <label className="text-[10px] text-slate-600 block ml-2 uppercase font-black italic tracking-widest">Severity Tier</label>
                <div className="flex gap-3">
                    {['info', 'warning', 'critical'].map((s) => (
                    <button key={s} type="button" onClick={() => setNewRule({ ...newRule, severity: s })} className={`flex-1 py-4 rounded-xl border-2 font-black text-[11px] uppercase tracking-widest transition-all ${newRule.severity === s ? (s === 'critical' ? 'bg-red-600 border-red-400 text-white shadow-lg' : s === 'warning' ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-[#009999] border-[#00ffcc] text-white shadow-lg') : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-700'}`}> {s} </button>
                    ))}
                </div>
             </div>

            <div className="h-[1px] bg-slate-800/50 w-full" />

            {!isComplex ? (
              <div className="space-y-6">
                <div className="bg-slate-950 p-8 rounded-[2.5rem] border-2 border-slate-800 space-y-5 shadow-inner">
                  <div className="space-y-2">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic ml-1">Primary Node Selector</p>
                    <select value={sourceConnId} onChange={(e) => setSourceConnId(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-[11px] font-black text-[#00ffcc] outline-none appearance-none cursor-pointer focus:border-[#009999]">
                        <option value="">SELECT SOURCE SYSTEM...</option>
                        {allSystemList.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name.toUpperCase()}</option>)}
                    </select>
                    <select value={newRule.tag_id} onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})} disabled={!sourceConnId} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-[11px] font-black text-white outline-none disabled:opacity-30">
                        <option value="">SELECT FIELD NODE...</option>
                        {currentSourceTags.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.tag_name.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-xl font-black text-[#00ffcc] outline-none focus:border-[#009999] shadow-2xl">
                       {['>', '<', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <div className="flex-1 flex bg-slate-950 p-2 rounded-[1.5rem] border-2 border-slate-800">
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'static'})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${newRule.logic_type === 'static' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-700'}`}>Static</button>
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'compare'})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${newRule.logic_type === 'compare' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-700'}`}>Compare</button>
                    </div>
                </div>

                <div className="bg-slate-950 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-inner">
                  {newRule.logic_type === 'static' ? (
                    <input type="number" value={newRule.static_value} onChange={e => setNewRule({...newRule, static_value: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-2xl font-black text-white outline-none focus:border-[#009999] text-center italic tracking-tighter" placeholder="VALUE_0.00" />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic ml-1">Reference Node Selector</p>
                      <div className="grid grid-cols-2 gap-4">
                        <select value={targetConnId} onChange={(e) => setTargetConnId(e.target.value)} className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 text-[10px] font-black text-[#00ffcc] outline-none">
                            <option value="">SYSTEM...</option>
                            {allSystemList.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                        <select value={newRule.target_tag_id} onChange={(e) => setNewRule({...newRule, target_tag_id: e.target.value})} disabled={!targetConnId} className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 text-[10px] font-black text-white outline-none">
                            <option value="">NODE...</option>
                            {currentTargetTags.map(t => <option key={t.id} value={t.id}>{t.tag_name.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-[3rem] border-2 border-purple-500/20 shadow-inner max-h-[400px] overflow-y-auto scrollbar-hide">
                {renderLogicNode(complexLogic)}
              </div>
            )}

            <div className="space-y-3">
                <label className="text-[10px] text-slate-600 block ml-2 uppercase font-black italic tracking-widest">Event Message Output</label>
                <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-xs text-slate-300 font-bold outline-none h-24 focus:border-[#009999] shadow-inner" placeholder="E.G. CRITICAL_TEMP_BREACH_DETECTION" />
            </div>

            <div className="flex gap-4">
              {editingId && <button type="button" onClick={handleCancelEdit} className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest border-2 border-slate-700 hover:bg-slate-700 transition-all"> Dismiss </button>}
              <button type="submit" className={`flex-[2] text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] shadow-2xl ${editingId ? 'bg-amber-600' : isComplex ? 'bg-purple-600 shadow-purple-900/20' : 'bg-[#009999] shadow-[#009999]/20'}`}>
                <Save size={20} /> {editingId ? 'Update Engine' : 'Deploy Engine'}
              </button>
            </div>
          </form>
        </div>

        {/* 📋 RULE LIST SIDE (TIMELINE STYLE) */}
        <div className="xl:col-span-3 space-y-8 pt-4">
           <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4 italic ml-4">
              <Settings2 size={18} className="text-[#009999]" /> Active Engine Configuration
           </h4>
           
           {rules.length === 0 ? (
             <div className="py-40 text-center bg-[#0b1117] border-2 border-dashed border-slate-800 rounded-[4rem] opacity-30">
               <Activity size={80} className="mx-auto text-[#009999] mb-8" />
               <p className="text-white font-black uppercase tracking-[0.5em] text-xs italic">Logic Engine Idle // No Rules Active</p>
             </div>
           ) : (
             rules.map((rule) => {
               const isEnabled = rule.enabled !== false; 
               const triggerTag = allTags.find(t => Number(t.id) === Number(rule.tag_id));
               const targetTag = allTags.find(t => Number(t.id) === Number(rule.target_tag_id));

               return (
                <div key={rule.id} className={`group p-8 rounded-[3.5rem] border-2 flex flex-col gap-8 transition-all relative overflow-hidden ${!isEnabled ? 'bg-slate-950/50 border-slate-900 opacity-40 grayscale' : editingId === rule.id ? 'bg-amber-500/5 border-amber-400 shadow-2xl' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow-xl'}`}>
                  
                  {/* Status Side Accent */}
                  <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${!isEnabled ? 'bg-slate-800' : (rule.severity === 'critical' ? 'bg-red-600' : rule.severity === 'warning' ? 'bg-amber-600' : 'bg-[#009999]')}`} />

                  <div className="flex items-start justify-between gap-6">
                     <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center shrink-0 shadow-2xl transition-all ${isEnabled ? getSevColor(rule.severity) : 'bg-slate-800 text-slate-700 border-slate-700'}`}>
                           {rule.is_complex ? <Layers size={36} /> : <Zap size={36} />}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <h4 className={`text-2xl font-black uppercase italic tracking-tighter ${isEnabled ? 'text-white group-hover:text-[#00ffcc]' : 'text-slate-600'}`}>{rule.name}</h4>
                            <span className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase border-2 italic tracking-widest ${isEnabled ? getSevColor(rule.severity) : 'bg-slate-800 text-slate-700 border-slate-700'}`}> {rule.severity} </span>
                          </div>
                          <p className={`text-sm italic font-bold uppercase tracking-widest ${isEnabled ? 'text-slate-400' : 'text-slate-800'}`}>"{rule.message}"</p>
                        </div>
                     </div>

                     <div className="flex gap-3">
                       <button onClick={() => handleToggleEnable(rule)} className={`p-4 rounded-2xl transition-all border-2 shadow-xl ${isEnabled ? 'bg-[#009999]/10 text-[#00ffcc] border-[#009999]/30 hover:bg-[#009999] hover:text-white' : 'bg-slate-800 text-slate-600 border-slate-700 hover:border-slate-600'}`}> <Power size={20} /> </button>
                       <button onClick={() => handleEditInit(rule)} className="p-4 bg-slate-800 text-slate-500 hover:text-white rounded-2xl transition-all border-2 border-slate-700 hover:border-white shadow-xl"><Edit3 size={20} /></button>
                       <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-4 bg-slate-800 text-slate-500 hover:text-red-500 rounded-2xl transition-all border-2 border-slate-800 hover:border-red-500/30 shadow-xl"><Trash2 size={20} /></button>
                     </div>
                  </div>

                  {/* 📊 LOGIC DISPLAY (THE DECISION BLUEPRINT) */}
                  <div className="bg-slate-950 rounded-3xl p-6 border-2 border-slate-800/50 flex flex-wrap items-center gap-10 shadow-inner group-hover:border-[#009999]/20 transition-all">
                    {!rule.is_complex ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 italic">Logic Input</span>
                          <div className="flex items-center gap-3 text-[#00ffcc] font-black text-sm italic tracking-tight">
                            <Target size={16} className="opacity-50" /> {triggerTag?.tag_name.toUpperCase() || `NODE_${rule.tag_id}`}
                          </div>
                        </div>

                        <div className="text-3xl font-black text-white italic opacity-30 tracking-widest">{rule.operator}</div>

                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 italic">Decision Threshold</span>
                          {rule.logic_type === 'compare' ? (
                            <div className="flex items-center gap-3 text-orange-400 font-black text-sm italic tracking-tight">
                              <ArrowRightLeft size={16} className="opacity-50" /> {targetTag?.tag_name.toUpperCase() || `NODE_${rule.target_tag_id}`}
                              {rule.offset_value !== 0 && <span className="text-slate-600 text-[11px] bg-slate-900 px-2 py-0.5 rounded ml-2">({rule.offset_value > 0 ? '+' : ''}{rule.offset_value})</span>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-emerald-400 font-mono text-xl font-black tracking-tighter">
                              <Database size={18} className="opacity-50" /> {rule.static_value}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-4 text-purple-400 font-black text-[11px] uppercase italic tracking-[0.4em]">
                        <Layers size={18} className="animate-pulse" /> Multi-Layer Heuristic Logic Stack Enabled
                      </div>
                    )}
                  </div>
                </div>
               );
             })
           )}
        </div>
      </div>
    </div>
  );   
};

export default RuleManagement;