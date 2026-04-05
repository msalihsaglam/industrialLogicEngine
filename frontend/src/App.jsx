import React, { useEffect, useState } from 'react';
import { 
  ChevronRight, Activity, Menu, LayoutDashboard, PlusCircle, 
  Settings, Zap, LogOut, User, Users, Database, ChevronDown, Cpu, 
  BarChart2, BatteryCharging, // 🔋 Enerji İkonu
  ShieldCheck as ShieldIcon, 
  History as HistoryIcon 
} from 'lucide-react'; 
import { socket, api } from './services/api';

// Pages
import Dashboard from './pages/Dashboard';
import RuleManagement from './pages/RuleManagement';
import ConnectionPage from './pages/ConnectionPage';
import Incidents from './pages/Incidents';
import UserManagement from './pages/UserManagement';
import VirtualTags from './pages/VirtualTags';
import HistorianSettings from './pages/HistorianSettings';
import Reports from './pages/Reports';
import Login from './pages/Login';
import EnergyIntelligence from './pages/EnergyModule/EnergyIntelligence';

function App() {
  const [user, setUser] = useState(null);
  const [liveData, setLiveData] = useState({}); 
  const [rules, setRules] = useState([]);
  const [alarms, setAlarms] = useState([]); 
  const [connections, setConnections] = useState([]);
  const [allTags, setAllTags] = useState([]); // 🎯 Enerji Modülü için Kritik: Tüm taglerin listesi
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openSubMenu, setOpenSubMenu] = useState(null);

  // --- ⚙️ DATA SYNC ---
  const refreshAllData = async (userId) => {
    if (!userId) return;
    try {
      const [rulesRes, connRes, tagsRes] = await Promise.all([
        api.getRules(userId),
        api.getConnections(),
        api.getAllTags() // 🎯 Backend'de tüm tagleri dönen bir endpoint olduğunu varsayıyoruz
      ]);
      setRules(rulesRes.data);
      setConnections(connRes.data);
      setAllTags(tagsRes.data || []);
    } catch (err) { console.error("Sync Error:", err); }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('logic_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      refreshAllData(parsedUser.id);
      socket.emit('join_user_room', parsedUser.id);
    }

    socket.on("liveData", (data) => {
      setLiveData(prev => ({
        ...prev,
        [data.tagId]: {
          value: data.value,
          tagName: data.tagName,
          unit: data.unit,
          sourceName: data.sourceName
        }
      }));
    });

    socket.on('alarm', (newAlarm) => {
      setAlarms(prev => [newAlarm, ...prev].slice(0, 50));
    });

    socket.on('connectionStatusUpdate', (updatedConn) => {
      setConnections(prev => prev.map(conn => conn.id === updatedConn.id ? { ...conn, status: updatedConn.status } : conn));
    });

    socket.on('connect', () => {
      const u = localStorage.getItem('logic_user');
      if (u) socket.emit('join_user_room', JSON.parse(u).id);
    });

    return () => {
      socket.off('liveData');
      socket.off('alarm');
      socket.off('connectionStatusUpdate');
      socket.off('connect');
    };
  }, []);

  const handleLogin = (authData) => {
    setUser(authData.user);
    localStorage.setItem('logic_user', JSON.stringify(authData.user));
    localStorage.setItem('token', authData.token);
    socket.emit('join_user_room', authData.user.id);
    refreshAllData(authData.user.id);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
    socket.disconnect();
    window.location.reload();
  };

  if (!user) { return <Login onLogin={handleLogin} />; }

  // --- 🧭 NAVIGATION CONFIGURATION ---
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'operator'] },
    
    // 🚀 ENERGY MODULE (Bağımsız Modül Olarak Eklendi)
    { id: 'energy', label: 'Energy Module', icon: <BatteryCharging size={20} />, roles: ['admin', 'operator'] },
    
    { id: 'incidents', label: 'Incidents', icon: <Zap size={20} />, roles: ['admin', 'operator'] },
    { 
      id: 'tag_mgmt', 
      label: 'Tag Management', 
      icon: <Database size={20} />, 
      roles: ['admin'],
      children: [
        { id: 'connections', label: 'Connections', icon: <Activity size={16} /> },
        { id: 'virtual_tags', label: 'Virtual Tags', icon: <Cpu size={16} /> }
      ]
    },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} />, roles: ['admin', 'operator'] },
    { id: 'reports', label: 'Intelligence', icon: <BarChart2 size={20} />, roles: ['admin', 'operator'] },
    { id: 'historian', label: 'Historian Hub', icon: <HistoryIcon size={20} />, roles: ['admin'] },
    { id: 'users', label: 'User Management', icon: <Users size={20} />, roles: ['admin'] },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* 🧭 SIDEBAR SECTION */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <div className="flex items-center gap-2 font-black text-blue-400 tracking-wider italic text-lg"><Activity size={24} /> <span>LOGIC.IO</span></div>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Menu size={20} /></button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => (
              <div key={item.id} className="space-y-1">
                <button 
                  onClick={() => {
                    if (item.children) {
                      setOpenSubMenu(openSubMenu === item.id ? null : item.id);
                    } else {
                      setActiveTab(item.id);
                      setOpenSubMenu(null);
                    }
                  }} 
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all relative group ${
                    activeTab === item.id || openSubMenu === item.id ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
                  } ${activeTab === item.id && !item.children ? (item.id === 'energy' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white shadow-lg') : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`min-w-[20px] ${activeTab === 'energy' && item.id === 'energy' ? 'text-white' : (item.id === 'energy' ? 'text-amber-500' : '')}`}>
                        {item.icon}
                    </div>
                    {isSidebarOpen && <span className="font-bold text-[11px] uppercase tracking-widest">{item.label}</span>}
                  </div>
                  {isSidebarOpen && item.children && (
                    <ChevronDown size={14} className={`transition-transform duration-300 ${openSubMenu === item.id ? 'rotate-180' : ''}`} />
                  )}
                  {item.id === 'incidents' && alarms.length > 0 && (
                    <span className="absolute right-2 bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse text-white">{alarms.length}</span>
                  )}
                </button>

                {isSidebarOpen && item.children && openSubMenu === item.id && (
                  <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {item.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider ${
                          activeTab === child.id ? 'text-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        {child.icon} {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 text-slate-400 bg-slate-950/50 rounded-xl mb-2 border border-slate-800/50">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><User size={16} /></div>
              <span className="text-[10px] font-black truncate uppercase tracking-tighter italic">{user.username}</span>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group">
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest">Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* 🏛️ MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] italic opacity-60">
              <span>Security Node</span> <ChevronRight size={14} /> <span className="text-blue-400 tracking-normal">{activeTab.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border flex items-center gap-2 tracking-widest ${user.role === 'admin' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'}`}>
                <ShieldIcon size={12} />
                <span className="ml-1">{user.role} Authorization</span>
              </div>
              <div className="text-[10px] font-mono text-green-400 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 uppercase tracking-widest font-black animate-pulse">
                {socket.connected ? "Node Online" : "Reconnecting"}
              </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activeTab === 'dashboard' && <Dashboard liveData={liveData} connections={connections} userId={user.id} />}
          
          {/* 🚀 ENERGY MODULE RENDERING (Kritik Ekleme) */}
          {activeTab === 'energy' && <EnergyIntelligence liveData={liveData} connections={connections} allTags={allTags} />}
          
          {activeTab === 'incidents' && <Incidents alarms={alarms} onClearAlarms={() => setAlarms([])} />}
          {activeTab === 'rules' && <RuleManagement rules={rules} connections={connections} onRefresh={() => refreshAllData(user.id)} userId={user.id} />}
          {activeTab === 'connections' && <ConnectionPage connections={connections} onRefresh={() => refreshAllData(user.id)} />}
          {activeTab === 'virtual_tags' && <VirtualTags connections={connections} />}
          {activeTab === 'historian' && <HistorianSettings connections={connections} />}
          {activeTab === 'reports' && <Reports liveData={liveData} />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
}

export default App;