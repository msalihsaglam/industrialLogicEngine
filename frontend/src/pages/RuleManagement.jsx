import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Save, Trash2, Zap, ArrowRightLeft, Edit3, XCircle, 
  Layers, Target, Power, Database, Cpu, Info, Terminal, 
  Settings2, ShieldAlert, Activity, X, ChevronDown
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

  const renderLogicNode = (node, path = []) => {
    if (node.type === 'group') {
      return (
        <div key={path.join('-')} className="ml-2 pl-4 border-l border-[#23333A] space-y-3 my-3 relative">
          <div className="absolute left-0 top-0 w-2 h-[1px] bg-[#23333A]"></div>
          <div className="flex items-center gap-2 bg-[#1C262B] p-1.5 rounded border border-[#23333A] w-fit">
            <select value={node.operator} onChange={(e) => updateComplexNode(path, { ...node, operator: e.target.value })} className="bg-[#0B1215] text-[#00FFCC] text-[9px] font-bold p-1 rounded border border-[#23333A] outline-none">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
            <button type="button" onClick={() => addComplexChild(path, 'condition')} className="p-1 text-[#10B981] hover:bg-[#10B981]/10 rounded transition-all"><PlusCircle size={14}/></button>
            <button type="button" onClick={() => addComplexChild(path, 'group')} className="p-1 text-purple-400 hover:bg-purple-500/10 rounded transition-all"><Layers size={14}/></button>
            {path.length > 0 && (
              <button type="button" onClick={() => removeComplexChild(path)} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"><X size={14}/></button>
            )}
          </div>
          <div className="space-y-3">
            {node.children.map((child, idx) => renderLogicNode(child, [...path, idx]))}
          </div>
        </div>
      );
    }
    return (
      <div key={path.join('-')} className="flex items-center gap-2 bg-[#0B1215] p-2 rounded border border-[#23333A] shadow-inner group">
        <select value={node.tag_id} onChange={(e) => updateComplexNode(path, { ...node, tag_id: e.target.value })} className="bg-transparent text-white text-[10px] font-bold outline-none flex-1 p-1 rounded border border-transparent focus:border-[#006470]">
          <option value="">Select Node...</option>
          {allTags.map(t => (
            <option key={t.id} value={t.id} className="bg-[#141F24]">{t.tag_name.toUpperCase()} ({t.connName})</option>
          ))}
        </select>
        <select value={node.op} onChange={(e) => updateComplexNode(path, { ...node, op: e.target.value })} className="bg-transparent text-[#00FFCC] font-bold text-[11px] outline-none">
          {['>', '<', '==', '!=', '>=', '<='].map(o => <option key={o} value={o} className="bg-[#141F24]">{o}</option>)}
        </select>
        <input type="number" value={node.val} onChange={(e) => updateComplexNode(path, { ...node, val: e.target.value })} className="bg-[#141F24] border border-[#23333A] rounded p-1 text-[10px] font-bold w-12 outline-none text-white text-center focus:border-[#006470]" />
        <button type="button" onClick={() => removeComplexChild(path)} className="text-slate-700 hover:text-red-500 p-1 transition-all"><X size={14}/></button>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL CORE STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 12px 16px; border-radius: 4px; font-weight: 600; outline: none; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* 🏛️ HEADER & GUIDE SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#00FFCC]"></div>
            <span className="label-caps">Heuristic Logic Engine</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white leading-none">Logic Builder</h1>
          <div className="mt-6 inline-flex items-center gap-2 bg-[#141F24] px-4 py-2 border border-[#23333A] rounded text-[10px] font-bold text-[#00FFCC] uppercase tracking-widest">
            <Activity size={14} /> {rules.length} Active Heuristics Deployed
          </div>
        </div>

        {/* 🎯 RIGHT: HEURISTIC GUIDE */}
        <div className="flex-1 industrial-panel p-6 rounded-md relative overflow-hidden flex flex-col md:flex-row gap-6 border-l-4 border-l-[#006470] shadow-sm">
            <div className="p-3 bg-[#006470]/10 text-[#00FFCC] rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="label-caps border-b border-[#23333A] pb-2 inline-block">Rule Definition Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[#00FFCC] text-[10px] font-bold uppercase">Static Mode</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Compares field node against a fixed threshold constant.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-amber-500 text-[10px] font-bold uppercase">Dynamic Compare</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Triggers logic by comparing two independent system nodes.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-purple-400 text-[10px] font-bold uppercase">Complex Stack</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Boolean tree (AND/OR) for multi-level event dependencies.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        {/* 🛠️ FORM SIDE (Mühendislik Konsolu) */}
        <div className={`xl:col-span-2 industrial-panel rounded-md p-8 shadow-sm h-fit sticky top-10 transition-all duration-300 ${editingId ? 'border-amber-600/50' : ''}`}>
          
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-bold uppercase tracking-tight flex items-center gap-3 ${editingId ? 'text-amber-500' : 'text-[#006470]'}`}>
              {editingId ? <Edit3 size={20} /> : <Zap size={20} />}
              {editingId ? 'Modify Logic' : 'Establish Logic'}
            </h3>
            <div className="flex bg-[#0B1215] p-1 rounded border border-[#23333A]">
               <button type="button" onClick={() => setIsComplex(false)} className={`px-4 py-1.5 text-[9px] font-bold rounded transition-all uppercase tracking-widest ${!isComplex ? 'bg-[#006470] text-white' : 'text-slate-600'}`}>Simple</button>
               <button type="button" onClick={() => setIsComplex(true)} className={`px-4 py-1.5 text-[9px] font-bold rounded transition-all uppercase tracking-widest ${isComplex ? 'bg-purple-600 text-white' : 'text-slate-600'}`}>Complex</button>
            </div>
          </div>
          
          <form onSubmit={handleSaveRule} className="space-y-6">
             <div className="space-y-2">
                <label className="label-caps">Identification Label</label>
                <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full input-field text-xs text-white font-bold uppercase tracking-widest" placeholder="E.G. COMPRESSOR_ANOMALY" />
             </div>

             <div className="space-y-2">
                <label className="label-caps">Severity Tier</label>
                <div className="flex gap-2">
                    {['info', 'warning', 'critical'].map((s) => (
                    <button key={s} type="button" onClick={() => setNewRule({ ...newRule, severity: s })} className={`flex-1 py-2.5 rounded border font-bold text-[9px] uppercase tracking-widest transition-all ${newRule.severity === s ? (s === 'critical' ? 'bg-red-600 border-red-500 text-white' : s === 'warning' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#006470] border-[#00FFCC] text-white') : 'bg-[#0B1215] border-[#23333A] text-slate-700 hover:border-slate-500'}`}> {s} </button>
                    ))}
                </div>
             </div>

            {!isComplex ? (
              <div className="space-y-6">
                <div className="bg-[#0B1215] p-6 rounded border border-[#23333A] space-y-4 shadow-inner">
                  <div className="space-y-2">
                    <p className="label-caps !text-[8px] opacity-50">Primary Node Selector</p>
                    <select value={sourceConnId} onChange={(e) => setSourceConnId(e.target.value)} className="w-full bg-[#141F24] border border-[#23333A] rounded p-3 text-[10px] font-bold text-[#00FFCC] outline-none appearance-none cursor-pointer focus:border-[#006470]">
                        <option value="">SELECT SOURCE SYSTEM...</option>
                        {allSystemList.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name.toUpperCase()}</option>)}
                    </select>
                    <select value={newRule.tag_id} onChange={(e) => setNewRule({...newRule, tag_id: e.target.value})} disabled={!sourceConnId} className="w-full bg-[#141F24] border border-[#23333A] rounded p-3 text-[10px] font-bold text-white outline-none disabled:opacity-20">
                        <option value="">SELECT FIELD NODE...</option>
                        {currentSourceTags.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.tag_name.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="bg-[#0B1215] border border-[#23333A] rounded p-4 text-lg font-bold text-[#00FFCC] outline-none focus:border-[#006470]">
                       {['>', '<', '==', '!=', '>=', '<='].map(op => <option key={op} value={op} className="bg-slate-900">{op}</option>)}
                    </select>
                    <div className="flex-1 flex bg-[#0B1215] p-1 rounded border border-[#23333A]">
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'static'})} className={`flex-1 py-2 text-[9px] font-bold rounded transition-all uppercase tracking-widest ${newRule.logic_type === 'static' ? 'bg-[#1C262B] text-white' : 'text-slate-700'}`}>Static</button>
                        <button type="button" onClick={() => setNewRule({...newRule, logic_type: 'compare'})} className={`flex-1 py-2 text-[9px] font-bold rounded transition-all uppercase tracking-widest ${newRule.logic_type === 'compare' ? 'bg-orange-600 text-white' : 'text-slate-700'}`}>Compare</button>
                    </div>
                </div>

                <div className="bg-[#0B1215] p-6 rounded border border-[#23333A] shadow-inner">
                  {newRule.logic_type === 'static' ? (
                    <input type="number" value={newRule.static_value} onChange={e => setNewRule({...newRule, static_value: e.target.value})} className="w-full bg-[#141F24] border border-[#23333A] rounded p-4 text-2xl font-bold font-data text-white outline-none focus:border-[#006470] text-center tracking-tighter" placeholder="0.00" />
                  ) : (
                    <div className="space-y-3">
                      <p className="label-caps !text-[8px] opacity-50">Reference Node Selector</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={targetConnId} onChange={(e) => setTargetConnId(e.target.value)} className="bg-[#141F24] border border-[#23333A] rounded p-3 text-[9px] font-bold text-[#00FFCC] outline-none">
                            <option value="">SYSTEM...</option>
                            {allSystemList.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                        <select value={newRule.target_tag_id} onChange={(e) => setNewRule({...newRule, target_tag_id: e.target.value})} disabled={!targetConnId} className="bg-[#141F24] border border-[#23333A] rounded p-3 text-[9px] font-bold text-white outline-none">
                            <option value="">NODE...</option>
                            {currentTargetTags.map(t => <option key={t.id} value={t.id}>{t.tag_name.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#0B1215] p-4 rounded border border-purple-500/20 shadow-inner max-h-[400px] overflow-y-auto scrollbar-hide">
                {renderLogicNode(complexLogic)}
              </div>
            )}

            <div className="space-y-2">
                <label className="label-caps">Output Protocol Message</label>
                <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} className="w-full bg-[#0B1215] border border-[#23333A] rounded p-4 text-[10px] text-slate-300 font-bold outline-none h-20 focus:border-[#006470] shadow-inner uppercase tracking-wider" placeholder="E.G. CRITICAL_TEMP_BREACH" />
            </div>

            <div className="flex gap-3 pt-4">
              {editingId && <button type="button" onClick={handleCancelEdit} className="flex-1 py-3 text-slate-500 font-bold uppercase text-[9px] tracking-widest border border-transparent hover:text-white transition-all"> Dismiss </button>}
              <button type="submit" className={`flex-[2] text-white font-bold py-3 rounded shadow-lg transition-all active:scale-95 text-[10px] uppercase tracking-widest ${editingId ? 'bg-amber-600' : isComplex ? 'bg-purple-600' : 'bg-[#006470]'}`}>
                {editingId ? 'Commit Logic' : 'Deploy Logic'}
              </button>
            </div>
          </form>
        </div>

        {/* 📋 RULE LIST SIDE (Mühendislik Çizelgesi) */}
        <div className="xl:col-span-3 space-y-6 pt-4">
            <h4 className="label-caps mb-8 flex items-center gap-3 opacity-50">
               <Settings2 size={14} /> Active Engine Configuration
            </h4>
            
            {rules.length === 0 ? (
              <div className="py-32 text-center industrial-panel border-dashed rounded-md opacity-20">
                <Activity size={48} className="mx-auto mb-6 text-[#006470]" />
                <p className="label-caps">Logic Engine Idle // No Rules Active</p>
              </div>
            ) : (
              rules.map((rule) => {
                const isEnabled = rule.enabled !== false; 
                const triggerTag = allTags.find(t => Number(t.id) === Number(rule.tag_id));
                const targetTag = allTags.find(t => Number(t.id) === Number(rule.target_tag_id));

                return (
                 <div key={rule.id} className={`industrial-panel rounded-md flex flex-col xl:flex-row transition-all relative overflow-hidden ${!isEnabled ? 'opacity-30' : editingId === rule.id ? 'border-amber-500 bg-[#1C262B]' : 'hover:border-slate-500'}`}>
                   
                   {/* Status Indicator (Vertical) */}
                   <div className={`w-full xl:w-1.5 h-1.5 xl:h-auto ${!isEnabled ? 'bg-slate-700' : (rule.severity === 'critical' ? 'bg-red-600' : rule.severity === 'warning' ? 'bg-amber-600' : 'bg-[#006470]')}`} />

                   <div className="flex-1 p-6 space-y-6">
                     <div className="flex items-start justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded bg-[#0B1215] border border-[#23333A] ${isEnabled ? (rule.severity === 'critical' ? 'text-red-500' : rule.severity === 'warning' ? 'text-amber-500' : 'text-[#00FFCC]') : 'text-slate-700'}`}>
                             {rule.is_complex ? <Layers size={24} /> : <Zap size={24} />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-xl font-bold uppercase tracking-tight text-white">{rule.name}</h4>
                              <span className={`text-[8px] px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${isEnabled ? (rule.severity === 'critical' ? 'text-red-500 border-red-900/30' : rule.severity === 'warning' ? 'text-amber-500 border-amber-900/30' : 'text-[#00FFCC] border-[#006470]/30') : 'text-slate-600 border-slate-800'}`}> {rule.severity} </span>
                            </div>
                            <p className="text-[10px] font-bold uppercase text-[#64748B] tracking-widest">{rule.message}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => handleToggleEnable(rule)} className={`p-2 rounded border transition-all ${isEnabled ? 'bg-[#006470]/10 text-[#00FFCC] border-[#006470]/30' : 'bg-slate-800 text-slate-600'}`}> <Power size={16} /> </button>
                          <button onClick={() => handleEditInit(rule)} className="p-2 text-slate-600 hover:text-white transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => api.deleteRule(rule.id).then(onRefresh)} className="p-2 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                        </div>
                     </div>

                     {/* 📊 LOGIC DISPLAY */}
                     <div className="bg-[#0B1215] rounded p-4 border border-[#23333A] flex flex-wrap items-center gap-8 shadow-inner">
                       {!rule.is_complex ? (
                         <>
                           <div className="flex flex-col">
                             <span className="label-caps !text-[7px] mb-1 opacity-40">Input Source</span>
                             <div className="flex items-center gap-2 text-[#00FFCC] font-bold text-[11px]">
                               <Target size={12} className="opacity-30" /> {triggerTag?.tag_name.toUpperCase() || `NODE_${rule.tag_id}`}
                             </div>
                           </div>

                           <div className="text-xl font-bold font-data text-white opacity-20">{rule.operator}</div>

                           <div className="flex flex-col">
                             <span className="label-caps !text-[7px] mb-1 opacity-40">Decision Threshold</span>
                             {rule.logic_type === 'compare' ? (
                               <div className="flex items-center gap-2 text-orange-400 font-bold text-[11px]">
                                 <ArrowRightLeft size={12} className="opacity-30" /> {targetTag?.tag_name.toUpperCase() || `NODE_${rule.target_tag_id}`}
                                 {rule.offset_value !== 0 && <span className="text-[#64748B] text-[9px] bg-[#141F24] px-1.5 py-0.5 rounded ml-1">({rule.offset_value > 0 ? '+' : ''}{rule.offset_value})</span>}
                               </div>
                             ) : (
                               <div className="flex items-center gap-2 text-emerald-500 font-data text-lg font-bold tracking-tighter">
                                 <Database size={14} className="opacity-30" /> {rule.static_value}
                               </div>
                             )}
                           </div>
                         </>
                       ) : (
                         <div className="flex items-center gap-3 text-purple-400 font-bold text-[9px] uppercase tracking-widest">
                           <Layers size={14} className="opacity-50" /> Multi-Layer Heuristic Logic Stack Active
                         </div>
                       )}
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