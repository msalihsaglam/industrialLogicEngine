import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, Save, X, Database, Tag, Globe, 
  Activity, Power, PowerOff, Edit2, ListTree, Hash, Timer, Target, ChevronDown,
  Zap, ArrowRight, Settings2, HardDrive, Info, Share2, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections = [], onRefresh }) => {
  // --- 🔒 CORE STATE (DO NOT REMOVE) ---
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConn, setSelectedConn] = useState(null);
  const [tags, setTags] = useState([]);
  
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '', connection_type: 'standard' });
  const [editConnData, setEditConnData] = useState({ id: '', name: '', endpoint_url: '', connection_type: 'standard' });
  
  const [newTagData, setNewTagData] = useState({ 
    tag_name: '', node_id: '', unit: '',
    is_historian: false, log_interval: 10, deadband: 0
  });

  // --- ⚙️ API HANDLERS (FULLY PRESERVED) ---
  const handleAddConnection = async (e) => {
    e.preventDefault();
    try {
      await api.addConnection(newConnData);
      setIsConnModalOpen(false);
      setNewConnData({ name: '', endpoint_url: '', connection_type: 'standard' });
      onRefresh();
    } catch (err) { alert("Source could not be established."); }
  };

  const handleUpdateConnection = async (e) => {
    e.preventDefault();
    try {
      await api.updateConnection(editConnData.id, editConnData);
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err) { alert("Update failed."); }
  };

  const handleToggleEnabled = async (conn) => {
    try {
      await api.updateConnection(conn.id, { enabled: !conn.enabled });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleDeleteConnection = async (id) => {
    if (window.confirm("Delete this source and all its tags?")) {
      try { await api.deleteConnection(id); onRefresh(); } catch (err) { console.error(err); }
    }
  };

  const fetchTags = async (connId) => {
    try {
      const res = await api.getTags(connId);
      setTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setTags([]); }
  };

  const openTagManager = (conn) => {
    setSelectedConn(conn);
    fetchTags(conn.id);
    setIsTagModalOpen(true);
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    try {
      await api.addTag({ ...newTagData, connection_id: selectedConn.id });
      setNewTagData({ tag_name: '', node_id: '', unit: '', is_historian: false, log_interval: 10, deadband: 0 });
      fetchTags(selectedConn.id);
    } catch (err) { alert("Tag add failed."); }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm("Delete this node?")) {
      try { await api.deleteTag(id); fetchTags(selectedConn.id); } catch (err) { alert("Delete failed."); }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Actions Area */}
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Network Infrastructure</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Connectivity</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase mt-4 italic">
             Control Layer & Node Orchestration
          </p>

          <button 
            onClick={() => setIsConnModalOpen(true)} 
            className="mt-8 bg-[#009999] hover:bg-[#00cccc] text-white px-8 py-4 rounded-xl flex items-center gap-3 shadow-[0_0_30px_rgba(0,153,153,0.2)] text-[11px] font-black uppercase tracking-widest transition-all group"
          >
            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
            Add New Interface
          </button>
        </div>

        {/* 🎯 RIGHT: INTEGRATED COMMUNICATION DEPLOYMENT GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Share2 size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Communication Deployment Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Source Sync</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Use standard Endpoint URLs (opc.tcp://) for direct hardware handshake.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Node Mapping</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Define symbolic names and Node IDs to orchestrate the internal tag database.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter italic">Protocol Security</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">Only validated interfaces can bridge the control layer and operational view.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 🎛️ SOURCE GRID (FEATURES PROTECTED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
        {connections.map(conn => {
          const isOnline = String(conn.status).toLowerCase() === 'connected' || conn.status === true;
          const isEnergy = conn.connection_type === 'energy_analyzer';
          
          return (
            <div key={conn.id} className={`group bg-slate-900/40 border-2 rounded-[2rem] p-8 shadow-2xl relative transition-all duration-500 overflow-hidden ${conn.enabled ? 'border-slate-800 hover:border-[#009999]/50 bg-slate-900' : 'border-red-900/20 opacity-40 grayscale'}`}>
              
              {/* Status Accent Bar */}
              <div className={`absolute top-0 right-0 w-32 h-1.5 transition-colors duration-500 ${!conn.enabled ? 'bg-slate-700' : (isOnline ? 'bg-[#00ffcc]' : 'bg-red-500')}`} />
              
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className={`font-black text-3xl tracking-tight transition-colors ${conn.enabled ? 'text-white' : 'text-slate-600'}`}>
                      {conn.name.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                      <Globe size={12} /> {conn.endpoint_url}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border-2 uppercase tracking-tighter ${
                      isOnline ? 'text-[#00ffcc] border-[#00ffcc]/20 bg-[#00ffcc]/5' : 'text-red-400 border-red-500/20 bg-red-500/5'
                    }`}>
                      {isOnline ? 'Active Link' : 'No Response'}
                    </span>
                    {isEnergy && (
                      <span className="text-[9px] font-black px-3 py-1.5 rounded-lg border-2 border-[#009999]/30 bg-[#009999]/10 text-[#00ffcc] flex items-center gap-1 uppercase tracking-tighter">
                        <Zap size={10} /> Analytics Node
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => handleToggleEnabled(conn)} className={`p-4 rounded-2xl transition-all border-2 ${conn.enabled ? 'bg-[#009999]/10 text-[#00ffcc] border-[#009999]/30' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                    {conn.enabled ? <Power size={22} /> : <PowerOff size={22} />}
                  </button>
                  <button onClick={() => { setEditConnData(conn); setIsEditModalOpen(true); }} className="p-4 rounded-2xl bg-slate-800 text-slate-500 border-2 border-slate-700 hover:text-white hover:border-white transition-all">
                    <Settings2 size={22} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={!conn.enabled} 
                  onClick={() => openTagManager(conn)} 
                  className={`flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                    conn.enabled 
                    ? 'bg-slate-800 hover:bg-[#009999] text-white shadow-xl hover:shadow-[#009999]/20' 
                    : 'bg-slate-950 text-slate-800 cursor-not-allowed border border-slate-900'
                  }`}
                >
                  <ListTree size={18}/> Orchestrate Nodes
                </button>
                <button 
                  onClick={() => handleDeleteConnection(conn.id)} 
                  className="px-6 bg-slate-800/50 hover:bg-red-600/10 text-slate-700 hover:text-red-500 rounded-2xl transition-all border-2 border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📂 PROFESSIONAL MODALS (FEATURES PROTECTED) */}
      {[isConnModalOpen, isEditModalOpen].some(Boolean) && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[700] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0b1117] border-2 border-slate-800 p-12 rounded-[3rem] w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-[#009999]/20 text-[#00ffcc] rounded-2xl flex items-center justify-center shadow-inner">
                {isEditModalOpen ? <Settings2 size={24}/> : <HardDrive size={24}/>}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  {isEditModalOpen ? 'Modify Interface' : 'Establish Source'}
                </h2>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1 italic">Industrial Communication Protocol</p>
              </div>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateConnection : handleAddConnection} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest ml-1 italic">Identification</label>
                <input 
                  type="text" 
                  placeholder="e.g. Siemens S7-1500 Controller" 
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-[#009999] transition-all font-black uppercase text-sm" 
                  required 
                  value={isEditModalOpen ? editConnData.name : newConnData.name} 
                  onChange={e => isEditModalOpen ? setEditConnData({...editConnData, name: e.target.value}) : setNewConnData({...newConnData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 flex items-center gap-5">
                   <Zap size={20} className={ (isEditModalOpen ? editConnData.connection_type : newConnData.connection_type) === 'energy_analyzer' ? 'text-[#00ffcc]' : 'text-slate-700' } />
                   <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Architecture Type</p>
                      <select 
                        className="w-full bg-transparent text-white font-black outline-none text-xs uppercase cursor-pointer"
                        value={isEditModalOpen ? editConnData.connection_type : newConnData.connection_type}
                        onChange={(e) => isEditModalOpen ? setEditConnData({...editConnData, connection_type: e.target.value}) : setNewConnData({...newConnData, connection_type: e.target.value})}
                      >
                        <option value="standard" className="bg-slate-900">General Automation</option>
                        <option value="energy_analyzer" className="bg-slate-900 text-[#00ffcc]">Energy Analytics Prof.</option>
                      </select>
                   </div>
                </div>
                
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 italic">Network Endpoint</label>
                  <input 
                    type="text" 
                    placeholder="opc.tcp://192.168.0.1:4840" 
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-[#00ffcc] font-mono outline-none focus:border-[#009999] transition-all text-xs shadow-inner" 
                    required 
                    value={isEditModalOpen ? editConnData.endpoint_url : newConnData.endpoint_url} 
                    onChange={e => isEditModalOpen ? setEditConnData({...editConnData, endpoint_url: e.target.value}) : setNewConnData({...newConnData, endpoint_url: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setIsConnModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-700 transition-all">Dismiss</button>
                <button type="submit" className="flex-[2] py-5 bg-[#009999] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-[#00cccc] transition-all">
                  {isEditModalOpen ? 'Commit Changes' : 'Initialize Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ TAG MANAGEMENT MODAL (FEATURES PROTECTED) */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[700] flex items-center justify-center p-8">
          <div className="bg-[#0b1117] border-2 border-slate-800 w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-10 border-b-2 border-slate-800 flex justify-between items-center bg-slate-900/30">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-3xl"><ListTree size={28}/></div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{selectedConn?.name} <span className="text-slate-600 font-normal ml-3">//</span> NODES</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Mapping & Archive Configuration</p>
                </div>
              </div>
              <button onClick={() => setIsTagModalOpen(false)} className="p-4 bg-slate-800 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
              <form onSubmit={handleAddTag} className="bg-slate-900/50 p-8 rounded-[2.5rem] border-2 border-slate-800 space-y-8 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#009999]"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic ml-1">Symbolic Name</label>
                    <input type="text" placeholder="e.g. Motor_Current" required className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-[#009999] transition-all font-bold uppercase" 
                      value={newTagData.tag_name} onChange={e => setNewTagData({...newTagData, tag_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic ml-1">OPC Node Identifier</label>
                    <input type="text" placeholder="ns=2;s=Data.Val" required className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-sm text-[#00ffcc] font-mono outline-none focus:border-[#009999] transition-all" 
                      value={newTagData.node_id} onChange={e => setNewTagData({...newTagData, node_id: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic ml-1">Metric Unit</label>
                    <input type="text" placeholder="kW / °C / Bar" className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-[#009999] transition-all font-bold uppercase italic" 
                      value={newTagData.unit} onChange={e => setNewTagData({...newTagData, unit: e.target.value})} />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/50 p-6 rounded-2xl border-2 border-slate-800">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-xl transition-all ${newTagData.is_historian ? 'bg-[#009999]/20 text-[#00ffcc]' : 'bg-slate-800 text-slate-600'}`}>
                      <Database size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">Enable Industrial Historian</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-1">Time-series archiving for analytics</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewTagData({...newTagData, is_historian: !newTagData.is_historian})}
                    className={`w-14 h-7 rounded-full relative transition-all duration-500 ${newTagData.is_historian ? 'bg-[#009999]' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${newTagData.is_historian ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {newTagData.is_historian && (
                  <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2 italic">
                        <Timer size={14} className="text-[#009999]"/> Sampling Interval (Seconds)
                      </label>
                      <input type="number" value={newTagData.log_interval} onChange={e => setNewTagData({...newTagData, log_interval: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-sm text-white font-black outline-none focus:border-[#009999]" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2 italic">
                        <Target size={14} className="text-[#009999]"/> Sensitivity Deadband (%)
                      </label>
                      <input type="number" step="0.1" value={newTagData.deadband} onChange={e => setNewTagData({...newTagData, deadband: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-sm text-white font-black outline-none focus:border-[#009999]" />
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full py-5 bg-[#009999] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#00cccc] transition-all shadow-2xl">Deploy Node Definition</button>
              </form>

              {/* Tag List */}
              <div className="space-y-4 pb-12">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-3 italic">
                  <Activity size={16} /> Data Points Overview
                </h4>
                {tags.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {tags.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-6 bg-slate-900/30 border-2 border-slate-800/50 rounded-3xl group hover:border-[#009999]/30 transition-all">
                        <div className="flex items-center gap-6 text-white">
                          <div className={`p-3 rounded-xl ${t.is_historian ? 'bg-[#009999]/10 text-[#00ffcc]' : 'bg-slate-800 text-slate-500'}`}>
                            <Hash size={20}/>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black tracking-tight uppercase italic">{t.tag_name}</span>
                              {t.is_historian && <span className="bg-[#009999]/10 text-[#00ffcc] text-[8px] font-black px-2 py-0.5 rounded uppercase border border-[#009999]/20 shadow-sm animate-pulse">Historian Active</span>}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-wider">
                              NODE: {t.node_id} <span className="mx-2 opacity-30">|</span> UNIT: {t.unit || 'RAW'} 
                              {t.is_historian && <span className="ml-2 text-[#009999] opacity-70">| ARCHIVE INTERVAL: {t.log_interval}S</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTag(t.id)} className="p-3 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20"><Trash2 size={20}/></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] opacity-20 italic text-sm tracking-widest text-white">
                    Waiting for Node Mapping...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPage;