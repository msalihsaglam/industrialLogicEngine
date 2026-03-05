import React, { useEffect, useState } from 'react';
import { ChevronRight, Activity, Menu, LayoutDashboard, PlusCircle, Settings, Zap, LogOut, User, Users } from 'lucide-react'; 
import { socket, api } from './services/api';
import Dashboard from './pages/Dashboard';
import RuleManagement from './pages/RuleManagement';
import ConnectionPage from './pages/ConnectionPage';
import Incidents from './pages/Incidents';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);
  const [liveData, setLiveData] = useState({}); 
  const [rules, setRules] = useState([]);
  const [alarms, setAlarms] = useState([]); 
  const [connections, setConnections] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const refreshAllData = (userId) => {
    if (!userId) return;
    api.getRules(userId).then(res => setRules(res.data)).catch(err => console.error(err));
    api.getConnections().then(res => setConnections(res.data)).catch(err => console.error(err));
  };

  // 1. SOCKET ODA YÖNETİMİ & VERİ DİNLEME
  useEffect(() => {
    const savedUser = localStorage.getItem('logic_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      refreshAllData(parsedUser.id);
      
      // ✅ Sayfa yenilendiğinde odaya tekrar katıl
      socket.emit('join_user_room', parsedUser.id);
    }

    // Canlı veri dinleyici (Global kalabilir)
    socket.on('liveData', (data) => {
      setLiveData(prev => ({ ...prev, [`${data.sourceName}:${data.tagName}`]: data.value }));
    });

    // ✅ Alarmlar artık sadece odaya özel gelecek
    socket.on('alarm', (newAlarm) => {
      console.log("🚨 [Socket] Yeni alarm alındı:", newAlarm);
      setAlarms(prev => [newAlarm, ...prev].slice(0, 50));
    });

    socket.on('connectionStatusUpdate', (updatedConn) => {
      setConnections(prev => prev.map(conn => conn.id === updatedConn.id ? { ...conn, status: updatedConn.status } : conn));
    });

    // Socket yeniden bağlandığında odaya tekrar gir
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
    
    // ✅ Giriş anında odaya katıl
    socket.emit('join_user_room', authData.user.id);
    
    refreshAllData(authData.user.id);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
    socket.disconnect();
    window.location.reload();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'operator'] },
    { id: 'incidents', label: 'Incidents', icon: <Zap size={20} />, roles: ['admin', 'operator'] },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} />, roles: ['admin', 'operator'] },
    { id: 'connections', label: 'Connections', icon: <Settings size={20} />, roles: ['admin'] },
    { id: 'users', label: 'User Management', icon: <Users size={20} />, roles: ['admin'] },
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
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <div className="min-w-[20px]">{item.icon}</div>
                {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                {item.id === 'incidents' && alarms.length > 0 && (
                  <span className="absolute right-2 bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">{alarms.length}</span>
                )}
              </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 text-slate-400 bg-slate-800/30 rounded-xl mb-2 border border-slate-800/50">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><User size={16} /></div>
              <span className="text-[11px] font-black truncate uppercase tracking-tighter">{user.username}</span>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group">
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest">Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md">
           <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] italic opacity-60">
              <span>Security Node</span> <ChevronRight size={14} /> <span className="text-blue-400 tracking-normal">{activeTab}</span>
           </div>
           <div className="flex items-center gap-4">
              <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border flex items-center gap-2 tracking-widest ${user.role === 'admin' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'}`}>
                {user.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                {user.role} Authorization
              </div>
              <div className="text-[10px] font-mono text-green-400 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 uppercase tracking-widest font-black animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                {socket.connected ? "Node Online" : "Reconnecting"}
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activeTab === 'dashboard' && <Dashboard liveData={liveData} connections={connections} userId={user.id} />}
          {activeTab === 'incidents' && <Incidents alarms={alarms} onClearAlarms={() => setAlarms([])} />}
          {activeTab === 'rules' && <RuleManagement rules={rules} connections={connections} onRefresh={() => refreshAllData(user.id)} userId={user.id} />}
          {activeTab === 'connections' && <ConnectionPage connections={connections} onRefresh={() => refreshAllData(user.id)} />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
}

const ShieldCheck = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default App;