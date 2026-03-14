import React, { useState, useEffect } from 'react';
import { Database, Search, Save, Timer, Target, RefreshCcw, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

const HistorianSettings = ({ connections = [] }) => {
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
    
    console.log(`📤 Updating ${field}:`, value);

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
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 pt-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Historian Hub</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">Central Data Logging & Archive Optimization</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH BY TAG OR SOURCE..." 
            className="bg-slate-900 border border-slate-800 rounded-full py-3 pl-12 pr-6 text-[10px] font-black text-white outline-none focus:border-blue-500 w-80 transition-all uppercase tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6">Tag Name</th>
              <th className="px-8 py-6">Source</th>
              <th className="px-8 py-6 text-center"><Timer size={14} className="inline mr-2" /> Interval (s)</th>
              <th className="px-8 py-6 text-center"><Target size={14} className="inline mr-2" /> Deadband (%)</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredTags.map((tag) => (
              <tr key={tag.id} className={`group hover:bg-slate-800/30 transition-all ${tag.is_historian ? 'bg-emerald-500/5' : 'opacity-70'}`}>
                <td className="px-8 py-6">
                  <button 
                    onClick={() => handleUpdateTag(tag, 'is_historian', !tag.is_historian)}
                    className={`w-12 h-6 rounded-full relative transition-all ${tag.is_historian ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tag.is_historian ? 'left-7' : 'left-1'}`} />
                  </button>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-white font-black text-sm uppercase tracking-tight">{tag.tag_name}</span>
                    <span className="text-slate-600 text-[9px] font-mono mt-1">{tag.node_id || 'CALCULATED'}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <Activity size={12} className={tag.type === 'virtual' ? 'text-purple-500' : 'text-blue-500'} />
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{tag.connName}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <input 
                    type="number" 
                    value={tag.log_interval} 
                    onChange={(e) => handleUpdateTag(tag, 'log_interval', e.target.value)}
                    className={`w-20 mx-auto block bg-slate-950/50 border rounded-lg p-2 text-center text-xs text-white focus:border-blue-500 outline-none transition-all font-bold ${tag.is_historian ? 'border-emerald-500/50' : 'border-slate-800'}`}
                  />
                </td>
                <td className="px-8 py-6">
                  <input 
                    type="number" 
                    step="0.1"
                    value={tag.deadband} 
                    onChange={(e) => handleUpdateTag(tag, 'deadband', e.target.value)}
                    className={`w-20 mx-auto block bg-slate-950/50 border rounded-lg p-2 text-center text-xs text-white focus:border-blue-500 outline-none transition-all font-bold ${tag.is_historian ? 'border-emerald-500/50' : 'border-slate-800'}`}
                  />
                </td>
                <td className="px-8 py-6 text-right">
                  {tag.is_historian ? (
                    <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[10px] uppercase italic">
                      <span className="animate-pulse">Active Logging</span>
                      <ShieldCheck size={20} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 text-slate-700 font-black text-[10px] uppercase italic">
                      <span>Standby</span>
                      <ShieldAlert size={20} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="py-20 text-center text-blue-500 font-black italic tracking-widest animate-pulse">SYNCHRONIZING HISTORIAN DATA...</div>}
      </div>
    </div>
  );
};

export default HistorianSettings;