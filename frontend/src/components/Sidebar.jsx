import React from 'react';
import { 
  Activity, Menu, LayoutDashboard, PlusCircle, 
  Settings, History, Zap, ShieldAlert, Database, BarChart2, 
  Terminal, ShieldCheck, Cpu, Layout, BatteryCharging // 🔋 Enerji Modülü İkonu
} from 'lucide-react';

const Sidebar = ({ isOpen, toggle, activeTab, setActiveTab, alarmCount = 0 }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'OPERATIONS', icon: <LayoutDashboard size={20} /> },
    
    // --- ⚡ LOGICENGINE ENERGY (MODÜLER ADD-ON) ---
    { 
      id: 'energy', 
      label: 'ENERGY MODULE', 
      icon: <Zap size={20} className={activeTab === 'energy' ? 'text-amber-500' : ''} />,
      isModule: true // İleride lisans kontrolü için flag
    },
    
    { 
      id: 'incidents', 
      label: 'INCIDENTS', 
      icon: <ShieldAlert size={20} />, // Karışmaması için Zap yerine ShieldAlert
      badge: alarmCount > 0 ? alarmCount : null 
    },
    { id: 'rules', label: 'LOGIC BUILDER', icon: <PlusCircle size={20} /> },
    { id: 'virtual', label: 'VIRTUAL NODES', icon: <Cpu size={20} /> },
    { 
      id: 'historian', 
      label: 'HISTORIAN HUB', 
      icon: <Database size={20} /> 
    },
    { 
      id: 'reports', 
      label: 'INTELLIGENCE', 
      icon: <BarChart2 size={20} /> 
    },
    { id: 'connections', label: 'CONNECTIVITY', icon: <Settings size={20} /> },
    { id: 'users', label: 'ACCESS CONTROL', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <aside className={`bg-[#0b1117] border-r-2 border-slate-800 transition-all duration-500 flex flex-col fixed h-full z-[1000] shadow-[10px_0_50px_rgba(0,0,0,0.5)] font-['Inter',_sans-serif] ${isOpen ? 'w-80' : 'w-24'}`}>
      
      {/* 🏛️ LOGO SECTION */}
      <div className="p-8 flex items-center justify-between border-b-2 border-slate-800/50">
        {isOpen && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="p-2 bg-[#009999]/20 text-[#00ffcc] rounded-xl border border-[#009999]/30 shadow-inner">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tighter italic leading-none">LOGIC.IO</span>
                <span className="text-[9px] font-semibold text-[#009999] tracking-[0.3em] uppercase mt-1">Industrial Core</span>
            </div>
          </div>
        )}
        <button 
          onClick={toggle} 
          className={`p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-[#00ffcc] transition-all border-2 border-transparent hover:border-[#009999]/20 ${!isOpen && 'mx-auto shadow-xl bg-slate-900'}`}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* 🧭 NAVIGATION LIST */}
      <nav className="flex-1 px-4 space-y-3 mt-8 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                isActive 
                ? 'bg-[#009999]/15 text-[#00ffcc] border border-[#009999]/30' 
                : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              {/* Aktiflik Göstergesi */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full shadow-lg ${item.id === 'energy' ? 'bg-amber-500 shadow-amber-500/60' : 'bg-[#00ffcc] shadow-[#00ffcc]/60'}`} />
              )}

              <div className={`min-w-[24px] transition-all duration-500 flex justify-center ${isActive ? 'scale-110' : 'group-hover:text-white'}`}>
                {item.icon}
              </div>

              {isOpen && (
                <div className="ml-5 flex-1 flex justify-between items-center overflow-hidden text-left animate-in fade-in slide-in-from-left-2">
                  <span className={`font-semibold text-[12px] uppercase tracking-wide transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                  
                  {item.badge && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse border border-red-400/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {!isOpen && item.badge && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#0b1117] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 🛰️ SYSTEM STATUS FOOTER */}
      <div className="p-6 border-t-2 border-slate-800/50 bg-slate-950/30">
        <div className={`flex items-center gap-4 px-2 ${!isOpen && 'justify-center'}`}>
            <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-25" />
            </div>
            {isOpen && (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">Core Engine Active</span>
                    <span className="text-[9px] font-medium text-slate-600 uppercase tracking-widest mt-0.5 opacity-70">V3.1 // SECURE_NODE</span>
                </div>
            )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;