import React, { useEffect, useState } from 'react';
import { ChevronRight, Activity, Menu, LayoutDashboard, PlusCircle, Settings } from 'lucide-react';
import { socket, api } from './services/api';
import Dashboard from './pages/Dashboard';
import RuleManagement from './pages/RuleManagement';
import ConnectionPage from './pages/ConnectionPage';

function App() {
  const [liveData, setLiveData] = useState({ Pressure: 0, Temperature: 0 });
  const [rules, setRules] = useState([]);
  const [alarms, setAlarms] = useState([]); // Sadece o anki canlı uyarılar
  const [connections, setConnections] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    refreshAllData();

    socket.on('liveData', (data) => setLiveData(prev => ({ ...prev, [data.tagName]: data.value })));
    socket.on('alarm', (newAlarm) => setAlarms(prev => [newAlarm, ...prev].slice(0, 5)));

    return () => socket.off();
  }, []);

  const refreshAllData = () => {
    api.getRules().then(res => setRules(res.data));
    api.getConnections().then(res => setConnections(res.data));
  };

  // History buradan kaldırıldı
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} /> },
    { id: 'connections', label: 'Connections', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
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

      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-2 text-slate-400 text-sm"><span>Home</span> <ChevronRight size={14} /> <span className="text-blue-400 capitalize">{activeTab}</span></div>
           <div className="text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest font-bold">
            {socket.connected ? "System Online" : "Connecting..."}
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <Dashboard liveData={liveData} alarms={alarms} />}
          {activeTab === 'rules' && <RuleManagement rules={rules} onRefresh={refreshAllData} />}
          {activeTab === 'connections' && <ConnectionPage connections={connections} onRefresh={refreshAllData} />}
        </div>
      </main>
    </div>
  );
}

export default App;