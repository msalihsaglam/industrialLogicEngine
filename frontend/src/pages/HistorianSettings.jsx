import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Save, Timer, Target, RefreshCcw, 
  Activity, ShieldCheck, ShieldAlert, Layers, HardDrive, Info, Share2, Server
} from 'lucide-react';
import { api } from '../services/api';

const HistorianSettings = ({ connections = [] }) => {
  // --- 🔒 CORE LOGIC (FULLY PRESERVED) ---
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllTags = async () => {
    setLoading(true);
    try {
      const tagPromises = connections.map(conn => api.getTags(conn.id));
      const physicalResults = await Promise.all(tagPromises);
      const physicalTags = physicalResults.flatMap((res, index) => 
        res.data.map(t => ({ ...t, connName: connections[index].name, type: 'physical' }))
      );
      
      const virtualRes = await api.getTags(0);
      const virtualTags = virtualRes.data.map(t => ({ ...t, connName: 'VIRTUAL WORKSPACE', type: 'virtual' }));

      setAllTags([...physicalTags, ...virtualTags]);
    } catch (err) {
      console.error("Historian tags fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllTags(); }, [connections]);

  const handleUpdateTag = async (tag, field, value) => {
    const updatedTag = { ...tag, [field]: value };
    try {
      await api.updateTag(tag.id, updatedTag);
      setAllTags(allTags.map(t => t.id === tag.id ? updatedTag : t));
    } catch (err) {
      console.error("❌ UPDATE HATASI:", err.response?.data || err.message);
      alert(`Update failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredTags = allTags.filter(t => 
    t.tag_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.connName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Actions */}
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Data Persistence Layer</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Historian Hub</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 mt-4 italic">
             <Server size={14} className="text-[#009999]" /> Central Archive & Record Management
          </p>

          <div className="relative group mt-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#009999] group-focus-within:text-[#00ffcc] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="FILTER ARCHIVE NODES..." 
              className="bg-slate-900 border-2 border-slate-800 rounded-2xl py-5 pl-14 pr-8 text-[11px] font-black text-white outline-none focus:border-[#009999] w-full lg:w-96 transition-all uppercase tracking-widest shadow-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED DATA PERSISTENCE GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Database size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Archive Logic Optimization
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Sampling</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Adjust 'Interval' to control database growth and sampling frequency.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Signal Filter</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Use 'Deadband' to ignore minor fluctuations and filter signal noise.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter italic">Persistence</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Active nodes are pushed to the time-series archive for reporting.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 📊 ARCHIVE TABLE (FEATURES PROTECTED) */}
      <div className="bg-[#0b1117] border-2 border-slate-800 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.4)] backdrop-blur-3xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#009999]/30 to-transparent"></div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b-2 border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
              <th className="px-10 py-8">Archive State</th>
              <th className="px-10 py-8">Node Identification</th>
              <th className="px-10 py-8">Communication Interface</th>
              <th className="px-10 py-8 text-center"><Timer size={16} className="inline mr-2 text-[#00ffcc]" /> Log Interval (S)</th>
              <th className="px-10 py-8 text-center"><Target size={16} className="inline mr-2 text-[#00ffcc]" /> Deadband (%)</th>
              <th className="px-10 py-8 text-right">Integrity</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-800/50">
            {filteredTags.map((tag) => (
              <tr key={tag.id} className={`group transition-all duration-300 ${tag.is_historian ? 'bg-[#009999]/5 hover:bg-[#009999]/10' : 'hover:bg-slate-800/30 opacity-60'}`}>
                <td className="px-10 py-7">
                  <button 
                    onClick={() => handleUpdateTag(tag, 'is_historian', !tag.is_historian)}
                    className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner border-2 ${tag.is_historian ? 'bg-[#009999] border-[#00ffcc]/30 shadow-[0_0_20px_rgba(0,153,153,0.4)]' : 'bg-slate-800 border-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${tag.is_historian ? 'left-8' : 'left-1'}`} />
                  </button>
                </td>
                <td className="px-10 py-7">
                  <div className="flex flex-col">
                    <span className="text-white font-black text-lg uppercase tracking-tighter italic">{tag.tag_name}</span>
                    <span className="text-[#00ffcc] text-[9px] font-mono mt-1 opacity-60 tracking-widest">{tag.node_id || 'INTERNAL_CALCULATION'}</span>
                  </div>
                </td>
                <td className="px-10 py-7">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tag.type === 'virtual' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-[#009999]/10 text-[#00ffcc] border border-[#009999]/20'}`}>
                        <Activity size={14} />
                    </div>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{tag.connName}</span>
                  </div>
                </td>
                <td className="px-10 py-7">
                  <div className="flex justify-center">
                    <input 
                        type="number" 
                        value={tag.log_interval} 
                        onChange={(e) => handleUpdateTag(tag, 'log_interval', e.target.value)}
                        className={`w-24 bg-slate-950 border-2 rounded-xl p-3 text-center text-xs text-white focus:border-[#00ffcc] outline-none transition-all font-black shadow-inner ${tag.is_historian ? 'border-[#009999]/50 shadow-[0_0_15px_rgba(0,153,153,0.1)]' : 'border-slate-800 text-slate-600'}`}
                    />
                  </div>
                </td>
                <td className="px-10 py-7">
                   <div className="flex justify-center">
                    <input 
                        type="number" 
                        step="0.1"
                        value={tag.deadband} 
                        onChange={(e) => handleUpdateTag(tag, 'deadband', e.target.value)}
                        className={`w-24 bg-slate-950 border-2 rounded-xl p-3 text-center text-xs text-white focus:border-[#00ffcc] outline-none transition-all font-black shadow-inner ${tag.is_historian ? 'border-[#009999]/50 shadow-[0_0_15px_rgba(0,153,153,0.1)]' : 'border-slate-800 text-slate-600'}`}
                    />
                  </div>
                </td>
                <td className="px-10 py-7 text-right">
                  {tag.is_historian ? (
                    <div className="flex items-center justify-end gap-3 text-[#00ffcc] font-black text-[10px] uppercase italic tracking-widest">
                      <span className="animate-pulse">Active Recording</span>
                      <ShieldCheck size={22} className="text-[#00ffcc]" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3 text-slate-700 font-black text-[10px] uppercase italic tracking-widest opacity-40">
                      <span>Offline Standby</span>
                      <ShieldAlert size={22} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {loading && (
            <div className="py-32 flex flex-col items-center justify-center gap-6 bg-slate-950/50 backdrop-blur-md">
                <RefreshCcw className="animate-spin text-[#00ffcc]" size={48} />
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#009999] animate-pulse">Syncing Archive Parameters</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistorianSettings;