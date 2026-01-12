import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Activity, AlertTriangle, Settings, Database, 
  Menu, X, LayoutDashboard, PlusCircle, History, ChevronRight,
  Thermometer, Gauge, Trash2, Save, Play, Globe, CheckCircle2, XCircle
} from 'lucide-react';

const socket = io('http://localhost:3001');

function App() {
  const [liveData, setLiveData] = useState({ Pressure: 0, Temperature: 0 });
  const [rules, setRules] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [connections, setConnections] = useState([]); // Yeni: Bağlantı listesi
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Settings Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConnData, setNewConnData] = useState({ name: '', endpoint_url: '' });

  const [newRule, setNewRule] = useState({
    tag_name: 'Pressure',
    operator: '>',
    threshold: '',
    alert_message: ''
  });

  useEffect(() => {
    fetchRules();
    fetchConnections(); // Sayfa açıldığında bağlantıları çek

    // Socket Dinleyicileri
    socket.on('connect', () => console.log("🟢 Socket Bağlantısı Başarılı"));
    
    socket.on('liveData', (data) => {
      if (data.tag) {
        setLiveData(prev => ({ ...prev, [data.tag]: data.value }));
      }
    });

    socket.on('alarm', (newAlarm) => {
      setAlarms(prev => [newAlarm, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('connect');
      socket.off('liveData');
      socket.off('alarm');
    };
  }, []);

  // --- API FONKSİYONLARI ---
  
  const fetchRules = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/rules');
      setRules(res.data);
    } catch (err) { console.error("Hata:", err); }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/connections');
      setConnections(res.data);
    } catch (err) { console.error("Hata:", err); }
  };

  const handleAddConnection = async (e) => {
    e.preventDefault();
    if (!newConnData.name || !newConnData.endpoint_url) return alert("Lütfen alanları doldurun.");
    
    try {
      await axios.post('http://localhost:3001/api/connections', newConnData);
      setIsModalOpen(false);
      setNewConnData({ name: '', endpoint_url: '' });
      fetchConnections(); // Listeyi yenile
    } catch (err) { alert("Bağlantı eklenemedi."); }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.threshold || !newRule.alert_message) return alert("Lütfen tüm alanları doldurun.");
    await axios.post('http://localhost:3001/api/rules', newRule);
    setNewRule({ tag_name: 'Pressure', operator: '>', threshold: '', alert_message: '' });
    fetchRules();
  };

  const deleteRule = async (id) => {
    if (window.confirm("Bu kuralı silmek istediğinize emin misiniz?")) {
      await axios.delete(`http://localhost:3001/api/rules/${id}`);
      fetchRules();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    { id: 'history', label: 'Alarm History', icon: <History size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <div className="flex items-center gap-2 font-bold text-blue-400 tracking-wider"><Activity size={24} /> <span>LOGIC.IO</span></div>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Menu size={20} /></button>
        </div>
        <nav className="flex-1 px-3 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <div className="min-w-[20px]">{item.icon}</div>
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-2 text-slate-400 text-sm"><span>Home</span> <ChevronRight size={14} /> <span className="text-blue-400 capitalize">{activeTab}</span></div>
           <div className="text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
            {socket.connected ? "System Online" : "Connecting..."}
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
               <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                  <h2 className="text-slate-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-widest font-semibold"><Gauge size={16}/> Pressure</h2>
                  <div className="text-6xl font-black text-blue-400">{liveData.Pressure.toFixed(2)} <span className="text-xl text-slate-600">PSI</span></div>
               </div>
               <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                  <h2 className="text-slate-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-widest font-semibold"><Thermometer size={16}/> Temperature</h2>
                  <div className="text-6xl font-black text-orange-400">{liveData.Temperature.toFixed(2)} <span className="text-xl text-slate-600">°C</span></div>
               </div>
               <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h2 className="text-slate-400 font-medium mb-6 flex items-center gap-2 text-amber-500 uppercase text-xs tracking-widest">Recent Alarms</h2>
                  <div className="space-y-4">
                    {alarms.length === 0 ? <p className="text-slate-600 italic text-sm text-center py-4">Safe operation. No alarms detected.</p> : alarms.map((a, i) => (
                      <div key={i} className="bg-red-500/5 border-l-2 border-red-500 p-3 text-xs flex justify-between items-center">
                        <div><div className="font-bold text-red-400">{a.message}</div><div className="text-slate-500 mt-1">{a.time}</div></div>
                        <div className="text-red-300 font-mono">Val: {a.value?.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-bold">Data Orchestration</h2>
                  <p className="text-slate-500">Manage heterogeneous OPC UA connections</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
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

              {/* MODAL */}
              {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                    <h3 className="text-xl font-bold mb-6 text-blue-400">Add New Data Source</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-[0.2em] font-bold">System Identifier</label>
                        <input type="text" placeholder="Line 1 - S7 PLC" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none" 
                          value={newConnData.name} onChange={(e) => setNewConnData({...newConnData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-[0.2em] font-bold">Endpoint URI</label>
                        <input type="text" placeholder="opc.tcp://127.0.0.1:4840" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                          value={newConnData.endpoint_url} onChange={(e) => setNewConnData({...newConnData, endpoint_url: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                      <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-xs uppercase">Cancel</button>
                      <button onClick={handleAddConnection} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 tracking-widest"><Save size={16}/> Connect</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RULES MANAGEMENT (Önceki kodla aynı) */}
          {activeTab === 'rules' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400"><PlusCircle size={20} /> New Logic Rule</h3>
                  <form onSubmit={handleAddRule} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Sensor</label>
                      <select value={newRule.tag_name} onChange={(e) => setNewRule({...newRule, tag_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none">
                        <option value="Pressure">Pressure</option><option value="Temperature">Temperature</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Operator</label>
                        <select value={newRule.operator} onChange={(e) => setNewRule({...newRule, operator: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none">
                          <option value=">">&gt;</option><option value="<">&lt;</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Threshold</label>
                        <input type="number" placeholder="45" value={newRule.threshold} onChange={(e) => setNewRule({...newRule, threshold: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider font-semibold">Message</label>
                      <textarea placeholder="Alert text..." value={newRule.alert_message} onChange={(e) => setNewRule({...newRule, alert_message: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none h-24" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Save size={18} /> Save</button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold mb-6 text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2"><Play size={16}/> Active Systems Logic</h3>
                  <table className="w-full text-left text-sm">
                    <thead><tr className="text-slate-500 text-xs uppercase border-b border-slate-800"><th className="pb-4">Tag</th><th className="pb-4">Condition</th><th className="pb-4">Message</th><th className="pb-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-800">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-800/30"><td className="py-4 text-blue-400 font-mono">{rule.tag_name}</td><td className="py-4 font-medium">{rule.operator} {rule.threshold}</td><td className="py-4 text-xs text-slate-400">{rule.alert_message}</td><td className="py-4 text-right"><button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;