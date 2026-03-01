import React, { useState } from 'react';
import { PlusCircle, Trash2, Save, X, Database, Tag, Globe, Activity, Power, PowerOff, Edit2 } from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections, onRefresh }) => {
  // Modal & Data States (Mevcut mantık korundu)
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConn, setSelectedConn] = useState(null);
  const [tags, setTags] = useState([]);
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '' });
  const [editConnData, setEditConnData] = useState({ id: '', name: '', endpoint_url: '' });
  const [newTagData, setNewTagData] = useState({ tag_name: '', node_id: '', unit: '' });

  // ... (Geri kalan tüm fonksiyonlar: handleUpdateConnection, handleToggleEnabled, fetchTags vb. aynı kalıyor)
  const openEditModal = (conn) => { setEditConnData({ id: conn.id, name: conn.name, endpoint_url: conn.endpoint_url }); setIsEditModalOpen(true); };
  const handleUpdateConnection = async (e) => { e.preventDefault(); try { await api.updateConnection(editConnData.id, { name: editConnData.name, endpoint_url: editConnData.endpoint_url }); setIsEditModalOpen(false); onRefresh(); } catch (err) { alert("Bağlantı güncellenemedi."); } };
  const handleToggleEnabled = async (conn) => { try { await api.updateConnection(conn.id, { enabled: !conn.enabled }); onRefresh(); } catch (err) { alert("Bağlantı durumu değiştirilemedi."); } };
  const handleAddConnection = async (e) => { e.preventDefault(); try { await api.addConnection(newConnData); setIsConnModalOpen(false); onRefresh(); } catch (err) { alert("Ekleme hatası"); } };
  const fetchTags = async (connId) => { try { const res = await api.getTags(connId); setTags(res.data); } catch (err) { console.error(err); } };
  const openTagManager = (conn) => { if (!conn.enabled) return; setSelectedConn(conn); fetchTags(conn.id); setIsTagModalOpen(true); };
  const handleAddTag = async (e) => { e.preventDefault(); try { await api.addTag({ ...newTagData, connection_id: selectedConn.id }); setNewTagData({ tag_name: '', node_id: '', unit: '' }); fetchTags(selectedConn.id); } catch (err) { console.error(err); } };
  const handleDeleteTag = async (id) => { if (window.confirm("Silinsin mi?")) { await api.deleteTag(id); fetchTags(selectedConn.id); } };
  const handleDeleteConnection = async (id) => { if (window.confirm("Tüm tagler ile birlikte silinsin mi?")) { try { await api.deleteConnection(id); onRefresh(); } catch (err) { alert("Hata"); } } };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 px-4">
      
      {/* STANDART SAYFA BAŞLIĞI */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Connectivity</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] mt-2 italic uppercase">
            Industrial Gateway & OPC UA Interface Manager
          </p>
        </div>
        <button 
          onClick={() => setIsConnModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
        >
          <PlusCircle size={20} /> Add New Source
        </button>
      </div>

      {/* İÇERİK: BAĞLANTI KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {connections.map(conn => (
          <div 
            key={conn.id} 
            className={`bg-slate-900 border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-300 group ${
              conn.enabled 
                ? 'border-slate-800 hover:border-slate-600' 
                : 'border-red-900/10 opacity-40 bg-slate-950/50'
            }`}
          >
            {/* Durum Şeridi */}
            <div className={`absolute top-0 left-0 w-2 h-full ${
              !conn.enabled ? 'bg-slate-800' : (conn.status ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-red-500')
            }`} />
            
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className={`font-black text-2xl tracking-tight mb-2 ${conn.enabled ? 'text-slate-100' : 'text-slate-600'}`}>
                    {conn.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Globe size={14} className="opacity-50" />
                    <p className="text-[10px] font-mono truncate max-w-[180px] tracking-tight">{conn.endpoint_url}</p>
                  </div>
               </div>
               
               <div className="flex flex-col gap-3">
                 <button 
                  onClick={() => handleToggleEnabled(conn)}
                  className={`p-3 rounded-2xl transition-all shadow-inner border ${
                    conn.enabled 
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20' 
                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                  }`}
                 >
                  {conn.enabled ? <Power size={20} /> : <PowerOff size={20} />}
                 </button>
                 <button 
                  onClick={() => openEditModal(conn)}
                  className="p-3 rounded-2xl bg-slate-800 text-slate-500 border border-slate-700 hover:text-amber-500 hover:border-amber-500/30 transition-all"
                 >
                   <Edit2 size={20} />
                 </button>
               </div>
            </div>
            
            <div className="flex gap-3 mt-10">
              <button 
                disabled={!conn.enabled}
                onClick={() => openTagManager(conn)}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  conn.enabled 
                  ? 'bg-slate-800 hover:bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                }`}
              >
                <Tag size={16}/> Manage Nodes
              </button>
              <button 
                onClick={() => handleDeleteConnection(conn.id)}
                className="px-5 bg-slate-800 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/30"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALLAR (Mevcut mantığınla aynı kalabilir) ... */}
    </div>
  );
};

export default ConnectionPage;