import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, X, Database, Tag, Globe, Activity } from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections, onRefresh }) => {
  // Modal States
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  
  // Data States
  const [selectedConn, setSelectedConn] = useState(null);
  const [tags, setTags] = useState([]);
  
  // Form States
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '' });
  const [newTagData, setNewTagData] = useState({ tag_name: '', node_id: '', unit: '' });

  // --- BAĞLANTI İŞLEMLERİ (Connection) ---
  const handleAddConnection = async (e) => {
    e.preventDefault();
    try {
      if (!newConnData.name || !newConnData.endpoint_url) return alert("Lütfen tüm alanları doldurun.");
      
      await api.addConnection(newConnData);
      setNewConnData({ name: '', endpoint_url: '' });
      setIsConnModalOpen(false);
      onRefresh(); // Ana sayfadaki listeyi yeniler
    } catch (err) {
      console.error("Bağlantı ekleme hatası:", err);
      alert("Bağlantı eklenemedi.");
    }
  };

  // --- ETİKET İŞLEMLERİ (Tag) ---
  const fetchTags = async (connId) => {
    try {
      const res = await api.getTags(connId);
      setTags(res.data);
    } catch (err) {
      console.error("Tag çekme hatası:", err);
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
      setNewTagData({ tag_name: '', node_id: '', unit: '' });
      fetchTags(selectedConn.id);
      // Not: onRefresh burada da çağrılabilir eğer bağlantı kartında 
      // tag sayısını gösteriyorsan, değilse opsiyoneldir.
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

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER BÖLÜMÜ */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold">Data Orchestration</h2>
          <p className="text-slate-500 italic">Manage your industrial data sources and OPC UA nodes.</p>
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
          <div key={conn.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${conn.status ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-500'}`} />
            
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="font-bold text-xl text-slate-100 truncate pr-4">{conn.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    <Globe size={12} />
                    <p className="text-[10px] font-mono truncate max-w-[180px]">{conn.endpoint_url}</p>
                  </div>
               </div>
               <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${conn.status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {conn.status ? 'Online' : 'Offline'}
               </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => openTagManager(conn)}
                className="flex-1 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Tag size={14}/> Manage Tags
              </button>
              <button className="px-4 bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/30">
                <Trash2 size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL: NEW CONNECTION --- */}
      {isConnModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Database size={24}/></div>
                <h3 className="text-xl font-bold text-slate-100">Add New Source</h3>
              </div>
              <button onClick={() => setIsConnModalOpen(false)} className="text-slate-500 hover:text-white p-1"><X size={24}/></button>
            </div>

            <form onSubmit={handleAddConnection} className="space-y-5">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-[0.2em] ml-1">Friendly Name</label>
                <input type="text" placeholder="e.g. Siemens S7-1200" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all"
                  value={newConnData.name} onChange={e => setNewConnData({...newConnData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-[0.2em] ml-1">Endpoint URL</label>
                <input type="text" placeholder="opc.tcp://192.168.1.10:4840" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm font-mono outline-none focus:border-blue-500 transition-all"
                  value={newConnData.endpoint_url} onChange={e => setNewConnData({...newConnData, endpoint_url: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-6 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                <Save size={18}/> Initialize Source
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TAG MANAGEMENT --- */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Activity size={24}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-100 tracking-tight uppercase">{selectedConn?.name}</h3>
                  <p className="text-xs text-slate-500 font-mono italic">{selectedConn?.endpoint_url}</p>
                </div>
              </div>
              <button onClick={() => setIsTagModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Form Kısmı (2/5 genişlik) */}
              <div className="lg:col-span-2 space-y-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Configure New Node</h4>
                <form onSubmit={handleAddTag} className="space-y-4 bg-slate-800/20 p-8 rounded-[2rem] border border-slate-800/50">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold ml-1 uppercase">Display Name</label>
                    <input type="text" placeholder="e.g. Boiler Pressure" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500"
                      value={newTagData.tag_name} onChange={e => setNewTagData({...newTagData, tag_name: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold ml-1 uppercase">OPC Node ID</label>
                    <input type="text" placeholder="ns=1;s=Pressure" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-sm font-mono outline-none focus:border-blue-500"
                      value={newTagData.node_id} onChange={e => setNewTagData({...newTagData, node_id: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold ml-1 uppercase">Unit</label>
                    <input type="text" placeholder="BAR / PSI / °C" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500"
                      value={newTagData.unit} onChange={e => setNewTagData({...newTagData, unit: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/10">
                    <PlusCircle size={18}/> Register Data Point
                  </button>
                </form>
              </div>

              {/* Liste Kısmı (3/5 genişlik) */}
              <div className="lg:col-span-3 space-y-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Active Node List</h4>
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {tags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/10 rounded-[2rem] border border-dashed border-slate-800">
                        <Tag size={40} className="text-slate-800 mb-4" />
                        <p className="text-slate-600 italic text-sm">No data points registered for this source.</p>
                    </div>
                  ) : tags.map(tag => (
                    <div key={tag.id} className="bg-slate-800/40 border border-slate-800/60 p-5 rounded-2xl flex justify-between items-center group hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-900 rounded-lg text-blue-500 font-bold text-xs">{tag.unit || '-'}</div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{tag.tag_name}</div>
                          <div className="text-[10px] font-mono text-slate-500 tracking-tight">{tag.node_id}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTag(tag.id)} 
                        className="text-slate-700 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18}/>
                      </button>
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