import React from 'react';
import { 
  Activity, Menu, LayoutDashboard, PlusCircle, 
  Settings, History, Zap, ShieldAlert, Database, BarChart2, 
  ShieldCheck, Cpu, BatteryCharging, Sliders, LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen, toggle, activeTab, setActiveTab, alarmCount = 0, handleLogout }) => {
  
  // Ana Navigasyon Öğeleri
  const mainItems = [
    { id: 'dashboard', label: 'OPERATIONS', icon: <LayoutDashboard size={20} /> },
    { 
      id: 'energy', 
      label: 'ENERGY MODULE', 
      icon: <Zap size={20} className={activeTab === 'energy' ? 'text-[#FFB900]' : ''} /> 
    },
    { 
      id: 'incidents', 
      label: 'INCIDENTS', 
      icon: <ShieldAlert size={20} />, 
      badge: alarmCount > 0 ? alarmCount : null 
    },
    { id: 'rules', label: 'LOGIC BUILDER', icon: <PlusCircle size={20} /> },
    { id: 'virtual', label: 'VIRTUAL NODES', icon: <Cpu size={20} /> },
    { id: 'historian', label: 'HISTORIAN HUB', icon: <Database size={20} /> },
    { id: 'reports', label: 'INTELLIGENCE', icon: <BarChart2 size={20} /> },
    { id: 'connections', label: 'CONNECTIVITY', icon: <Settings size={20} /> },
  ];

  // Alt Admin Öğeleri
  const adminItems = [
    { id: 'system_settings', label: 'GLOBAL CONFIG', icon: <Sliders size={20} /> },
    { id: 'users', label: 'ACCESS CONTROL', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <aside className={`bg-[#0B1215] border-r border-[#23333A] transition-all duration-500 flex flex-col fixed h-full z-[1000] shadow-2xl font-['IBM_Plex_Sans'] ${isOpen ? 'w-80' : 'w-24'}`}>
      
      {/* 🏛️ LOGO SECTION */}
      <div className="p-8 flex items-center justify-between border-b border-[#23333A] bg-[#0B1215]">
        {isOpen && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="p-2 bg-[#006470]/20 text-[#00FFCC] rounded border border-[#006470]/30 shadow-inner">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tighter leading-none">LOGIC.IO</span>
                <span className="text-[9px] font-bold text-[#006470] tracking-[0.3em] uppercase mt-1">Industrial Core</span>
            </div>
          </div>
        )}
        <button 
          onClick={toggle} 
          className={`p-3 hover:bg-[#141F24] rounded-md text-[#94A3B8] hover:text-[#00FFCC] transition-all border border-transparent hover:border-[#23333A] ${!isOpen && 'mx-auto bg-[#141F24]'}`}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 🧭 MAIN NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 mt-8 overflow-y-auto scrollbar-hide">
        {mainItems.map((item) => {
          const isActive = activeTab === item.id;
          const isEnergy = item.id === 'energy';
          
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center p-4 rounded-md transition-all duration-200 relative group overflow-hidden ${
                isActive 
                ? (isEnergy ? 'bg-[#FFB900]/10 text-[#FFB900] border border-[#FFB900]/20' : 'bg-[#006470]/20 text-[#00FFCC] border border-[#006470]/30') 
                : 'text-[#94A3B8] hover:bg-[#141F24] hover:text-white border border-transparent'
              }`}
            >
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${isEnergy ? 'bg-[#FFB900]' : 'bg-[#00FFCC]'}`} />
              )}
              <div className={`min-w-[24px] flex justify-center ${isActive ? 'scale-110' : 'group-hover:text-white'}`}>
                {item.icon}
              </div>
              {isOpen && (
                <div className="ml-5 flex-1 flex justify-between items-center overflow-hidden text-left animate-in fade-in slide-in-from-left-2">
                  <span className={`font-bold text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm border border-red-400/30 font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* ⚙️ BOTTOM ADMIN & TERMINATE SECTION */}
      <div className="p-4 bg-[#0B1215] border-t border-[#23333A] space-y-2">
        {isOpen && <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] ml-4 mb-3 mt-2">Platform Management</p>}
        
        {adminItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-4 rounded-md transition-all duration-200 group ${
                isActive 
                ? 'bg-[#006470]/10 text-[#00FFCC] border border-[#006470]/20' 
                : 'text-slate-500 hover:bg-[#141F24] hover:text-white border border-transparent'
              }`}
            >
              <div className={`min-w-[24px] flex justify-center ${isActive ? 'text-[#00FFCC]' : 'group-hover:rotate-90 transition-transform duration-500'}`}>
                {item.icon}
              </div>
              {isOpen && (
                <span className={`ml-5 font-bold text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* TERMINATE SESSION (Dik & Net) */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center p-4 rounded-md text-slate-600 hover:text-[#EF4444] hover:bg-red-500/5 transition-all mt-4 group"
        >
          <div className="min-w-[24px] flex justify-center group-hover:translate-x-1 transition-transform">
            <LogOut size={20} />
          </div>
          {isOpen && (
            <span className="ml-5 font-bold text-[11px] uppercase tracking-[0.2em]">Terminate Session</span>
          )}
        </button>

        {/* SYSTEM STATUS FOOTER */}
        <div className={`flex items-center gap-4 px-4 py-4 mt-2 border-t border-[#23333A]/50 ${!isOpen && 'justify-center'}`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            {isOpen && (
                <div className="flex flex-col leading-none">
                    <span className="text-[9px] font-bold text-white uppercase tracking-tight">Node Online</span>
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-1">V3.2 // SECURE_CORE</span>
                </div>
            )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;