import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Cpu, Hash, Calculator, Search,
  CornerDownRight, MousePointer2, Database, Terminal, 
  Edit3, X, Info 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const VirtualTags = ({ connections }) => {
  const { t } = useTranslation();

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
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-purple-500"></div>
            <span className="ind-label">Logic Layer Engine</span>
          </div>
          <h1 className="ind-title">Virtual Workspace</h1>
          
          <div className="flex gap-4 mt-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)]" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH VARIABLES..." 
                className="ind-input !pl-10 !w-64" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-[var(--ind-radius)] flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
            >
              <Plus size={18} /> New Node
            </button>
          </div>
        </div>

        {/* 🎯 GUIDE BOX (Sert & Net) */}
        <div className="flex-1 ind-panel p-6 border-l-4 border-l-purple-600 relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="p-3 bg-purple-600/10 text-purple-400 rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="ind-label border-b border-[var(--ind-border)] pb-2 inline-block">Operational Logic Deployment</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <p className="ind-label !text-[var(--ind-amber)]">Constants</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Fixed operational setpoints.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                      <p className="ind-label !text-purple-400">Calculated</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Dynamic variables via T(id) syntax.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                      <p className="ind-label !text-[var(--ind-cyan)]">Sandbox</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Test math without affecting field PLC.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ VIRTUAL NODE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTags.map(tag => (
          <div key={tag.id} className="ind-panel transition-all duration-300 overflow-hidden group hover:border-purple-500/50">
            {/* Type Indicator Top Bar */}
            <div className={`h-1.5 w-full ${tag.source_type === 'calculated' ? 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[var(--ind-amber)]'}`} />
            
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className={`p-3 rounded border shadow-inner ${tag.source_type === 'calculated' ? 'bg-purple-600/5 text-purple-400 border-purple-500/20' : 'bg-[var(--ind-amber)]/5 text-[var(--ind-amber)] border-[var(--ind-amber)]/20'}`}>
                  {tag.source_type === 'calculated' ? <Calculator size={22} /> : <Hash size={22} />}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`ind-status-badge ${tag.source_type === 'calculated' ? 'text-purple-400 border-purple-500/20' : 'text-[var(--ind-amber)] border-[var(--ind-amber)]/20'}`}>
                    {tag.source_type}
                  </span>
                  <span className="ind-data text-[9px] text-[var(--ind-cyan)] bg-[var(--ind-bg)] px-2 py-0.5 rounded border border-[var(--ind-border)] tracking-widest">ID: T{tag.id}</span>
                </div>
              </div>

              <h3 className="ind-subtitle !text-xl !text-white !normal-case tracking-tight group-hover:text-purple-400 transition-colors mb-8">{tag.tag_name}</h3>
              
              <div className="bg-[var(--ind-bg)] rounded p-4 mb-8 border border-[var(--ind-border)] shadow-inner">
                  <p className="ind-label !text-[8px] mb-2 flex items-center gap-2 opacity-40"><Terminal size={10}/> Logic String</p>
                  <p className="ind-data text-[12px] truncate tracking-tight text-purple-300">
                    {tag.source_type === 'calculated' ? `f(x) = ${tag.formula}` : 'Manual Process Constant'}
                  </p>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-[var(--ind-border)]">
                  <div className="ind-label !text-[9px] opacity-60">Engineering Unit: <span className="text-white ml-1.5">{tag.unit || 'RAW'}</span></div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditClick(tag)} className="p-2 text-slate-700 hover:text-purple-400 hover:bg-purple-500/5 rounded transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(tag.id)} className="p-2 text-slate-700 hover:text-[var(--ind-red)] hover:bg-red-500/5 rounded transition-all"><Trash2 size={18} /></button>
                  </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📂 DEPLOY / EDIT MODAL (Industrial IDE Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B1215]/98 backdrop-blur-md z-[700] flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
          <div className="ind-panel w-full max-w-7xl h-[85vh] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col md:flex-row overflow-hidden border-[var(--ind-border)]">
            
            {/* Form Side */}
            <div className="flex-[1.2] flex flex-col h-full bg-[var(--ind-panel)]">
              <div className="p-6 border-b border-[var(--ind-border)] bg-[var(--ind-header)] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-purple-500"></div>
                  <h2 className="ind-title !text-xl">
                    {isEditing ? 'Modify Logic Node' : 'Initialize Logic Node'}
                  </h2>
                </div>
                <button onClick={handleModalClose} className="p-2.5 ind-panel hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                <div className="grid grid-cols-2 gap-2 bg-[var(--ind-bg)] p-1.5 rounded border border-[var(--ind-border)] shadow-inner">
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'internal'})} className={`flex items-center justify-center gap-2 py-3.5 rounded-[var(--ind-radius)] ind-label !text-[10px] transition-all ${newTag.source_type === 'internal' ? 'bg-[var(--ind-amber)] text-black shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}> <Hash size={16} /> Static Setpoint </button>
                    <button type="button" onClick={() => setNewTag({...newTag, source_type: 'calculated'})} className={`flex items-center justify-center gap-2 py-3.5 rounded-[var(--ind-radius)] ind-label !text-[10px] transition-all ${newTag.source_type === 'calculated' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}> <Calculator size={16} /> Dynamic Calc </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                          <label className="ind-label">Node Symbolic Name</label>
                          <input type="text" placeholder="e.g. HEAT_COEFFICIENT_K" required className="w-full ind-input" value={newTag.tag_name} onChange={e => setNewTag({...newTag, tag_name: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                          <label className="ind-label">Engineering Unit</label>
                          <input type="text" placeholder="e.g. °C / BAR" className="w-full ind-input" value={newTag.unit} onChange={e => setNewTag({...newTag, unit: e.target.value})} />
                      </div>
                    </div>

                    {newTag.source_type === 'calculated' ? (
                        <div className="space-y-4">
                            <label className="ind-label !text-purple-400 flex items-center gap-2"><Terminal size={14}/> Logic Formula String</label>
                            <textarea 
                              placeholder="Build architecture using identifiers (e.g. T101 * 0.5)..." required rows="5"
                              className="w-full bg-[var(--ind-bg)] border border-purple-900/20 rounded p-6 text-purple-400 ind-data text-xl outline-none focus:border-purple-500 transition-all resize-none shadow-inner" 
                              value={newTag.formula} 
                              onChange={e => setNewTag({...newTag, formula: e.target.value})} 
                            />
                            <div className="flex flex-wrap gap-2.5">
                                {['+', '-', '*', '/', '(', ')', '^'].map(op => (
                                    <button key={op} type="button" onClick={() => appendToFormula(op)} className="ind-panel bg-[var(--ind-bg)] hover:border-purple-500 text-white w-12 h-12 flex items-center justify-center ind-data text-xl transition-all active:scale-95">{op}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="ind-label !text-[var(--ind-amber)]">Preset Constant Value</label>
                            <input type="number" placeholder="0.00" className="w-full ind-input !text-3xl ind-data text-[var(--ind-amber)]" value={newTag.value} onChange={e => setNewTag({...newTag, value: e.target.value})} />
                        </div>
                    )}

                    <div className="flex gap-4 pt-8">
                        <button type="button" onClick={handleModalClose} className="flex-1 py-4 ind-label !text-slate-600 hover:text-white transition-all">Abort</button>
                        <button type="submit" className={`flex-[2] py-4 rounded-[var(--ind-radius)] ind-label !text-[11px] text-white shadow-xl transition-all active:scale-95 ${newTag.source_type === 'calculated' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[var(--ind-petroleum)] hover:bg-[var(--ind-petroleum)]/80'}`}>
                          {isEditing ? 'Commit Node Update' : 'Establish Logic Node'}
                        </button>
                    </div>
                </form>
              </div>
            </div>

            {/* Infrastructure Map Side (Picker) */}
            {newTag.source_type === 'calculated' && (
                <div className="hidden md:flex flex-1 flex-col bg-[var(--ind-bg)] border-l border-[var(--ind-border)]">
                    <div className="p-6 border-b border-[var(--ind-border)] bg-[var(--ind-header)]">
                      <h3 className="ind-label flex items-center gap-2">
                        <MousePointer2 size={14} className="text-purple-500" /> Infrastructure Map
                      </h3>
                    </div>
                    <div className="p-6 bg-[var(--ind-bg)] border-b border-[var(--ind-border)]/50">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)]" size={16} />
                            <input type="text" placeholder="FILTER SYSTEM NODES..." className="w-full ind-input !pl-12 !text-[var(--ind-cyan)]" value={tagPickerSearch} onChange={(e) => setTagPickerSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-10 scrollbar-hide">
                        {pickerFilteredTags.map(t => (
                            <button key={t.id} type="button" onClick={() => appendToFormula(t)} className="w-full flex items-center justify-between p-4 bg-[var(--ind-panel)] border border-[var(--ind-border)] rounded-[var(--ind-radius)] hover:border-purple-500/50 transition-all group">
                                <div className="flex items-center gap-4 text-left">
                                    <Database size={14} className={t.type === 'physical' ? 'text-[var(--ind-cyan)] opacity-30' : 'text-purple-400 opacity-30'}/>
                                    <div>
                                        <div className="text-[11px] font-extrabold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight leading-none">{t.tag_name}</div>
                                        <div className="ind-data text-[8px] text-slate-600 uppercase mt-1.5">{t.connName} // ID: {t.displayId}</div>
                                    </div>
                                </div>
                                <CornerDownRight size={14} className="text-slate-800 group-hover:text-purple-400 transition-all" />
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