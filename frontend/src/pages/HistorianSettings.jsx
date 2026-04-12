import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Search, Save, Timer, Target, RefreshCcw, 
  Activity, ShieldCheck, ShieldAlert, Layers, HardDrive, Info, 
  ChevronDown, Globe, Cpu, Server, CheckCircle2, Terminal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const HistorianSettings = ({ connections = [] }) => {
  const { t } = useTranslation();

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
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER & FILTER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4 min-w-[400px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-cyan)]"></div>
            <span className="ind-label">Data Persistence Layer</span>
          </div>
          <h1 className="ind-title">Historian Config</h1>
          
          <div className="flex flex-col gap-4 mt-8">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)]" size={16} />
                <input 
                    type="text" 
                    placeholder="SEARCH TAGS OR INTERFACES..." 
                    className="ind-input !pl-12 !w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex bg-[var(--ind-bg)] p-1 rounded border border-[var(--ind-border)] w-fit shadow-inner">
                {['all', 'active', 'standby'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-5 py-2 rounded-[var(--ind-radius)] ind-label !text-[9px] transition-all ${statusFilter === f ? 'bg-[var(--ind-petroleum)] text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}
                    >
                        {f === 'active' ? 'Recording' : f}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED ARCHIVE GUIDE */}
        <div className="flex-1 ind-panel p-6 border-l-4 border-l-[var(--ind-petroleum)] relative overflow-hidden flex flex-col md:flex-row gap-8">
            <div className="p-3 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded h-fit"><Info size={24}/></div>
            <div className="space-y-4">
                <h5 className="ind-label border-b border-[var(--ind-border)] pb-2 inline-block">Archive Policy Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                        <p className="ind-label !text-[var(--ind-cyan)]">Sampling</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Adjust interval for time-series frequency.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-[var(--ind-amber)]">Filter</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Use deadband to ignore sensor noise.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-blue-400">Persistence</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Active nodes are pushed to secure archive.</p>
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
            <div key={connName} className="ind-panel !p-0 overflow-hidden border-[var(--ind-border)] shadow-lg animate-in fade-in slide-in-from-bottom-2">
              {/* Section Header */}
              <button 
                onClick={() => toggleSection(connName)}
                className={`w-full flex items-center justify-between p-6 transition-all duration-300 relative ${isExpanded ? 'bg-[var(--ind-header)]' : 'bg-[var(--ind-panel)] hover:bg-[var(--ind-header)]'}`}
              >
                {/* Vertical Accent Line */}
                <div className={`absolute left-0 top-0 h-full w-1.5 ${isVirtual ? 'bg-purple-600' : (activeCount > 0 ? 'bg-[var(--ind-cyan)]' : 'bg-slate-700')}`} />
                
                <div className="flex items-center gap-6">
                  <div className={`p-3 rounded border shadow-inner ${isVirtual ? 'bg-purple-600/5 text-purple-400 border-purple-500/20' : 'bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] border-[var(--ind-petroleum)]/30'}`}>
                    {isVirtual ? <Cpu size={24} /> : <Globe size={24} />}
                  </div>
                  <div className="text-left">
                    <h3 className="ind-subtitle !text-xl !text-white leading-none">{connName}</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="ind-label !text-[8px] opacity-40 flex items-center gap-1.5">
                            <Layers size={10} /> {tags.length} Nodes
                        </span>
                        <span className={`ind-label !text-[8px] flex items-center gap-1.5 ${activeCount > 0 ? 'text-[var(--ind-cyan)]' : 'text-slate-700'}`}>
                            <Activity size={10} /> {activeCount} Recording
                        </span>
                    </div>
                  </div>
                </div>
                <div className={`text-slate-600 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-[var(--ind-cyan)]' : ''}`}>
                    <ChevronDown size={22} />
                </div>
              </button>

              {/* Table Content */}
              {isExpanded && (
                <div className="bg-[var(--ind-bg)] border-t border-[var(--ind-border)] overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--ind-header)]/50 border-b border-[var(--ind-border)]">
                          <th className="px-8 py-5 ind-label !text-slate-600 w-[120px]">State</th>
                          <th className="px-8 py-5 ind-label !text-slate-600">Node Identifier</th>
                          <th className="px-8 py-5 ind-label !text-slate-600 text-center w-[180px]">Interval (s)</th>
                          <th className="px-8 py-5 ind-label !text-slate-600 text-center w-[180px]">Deadband</th>
                          <th className="px-8 py-5 ind-label !text-slate-600 text-right pr-12">Integrity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ind-border)]/50">
                        {tags.map((tag) => (
                          <tr key={tag.id} className={`transition-all duration-300 group ${tag.is_historian ? 'bg-[var(--ind-petroleum)]/5' : 'opacity-40 hover:opacity-100'}`}>
                            <td className="px-8 py-5">
                                <button 
                                    onClick={() => handleUpdateTag(tag, 'is_historian', !tag.is_historian)}
                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${tag.is_historian ? 'bg-[var(--ind-petroleum)]' : 'bg-slate-900'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${tag.is_historian ? 'left-7' : 'left-1'}`} />
                                </button>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-white font-extrabold text-sm uppercase tracking-tight">{tag.tag_name}</span>
                                <span className="ind-data text-[9px] text-[var(--ind-slate)] mt-1.5 tracking-widest">{tag.node_id || 'INTERNAL_VAR'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                                <input 
                                    type="number" 
                                    value={tag.log_interval} 
                                    onChange={(e) => handleUpdateTag(tag, 'log_interval', e.target.value)}
                                    className="w-full ind-input !bg-[var(--ind-panel)] !py-2 text-center ind-data text-[12px] !text-[var(--ind-cyan)]"
                                />
                            </td>
                            <td className="px-8 py-5">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={tag.deadband} 
                                    onChange={(e) => handleUpdateTag(tag, 'deadband', e.target.value)}
                                    className="w-full ind-input !bg-[var(--ind-panel)] !py-2 text-center ind-data text-[12px] !text-[var(--ind-amber)]"
                                />
                            </td>
                            <td className="px-8 py-5 text-right pr-12">
                                {tag.is_historian ? (
                                    <div className="flex items-center justify-end gap-3 group-hover:scale-105 transition-transform">
                                        <span className="ind-data text-[9px] text-[var(--ind-cyan)] animate-pulse">RECORDING</span>
                                        <ShieldCheck size={20} className="text-[var(--ind-cyan)]" />
                                    </div>
                                ) : (
                                    <ShieldAlert size={20} className="text-slate-800 ml-auto opacity-20" />
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
            <RefreshCcw className="animate-spin text-[var(--ind-cyan)]" size={48} />
            <span className="ind-label tracking-[0.5em] text-[var(--ind-petroleum)]">Synchronizing Archive Cluster...</span>
          </div>
        )}

        {Object.keys(groupedTags).length === 0 && !loading && (
            <div className="py-32 text-center ind-panel border-dashed opacity-20">
                <Search size={56} className="mx-auto text-slate-800 mb-6" />
                <p className="ind-label tracking-[0.2em]">Zero Archive Nodes Identified In Current Filter</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistorianSettings;