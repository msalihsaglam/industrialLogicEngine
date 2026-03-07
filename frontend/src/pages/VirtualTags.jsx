import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, X, Cpu, Beaker, Hash, 
  Variable, Info, FunctionSquare, Calculator, Search,
  CornerDownRight, MousePointer2, Database, Layers
} from 'lucide-react';
import { api } from '../services/api';

const VirtualTags = ({ connections }) => {
  const [vTags, setVTags] = useState([]);
  const [allSystemTags, setAllSystemTags] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagPickerSearch, setTagPickerSearch] = useState("");
  const [newTag, setNewTag] = useState({
    tag_name: '', unit: '', source_type: 'internal', formula: ''
  });

  // 1. Sanal Etiketleri Getir
  const fetchVirtualTags = async () => {
    try {
      const res = await api.getTags(0); 
      setVTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Virtual tags yüklenemedi:", err); }
  };

  // 2. Picker için Sistemdeki TÜM Etiketleri Havuzda Topla
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
    } catch (err) { console.error("Tag picker listesi oluşturulamadı:", err); }
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
    } catch (err) { alert("Düğüm oluşturulamadı."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bu değişken silinsin mi?")) {
      await api.deleteTag(id);
      fetchVirtualTags();
    }
  };

  // 🎯 Formüle Tag ID'sini Ekle (Örn: T12)
  const appendToFormula = (tagOrOp) => {
    let identifier;
    if (typeof tagOrOp === 'object') {
        identifier = `T${tagOrOp.id}`; // ✅ Tag seçildiğinde ID ekle
    } else {
        identifier = tagOrOp; // ✅ Operatör seçildiğinde (+, -, *, /) karakteri ekle
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
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 px-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Virtual Workspace</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase text-blue-400">System Variables & Calculated Logic</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input type="text" placeholder="Search variables..." className="bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-300 outline-none w-64 focus:border-purple-500 transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-900/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
             <Plus size={20} /> New Virtual Node
           </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTags.map(tag => (
          <div key={tag.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2.5rem] relative group hover:border-purple-500/40 transition-all shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-2xl ${tag.source_type === 'calculated' ? 'bg-purple-600/10 text-purple-400' : 'bg-amber-600/10 text-amber-400'}`}>
                {tag.source_type === 'calculated' ? <Calculator size={24} /> : <Hash size={24} />}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest mb-1 ${tag.source_type === 'calculated' ? 'text-purple-400 border-purple-500/20' : 'text-amber-400 border-amber-500/20'}`}>
                  {tag.source_type}
                </span>
                <span className="text-[8px] font-mono text-slate-600 bg-slate-950 px-1.5 rounded">ID: T{tag.id}</span>
              </div>
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tight">{tag.tag_name}</h3>
            <div className="bg-slate-950/50 rounded-2xl p-4 mb-6 border border-slate-800/50">
               <p className="text-[9px] text-slate-500 uppercase font-black mb-1 tracking-widest italic">Logic Source</p>
               <p className="text-xs font-mono text-slate-300 truncate tracking-tighter text-purple-300/80">
                 {tag.source_type === 'calculated' ? `f(x) = ${tag.formula}` : 'Manual Setpoint Variable'}
               </p>
            </div>
            <div className="flex justify-between items-center">
               <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Unit: {tag.unit || 'VAL'}</div>
               <button onClick={() => handleDelete(tag.id)} className="p-2 text-slate-700 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-lg"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[700] flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] w-full max-w-6xl shadow-2xl relative flex flex-col md:flex-row gap-10 max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
            
            {/* Form Side */}
            <div className="flex-[1.2] space-y-6 overflow-y-auto pr-2 scrollbar-hide">
                <h2 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">Deploy Node</h2>
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'internal'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${newTag.source_type === 'internal' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-slate-600 hover:text-slate-400'}`}> <Hash size={14} /> Internal </button>
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'calculated'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${newTag.source_type === 'calculated' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-600 hover:text-slate-400'}`}> <Calculator size={14} /> Calculated </button>
                </div>

                <form onSubmit={handleAddTag} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Variable Name</label>
                        <input type="text" placeholder="e.g. TOTAL_POWER" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 uppercase transition-all" value={newTag.tag_name} onChange={e => setNewTag({...newTag, tag_name: e.target.value})} />
                    </div>

                    {newTag.source_type === 'calculated' ? (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest ml-1 block italic">
                                Formula (Use Picker -&gt;)
                            </label>
                            <textarea 
                                placeholder="Select tags to build formula..." required rows="3"
                                className="w-full bg-slate-950 border border-purple-900/30 rounded-2xl p-4 text-purple-400 font-mono text-sm outline-none focus:border-purple-500 transition-all resize-none shadow-inner" 
                                value={newTag.formula} 
                                onChange={e => setNewTag({...newTag, formula: e.target.value})} 
                            />
                            <div className="flex flex-wrap gap-2">
                                {['+', '-', '*', '/', '(', ')', '^'].map(op => (
                                    <button key={op} type="button" onClick={() => appendToFormula(op)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-10 h-10 rounded-lg font-bold transition-all active:scale-90">{op}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Initial Unit</label>
                            <input type="text" placeholder="e.g. kW" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all" value={newTag.unit} onChange={e => setNewTag({...newTag, unit: e.target.value})} />
                        </div>
                    )}

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase text-[10px] transition-all">Cancel</button>
                        <button type="submit" className={`flex-[2] py-5 rounded-2xl text-white font-black uppercase text-[10px] shadow-xl transition-all active:scale-[0.98] ${newTag.source_type === 'calculated' ? 'bg-purple-600 shadow-purple-900/40 hover:bg-purple-500' : 'bg-amber-600 shadow-amber-900/40 hover:bg-amber-500'}`}>Initialize Node</button>
                    </div>
                </form>
            </div>

            {/* Picker Side */}
            {newTag.source_type === 'calculated' && (
                <div className="flex-1 border-l border-slate-800 pl-10 flex flex-col overflow-hidden animate-in slide-in-from-right-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                        <MousePointer2 size={14} className="text-purple-500" /> Data Pool (Click to add)
                    </h3>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
                        <input type="text" placeholder="Filter by name or system..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-slate-400 outline-none focus:border-purple-500 transition-all" value={tagPickerSearch} onChange={(e) => setTagPickerSearch(e.target.value)} />
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                        {pickerFilteredTags.map(t => (
                            <button 
                                key={t.id} type="button" onClick={() => appendToFormula(t)}
                                className="w-full flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl hover:bg-purple-600/10 hover:border-purple-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-md ${t.type === 'physical' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {t.type === 'physical' ? <Database size={12}/> : <Layers size={12}/>}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[11px] font-bold text-slate-300 group-hover:text-purple-400 transition-colors">{t.tag_name}</div>
                                        <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest">{t.connName} • {t.displayId}</div>
                                    </div>
                                </div>
                                <CornerDownRight size={14} className="text-slate-800 group-hover:text-purple-500 transition-colors" />
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