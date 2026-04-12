import React, { useEffect, useState } from 'react';
import { 
  ChevronRight, Activity, Menu, LayoutDashboard, PlusCircle, 
  Settings, Zap, LogOut, User, Users, Database, ChevronDown, Cpu, 
  BarChart2, BatteryCharging, ShieldCheck, History, Sun, Moon 
} from 'lucide-react'; 
import { socket, api } from './services/api';

// --- 📂 PAGES ---
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
  const [allTags, setAllTags] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openSubMenu, setOpenSubMenu] = useState(null);
  
  // 🌓 THEME STATE
  const [theme, setTheme] = useState(localStorage.getItem('logic_theme') || 'dark');

  // --- 🌓 THEME CONTROLLER ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('logic_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // --- ⚙️ DATA SYNC ---
  const refreshAllData = async (userId) => {
    if (!userId) return;
    try {
      const [rulesRes, connRes, tagsRes] = await Promise.all([
        api.getRules(userId),
        api.getConnections(),
        api.getAllTags() 
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
      socket.off('liveData'); socket.off('alarm');
      socket.off('connectionStatusUpdate'); socket.off('connect');
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

  // --- 🧭 NAVIGATION CONFIG ---
  const menuItems = [
    { id: 'dashboard', label: 'OPERATIONS', icon: <LayoutDashboard size={18} />, roles: ['admin', 'operator'] },
    { id: 'energy', label: 'ENERGY MODULE', icon: <BatteryCharging size={18} />, roles: ['admin', 'operator'] },
    { id: 'incidents', label: 'INCIDENTS', icon: <Zap size={18} />, roles: ['admin', 'operator'], badge: alarms.length },
    { 
      id: 'tag_mgmt', 
      label: 'INFRASTRUCTURE', 
      icon: <Database size={18} />, 
      roles: ['admin'],
      children: [
        { id: 'connections', label: 'CONNECTIVITY', icon: <Activity size={14} /> },
        { id: 'virtual_tags', label: 'VIRTUAL NODES', icon: <Cpu size={14} /> }
      ]
    },
    { id: 'rules', label: 'LOGIC BUILDER', icon: <PlusCircle size={18} />, roles: ['admin', 'operator'] },
    { id: 'reports', label: 'INTELLIGENCE', icon: <BarChart2 size={18} />, roles: ['admin', 'operator'] },
    { id: 'historian', label: 'HISTORIAN HUB', icon: <History size={18} />, roles: ['admin'] },
    { id: 'users', label: 'ACCESS CONTROL', icon: <Users size={18} />, roles: ['admin'] },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--ind-bg)] text-[var(--ind-text)] transition-colors duration-300 overflow-hidden">
      
      {/* 🧭 SIDEBAR SECTION (IDS Stili) */}
      <aside className={`bg-[var(--ind-panel)] border-r border-[var(--ind-border)] transition-all duration-300 flex flex-col fixed h-full z-[1000] shadow-2xl ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        
        {/* LOGO */}
        <div className="p-6 h-24 flex items-center justify-between border-b border-[var(--ind-border)]">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="p-2 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded border border-[var(--ind-petroleum)]/30 shadow-inner">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter leading-none">LOGIC.IO</span>
                  <span className="ind-label !text-[8px] mt-1 opacity-50">Industrial Core</span>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2.5 ind-panel hover:text-[var(--ind-cyan)] transition-all ${!isSidebarOpen && 'mx-auto'}`}><Menu size={18} /></button>
        </div>
        
        {/* NAV LIST */}
        <nav className="flex-1 px-3 space-y-1.5 mt-8 overflow-y-auto scrollbar-hide">
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => {
              const isActive = activeTab === item.id || openSubMenu === item.id;
              const isEnergy = item.id === 'energy';
              
              return (
                <div key={item.id} className="space-y-1">
                  <button 
                    onClick={() => item.children ? setOpenSubMenu(openSubMenu === item.id ? null : item.id) : setActiveTab(item.id)} 
                    className={`w-full flex items-center p-3.5 rounded-[var(--ind-radius)] transition-all relative group border ${
                      isActive 
                      ? (isEnergy ? 'bg-[var(--ind-amber)]/10 text-[var(--ind-amber)] border-[var(--ind-amber)]/20 shadow-lg' : 'bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] border-[var(--ind-petroleum)]/20 shadow-lg') 
                      : 'text-slate-500 border-transparent hover:bg-[var(--ind-panel)] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`min-w-[18px] ${isActive ? 'scale-110' : ''}`}> {item.icon} </div>
                      {isSidebarOpen && <span className={`ind-label !text-[10px] ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                    </div>
                    {isSidebarOpen && item.children && <ChevronDown size={14} className={`transition-transform ${openSubMenu === item.id ? 'rotate-180' : ''}`} />}
                    {item.badge > 0 && isSidebarOpen && (
                      <span className="ind-status-badge !px-1.5 !py-0.5 bg-[var(--ind-red)] text-white border-none ml-2">{item.badge}</span>
                    )}
                  </button>

                  {isSidebarOpen && item.children && openSubMenu === item.id && (
                    <div className="ml-4 pl-4 border-l border-[var(--ind-border)] space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {item.children.map(child => (
                        <button key={child.id} onClick={() => setActiveTab(child.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-[var(--ind-radius)] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === child.id ? 'text-[var(--ind-cyan)] bg-[var(--ind-petroleum)]/10' : 'text-slate-600 hover:text-white'}`}>
                          {child.icon} {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* BOTTOM: USER & SETTINGS */}
        <div className="p-3 bg-[var(--ind-header)]/30 border-t border-[var(--ind-border)] space-y-1">
          {/* THEME TOGGLE */}
          <button onClick={toggleTheme} className="w-full flex items-center p-3.5 rounded-[var(--ind-radius)] text-slate-600 hover:text-[var(--ind-cyan)] hover:bg-[var(--ind-panel)] transition-all group border border-transparent">
            <div className="min-w-[18px] flex justify-center group-hover:rotate-12 transition-transform">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</div>
            {isSidebarOpen && <span className="ml-4 ind-label !text-[10px] uppercase">Toggle Theme</span>}
          </button>

          {/* USER PROFILE */}
          <div className={`flex items-center p-3 mb-1 rounded-[var(--ind-radius)] bg-[var(--ind-bg)] border border-[var(--ind-border)] group transition-all ${!isSidebarOpen ? 'justify-center' : 'gap-4 mt-2'}`}>
            <div className="min-w-[32px] h-8 bg-[var(--ind-petroleum)]/20 border border-[var(--ind-petroleum)]/40 rounded flex items-center justify-center text-[var(--ind-cyan)] shadow-inner">
              <User size={18} strokeWidth={2.5} />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-1 duration-300">
                <span className="ind-label !text-[8px] opacity-50 leading-none mb-1">Operative</span>
                <span className="text-[10px] font-black uppercase tracking-tight leading-none text-white truncate">{user.username}</span>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="w-full flex items-center p-3.5 rounded-[var(--ind-radius)] text-slate-700 hover:text-[var(--ind-red)] hover:bg-red-500/5 transition-all group">
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="ml-4 ind-label !text-[10px] !text-inherit">Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* 🏛️ MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        
        {/* HEADER */}
        <header className="h-16 border-b border-[var(--ind-border)] bg-[var(--ind-bg)]/80 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md">
            <div className="flex items-center gap-3 ind-label !opacity-40 italic">
              <span>Security Node</span> <ChevronRight size={14} /> <span className="text-[var(--ind-cyan)] tracking-normal normal-case font-extrabold">{activeTab.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`ind-status-badge ${user.role === 'admin' ? 'text-[var(--ind-amber)] border-[var(--ind-amber)]/20 bg-amber-500/5' : 'text-[var(--ind-cyan)] border-[var(--ind-cyan)]/20 bg-cyan-500/5'}`}>
                <ShieldCheck size={12} className="inline mr-2" />
                {user.role} Authorization
              </div>
              <div className="ind-data text-[10px] text-green-500 bg-green-500/5 px-4 py-1.5 rounded-full border border-green-500/10 uppercase tracking-widest font-black animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                {socket.connected ? "Node Online" : "Reconnecting"}
              </div>
            </div>
        </header>

        {/* CONTENT RENDERING */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activeTab === 'dashboard' && <Dashboard liveData={liveData} connections={connections} userId={user.id} />}
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