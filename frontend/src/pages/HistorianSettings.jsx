import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Search, Save, Timer, Target, RefreshCcw, 
  Activity, ShieldCheck, ShieldAlert, Layers, HardDrive, Info, 
  ChevronDown, Globe, Cpu, Server, CheckCircle2, Terminal
} from 'lucide-react';
import { api } from '../services/api';

const HistorianSettings = ({ connections = [] }) => {
  // --- 🔒 CORE STATE (PRESERVED) ---
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  // --- ⚙️ API HANDLERS (PRESERVED) ---
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

  // --- 🧠 FILTER LOGIC (PRESERVED) ---
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
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL CORE STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 10px 14px; border-radius: 4px; font-weight: 600; outline: none; }
          .table-header { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #64748B; background-color: #1C262B; }
        `}
      </style>

      {/* 🏛️ HEADER & GUIDE SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4 min-w-[400px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#00FFCC]"></div>
            <span className="label-caps">Data Persistence Layer</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white leading-none">Historian Hub</h1>
          
          <div className="flex flex-col gap-3 mt-6">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006470]" size={16} />
                <input 
                    type="text" 
                    placeholder="SEARCH TAGS OR INTERFACES..." 
                    className="bg-[#141F24] border border-[#23333A] rounded-md py-2.5 pl-10 pr-4 text-[10px] font-bold text-white outline-none focus:border-[#00FFCC] w-full transition-all uppercase tracking-widest"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex bg-[#0B1215] p-1 rounded border border-[#23333A] w-fit">
                {['all', 'active', 'standby'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-4 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-[#006470] text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        {f === 'active' ? 'Recording' : f}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED ARCHIVE GUIDE */}
        <div className="flex-1 industrial-panel p-6 rounded-md relative overflow-hidden flex flex-col md:flex-row gap-6 border-l-4 border-l-[#006470] shadow-sm">
            <div className="p-3 bg-[#006470]/10 text-[#00FFCC] rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="label-caps border-b border-[#23333A] pb-2 inline-block">Archive Policy Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[#00FFCC] text-[10px] font-bold uppercase tracking-tighter">Sampling</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Adjust 'Interval' to control time-series sampling frequency.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-tighter">Filter</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Use 'Deadband' to filter noise and ignore minor fluctuations.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-tighter">Persistence</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Active nodes are pushed to time-series archive for analytics.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 📂 HIERARCHICAL ARCHIVE LIST */}
      <div className="space-y-6 pt-4">
        {Object.entries(groupedTags).map(([connName, tags]) => {
          const isExpanded = expandedSections[connName];
          const activeCount = tags.filter(t => t.is_historian).length;
          const isVirtual = connName === 'VIRTUAL WORKSPACE';

          return (
            <div key={connName} className="animate-in slide-in-from-bottom-4 duration-500 overflow-hidden rounded-md border border-[#23333A]">
              {/* Bölüm Başlığı (Sert Dikdörtgen) */}
              <button 
                onClick={() => toggleSection(connName)}
                className={`w-full flex items-center justify-between p-5 transition-all duration-300 ${isExpanded ? 'bg-[#1C262B]' : 'bg-[#141F24] hover:bg-[#1C262B]'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-3 rounded border ${isVirtual ? 'bg-purple-600/5 text-purple-400 border-purple-500/20' : 'bg-[#006470]/5 text-[#00FFCC] border-[#006470]/20'}`}>
                    {isVirtual ? <Cpu size={24} /> : <Globe size={24} />}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight leading-none">{connName}</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="label-caps !text-[8px] opacity-50 flex items-center gap-1.5 font-bold">
                            <Layers size={10} /> {tags.length} Nodes
                        </span>
                        <span className={`label-caps !text-[8px] flex items-center gap-1.5 font-bold ${activeCount > 0 ? 'text-[#00FFCC]' : 'text-slate-700'}`}>
                            <Activity size={10} /> {activeCount} Recording
                        </span>
                    </div>
                  </div>
                </div>
                <div className={`text-slate-500 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-[#00FFCC]' : ''}`}>
                    <ChevronDown size={20} />
                </div>
              </button>

              {/* Bölüm İçeriği (Industrial Grid Table) */}
              {isExpanded && (
                <div className="bg-[#0B1215] border-t border-[#23333A] overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="table-header">
                          <th className="px-8 py-4 w-[120px]">State</th>
                          <th className="px-8 py-4">Node Identifier</th>
                          <th className="px-8 py-4 text-center w-[180px]">Log Interval (s)</th>
                          <th className="px-8 py-4 text-center w-[180px]">Deadband</th>
                          <th className="px-8 py-4 text-right pr-12">Integrity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#23333A]/50">
                        {tags.map((tag) => (
                          <tr key={tag.id} className={`transition-all ${tag.is_historian ? 'bg-[#006470]/5' : 'opacity-40 hover:opacity-100'}`}>
                            <td className="px-8 py-4">
                                <button 
                                    onClick={() => handleUpdateTag(tag, 'is_historian', !tag.is_historian)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${tag.is_historian ? 'bg-[#006470] border-[#00FFCC]/30 shadow-[0_0_8px_#006470]' : 'bg-[#141F24] border-[#23333A]'}`}
                                >
                                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-300 ${tag.is_historian ? 'left-5.5' : 'left-0.5'}`} />
                                </button>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-sm uppercase tracking-tight">{tag.tag_name}</span>
                                <span className="text-[#64748B] text-[9px] font-data mt-0.5 uppercase tracking-widest">{tag.node_id || 'INTERNAL_VAR'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4">
                                <input 
                                    type="number" 
                                    value={tag.log_interval} 
                                    onChange={(e) => handleUpdateTag(tag, 'log_interval', e.target.value)}
                                    className="w-full bg-[#141F24] border border-[#23333A] rounded p-2 text-center text-[10px] text-white focus:border-[#006470] outline-none font-data font-bold transition-all"
                                />
                            </td>
                            <td className="px-8 py-4">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={tag.deadband} 
                                    onChange={(e) => handleUpdateTag(tag, 'deadband', e.target.value)}
                                    className="w-full bg-[#141F24] border border-[#23333A] rounded p-2 text-center text-[10px] text-white focus:border-[#006470] outline-none font-data font-bold transition-all"
                                />
                            </td>
                            <td className="px-8 py-4 text-right pr-12">
                                {tag.is_historian ? (
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="text-[8px] font-bold text-[#00FFCC] uppercase tracking-widest animate-pulse">Syncing</span>
                                        <ShieldCheck size={18} className="text-[#00FFCC]" />
                                    </div>
                                ) : (
                                    <ShieldAlert size={18} className="text-slate-800 ml-auto" />
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
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <RefreshCcw className="animate-spin text-[#00FFCC]" size={40} />
            <span className="label-caps tracking-[0.4em] text-[#006470]">Synchronizing Archive Cluster...</span>
          </div>
        )}

        {Object.keys(groupedTags).length === 0 && !loading && (
            <div className="py-32 text-center industrial-panel border-dashed rounded-md opacity-20">
                <Search size={48} className="mx-auto text-slate-800 mb-6" />
                <p className="label-caps">Zero Archive Nodes Identified In Filter</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistorianSettings;