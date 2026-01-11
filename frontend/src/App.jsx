import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Activity, AlertTriangle, Settings, Database, 
  Menu, X, LayoutDashboard, PlusCircle, History, ChevronRight,
  Thermometer, Gauge
} from 'lucide-react';

const socket = io('http://localhost:3001');

function App() {
  // State: Çoklu veri yapısı
  const [liveData, setLiveData] = useState({ Pressure: 0, Temperature: 0 });
  const [rules, setRules] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // 1. Kuralları çek
    axios.get('http://localhost:3001/api/rules').then(res => setRules(res.data));

    // 2. Canlı veriyi dinle (Tag bazlı güncelleme)
    socket.on('liveData', (data) => {
      setLiveData(prev => ({
        ...prev,
        [data.tag]: data.value // Gelen tag ismine göre (Pressure/Temperature) ilgili yeri günceller
      }));
    });

    // 3. Alarmları dinle
    socket.on('alarm', (newAlarm) => {
      setAlarms(prev => [newAlarm, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('liveData');
      socket.off('alarm');
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} /> },
    { id: 'history', label: 'Alarm History', icon: <History size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-blue-400 tracking-wider">
              <Activity size={24} /> <span>LOGIC.IO</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="min-w-[20px]">{item.icon}</div>
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>Home</span> <ChevronRight size={14} /> <span className="text-blue-400 capitalize">{activeTab}</span>
           </div>
           <div className="text-sm font-mono text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              OPC UA: CONNECTED
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Sensör Kartları Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pressure Card */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Gauge size={80} />
                  </div>
                  <h2 className="text-slate-400 font-medium mb-1 flex items-center gap-2">
                    <Database size={16} /> Pressure Sensor
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-blue-400 tracking-tighter">
                      {liveData.Pressure.toFixed(2)}
                    </span>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">PSI</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(liveData.Pressure / 60) * 100}%` }}></div>
                  </div>
                </div>

                {/* Temperature Card */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Thermometer size={80} />
                  </div>
                  <h2 className="text-slate-400 font-medium mb-1 flex items-center gap-2">
                    <Thermometer size={16} className="text-orange-500" /> Temperature Sensor
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-orange-400 tracking-tighter">
                      {liveData.Temperature.toFixed(2)}
                    </span>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">°C</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${(liveData.Temperature / 80) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Alarms & History Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h2 className="text-slate-400 font-medium mb-4 flex items-center gap-2">Active Logic Rules</h2>
                  <div className="space-y-2">
                    {rules.map(r => (
                      <div key={r.id} className="flex justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800 text-sm">
                        <span className="text-blue-300 font-mono">{r.tag_name}</span>
                        <span className="text-slate-400">{r.operator} {r.threshold}</span>
                        <span className="text-green-500 text-xs bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Active</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-fit">
                  <h2 className="text-slate-400 font-medium mb-4 flex items-center gap-2 text-amber-500">
                    <AlertTriangle size={18} /> Recent Alarms
                  </h2>
                  <div className="space-y-3">
                    {alarms.length === 0 ? (
                      <div className="text-slate-600 text-sm italic text-center py-4">No alerts in queue</div>
                    ) : (
                      alarms.map((a, i) => (
                        <div key={i} className="bg-red-500/5 border-l-2 border-red-500 p-3 rounded-r animate-in slide-in-from-right-2">
                          <div className="font-bold text-red-400 text-xs">{a.message}</div>
                          <div className="text-slate-500 text-[10px] mt-1 font-mono">{a.time} | Val: {a.value.toFixed(1)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'rules' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Rule Management</h2>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
                    <PlusCircle size={18} /> Create New Rule
                  </button>
               </div>
               
               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Settings size={32} />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Configure System Logic</h3>
                  <p className="text-slate-500 mb-6">Create automated actions based on sensor thresholds and data trends.</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;