import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Save, Trash2, Zap, ArrowRightLeft, Edit3, 
  Layers, Target, Power, Database, Cpu, Info, Terminal, 
  Settings2, ShieldAlert, Activity, X, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const RuleManagement = ({ rules, connections, onRefresh, userId }) => {
  const { t } = useTranslation();

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

  const renderLogicNode = (node, path = []) => {
    if (node.type === 'group') {
      return (
        <div key={path.join('-')} className="ml-2 pl-4 border-l border-[var(--ind-border)] space-y-4 my-4 relative">
          <div className="absolute left-0 top-0 w-2 h-[1px] bg-[var(--ind-border)]"></div>
          <div className="flex items-center gap-2 bg-[var(--ind-header)] p-1.5 rounded border border-[var(--ind-border)] w-fit">
            <select value={node.operator} onChange={(e) => updateComplexNode(path, { ...node, operator: e.target.value })} className="bg-[var(--ind-bg)] text-[var(--ind-cyan)] text-[9px] font-black p-1 rounded border border-[var(--ind-border)] outline-none uppercase">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
            <button type="button" onClick={() => addComplexChild(path, 'condition')} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition-all"><PlusCircle size={14}/></button>
            <button type="button" onClick={() => addComplexChild(path, 'group')} className="p-1 text-purple-400 hover:bg-purple-500/10 rounded transition-all"><Layers size={14}/></button>
            {path.length > 0 && (
              <button type="button" onClick={() => removeComplexChild(path)} className="p-1 text-[var(--ind-red)] hover:bg-red-500/10 rounded transition-all"><X size={14}/></button>
            )}
          </div>
          <div className="space-y-4">
            {node.children.map((child, idx) => renderLogicNode(child, [...path, idx]))}
          </div>
        </div>
      );
    }
    return (
      <div key={path.join('-')} className="flex items-center gap-3 bg-[var(--ind-bg)] p-3 rounded border border-[var(--ind-border)] shadow-inner group">
        <select value={node.tag_id} onChange={(e) => updateComplexNode(path, { ...node, tag_id: e.target.value })} className="bg-transparent text-white text-[10px] font-bold outline-none flex-1 p-1 rounded border border-transparent focus:border-[var(--ind-petroleum)]">
          <option value="">Select Node...</option>
          {allTags.map(t => (
            <option key={t.id} value={t.id} className="bg-slate-900">{t.tag_name.toUpperCase()} ({t.connName})</option>
          ))}
        </select>
        <select value={node.op} onChange={(e) => updateComplexNode(path, { ...node, op: e.target.value })} className="bg-transparent text-[var(--ind-cyan)] ind-data text-[12px] outline-none">
          {['>', '<', '==', '!=', '>=', '<='].map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
        </select>
        <input type="number" value={node.val} onChange={(e) => updateComplexNode(path, { ...node, val: e.target.value })} className="bg-[var(--ind-panel)] border border-[var(--ind-border)] rounded p-1 ind-data text-[11px] w-14 outline-none text-white text-center focus:border-[var(--ind-petroleum)]" />
        <button type="button" onClick={() => removeComplexChild(path)} className="text-slate-700 hover:text-[var(--ind-red)] p-1 transition-all"><X size={14}/></button>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER & GUIDE SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-cyan)]"></div>
            <span className="ind-label">Heuristic Logic Engine</span>
          </div>
          <h1 className="ind-title">Logic Builder</h1>
          <div className="mt-6 inline-flex items-center gap-3 bg-[var(--ind-panel)] px-4 py-2 border border-[var(--ind-border)] rounded-[var(--ind-radius)] ind-label !text-[var(--ind-cyan)]">
            <Activity size={14} /> {rules.length} Active Heuristics Deployed
          </div>
        </div>

        {/* 🎯 RIGHT: HEURISTIC GUIDE */}
        <div className="flex-1 ind-panel p-6 border-l-4 border-l-[var(--ind-petroleum)] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="p-3 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="ind-label border-b border-[var(--ind-border)] pb-2 inline-block">Rule Definition Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                        <p className="ind-label !text-[var(--ind-cyan)]">Static Mode</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Field node vs fixed threshold constant.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-[var(--ind-amber)]">Dynamic Compare</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Comparison between two system nodes.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-purple-400">Complex Stack</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Boolean tree for multi-level events.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        {/* 🛠️ FORM SIDE (Engineering Console) */}
        <div className={`xl:col-span-2 ind-panel p-8 h-fit sticky top-10 transition-all duration-300 ${editingId ? 'border-[var(--ind-amber)]/50' : ''}`}>
          
          <div className="flex justify-between items-center mb-10">
            <h3 className={`ind-subtitle !text-lg flex items-center gap-3 ${editingId ? 'text-[var(--ind-amber)]' : 'text-[var(--ind-petroleum)]'}`}>
              {editingId ? <Edit3 size={20} /> : <Zap size={20} />}
              {editingId ? 'Modify Logic' : 'Establish Logic'}
            </h3>
            <div className="flex bg-[var(--ind-bg)] p-1 rounded border border-[var(--ind-border)]">
               <button type="button" onClick={() => setIsComplex(false)} className={`px-4 py-1.5 ind-label !text-[9px] rounded transition-all ${!isComplex ? 'bg-[var(--ind-petroleum)] text-white shadow-lg' : 'text-slate-600'}`}>Simple</button>
               <button type="button" onClick={() => setIsComplex(true)} className={`px-4 py-1.5 ind-label !text-[9px] rounded transition-all ${isComplex ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600'}`}>Complex</button>
            </div>
          </div>
          
          <form onSubmit={handleSaveRule} className="space-y-8">
             <div className="space-y-3">
                <label className="ind-label">Identification Label</label>
                <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full ind-input" placeholder="E.G. COMPRESSOR_ANOMALY" />
             </div>

             <div className="space-y-3">
                <label className="ind-label">Severity Tier</label>
                <div className="flex gap-2">
                    {['info', 'warning', 'critical'].map((s) => (
                    <button key={s} type="button" onClick={() => setNewRule({ ...newRule, severity: s })} className={`flex-1 py-3 rounded-[var(--ind-radius)] border ind-label !text-[9px] transition-all ${newRule.severity === s ? (s === 'critical' ? 'bg-[var(--ind-red)] border-[var(--ind-red)] text-white shadow-lg' : s === 'warning' ? 'bg-[var(--ind-amber)] border-[var(--ind-amber)] text-white shadow-lg' : 'bg-[var(--ind-petroleum)] border-[var(--ind-petroleum)] text-white shadow-lg') : 'bg-[var(--ind-bg)] border-[var(--ind-border)] text-slate-700 hover:border-slate-500'}`}> {s} </button>
                    ))}
                </div>
             </div>

            {!isComplex ? (
              <div className="space-y-8">
                <div className="bg-[var(--ind-bg)] p-8 rounded border border-[var(--ind-border)] space-y-6 shadow-inner relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1 bg-[var(--ind-petroleum)]"></div>
                  <div className="space-y-4">
                    <p className="ind-label opacity-40">Primary Node Selector</p>
                    <select value={sourceConnId} onChange={(e) => setSourceConnId(e.target.value)} className="w-full ind-input !bg-[var(--ind-panel)]">
                        <option value="">SELECT SOURCE SYSTEM...</option>
                        {allSystemList.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                    <select value={newRule.tag_id} onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})} disabled={!sourceConnId} className="w-full ind-input !bg-[var(--ind-panel)] disabled:opacity-20">
                        <option value="">SELECT FIELD NODE...</option>
                        {currentSourceTags.map(t => <option key={t.id} value={t.id}>{t.tag_name.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="bg-[var(--ind-bg)] border border-[var(--ind-border)] rounded p-4 ind-data text-2xl text-[var(--ind-cyan)] outline-none focus:border-[var(--ind-petroleum)]">
                       {['>', '<', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <div className="flex-1 flex bg-[var(--ind-bg)] p-1 rounded border border-[var(--ind-border)] shadow-inner">
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'static'})} className={`flex-1 py-3 ind-label !text-[9px] rounded transition-all ${newRule.logic_type === 'static' ? 'bg-[var(--ind-header)] text-white shadow-md' : 'text-slate-700'}`}>Static</button>
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'compare'})} className={`flex-1 py-3 ind-label !text-[9px] rounded transition-all ${newRule.logic_type === 'compare' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-700'}`}>Compare</button>
                    </div>
                </div>

                <div className="bg-[var(--ind-bg)] p-8 rounded border border-[var(--ind-border)] shadow-inner relative overflow-hidden">
                  <div className={`absolute left-0 top-0 h-full w-1 ${newRule.logic_type === 'compare' ? 'bg-orange-600' : 'bg-emerald-600'}`}></div>
                  {newRule.logic_type === 'static' ? (
                    <input type="number" value={newRule.static_value} onChange={e => setNewRule({...newRule, static_value: e.target.value})} className="w-full bg-transparent border-none ind-value-lg text-white text-center outline-none" placeholder="0.00" />
                  ) : (
                    <div className="space-y-4">
                      <p className="ind-label opacity-40">Reference Node Selector</p>
                      <div className="grid grid-cols-2 gap-3">
                        <select value={targetConnId} onChange={(e) => setTargetConnId(e.target.value)} className="ind-input !bg-[var(--ind-panel)] !text-[9px]">
                            <option value="">SYSTEM...</option>
                            {allSystemList.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                        <select value={newRule.target_tag_id} onChange={(e) => setNewRule({...newRule, target_tag_id: e.target.value})} disabled={!targetConnId} className="ind-input !bg-[var(--ind-panel)] !text-[9px]">
                            <option value="">NODE...</option>
                            {currentTargetTags.map(t => <option key={t.id} value={t.id}>{t.tag_name.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--ind-bg)] p-6 rounded border border-purple-500/10 shadow-inner max-h-[500px] overflow-y-auto scrollbar-hide">
                {renderLogicNode(complexLogic)}
              </div>
            )}

            <div className="space-y-3">
                <label className="ind-label">Output Protocol Message</label>
                <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} className="w-full ind-input !h-24 !normal-case !text-slate-300" placeholder="E.G. CRITICAL_TEMP_BREACH" />
            </div>

            <div className="flex gap-4 pt-6">
              {editingId && <button type="button" onClick={handleCancelEdit} className="flex-1 ind-label !text-slate-600 hover:text-white transition-all uppercase"> Abort </button>}
              <button type="submit" className={`flex-[2] ind-btn-primary !py-5 ${editingId ? '!bg-[var(--ind-amber)]' : isComplex ? '!bg-purple-600 hover:!bg-purple-700' : ''}`}>
                {editingId ? 'Commit Logic' : 'Deploy Logic Engine'}
              </button>
            </div>
          </form>
        </div>

        {/* 📋 RULE LIST SIDE (Engineering Manifest) */}
        <div className="xl:col-span-3 space-y-6">
            <h4 className="ind-label mb-10 flex items-center gap-3 opacity-40">
               <Settings2 size={14} /> Active Engine Configuration
            </h4>
            
            {rules.length === 0 ? (
              <div className="py-32 text-center ind-panel border-dashed opacity-20">
                <Activity size={48} className="mx-auto mb-6 text-[var(--ind-petroleum)]" />
                <p className="ind-label tracking-[0.3em]">Logic Engine Idle // No Rules Active</p>
              </div>
            ) : (
              rules.map((rule) => {
                const isEnabled = rule.enabled !== false; 
                const triggerTag = allTags.find(t => Number(t.id) === Number(rule.tag_id));
                const targetTag = allTags.find(t => Number(t.id) === Number(rule.target_tag_id));

                return (
                 <div key={rule.id} className={`ind-panel flex flex-col xl:flex-row transition-all duration-300 relative overflow-hidden group ${!isEnabled ? 'opacity-30 grayscale' : editingId === rule.id ? 'border-[var(--ind-amber)] bg-[var(--ind-header)]' : 'hover:border-slate-600'}`}>
                   
                   {/* Severity Indicator Bar */}
                   <div className={`w-full xl:w-1.5 h-1.5 xl:h-auto ${!isEnabled ? 'bg-slate-700' : (rule.severity === 'critical' ? 'bg-[var(--ind-red)] shadow-[0_0_10px_rgba(220,38,38,0.4)]' : rule.severity === 'warning' ? 'bg-[var(--ind-amber)]' : 'bg-[var(--ind-petroleum)]')}`} />

                   <div className="flex-1 p-8 space-y-8">
                     <div className="flex items-start justify-between gap-8">
                        <div className="flex items-center gap-8">
                          <div className={`p-4 rounded-[var(--ind-radius)] bg-[var(--ind-bg)] border border-[var(--ind-border)] shadow-inner transition-colors ${isEnabled ? (rule.severity === 'critical' ? 'text-[var(--ind-red)]' : rule.severity === 'warning' ? 'text-[var(--ind-amber)]' : 'text-[var(--ind-cyan)]') : 'text-slate-800'}`}>
                             {rule.is_complex ? <Layers size={24} /> : <Zap size={24} />}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <h4 className="ind-subtitle !text-xl !text-white">{rule.name}</h4>
                              <span className={`ind-status-badge ${isEnabled ? (rule.severity === 'critical' ? 'text-[var(--ind-red)] border-[var(--ind-red)]/20 bg-red-500/5' : rule.severity === 'warning' ? 'text-[var(--ind-amber)] border-[var(--ind-amber)]/20 bg-amber-500/5' : 'text-[var(--ind-cyan)] border-[var(--ind-cyan)]/20 bg-cyan-500/5') : 'text-slate-800 border-slate-900 bg-transparent'}`}> {rule.severity} </span>
                            </div>
                            <p className="ind-label !text-[11px] !text-[var(--ind-slate)] normal-case tracking-tight opacity-80">{rule.message}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => handleToggleEnable(rule)} className={`p-2.5 rounded-[var(--ind-radius)] border transition-all ${isEnabled ? 'bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] border-[var(--ind-petroleum)]/30 shadow-lg' : 'bg-slate-900 text-slate-700 border-transparent'}`}> <Power size={18} /> </button>
                          <button onClick={() => handleEditInit(rule)} className="p-2.5 ind-panel hover:text-white transition-all"><Edit3 size={18} /></button>
                          <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-2.5 text-slate-700 hover:text-[var(--ind-red)] transition-all hover:bg-red-500/5"><Trash2 size={18} /></button>
                        </div>
                     </div>

                     {/* 📊 LOGIC DISPLAY (IDS Data Mode) */}
                     <div className="bg-[var(--ind-bg)] rounded-md p-6 border border-[var(--ind-border)] flex flex-wrap items-center gap-12 shadow-inner relative overflow-hidden">
                       {!rule.is_complex ? (
                         <>
                           <div className="flex flex-col">
                             <span className="ind-label !text-[7px] mb-2 opacity-40">Input Source Node</span>
                             <div className="flex items-center gap-3 text-[var(--ind-cyan)] font-extrabold text-[12px] uppercase">
                               <Target size={14} className="opacity-30" /> {triggerTag?.tag_name || `NODE_${rule.tag_id}`}
                             </div>
                           </div>

                           <div className="ind-data text-2xl text-white opacity-20">{rule.operator}</div>

                           <div className="flex flex-col">
                             <span className="ind-label !text-[7px] mb-2 opacity-40">Logic Threshold</span>
                             {rule.logic_type === 'compare' ? (
                               <div className="flex items-center gap-3 text-orange-400 font-extrabold text-[12px] uppercase">
                                 <ArrowRightLeft size={14} className="opacity-30" /> {targetTag?.tag_name || `NODE_${rule.target_tag_id}`}
                                 {rule.offset_value !== 0 && <span className="ind-data text-[10px] text-slate-600 bg-[var(--ind-panel)] px-2 py-0.5 rounded ml-2">({rule.offset_value > 0 ? '+' : ''}{rule.offset_value})</span>}
                               </div>
                             ) : (
                               <div className="flex items-center gap-3 text-emerald-500 ind-value-md tracking-tighter">
                                 <Database size={16} className="opacity-30" /> {rule.static_value}
                               </div>
                             )}
                           </div>
                         </>
                       ) : (
                         <div className="flex items-center gap-4 text-purple-400 font-black text-[10px] uppercase tracking-[0.2em]">
                           <Layers size={18} className="opacity-50" /> Multi-Layer Heuristic Logic Stack Active
                         </div>
                       )}
                       {/* Rule Type Label in Background */}
                       <div className="absolute -right-4 -bottom-2 opacity-[0.03] ind-title !text-6xl pointer-events-none">
                         {rule.is_complex ? 'STACK' : 'SIMPLE'}
                       </div>
                     </div>
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