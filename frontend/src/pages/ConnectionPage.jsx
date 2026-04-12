import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, Globe, Activity, Power, PowerOff, ListTree, 
  Settings2, HardDrive, Info, X, Zap, Database, Server, Link2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const ConnectionPage = ({ connections = [], onRefresh }) => {
  const { t } = useTranslation();

  // --- 🔒 CORE STATE (PRESERVED) ---
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConn, setSelectedConn] = useState(null);
  const [tags, setTags] = useState([]);
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '', connection_type: 'standard' });
  const [editConnData, setEditConnData] = useState({ id: '', name: '', endpoint_url: '', connection_type: 'standard' });
  const [newTagData, setNewTagData] = useState({ 
    tag_name: '', node_id: '', unit: '', is_historian: false, log_interval: 10, deadband: 0, tag_role: 'general' 
  });

  // --- ⚙️ API HANDLERS (PRESERVED) ---
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
    if (window.confirm("Delete this source?")) {
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
      setNewTagData({ tag_name: '', node_id: '', unit: '', is_historian: false, log_interval: 10, deadband: 0, tag_role: 'general' });
      fetchTags(selectedConn.id);
    } catch (err) { alert("Tag add failed."); }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm("Delete this node?")) {
      try { await api.deleteTag(id); fetchTags(selectedConn.id); } catch (err) { alert("Delete failed."); }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER SECTION */}
      <div className="flex justify-between items-end border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-cyan)]"></div>
            <span className="ind-label">Network Infrastructure</span>
          </div>
          <h1 className="ind-title">Connectivity</h1>
          <button 
            onClick={() => setIsConnModalOpen(true)} 
            className="ind-btn-primary flex items-center gap-3"
          >
            <PlusCircle size={16} /> Add New Interface
          </button>
        </div>

        {/* INTEGRATED GUIDE */}
        <div className="hidden lg:flex ind-panel p-6 border-l-4 border-l-[var(--ind-petroleum)] max-w-2xl gap-8">
           <div className="text-[var(--ind-cyan)] opacity-40"><Info size={24}/></div>
           <div className="grid grid-cols-2 gap-x-12 gap-y-2">
              <div className="space-y-1">
                <p className="ind-label !text-[var(--ind-cyan)]">Protocol Sync</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Standard Endpoint URLs (opc.tcp://)</p>
              </div>
              <div className="space-y-1">
                <p className="ind-label !text-[var(--ind-amber)]">Role Mapping</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Assign functional roles to tag nodes</p>
              </div>
           </div>
        </div>
      </div>

      {/* 🎛️ SOURCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {connections.map(conn => {
          const isOnline = String(conn.status).toLowerCase() === 'connected' || conn.status === true;
          const isEnergy = conn.connection_type === 'energy_analyzer';
          return (
            <div key={conn.id} className={`ind-panel transition-all duration-300 overflow-hidden group ${!conn.enabled ? 'opacity-40 grayscale' : 'hover:border-[var(--ind-petroleum)]'}`}>
              {/* Status Header Bar */}
              <div className={`h-1.5 w-full ${!conn.enabled ? 'bg-slate-700' : (isOnline ? 'bg-[var(--ind-cyan)] shadow-[0_0_10px_rgba(0,255,204,0.3)]' : 'bg-[var(--ind-red)]')}`} />
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-2">
                    <h3 className="ind-subtitle !text-xl !text-white">{conn.name}</h3>
                    <div className="flex items-center gap-2 ind-data !text-[10px] text-[var(--ind-slate)]">
                      <Globe size={12} className="text-[var(--ind-petroleum)]" /> {conn.endpoint_url}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleEnabled(conn)} className={`p-2.5 rounded border transition-all ${conn.enabled ? 'border-[var(--ind-cyan)]/30 text-[var(--ind-cyan)] bg-[var(--ind-cyan)]/5' : 'border-slate-800 text-slate-600'}`}>
                      {conn.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                    </button>
                    <button onClick={() => { setEditConnData(conn); setIsEditModalOpen(true); }} className="p-2.5 ind-panel hover:text-white transition-all"><Settings2 size={18} /></button>
                  </div>
                </div>

                <div className="flex gap-3 mb-10">
                  <span className={`ind-status-badge ${isOnline ? 'text-[var(--ind-cyan)] border-[var(--ind-cyan)]/20 bg-[var(--ind-cyan)]/5' : 'text-[var(--ind-red)] border-[var(--ind-red)]/20 bg-[var(--ind-red)]/5'}`}>
                    {isOnline ? 'LINK ACTIVE' : 'NO RESPONSE'}
                  </span>
                  {isEnergy && <span className="ind-status-badge text-[var(--ind-amber)] border-[var(--ind-amber)]/20 bg-[var(--ind-amber)]/5 flex items-center gap-1.5"> <Zap size={10} /> Energy Hub</span>}
                </div>

                <div className="flex gap-3 pt-6 border-t border-[var(--ind-border)]">
                  <button 
                    disabled={!conn.enabled} 
                    onClick={() => openTagManager(conn)} 
                    className={`flex-1 py-3.5 rounded-[var(--ind-radius)] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${conn.enabled ? 'bg-[var(--ind-petroleum)] text-white hover:bg-[var(--ind-petroleum)]/80 shadow-lg' : 'bg-slate-900 text-slate-700'}`}
                  >
                    <ListTree size={16}/> Configure Nodes
                  </button>
                  <button onClick={() => handleDeleteConnection(conn.id)} className="px-4 text-slate-600 hover:text-[var(--ind-red)] hover:bg-red-500/10 rounded-[var(--ind-radius)] transition-all border border-transparent hover:border-red-500/20">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🏷️ TAG MANAGEMENT MODAL */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-[#0B1215]/95 backdrop-blur-md z-[700] flex items-center justify-center p-8">
          <div className="ind-panel w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-[var(--ind-header)] border-b border-[var(--ind-border)] flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-[var(--ind-petroleum)]/20 text-[var(--ind-cyan)] rounded border border-[var(--ind-petroleum)]/30">
                  <ListTree size={24}/>
                </div>
                <div>
                  <h2 className="ind-title !text-2xl text-white">{selectedConn?.name}</h2>
                  <p className="ind-label !text-slate-500 mt-1">Industrial Node Mapping Protocol</p>
                </div>
              </div>
              <button onClick={() => setIsTagModalOpen(false)} className="p-3 ind-panel hover:text-white transition-all"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
              {/* Add Tag Form */}
              <form onSubmit={handleAddTag} className="ind-panel p-10 bg-[var(--ind-bg)] border-l-4 border-l-[var(--ind-petroleum)] space-y-10 relative shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label className="ind-label">Node Role</label>
                    <select 
                      value={newTagData.tag_role} 
                      onChange={e => setNewTagData({...newTagData, tag_role: e.target.value})}
                      className="w-full ind-input !bg-[var(--ind-panel)]"
                    >
                      <option value="general">Standard Node</option>
                      {selectedConn?.connection_type === 'energy_analyzer' && (
                        <optgroup label="ENERGY ANALYTICS" className="bg-[#141F24]">
                          <option value="voltage">Voltage (V)</option>
                          <option value="current">Current (A)</option>
                          <option value="power">Active Power (kW)</option>
                          <option value="energy">Energy (kWh)</option>
                          <option value="power_factor">Power Factor (cosφ)</option>
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="ind-label">Symbolic Name</label>
                    <input type="text" placeholder="MAIN_L1_V" required className="w-full ind-input" value={newTagData.tag_name} onChange={e => setNewTagData({...newTagData, tag_name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="ind-label">OPC Node ID</label>
                    <input type="text" placeholder="ns=2;s=Tag1" required className="w-full ind-input ind-data !text-[var(--ind-cyan)]" value={newTagData.node_id} onChange={e => setNewTagData({...newTagData, node_id: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="ind-label">Engineering Unit</label>
                    <input type="text" placeholder="kW / V / A" className="w-full ind-input" value={newTagData.unit} onChange={e => setNewTagData({...newTagData, unit: e.target.value})} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-6 border-t border-[var(--ind-border)]">
                  <div className="flex items-center gap-5">
                    <Database size={22} className={newTagData.is_historian ? 'text-[var(--ind-cyan)]' : 'text-slate-800'} />
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-widest block">Historian Data Recording</span>
                      <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 block">Log changes to secure industrial storage</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setNewTagData({...newTagData, is_historian: !newTagData.is_historian})} className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${newTagData.is_historian ? 'bg-[var(--ind-petroleum)]' : 'bg-slate-900'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${newTagData.is_historian ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <button type="submit" className="w-full ind-btn-primary !py-5 shadow-xl">Commit Node Definition</button>
              </form>

              {/* Tag List Table */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 ind-label opacity-60"> <Activity size={14} /> Active Node Configuration </div>
                <div className="ind-panel overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--ind-header)] border-b border-[var(--ind-border)]">
                        <th className="p-5 ind-label">Log</th>
                        <th className="p-5 ind-label">Symbol Name</th>
                        <th className="p-5 ind-label">Identifier</th>
                        <th className="p-5 ind-label">Role Mapping</th>
                        <th className="p-5 ind-label text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ind-border)]">
                      {tags.map(t => (
                        <tr key={t.id} className="hover:bg-[var(--ind-header)]/50 transition-colors group">
                          <td className="p-5"><div className={`w-2.5 h-2.5 rounded-full ${t.is_historian ? 'bg-[var(--ind-cyan)] shadow-[0_0_8px_var(--ind-cyan)]' : 'bg-slate-800'}`} /></td>
                          <td className="p-5 text-sm font-extrabold text-white uppercase tracking-tight">{t.tag_name}</td>
                          <td className="p-5 ind-data text-[11px] text-[var(--ind-slate)]">{t.node_id}</td>
                          <td className="p-5"><span className="ind-status-badge text-[var(--ind-slate)] border-[var(--ind-border)] bg-[var(--ind-bg)]">{t.tag_role}</span></td>
                          <td className="p-5 text-right">
                            <button onClick={() => handleDeleteTag(t.id)} className="p-2 text-slate-700 hover:text-[var(--ind-red)] opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECTION MODALS (Established & Edit) */}
      {[isConnModalOpen, isEditModalOpen].some(Boolean) && (
        <div className="fixed inset-0 bg-[#0B1215]/95 backdrop-blur-md z-[700] flex items-center justify-center p-6">
          <div className="ind-panel p-12 w-full max-w-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-5 mb-10 border-b border-[var(--ind-border)] pb-8">
               <div className="p-3 bg-[var(--ind-petroleum)]/20 text-[var(--ind-cyan)] rounded border border-[var(--ind-petroleum)]/30">
                 <Server size={24}/>
               </div>
               <div>
                 <h2 className="ind-title !text-2xl">{isEditModalOpen ? 'Modify Interface' : 'Establish Protocol'}</h2>
                 <p className="ind-label !text-slate-500 mt-1">Network Access & Data Exchange Settings</p>
               </div>
            </div>
            
            <form onSubmit={isEditModalOpen ? handleUpdateConnection : handleAddConnection} className="space-y-8">
              <div className="space-y-3">
                <label className="ind-label">Display Interface Name</label>
                <input type="text" className="w-full ind-input" required value={isEditModalOpen ? editConnData.name : newConnData.name} onChange={e => isEditModalOpen ? setEditConnData({...editConnData, name: e.target.value}) : setNewConnData({...newConnData, name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="ind-label">Protocol Definition</label>
                <select className="w-full ind-input cursor-pointer" value={isEditModalOpen ? editConnData.connection_type : newConnData.connection_type} onChange={(e) => isEditModalOpen ? setEditConnData({...editConnData, connection_type: e.target.value}) : setNewConnData({...newConnData, connection_type: e.target.value})} >
                  <option value="standard">OPC UA Standard</option>
                  <option value="energy_analyzer">Energy Intelligence Source</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="ind-label">Network Endpoint URL</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)]" size={16} />
                  <input type="text" className="w-full ind-input !pl-12 ind-data !text-[var(--ind-cyan)]" required value={isEditModalOpen ? editConnData.endpoint_url : newConnData.endpoint_url} onChange={e => isEditModalOpen ? setEditConnData({...editConnData, endpoint_url: e.target.value}) : setNewConnData({...newConnData, endpoint_url: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setIsConnModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-4 ind-panel !bg-transparent text-slate-500 font-bold uppercase text-[10px] tracking-widest border border-[var(--ind-border)] hover:text-white transition-all">Abort</button>
                <button type="submit" className="flex-[2] ind-btn-primary !py-4 shadow-xl"> {isEditModalOpen ? 'Commit Update' : 'Initialize Protocol'} </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConnectionPage;