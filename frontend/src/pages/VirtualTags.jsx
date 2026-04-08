import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Cpu, Hash, Calculator, Search,
  CornerDownRight, MousePointer2, Database, Terminal, Settings2,
  Edit3, X, Info 
} from 'lucide-react';
import { api } from '../services/api';

const VirtualTags = ({ connections }) => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
  const [vTags, setVTags] = useState([]);
  const [allSystemTags, setAllSystemTags] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTagId, setCurrentTagId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagPickerSearch, setTagPickerSearch] = useState("");
  
  const [newTag, setNewTag] = useState({
    tag_name: '', unit: '', source_type: 'internal', formula: '', value: 0 
  });

  // --- ⚙️ API HANDLERS (PRESERVED) ---
  const fetchVirtualTags = async () => {
    try {
      const res = await api.getTags(0); 
      setVTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Fetch error:", err); }
  };

  const fetchAllSystemTags = async () => {
    try {
      const tagPromises = connections.map(c => api.getTags(c.id));
      const results = await Promise.all(tagPromises);
      const physicalTags = results.flatMap((res, idx) => 
        res.data.map(t => ({ 
          ...t, connName: connections[idx].name, type: 'physical', displayId: `T${t.id}` 
        }))
      );
      const virtualList = vTags.map(t => ({ 
        ...t, connName: 'VIRTUAL', type: 'virtual', displayId: `T${t.id}`
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

  const handleEditClick = (tag) => {
    setIsEditing(true);
    setCurrentTagId(tag.id);
    setNewTag({
      tag_name: tag.tag_name,
      unit: tag.unit || '',
      source_type: tag.source_type,
      formula: tag.formula || '',
      value: tag.initial_value || 0
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentTagId(null);
    setNewTag({ tag_name: '', unit: '', source_type: 'internal', formula: '', value: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateTag(currentTagId, { ...newTag, connection_id: null });
      } else {
        await api.addTag({ ...newTag, connection_id: null });
      }
      handleModalClose();
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
    let identifier = typeof tagOrOp === 'object' ? `T${tagOrOp.id}` : tagOrOp;
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

      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-purple-500"></div>
            <span className="label-caps">Logic Layer Engine</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white leading-none">Virtual Workspace</h1>
          
          <div className="flex gap-3 mt-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH VARIABLES..." 
                className="bg-[#141F24] border border-[#23333A] rounded-md py-2.5 pl-10 pr-4 text-[10px] font-bold text-white outline-none focus:border-purple-500 w-64 transition-all uppercase tracking-widest" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <Plus size={18} /> New Node
            </button>
          </div>
        </div>

        {/* 🎯 GUIDE BOX (Sert & Net) */}
        <div className="flex-1 industrial-panel p-6 rounded-md relative overflow-hidden flex flex-col md:flex-row gap-6 border-l-4 border-l-purple-600 shadow-sm">
            <div className="p-3 bg-purple-600/10 text-purple-400 rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="label-caps border-b border-[#23333A] pb-2 inline-block">Operational Logic Deployment</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1"><p className="text-amber-500 text-[10px] font-bold uppercase">Constants</p><p className="text-[9px] text-slate-500 leading-relaxed font-medium">Manual operational setpoints used as fixed values.</p></div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4"><p className="text-purple-400 text-[10px] font-bold uppercase">Calculated</p><p className="text-[9px] text-slate-500 leading-relaxed font-medium">Dynamic variables derived via T(id) syntax.</p></div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4"><p className="text-[#00FFCC] text-[10px] font-bold uppercase">Sandbox</p><p className="text-[9px] text-slate-500 leading-relaxed font-medium">Test complex math without affecting field PLC tags.</p></div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ VIRTUAL NODE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        {filteredTags.map(tag => (
          <div key={tag.id} className="industrial-panel rounded-md transition-all overflow-hidden hover:border-purple-500/50 group">
            {/* Type Indicator Top Bar */}
            <div className={`h-1 w-full ${tag.source_type === 'calculated' ? 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-amber-600'}`} />
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded border ${tag.source_type === 'calculated' ? 'bg-purple-600/5 text-purple-400 border-purple-500/20' : 'bg-amber-600/5 text-amber-400 border-amber-500/20'}`}>
                  {tag.source_type === 'calculated' ? <Calculator size={20} /> : <Hash size={20} />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${tag.source_type === 'calculated' ? 'text-purple-400 border-purple-500/20' : 'text-amber-400 border-amber-500/20'}`}>
                    {tag.source_type}
                  </span>
                  <span className="text-[9px] font-data text-[#00FFCC] bg-[#0B1215] px-2 py-0.5 rounded border border-[#23333A]">ID: T{tag.id}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight group-hover:text-purple-400 transition-colors">{tag.tag_name}</h3>
              
              <div className="bg-[#0B1215] rounded p-4 mb-6 border border-[#23333A] shadow-inner">
                  <p className="label-caps !text-[8px] mb-2 flex items-center gap-2 opacity-50"><Terminal size={10}/> Logic String</p>
                  <p className="text-[12px] font-data text-slate-300 truncate tracking-tight text-purple-300 font-bold">
                    {tag.source_type === 'calculated' ? `f(x) = ${tag.formula}` : 'Manual Process Constant'}
                  </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#23333A]">
                  <div className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest">Unit: <span className="text-white ml-1">{tag.unit || 'RAW'}</span></div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditClick(tag)} className="p-2 text-slate-600 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(tag.id)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"><Trash2 size={18} /></button>
                  </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📂 DEPLOY / EDIT MODAL (Industrial IDE Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B1215]/98 backdrop-blur-md z-[700] flex items-center justify-center p-8 animate-in zoom-in duration-200">
          <div className="industrial-panel w-full max-w-7xl h-[85vh] rounded-md shadow-2xl relative flex flex-col md:flex-row overflow-hidden border-[#23333A]">
            
            {/* Form Side */}
            <div className="flex-[1.2] flex flex-col h-full">
              <div className="p-6 border-b border-[#23333A] bg-[#1C262B] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-purple-500"></div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                    {isEditing ? 'Modify Logic Node' : 'Initialize Logic Node'}
                  </h2>
                </div>
                <button onClick={handleModalClose} className="p-2 text-slate-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                <div className="grid grid-cols-2 gap-2 bg-[#0B1215] p-1.5 rounded border border-[#23333A]">
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'internal'})} className={`flex items-center justify-center gap-2 py-3 rounded font-bold text-[10px] uppercase tracking-widest transition-all ${newTag.source_type === 'internal' ? 'bg-[#FFB900] text-black shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}> <Hash size={16} /> Static Setpoint </button>
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'calculated'})} className={`flex items-center justify-center gap-2 py-3 rounded font-bold text-[10px] uppercase tracking-widest transition-all ${newTag.source_type === 'calculated' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}> <Calculator size={16} /> Dynamic Calc </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="label-caps">Node Symbolic Name</label>
                          <input type="text" placeholder="e.g. HEAT_COEFFICIENT_K" required className="w-full input-field text-sm uppercase tracking-wider" value={newTag.tag_name} onChange={e => setNewTag({...newTag, tag_name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="label-caps">Unit</label>
                          <input type="text" placeholder="e.g. °C / BAR" className="w-full input-field text-sm uppercase" value={newTag.unit} onChange={e => setNewTag({...newTag, unit: e.target.value})} />
                      </div>
                    </div>

                    {newTag.source_type === 'calculated' ? (
                        <div className="space-y-4">
                            <label className="label-caps !text-purple-400 flex items-center gap-2"><Terminal size={14}/> Logic Formula String</label>
                            <textarea 
                              placeholder="Build architecture using identifiers (e.g. T101 * 0.5)..." required rows="5"
                              className="w-full bg-[#0B1215] border border-purple-900/30 rounded p-6 text-purple-400 font-data text-lg outline-none focus:border-purple-500 transition-all resize-none shadow-inner font-bold" 
                              value={newTag.formula} 
                              onChange={e => setNewTag({...newTag, formula: e.target.value})} 
                            />
                            <div className="flex flex-wrap gap-2">
                                {['+', '-', '*', '/', '(', ')', '^'].map(op => (
                                    <button key={op} type="button" onClick={() => appendToFormula(op)} className="bg-[#1C262B] border border-[#23333A] hover:border-purple-500 text-white w-12 h-12 rounded font-bold text-lg transition-all active:scale-95">{op}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="label-caps !text-amber-500">Preset Constant Value</label>
                            <input type="number" placeholder="0.00" className="w-full input-field text-2xl font-data text-amber-500" value={newTag.value} onChange={e => setNewTag({...newTag, value: e.target.value})} />
                        </div>
                    )}

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={handleModalClose} className="flex-1 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
                        <button type="submit" className={`flex-[2] py-4 rounded font-bold text-white uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${newTag.source_type === 'calculated' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#006470] hover:bg-[#007a8a]'}`}>
                          {isEditing ? 'COMMIT UPDATES' : 'DEPLOY VIRTUAL NODE'}
                        </button>
                    </div>
                </form>
              </div>
            </div>

            {/* Picker Side (Sadece Calculated taglerde) */}
            {newTag.source_type === 'calculated' && (
                <div className="hidden md:flex flex-1 flex-col bg-[#0B1215] border-l border-[#23333A]">
                    <div className="p-6 border-b border-[#23333A] bg-[#1C262B]">
                      <h3 className="label-caps flex items-center gap-2">
                        <MousePointer2 size={14} className="text-purple-500" /> Infrastructure Map
                      </h3>
                    </div>
                    <div className="p-4 bg-[#0B1215]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006470]" size={16} />
                            <input type="text" placeholder="FILTER NODES..." className="w-full bg-[#141F24] border border-[#23333A] rounded py-3 pl-10 pr-4 text-[10px] font-bold text-white outline-none focus:border-purple-500 transition-all uppercase tracking-widest" value={tagPickerSearch} onChange={(e) => setTagPickerSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-10 scrollbar-hide">
                        {pickerFilteredTags.map(t => (
                            <button key={t.id} type="button" onClick={() => appendToFormula(t)} className="w-full flex items-center justify-between p-4 bg-[#141F24] border border-[#23333A] rounded hover:border-purple-500/50 transition-all group">
                                <div className="flex items-center gap-4 text-left">
                                    <Database size={14} className={t.type === 'physical' ? 'text-[#00FFCC] opacity-30' : 'text-purple-400 opacity-30'}/>
                                    <div>
                                        <div className="text-[11px] font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{t.tag_name}</div>
                                        <div className="text-[8px] text-slate-600 uppercase font-bold tracking-widest mt-0.5">{t.connName} // ID: {t.displayId}</div>
                                    </div>
                                </div>
                                <CornerDownRight size={14} className="text-slate-800 group-hover:text-purple-400" />
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