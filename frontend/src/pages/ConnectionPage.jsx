import React, { useState } from 'react';
import { PlusCircle, Trash2, Save, X, Database, Tag, Globe, Activity, Power, PowerOff, Edit2 } from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections, onRefresh }) => {

  // Modal States
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // YENİ
  
  // Data States
  const [selectedConn, setSelectedConn] = useState(null);
  const [tags, setTags] = useState([]);
  
  // Form States
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '' });
  const [editConnData, setEditConnData] = useState({ id: '', name: '', endpoint_url: '' }); // YENİ
  const [newTagData, setNewTagData] = useState({ tag_name: '', node_id: '', unit: '' });

  // --- DÜZENLEME İŞLEMLERİ (Edit) ---
  const openEditModal = (conn) => {
    setEditConnData({
      id: conn.id,
      name: conn.name,
      endpoint_url: conn.endpoint_url
    });
    setIsEditModalOpen(true);
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
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      alert("Bağlantı güncellenemedi.");
    }
  };

  // --- AKTİF / PASİF GEÇİŞİ ---
  const handleToggleEnabled = async (conn) => {
    try {
      await api.updateConnection(conn.id, { enabled: !conn.enabled });
      onRefresh(); 
    } catch (err) {
      console.error("Durum güncellenemedi:", err);
      alert("Bağlantı durumu değiştirilemedi.");
    }
  };

  // --- BAĞLANTI İŞLEMLERİ (Ekleme/Silme) ---
  const handleAddConnection = async (e) => {
    e.preventDefault();
    try {
      if (!newConnData.name || !newConnData.endpoint_url) return alert("Lütfen tüm alanları doldurun.");
      await api.addConnection(newConnData);
      setNewConnData({ name: '', endpoint_url: '' });
      setIsConnModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error("Bağlantı ekleme hatası:", err);
      alert("Bağlantı eklenemedi.");
    }
  };

  const fetchTags = async (connId) => {
    try {
      const res = await api.getTags(connId);
      setTags(res.data);
    } catch (err) {
      console.error("Tag çekme hatası:", err);
    }
  };

  const openTagManager = (conn) => {
    if (!conn.enabled) return; 
    setSelectedConn(conn);
    fetchTags(conn.id);
    setIsTagModalOpen(true);
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    try {
      await api.addTag({ ...newTagData, connection_id: selectedConn.id });
      setNewTagData({ tag_name: '', node_id: '', unit: '' });
      fetchTags(selectedConn.id);
    } catch (err) {
      console.error("Tag ekleme hatası:", err);
    }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm("Bu tag'i silmek istediğinize emin misiniz?")) {
      await api.deleteTag(id);
      fetchTags(selectedConn.id);
    }
  };

  const handleDeleteConnection = async (id) => {
    if (window.confirm("Bu bağlantıyı ve tüm taglerini silmek istediğinize emin misiniz?")) {
      try {
        await api.deleteConnection(id);
        onRefresh();
      } catch (err) {
        alert("Silme işlemi başarısız.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER BÖLÜMÜ */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Connectivity Manager</h2>
          <p className="text-slate-500 italic">Enable or disable data streams and manage OPC UA nodes.</p>
        </div>
        <button 
          onClick={() => setIsConnModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <PlusCircle size={20} /> Add New Source
        </button>
      </div>

      {/* BAĞLANTI KARTLARI LİSTESİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map(conn => (
          <div 
            key={conn.id} 
            className={`bg-slate-900 border rounded-[2rem] p-7 shadow-xl relative overflow-hidden transition-all duration-300 ${
              conn.enabled 
                ? 'border-slate-800 hover:border-slate-700' 
                : 'border-red-900/20 opacity-50 bg-slate-950/50'
            }`}
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              !conn.enabled ? 'bg-slate-800' : (conn.status ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-500')
            }`} />
            
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className={`font-bold text-xl truncate pr-4 ${conn.enabled ? 'text-slate-100' : 'text-slate-600'}`}>
                    {conn.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    <Globe size={12} />
                    <p className="text-[10px] font-mono truncate max-w-[150px]">{conn.endpoint_url}</p>
                  </div>
               </div>
               
               <div className="flex flex-col gap-2">
                 <button 
                  onClick={() => handleToggleEnabled(conn)}
                  className={`p-2.5 rounded-xl transition-all shadow-inner ${
                    conn.enabled 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20' 
                    : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title={conn.enabled ? "Disable Source" : "Enable Source"}
                 >
                  {conn.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                 </button>
                 
                 {/* DÜZENLE BUTONU */}
                 <button 
                  onClick={() => openEditModal(conn)}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:text-blue-400 hover:border-blue-400/30 transition-all"
                  title="Edit Source"
                 >
                   <Edit2 size={18} />
                 </button>
               </div>
            </div>
            
            <div className="flex gap-2 mt-8">
              <button 
                disabled={!conn.enabled}
                onClick={() => openTagManager(conn)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  conn.enabled 
                  ? 'bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300' 
                  : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
                }`}
              >
                <Tag size={14}/> Manage Tags
              </button>
              <button 
                onClick={() => handleDeleteConnection(conn.id)}
                className="px-4 bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/30"
              >
                <Trash2 size={16}/>
              </button>
            </div>

            {conn.enabled && (
              <div className="mt-5 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${conn.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {conn.status ? 'Stream Active' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-slate-600">ID: {conn.id}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- MODAL: EDIT CONNECTION --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[210] p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Edit2 size={24}/></div>
                <h3 className="text-xl font-bold text-slate-100">Edit Data Source</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>

            <form onSubmit={handleUpdateConnection} className="space-y-5">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-widest ml-1">Friendly Name</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 text-slate-100"
                  value={editConnData.name} onChange={e => setEditConnData({...editConnData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-widest ml-1">Endpoint URL</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm font-mono outline-none focus:border-amber-500 text-slate-100"
                  value={editConnData.endpoint_url} onChange={e => setEditConnData({...editConnData, endpoint_url: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 transition-all">
                <Save size={18}/> Update Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW CONNECTION --- (Aynı Kaldı) */}
      {isConnModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Database size={24}/></div>
                <h3 className="text-xl font-bold text-slate-100">New Data Source</h3>
              </div>
              <button onClick={() => setIsConnModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>

            <form onSubmit={handleAddConnection} className="space-y-5">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-widest ml-1">Friendly Name</label>
                <input type="text" placeholder="Line 1 Controller" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm outline-none focus:border-blue-500"
                  value={newConnData.name} onChange={e => setNewConnData({...newConnData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-widest ml-1">Endpoint URL</label>
                <input type="text" placeholder="opc.tcp://127.0.0.1:4840" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm font-mono outline-none focus:border-blue-500"
                  value={newConnData.endpoint_url} onChange={e => setNewConnData({...newConnData, endpoint_url: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 transition-all">
                <Save size={18}/> Establish Connection
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TAG MANAGEMENT --- (Aynı Kaldı) */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Activity size={24}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight">{selectedConn?.name}</h3>
                  <p className="text-xs text-slate-500 font-mono italic">{selectedConn?.endpoint_url}</p>
                </div>
              </div>
              <button onClick={() => setIsTagModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-5 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Register New Node</h4>
                <form onSubmit={handleAddTag} className="space-y-4 bg-slate-800/20 p-8 rounded-[2rem] border border-slate-800/50">
                  <input type="text" placeholder="Tag Name (e.g. Speed)" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500"
                    value={newTagData.tag_name} onChange={e => setNewTagData({...newTagData, tag_name: e.target.value})} required />
                  <input type="text" placeholder="Node ID (ns=1;s=Speed)" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-sm font-mono outline-none focus:border-blue-500"
                    value={newTagData.node_id} onChange={e => setNewTagData({...newTagData, node_id: e.target.value})} required />
                  <input type="text" placeholder="Unit (RPM)" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500"
                    value={newTagData.unit} onChange={e => setNewTagData({...newTagData, unit: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 transition-all active:scale-95">
                    <PlusCircle size={18}/> Add Node
                  </button>
                </form>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Node List</h4>
                <div className="space-y-3">
                  {tags.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/10 rounded-[2rem] border border-dashed border-slate-800">
                        <p className="text-slate-600 italic text-sm">No data points registered.</p>
                    </div>
                  ) : tags.map(tag => (
                    <div key={tag.id} className="bg-slate-800/40 border border-slate-800/60 p-5 rounded-2xl flex justify-between items-center group">
                      <div>
                        <div className="text-sm font-bold text-slate-200">{tag.tag_name}</div>
                        <div className="text-[10px] font-mono text-slate-500 italic">{tag.node_id}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">{tag.unit || '-'}</span>
                        <button onClick={() => handleDeleteTag(tag.id)} className="text-slate-700 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPage;