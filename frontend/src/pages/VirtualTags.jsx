import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, X, Cpu, Beaker, Hash, 
  Variable, Info, FunctionSquare, Calculator, Search,
  CornerDownRight, MousePointer2, Database, Layers, Terminal, Clock, Settings2
} from 'lucide-react';
import { api } from '../services/api';

const VirtualTags = ({ connections }) => {
  // --- 🔒 CORE STATE (DO NOT REMOVE) ---
  const [vTags, setVTags] = useState([]);
  const [allSystemTags, setAllSystemTags] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagPickerSearch, setTagPickerSearch] = useState("");
  const [newTag, setNewTag] = useState({
    tag_name: '', unit: '', source_type: 'internal', formula: ''
  });

  // --- ⚙️ API & LOGIC HANDLERS (FULLY PRESERVED) ---
  const fetchVirtualTags = async () => {
    try {
      const res = await api.getTags(0); 
      setVTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Virtual tags fetch error:", err); }
  };

  const fetchAllSystemTags = async () => {
    try {
      const tagPromises = connections.map(c => api.getTags(c.id));
      const results = await Promise.all(tagPromises);
      const physicalTags = results.flatMap((res, idx) => 
        res.data.map(t => ({ 
          ...t, 
          connName: connections[idx].name, 
          type: 'physical',
          displayId: `T${t.id}` 
        }))
      );
      const virtualList = vTags.map(t => ({ 
        ...t, 
        connName: 'VIRTUAL', 
        type: 'virtual',
        displayId: `T${t.id}`
      }));
      setAllSystemTags([...physicalTags, ...virtualList]);
    } catch (err) { console.error("Picker list error:", err); }
  };

  useEffect(() => { fetchVirtualTags(); }, []);
  
  useEffect(() => {
    if (isModalOpen && newTag.source_type === 'calculated') {
      fetchAllSystemTags();
    }
  }, [isModalOpen, newTag.source_type, vTags]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    try {
      await api.addTag({ ...newTag, connection_id: null });
      setIsModalOpen(false);
      setNewTag({ tag_name: '', unit: '', source_type: 'internal', formula: '' });
      fetchVirtualTags();
    } catch (err) { alert("Deployment failed."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this virtual variable?")) {
      await api.deleteTag(id);
      fetchVirtualTags();
    }
  };

  const appendToFormula = (tagOrOp) => {
    let identifier;
    if (typeof tagOrOp === 'object') {
        identifier = `T${tagOrOp.id}`;
    } else {
        identifier = tagOrOp;
    }
    setNewTag(prev => ({
      ...prev,
      formula: prev.formula ? `${prev.formula} ${identifier}` : identifier
    }));
  };

  const filteredTags = vTags.filter(t => 
    t.tag_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pickerFilteredTags = allSystemTags.filter(t =>
    t.tag_name.toLowerCase().includes(tagPickerSearch.toLowerCase()) ||
    t.connName.toLowerCase().includes(tagPickerSearch.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Actions */}
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-purple-500"></div>
            <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.5em]">Logic Layer Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Virtual Workspace</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Terminal size={14} className="text-[#009999]" /> System Variables & Calculated Analytics
          </p>

          <div className="flex gap-4 mt-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="SEARCH VARIABLES..." 
                className="bg-slate-900 border-2 border-slate-800 rounded-xl py-4 pl-12 pr-6 text-[11px] font-black text-white outline-none focus:border-purple-500 w-72 transition-all uppercase tracking-widest shadow-2xl" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl flex items-center gap-3 shadow-2xl shadow-purple-900/20 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Plus size={20} /> New Virtual Node
            </button>
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED OPERATIONAL CALCULATION GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Calculator size={80}/></div>
            
            <div className="p-4 bg-purple-600/10 text-purple-400 rounded-2xl h-fit shadow-inner">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Operational Calculation Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Internal Variables</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Manual setpoints or constants used as reference values in calculations.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-tighter italic">Calculated Logic</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Dynamic nodes derived from physical sensor data using $T(id)$ syntax.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Logic Sandbox</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Create complex formulas ($T1 + T2 / 100$) without affecting raw field data.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ VIRTUAL NODE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
        {filteredTags.map(tag => (
          <div key={tag.id} className="group bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[3rem] relative transition-all duration-500 overflow-hidden hover:border-purple-500/40 hover:bg-slate-900 shadow-2xl">
            
            {/* Status Accent Bar */}
            <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${tag.source_type === 'calculated' ? 'bg-purple-600' : 'bg-amber-600'}`} />
            
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-2xl border-2 transition-all ${tag.source_type === 'calculated' ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' : 'bg-amber-600/10 text-amber-400 border-amber-500/20'}`}>
                {tag.source_type === 'calculated' ? <Calculator size={28} /> : <Hash size={28} />}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 uppercase tracking-widest mb-2 italic ${tag.source_type === 'calculated' ? 'text-purple-400 border-purple-500/20 bg-purple-900/10' : 'text-amber-400 border-amber-500/20 bg-amber-900/10'}`}>
                  {tag.source_type}
                </span>
                <span className="text-[9px] font-mono text-[#00ffcc] bg-slate-950 px-2 py-0.5 rounded border border-[#009999]/20 tracking-widest uppercase">ID: T{tag.id}</span>
              </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter group-hover:text-purple-400 transition-colors">{tag.tag_name}</h3>
            
            <div className="bg-slate-950/80 rounded-2xl p-5 mb-8 border-2 border-slate-800 shadow-inner group-hover:border-slate-700 transition-all">
                <p className="text-[9px] text-slate-600 uppercase font-black mb-2 tracking-[0.2em] italic flex items-center gap-2">
                    <Terminal size={12}/> Logic Source Definition
                </p>
                <p className="text-[13px] font-mono text-slate-300 truncate tracking-tight text-purple-300 font-bold italic">
                  {tag.source_type === 'calculated' ? `f(x) = ${tag.formula}` : 'Manual Setpoint Variable'}
                </p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
               <div className="text-slate-500 text-[11px] font-black uppercase tracking-widest italic">Unit Protocol: <span className="text-white">{tag.unit || 'RAW'}</span></div>
               <button onClick={() => handleDelete(tag.id)} className="p-3 text-slate-700 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* 📂 DEPLOY MODAL (Siemens Style with Formula Builder) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[700] flex items-center justify-center p-8 animate-in zoom-in duration-300">
          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[4rem] w-full max-w-7xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col md:flex-row gap-12 max-h-[90vh] overflow-hidden">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all bg-slate-900 p-2 rounded-xl border border-slate-800"><X size={28}/></button>
            
            {/* Form Side */}
            <div className="flex-[1.2] space-y-10 overflow-y-auto pr-6 scrollbar-hide">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Deploy Logic Node</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic mt-1">Virtual Control Variable Definition</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-2 rounded-2xl border-2 border-slate-800">
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'internal'})} className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${newTag.source_type === 'internal' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}> <Hash size={18} /> Internal Setpoint </button>
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'calculated'})} className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${newTag.source_type === 'calculated' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}> <Calculator size={18} /> Calculated Node </button>
                </div>

                <form onSubmit={handleAddTag} className="space-y-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Node Label</label>
                        <input type="text" placeholder="e.g. TOTAL_SITE_CONSUMPTION" required className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 text-white font-black outline-none focus:border-purple-500 uppercase transition-all shadow-inner" value={newTag.tag_name} onChange={e => setNewTag({...newTag, tag_name: e.target.value})} />
                    </div>

                    {newTag.source_type === 'calculated' ? (
                        <div className="space-y-6 animate-in slide-in-from-top-4">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2 block italic">
                                Logic Formula Editor (Use Sandbox Selector)
                            </label>
                            <div className="relative group">
                                <textarea 
                                    placeholder="SELECT TAGS TO BUILD ARCHITECTURE..." required rows="4"
                                    className="w-full bg-slate-950 border-2 border-purple-900/30 rounded-3xl p-6 text-purple-400 font-mono text-lg outline-none focus:border-purple-500 transition-all resize-none shadow-2xl italic font-bold" 
                                    value={newTag.formula} 
                                    onChange={e => setNewTag({...newTag, formula: e.target.value})} 
                                />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {['+', '-', '*', '/', '(', ')', '^'].map(op => (
                                    <button key={op} type="button" onClick={() => appendToFormula(op)} className="bg-slate-900 border-2 border-slate-800 hover:border-purple-500 text-white w-14 h-14 rounded-2xl font-black text-xl transition-all active:scale-90 shadow-lg">{op}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-top-4 space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Engineering Unit</label>
                            <input type="text" placeholder="e.g. kWh / °C" className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 text-white font-black outline-none focus:border-[#009999] transition-all uppercase italic" value={newTag.unit} onChange={e => setNewTag({...newTag, unit: e.target.value})} />
                        </div>
                    )}

                    <div className="flex gap-6 pt-10 border-t border-slate-800">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all">Dismiss</button>
                        <button type="submit" className={`flex-[2.5] py-6 rounded-2xl text-white font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 ${newTag.source_type === 'calculated' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-amber-600 hover:bg-amber-500'}`}>Establish Virtual Node</button>
                    </div>
                </form>
            </div>

            {/* Picker Side */}
            {newTag.source_type === 'calculated' && (
                <div className="flex-1 border-l-2 border-slate-800 pl-12 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500 bg-slate-950/30 rounded-r-[3rem]">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 italic mt-4">
                        <MousePointer2 size={16} className="text-purple-500" /> Interface Node Discovery
                    </h3>
                    <div className="relative mb-6">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#009999]" size={20} />
                        <input type="text" placeholder="FILTER BY MAPPED SYSTEM..." className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black text-white outline-none focus:border-purple-500 transition-all uppercase tracking-widest" value={tagPickerSearch} onChange={(e) => setTagPickerSearch(e.target.value)} />
                    </div>
                    <div className="flex-1 overflow-y-auto pr-4 space-y-3 scrollbar-hide pb-10">
                        {pickerFilteredTags.map(t => (
                            <button 
                                key={t.id} type="button" onClick={() => appendToFormula(t)}
                                className="w-full flex items-center justify-between p-5 bg-slate-900/60 border-2 border-slate-800 rounded-3xl hover:bg-purple-600/10 hover:border-purple-500 transition-all group shadow-xl"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`p-3 rounded-xl transition-all ${t.type === 'physical' ? 'bg-[#009999]/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,153,153,0.1)]' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {t.type === 'physical' ? <Database size={18}/> : <Layers size={18}/>}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-black text-white group-hover:text-purple-400 transition-colors uppercase italic tracking-tight">{t.tag_name}</div>
                                        <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1 italic">{t.connName} <span className="mx-2 opacity-30">//</span> {t.displayId}</div>
                                    </div>
                                </div>
                                <CornerDownRight size={18} className="text-slate-800 group-hover:text-purple-500 transition-all transform group-hover:translate-x-1" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualTags;