import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Search, Save, Timer, Target, RefreshCcw, 
  Activity, ShieldCheck, ShieldAlert, Layers, HardDrive, Info, 
  ChevronDown, ChevronRight, Filter, Globe, Cpu, Server, CheckCircle2, Terminal
} from 'lucide-react';
import { api } from '../services/api';

const HistorianSettings = ({ connections = [] }) => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  // --- ⚙️ API HANDLERS ---
  const fetchAllTags = async () => {
    setLoading(true);
    try {
      const tagPromises = connections.map(conn => api.getTags(conn.id));
      const physicalResults = await Promise.all(tagPromises);
      const physicalTags = physicalResults.flatMap((res, index) => 
        res.data.map(t => ({ ...t, connName: connections[index].name, type: 'physical', connectionId: connections[index].id }))
      );
      
      const virtualRes = await api.getTags(0);
      const virtualTags = virtualRes.data.map(t => ({ ...t, connName: 'VIRTUAL WORKSPACE', type: 'virtual', connectionId: 0 }));

      const mergedTags = [...physicalTags, ...virtualTags];
      setAllTags(mergedTags);

      // Başlangıçta tüm hiyerarşiyi açık getir
      const initialExpanded = mergedTags.reduce((acc, tag) => ({ ...acc, [tag.connName]: true }), {});
      setExpandedSections(initialExpanded);
    } catch (err) { console.error("Historian fetch error:", err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAllTags(); }, [connections]);

  const handleUpdateTag = async (tag, field, value) => {
    const updatedTag = { ...tag, [field]: value };
    try {
      await api.updateTag(tag.id, updatedTag);
      setAllTags(allTags.map(t => t.id === tag.id ? updatedTag : t));
    } catch (err) { alert(`Update failed: ${err.message}`); }
  };

  // --- 🧠 HIERARCHICAL & FILTER LOGIC ---
  const groupedTags = useMemo(() => {
    const filtered = allTags.filter(t => {
      const matchesSearch = t.tag_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.connName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : 
                           statusFilter === 'active' ? t.is_historian : !t.is_historian;
      return matchesSearch && matchesStatus;
    });

    return filtered.reduce((acc, tag) => {
      if (!acc[tag.connName]) acc[tag.connName] = [];
      acc[tag.connName].push(tag);
      return acc;
    }, {});
  }, [allTags, searchTerm, statusFilter]);

  const toggleSection = (name) => {
    setExpandedSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED PERSISTENCE GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Quick Controls */}
        <div className="space-y-1 min-w-[400px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Data Persistence Layer</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Historian Hub</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Server size={14} className="text-[#009999]" /> Central Archive & Record Optimization
          </p>

          <div className="flex flex-col gap-4 mt-8">
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#009999] group-focus-within:text-[#00ffcc] transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="SEARCH TAGS OR INTERFACES..." 
                    className="bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-14 pr-8 text-[11px] font-black text-white outline-none focus:border-[#009999] w-full lg:w-96 transition-all uppercase tracking-widest shadow-2xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800 shadow-xl w-fit">
                {['all', 'active', 'standby'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-[#009999] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {f === 'active' ? 'Recording' : f}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED DATA PERSISTENCE GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Database size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner border border-[#009999]/20">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Archive Logic Optimization
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Sampling</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Adjust 'Interval' to control database growth and sampling frequency.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Signal Filter</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Use 'Deadband' to ignore minor fluctuations and filter signal noise.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter italic">Persistence</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Active nodes are pushed to the time-series archive for reporting.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 📂 HIERARCHICAL ARCHIVE LIST */}
      <div className="space-y-8 pt-4">
        {Object.entries(groupedTags).map(([connName, tags]) => {
          const isExpanded = expandedSections[connName];
          const activeCount = tags.filter(t => t.is_historian).length;
          const isVirtual = connName === 'VIRTUAL WORKSPACE';

          return (
            <div key={connName} className="group animate-in slide-in-from-bottom-4 duration-500">
              {/* Bölüm Başlığı */}
              <button 
                onClick={() => toggleSection(connName)}
                className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] border-2 transition-all duration-500 mb-2 ${isExpanded ? 'bg-slate-900 border-slate-700 shadow-2xl' : 'bg-[#0b1117] border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl border-2 transition-all shadow-inner ${isVirtual ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' : 'bg-[#009999]/10 text-[#00ffcc] border-[#009999]/20'}`}>
                    {isVirtual ? <Cpu size={28} /> : <Globe size={28} />}
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-[#00ffcc] transition-colors">{connName}</h3>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                            <Layers size={12} className="text-[#009999]" /> {tags.length} Nodes Discovered
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 italic ${activeCount > 0 ? 'text-[#00ffcc]' : 'text-slate-700'}`}>
                            <Activity size={12} /> {activeCount} Recording Streams
                        </span>
                    </div>
                  </div>
                </div>
                <div className={`p-3 rounded-xl border-2 border-slate-800 text-slate-500 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-[#009999] text-white border-[#00ffcc]/30 shadow-lg' : ''}`}>
                    <ChevronDown size={22} />
                </div>
              </button>

              {/* Bölüm İçeriği (Table) */}
              {isExpanded && (
                <div className="bg-[#0b1117]/60 border-x-2 border-b-2 border-slate-800/50 rounded-b-[3rem] mx-6 overflow-hidden shadow-inner animate-in slide-in-from-top-4">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/50 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
                          <th className="px-10 py-7 w-[160px]">Archive State</th>
                          <th className="px-10 py-7">Node Identifier</th>
                          <th className="px-10 py-7 text-center w-[200px]"><Timer size={14} className="inline mr-2" /> Log Interval</th>
                          <th className="px-10 py-7 text-center w-[200px]"><Target size={14} className="inline mr-2" /> Deadband</th>
                          <th className="px-10 py-7 text-right">Integrity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-800/30">
                        {tags.map((tag) => (
                          <tr key={tag.id} className={`group/row transition-all duration-300 ${tag.is_historian ? 'bg-[#009999]/5 hover:bg-[#009999]/10' : 'hover:bg-slate-800/30 opacity-60'}`}>
                            <td className="px-10 py-6">
                                <button 
                                    onClick={() => handleUpdateTag(tag, 'is_historian', !tag.is_historian)}
                                    className={`w-14 h-7 rounded-full relative transition-all duration-500 border-2 shadow-inner ${tag.is_historian ? 'bg-[#009999] border-[#00ffcc]/30 shadow-[0_0_15px_rgba(0,255,204,0.2)]' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${tag.is_historian ? 'left-8' : 'left-0.5'}`} />
                                </button>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex flex-col">
                                <span className="text-white font-black text-lg uppercase tracking-tighter italic group-hover/row:text-[#00ffcc] transition-colors">{tag.tag_name}</span>
                                <span className="text-[#00ffcc] text-[9px] font-mono mt-1 opacity-50 tracking-widest uppercase">{tag.node_id || 'INTERNAL_CALCULATION'}</span>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                                <input 
                                    type="number" 
                                    value={tag.log_interval} 
                                    onChange={(e) => handleUpdateTag(tag, 'log_interval', e.target.value)}
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-[11px] text-white focus:border-[#009999] outline-none font-black shadow-inner transition-all"
                                />
                            </td>
                            <td className="px-10 py-6">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={tag.deadband} 
                                    onChange={(e) => handleUpdateTag(tag, 'deadband', e.target.value)}
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-[11px] text-white focus:border-[#009999] outline-none font-black shadow-inner transition-all"
                                />
                            </td>
                            <td className="px-10 py-6 text-right">
                                {tag.is_historian ? (
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="text-[9px] font-black text-[#00ffcc] uppercase italic tracking-widest animate-pulse">Syncing</span>
                                        <ShieldCheck size={22} className="text-[#00ffcc]" />
                                    </div>
                                ) : (
                                    <ShieldAlert size={22} className="text-slate-700 ml-auto" />
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="py-40 flex flex-col items-center justify-center gap-8">
            <RefreshCcw className="animate-spin text-[#00ffcc]" size={56} />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#009999] animate-pulse">Synchronizing Archive Cluster...</span>
          </div>
        )}

        {Object.keys(groupedTags).length === 0 && !loading && (
            <div className="py-40 text-center bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-[4rem] opacity-30">
                <Search size={80} className="mx-auto text-slate-800 mb-8" />
                <p className="text-white font-black uppercase tracking-[0.5em] text-xs italic">Zero Archive Nodes Identified In Filter</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistorianSettings;