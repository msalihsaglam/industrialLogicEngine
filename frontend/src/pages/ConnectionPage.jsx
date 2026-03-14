import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, Save, X, Database, Tag, Globe, 
  Activity, Power, PowerOff, Edit2, ListTree, Hash, Timer, Target, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections = [], onRefresh }) => {
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConn, setSelectedConn] = useState(null);
  const [tags, setTags] = useState([]);
  
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '' });
  const [editConnData, setEditConnData] = useState({ id: '', name: '', endpoint_url: '' });
  
  const [newTagData, setNewTagData] = useState({ 
    tag_name: '', 
    node_id: '', 
    unit: '',
    is_historian: false,
    log_interval: 10,
    deadband: 0
  });

  // --- CİHAZ (CONNECTION) YÖNETİMİ ---
  const handleAddConnection = async (e) => {
    e.preventDefault();
    try {
      await api.addConnection(newConnData);
      setIsConnModalOpen(false);
      setNewConnData({ name: '', endpoint_url: '' });
      onRefresh();
    } catch (err) { alert("Source could not be established."); }
  };

  const handleUpdateConnection = async (e) => {
    e.preventDefault();
    try {
      await api.updateConnection(editConnData.id, { 
        name: editConnData.name, 
        endpoint_url: editConnData.endpoint_url 
      });
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

  // --- TAG (NODE) YÖNETİMİ ---
  const fetchTags = async (connId) => {
    try {
      const res = await api.getTags(connId);
      setTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("Tags could not be retrieved:", err);
      setTags([]);
    }
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
      setNewTagData({ 
        tag_name: '', node_id: '', unit: '', 
        is_historian: false, log_interval: 10, deadband: 0 
      });
      fetchTags(selectedConn.id);
    } catch (err) { alert("Tag add failed."); }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm("Delete this node?")) {
      try {
        await api.deleteTag(id);
        fetchTags(selectedConn.id);
      } catch (err) { alert("Delete failed."); }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 px-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Connectivity</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">Industrial Gateway & OPC UA Management</p>
        </div>
        <button onClick={() => setIsConnModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg text-[10px] font-black uppercase tracking-widest">
          <PlusCircle size={20} /> Add New Source
        </button>
      </div>

      {/* CİHAZ KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {connections.map(conn => {
          // Durum kontrolü için yardımcı değişken
          const isOnline = String(conn.status).toLowerCase() === 'connected' || conn.status === true;
          
          return (
            <div key={conn.id} className={`bg-slate-900 border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-300 group ${conn.enabled ? 'border-slate-800 hover:border-slate-600' : 'border-red-900/10 opacity-40 bg-slate-950/50'}`}>
              
              {/* Sol taraftaki durum şeridi */}
              <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${!conn.enabled ? 'bg-slate-800' : (isOnline ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-red-500')}`} />
              
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className={`font-black text-2xl tracking-tight mb-2 ${conn.enabled ? 'text-slate-100' : 'text-slate-600'}`}>{conn.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">{conn.endpoint_url}</p>
                    
                    {/* 🟢 GÜNCELLENEN DURUM BADGE'İ */}
                    <div className={`mt-4 text-[9px] font-black px-3 py-1 rounded-lg border w-fit uppercase tracking-tighter shadow-sm transition-all duration-500 ${
                      isOnline 
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' 
                        : 'text-red-400 border-red-500/30 bg-red-500/5'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`} />
                        {isOnline ? 'Connection OK' : 'Source Offline'}
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                   <button onClick={() => handleToggleEnabled(conn)} className={`p-3 rounded-2xl transition-all shadow-inner border ${conn.enabled ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}>
                    {conn.enabled ? <Power size={20} /> : <PowerOff size={20} />}
                   </button>
                   <button onClick={() => { setEditConnData(conn); setIsEditModalOpen(true); }} className="p-3 rounded-2xl bg-slate-800 text-slate-500 border border-slate-700 hover:text-amber-500 transition-all">
                     <Edit2 size={20} />
                   </button>
                 </div>
              </div>
              
              <div className="flex gap-3 mt-10">
                <button disabled={!conn.enabled} onClick={() => openTagManager(conn)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${conn.enabled ? 'bg-slate-800 hover:bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-700 cursor-not-allowed'}`}>
                  <ListTree size={16}/> Manage Nodes
                </button>
                <button onClick={() => handleDeleteConnection(conn.id)} className="px-5 bg-slate-800 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/30">
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📝 ESTABLISH CONNECTION MODAL */}
      {isConnModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[700] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl">
            <h2 className="text-3xl font-black text-white uppercase italic mb-8">Establish Source</h2>
            <form onSubmit={handleAddConnection} className="space-y-6">
              <input type="text" placeholder="Source Name" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 font-bold" required value={newConnData.name} onChange={e => setNewConnData({...newConnData, name: e.target.value})} />
              <input type="text" placeholder="Endpoint URL" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-mono outline-none focus:border-blue-500" required value={newConnData.endpoint_url} onChange={e => setNewConnData({...newConnData, endpoint_url: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsConnModalOpen(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Initialize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📝 EDIT CONNECTION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[700] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl">
            <h2 className="text-3xl font-black text-amber-500 uppercase italic mb-8">Edit Connection</h2>
            <form onSubmit={handleUpdateConnection} className="space-y-6">
              <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-amber-500 font-bold" required value={editConnData.name} onChange={e => setEditConnData({...editConnData, name: e.target.value})} />
              <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-mono outline-none focus:border-amber-500" required value={editConnData.endpoint_url} onChange={e => setEditConnData({...editConnData, endpoint_url: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Apply Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ TAG MANAGEMENT MODAL */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[700] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-2xl font-black text-white uppercase italic">{selectedConn?.name} // Tags</h2>
              <button onClick={() => setIsTagModalOpen(false)} className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              <form onSubmit={handleAddTag} className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-600 uppercase mb-2 block">Tag Name</label>
                    <input type="text" placeholder="e.g. Temperature" required className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500" 
                      value={newTagData.tag_name} onChange={e => setNewTagData({...newTagData, tag_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-600 uppercase mb-2 block">Node ID</label>
                    <input type="text" placeholder="ns=2;s=Device.Val" required className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-amber-500 font-mono outline-none focus:border-amber-500" 
                      value={newTagData.node_id} onChange={e => setNewTagData({...newTagData, node_id: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-600 uppercase mb-2 block">Unit</label>
                    <input type="text" placeholder="°C" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500" 
                      value={newTagData.unit} onChange={e => setNewTagData({...newTagData, unit: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-6">
                   <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${newTagData.is_historian ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-600'}`}>
                            <Database size={18} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase italic">Archive in Historian</p>
                            <p className="text-[8px] text-slate-500">Record this node for historical reporting</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNewTagData({...newTagData, is_historian: !newTagData.is_historian})}
                        className={`w-10 h-5 rounded-full relative transition-all duration-300 ${newTagData.is_historian ? 'bg-emerald-600' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${newTagData.is_historian ? 'left-6' : 'left-1'}`} />
                      </button>
                   </div>

                   {newTagData.is_historian && (
                     <div className="grid grid-cols-2 gap-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                           <label className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase">
                              <Timer size={12}/> Log Interval (sec)
                           </label>
                           <input type="number" value={newTagData.log_interval} onChange={e => setNewTagData({...newTagData, log_interval: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" />
                        </div>
                        <div className="space-y-2">
                           <label className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase">
                              <Target size={12}/> Deadband (%)
                           </label>
                           <input type="number" step="0.1" value={newTagData.deadband} onChange={e => setNewTagData({...newTagData, deadband: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" />
                        </div>
                     </div>
                   )}
                </div>

                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg">Establish Node</button>
              </form>

              <div className="space-y-3 pb-10">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <ListTree size={14} /> Registered Nodes on this Interface
                </h4>
                {tags.length > 0 ? (
                  tags.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-950/30 border border-slate-800/50 rounded-2xl group hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${t.is_historian ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          <Hash size={16}/>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-slate-100">{t.tag_name}</span>
                             {t.is_historian && <Database size={12} className="text-emerald-500 opacity-60" />}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">
                             {t.node_id} | {t.unit || 'No Unit'} 
                             {t.is_historian && ` | Interval: ${t.log_interval}s`}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTag(t.id)} className="p-2 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center border border-dashed border-slate-800 rounded-3xl opacity-30 italic text-xs text-white">
                    No nodes mapped for this source yet.
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