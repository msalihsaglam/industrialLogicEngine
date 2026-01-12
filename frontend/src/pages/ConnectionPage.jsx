import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, XCircle, Trash2, Save } from 'lucide-react';
import { api } from '../services/api';

const ConnectionPage = ({ connections, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '' });

  const handleAddConnection = async (e) => {
    e.preventDefault();
    if (!newConnData.name || !newConnData.endpoint_url) return alert("Alanları doldurun.");
    await api.addConnection(newConnData);
    setIsModalOpen(false);
    setNewConnData({ name: '', endpoint_url: '' });
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold">Data Orchestration</h2>
          <p className="text-slate-500">Manage heterogeneous OPC UA connections</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
          <PlusCircle size={20} /> Add New Source
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map(conn => (
          <div key={conn.id} className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl border-l-4 ${conn.status ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="max-w-[150px]">
                <h3 className="font-bold text-lg text-slate-200 truncate">{conn.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono truncate">{conn.endpoint_url}</p>
              </div>
              <div className={`p-1.5 rounded-full ${conn.status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {conn.status ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs text-slate-400 uppercase tracking-widest font-bold">Configure</button>
              <button className="px-3 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-6 text-blue-400">Add New Source</h3>
            <div className="space-y-4">
              <input type="text" placeholder="System Identifier" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none" 
                value={newConnData.name} onChange={(e) => setNewConnData({...newConnData, name: e.target.value})} />
              <input type="text" placeholder="opc.tcp://..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                value={newConnData.endpoint_url} onChange={(e) => setNewConnData({...newConnData, endpoint_url: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-xs uppercase">Cancel</button>
              <button onClick={handleAddConnection} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"><Save size={16}/> Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPage;