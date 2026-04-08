import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, Globe, Activity, Power, PowerOff, ListTree, 
  Settings2, HardDrive, Info, Share2, ShieldCheck, Fingerprint, X, 
  ChevronDown, Zap, Database // <--- Database buraya eklendi!
} from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections = [], onRefresh }) => {
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
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 12px 16px; border-radius: 4px; font-weight: 600; outline: none; }
          .input-field:focus { border-color: #006470; }
        `}
      </style>

      {/* 🏛️ HEADER SECTION */}
      <div className="flex justify-between items-end border-b border-[#23333A] pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#00FFCC]"></div>
            <span className="label-caps">Network Infrastructure</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white uppercase">Connectivity</h1>
          <button 
            onClick={() => setIsConnModalOpen(true)} 
            className="bg-[#006470] hover:bg-[#007a8a] text-white px-6 py-3 rounded-md flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest transition-all"
          >
            <PlusCircle size={16} /> Add New Interface
          </button>
        </div>

        {/* INTEGRATED GUIDE (Sert Köşeli) */}
        <div className="hidden lg:flex industrial-panel p-5 rounded-md gap-6 max-w-2xl border-l-4 border-l-[#006470]">
           <div className="text-[#00FFCC] opacity-50"><Info size={24}/></div>
           <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="space-y-1">
                <p className="label-caps !text-[#00FFCC]">Protocol Sync</p>
                <p className="text-[10px] text-slate-500 font-medium">Standard Endpoint URLs (opc.tcp://).</p>
              </div>
              <div className="space-y-1">
                <p className="label-caps !text-amber-500">Role Mapping</p>
                <p className="text-[10px] text-slate-500 font-medium">Assign functional roles to tag nodes.</p>
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
            <div key={conn.id} className={`industrial-panel rounded-md transition-all overflow-hidden ${!conn.enabled ? 'opacity-40' : 'hover:border-[#006470]'}`}>
              {/* Status Header */}
              <div className={`h-1 w-full ${!conn.enabled ? 'bg-slate-700' : (isOnline ? 'bg-[#00FFCC]' : 'bg-red-500')}`} />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-white tracking-tight">{conn.name.toUpperCase()}</h3>
                    <div className="flex items-center gap-2 font-data text-[10px] text-slate-500"><Globe size={12} /> {conn.endpoint_url}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleEnabled(conn)} className={`p-2 rounded border ${conn.enabled ? 'border-[#00FFCC]/30 text-[#00FFCC] bg-[#00FFCC]/5' : 'border-slate-700 text-slate-600'}`}>
                      {conn.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                    </button>
                    <button onClick={() => { setEditConnData(conn); setIsEditModalOpen(true); }} className="p-2 rounded border border-slate-700 text-slate-500 hover:text-white"><Settings2 size={18} /></button>
                  </div>
                </div>

                <div className="flex gap-2 mb-8">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded border ${isOnline ? 'text-[#00FFCC] border-[#00FFCC]/20' : 'text-red-500 border-red-500/20'}`}>
                    {isOnline ? 'LINK ACTIVE' : 'NO RESPONSE'}
                  </span>
                  {isEnergy && <span className="text-[9px] font-bold px-2 py-1 rounded border border-[#006470] text-[#00FFCC] bg-[#006470]/10 flex items-center gap-1 uppercase"> <Zap size={10} /> Energy Hub</span>}
                </div>

                <div className="flex gap-3">
                  <button 
                    disabled={!conn.enabled} 
                    onClick={() => openTagManager(conn)} 
                    className={`flex-1 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${conn.enabled ? 'bg-[#006470] text-white' : 'bg-slate-900 text-slate-700'}`}
                  >
                    <ListTree size={16}/> Configure Nodes
                  </button>
                  <button onClick={() => handleDeleteConnection(conn.id)} className="px-4 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all border border-transparent hover:border-red-500/20">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🏷️ TAG MANAGEMENT MODAL (Industrial Design) */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-[#0B1215]/95 backdrop-blur-sm z-[700] flex items-center justify-center p-8">
          <div className="industrial-panel w-full max-w-6xl h-[85vh] rounded-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#23333A] flex justify-between items-center bg-[#1C262B]">
              <div className="flex items-center gap-4">
                <ListTree size={24} className="text-[#00FFCC]"/>
                <h2 className="text-xl font-bold text-white uppercase">{selectedConn?.name} <span className="text-slate-600 font-normal mx-2">//</span> NODE MAPPING</h2>
              </div>
              <button onClick={() => setIsTagModalOpen(false)} className="p-2 text-slate-500 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
              {/* Add Tag Form */}
              <form onSubmit={handleAddTag} className="bg-[#0B1215] p-8 rounded border border-[#23333A] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#006470]"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps">Node Role</label>
                    <select 
                      value={newTagData.tag_role} 
                      onChange={e => setNewTagData({...newTagData, tag_role: e.target.value})}
                      className="w-full input-field text-xs uppercase"
                    >
                      <option value="general">Standard Node</option>
                      {selectedConn?.connection_type === 'energy_analyzer' && (
                        <optgroup label="ENERGY DATA" className="bg-[#141F24]">
                          <option value="voltage">Voltage (V)</option>
                          <option value="current">Current (A)</option>
                          <option value="power">Active Power (kW)</option>
                          <option value="energy">Energy (kWh)</option>
                          <option value="power_factor">Power Factor (cosφ)</option>
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Symbolic Name</label>
                    <input type="text" placeholder="MAIN_L1_V" required className="w-full input-field text-sm" value={newTagData.tag_name} onChange={e => setNewTagData({...newTagData, tag_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">OPC Node ID</label>
                    <input type="text" placeholder="ns=2;s=Tag1" required className="w-full input-field text-sm font-data text-[#00FFCC]" value={newTagData.node_id} onChange={e => setNewTagData({...newTagData, node_id: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Unit</label>
                    <input type="text" placeholder="kW / V / A" className="w-full input-field text-sm" value={newTagData.unit} onChange={e => setNewTagData({...newTagData, unit: e.target.value})} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-[#23333A]">
                  <div className="flex items-center gap-4">
                    <Database size={20} className={newTagData.is_historian ? 'text-[#00FFCC]' : 'text-slate-700'} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Industrial Historian Recording</span>
                  </div>
                  <button type="button" onClick={() => setNewTagData({...newTagData, is_historian: !newTagData.is_historian})} className={`w-12 h-6 rounded-full relative transition-all ${newTagData.is_historian ? 'bg-[#006470]' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newTagData.is_historian ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <button type="submit" className="w-full py-4 bg-[#006470] text-white rounded font-bold text-[11px] uppercase tracking-widest hover:bg-[#007a8a] transition-all">Commit Node Definition</button>
              </form>

              {/* Tag List Table Style */}
              <div className="space-y-4 pb-10">
                <div className="flex items-center gap-3 label-caps opacity-50"> <Activity size={14} /> Configured Nodes </div>
                <div className="border border-[#23333A] rounded overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1C262B] border-b border-[#23333A]">
                      <tr>
                        <th className="p-4 label-caps">State</th>
                        <th className="p-4 label-caps">Tag Name</th>
                        <th className="p-4 label-caps">Identifier</th>
                        <th className="p-4 label-caps">Role</th>
                        <th className="p-4 label-caps text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23333A]">
                      {tags.map(t => (
                        <tr key={t.id} className="hover:bg-[#1C262B] transition-colors group text-white">
                          <td className="p-4"><div className={`w-2 h-2 rounded-full ${t.is_historian ? 'bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]' : 'bg-slate-700'}`} /></td>
                          <td className="p-4 font-bold text-xs">{t.tag_name}</td>
                          <td className="p-4 font-data text-[11px] text-slate-500">{t.node_id}</td>
                          <td className="p-4"><span className="text-[9px] font-bold px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50 uppercase">{t.tag_role}</span></td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteTag(t.id)} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
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

      {/* CONNECTION MODALS (MODERATE DESIGN) */}
      {[isConnModalOpen, isEditModalOpen].some(Boolean) && (
        <div className="fixed inset-0 bg-[#0B1215]/90 z-[700] flex items-center justify-center p-6">
          <div className="industrial-panel p-10 rounded-md w-full max-w-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white uppercase mb-8 flex items-center gap-3">
              <HardDrive size={24} className="text-[#00FFCC]"/>
              {isEditModalOpen ? 'Modify Interface' : 'Establish Source'}
            </h2>
            <form onSubmit={isEditModalOpen ? handleUpdateConnection : handleAddConnection} className="space-y-6">
              <div className="space-y-2">
                <label className="label-caps">Display Name</label>
                <input type="text" className="w-full input-field text-sm" required value={isEditModalOpen ? editConnData.name : newConnData.name} onChange={e => isEditModalOpen ? setEditConnData({...editConnData, name: e.target.value}) : setNewConnData({...newConnData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="label-caps">Protocol Type</label>
                <select className="w-full input-field text-xs uppercase" value={isEditModalOpen ? editConnData.connection_type : newConnData.connection_type} onChange={(e) => isEditModalOpen ? setEditConnData({...editConnData, connection_type: e.target.value}) : setNewConnData({...newConnData, connection_type: e.target.value})} >
                  <option value="standard">OPC UA Standard</option>
                  <option value="energy_analyzer">Energy Intelligence Source</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-caps">Endpoint URL</label>
                <input type="text" className="w-full input-field text-xs font-data text-[#00FFCC]" required value={isEditModalOpen ? editConnData.endpoint_url : newConnData.endpoint_url} onChange={e => isEditModalOpen ? setEditConnData({...editConnData, endpoint_url: e.target.value}) : setNewConnData({...newConnData, endpoint_url: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsConnModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-[#006470] text-white rounded font-bold uppercase text-[10px] tracking-widest hover:bg-[#007a8a]"> {isEditModalOpen ? 'Commit Changes' : 'Initialize Protocol'} </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConnectionPage;