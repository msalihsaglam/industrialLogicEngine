import React from 'react';
import { 
  Activity, Menu, LayoutDashboard, PlusCircle, 
  Settings, ShieldAlert, Database, BarChart2, 
  ShieldCheck, Cpu, Sliders, LogOut, Zap, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, toggle, activeTab, setActiveTab, alarmCount = 0, handleLogout }) => {
  const { t } = useTranslation();

  // --- 🧭 NAVIGATION CONFIGURATION ---
  const mainItems = [
    { id: 'dashboard', label: 'OPERATIONS', icon: <LayoutDashboard size={18} /> },
    { 
      id: 'energy', 
      label: 'ENERGY MODULE', 
      icon: <Zap size={18} className={activeTab === 'energy' ? 'text-[var(--ind-amber)]' : ''} /> 
    },
    { 
      id: 'incidents', 
      label: 'INCIDENTS', 
      icon: <ShieldAlert size={18} />, 
      badge: alarmCount > 0 ? alarmCount : null 
    },
    { id: 'rules', label: 'LOGIC BUILDER', icon: <PlusCircle size={18} /> },
    { id: 'virtual', label: 'VIRTUAL NODES', icon: <Cpu size={18} /> },
    { id: 'historian', label: 'HISTORIAN HUB', icon: <Database size={18} /> },
    { id: 'reports', label: 'INTELLIGENCE', icon: <BarChart2 size={18} /> },
    { id: 'connections', label: 'CONNECTIVITY', icon: <Settings size={18} /> },
  ];

  const adminItems = [
    { id: 'system_settings', label: 'GLOBAL CONFIG', icon: <Sliders size={18} /> },
    { id: 'users', label: 'ACCESS CONTROL', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <aside className={`bg-[var(--ind-bg)] border-r border-[var(--ind-border)] transition-all duration-300 flex flex-col fixed h-screen z-[1000] shadow-2xl font-sans ${isOpen ? 'w-72' : 'w-20'}`}>
      
      {/* 🏛️ LOGO SECTION (Sert & Dik) */}
      <div className="p-6 h-24 flex items-center justify-between border-b border-[var(--ind-border)]">
        {isOpen && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="p-2 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded border border-[var(--ind-petroleum)]/30">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tighter leading-none">LOGIC.IO</span>
                <span className="text-[8px] font-bold text-[var(--ind-petroleum)] tracking-[0.4em] uppercase mt-1">Industrial Core</span>
            </div>
          </div>
        )}
        <button 
          onClick={toggle} 
          className={`p-2.5 ind-panel hover:text-[var(--ind-cyan)] transition-all ${!isOpen && 'mx-auto'}`}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* 🧭 MAIN NAVIGATION (Scrollable) */}
      <nav className="flex-1 px-3 space-y-1.5 mt-8 overflow-y-auto scrollbar-hide">
        {mainItems.map((item) => {
          const isActive = activeTab === item.id;
          const isEnergy = item.id === 'energy';
          
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center p-3.5 rounded-[var(--ind-radius)] transition-all duration-200 relative group overflow-hidden border ${
                isActive 
                ? (isEnergy ? 'bg-[var(--ind-amber)]/10 text-[var(--ind-amber)] border-[var(--ind-amber)]/20' : 'bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] border-[var(--ind-petroleum)]/30') 
                : 'text-slate-500 border-transparent hover:bg-[var(--ind-panel)] hover:text-white'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${isEnergy ? 'bg-[var(--ind-amber)]' : 'bg-[var(--ind-cyan)]'}`} />
              )}
              
              <div className={`min-w-[20px] flex justify-center ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>

              {isOpen && (
                <div className="ml-4 flex-1 flex justify-between items-center overflow-hidden animate-in fade-in slide-in-from-left-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="bg-[var(--ind-red)] text-white ind-data text-[9px] px-1.5 py-0.5 rounded-sm border border-red-400/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

{/* ⚙️ BOTTOM SECTION: USER PROFILE & SESSION MANAGEMENT */}
<div className="p-3 bg-[var(--ind-panel)]/40 border-t border-[var(--ind-border)] space-y-1">
  
  {/* 👤 AUTHORIZED OPERATIVE (User Section) */}
  <div className={`flex items-center p-3 mb-2 rounded-[var(--ind-radius)] bg-[var(--ind-bg)] border border-[var(--ind-border)] group transition-all ${!isOpen ? 'justify-center' : 'gap-4'}`}>
    {/* User Icon / Avatar (Sert Köşeli Badge Stili) */}
    <div className="min-w-[36px] h-9 bg-[var(--ind-petroleum)]/20 border border-[var(--ind-petroleum)]/40 rounded flex items-center justify-center text-[var(--ind-cyan)] shadow-inner group-hover:border-[var(--ind-cyan)]/30 transition-all">
      <User size={20} strokeWidth={2.5} />
    </div>

    {isOpen && (
      <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-1 duration-300">
        <span className="ind-label !text-[8px] !text-[var(--ind-petroleum)] mb-0.5 opacity-80">Authorized Op.</span>
        <span className="text-[11px] font-extrabold text-white uppercase tracking-tight leading-none truncate">
          {/* Buraya props'tan gelen kullanıcı adı gelecek */}
          S. DEMİRCİ
        </span>
        <span className="ind-data text-[8px] text-[var(--ind-slate)] mt-1 opacity-50 uppercase tracking-tighter">
          ID: #0412-NODE
        </span>
      </div>
    )}
  </div>

  {/* 🛠️ ADMIN ITEMS (GLOBAL CONFIG & ACCESS CONTROL) */}
  {adminItems.map((item) => {
    const isActive = activeTab === item.id;
    return (
      <button 
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center p-3.5 rounded-[var(--ind-radius)] transition-all group border ${
          isActive 
          ? 'bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] border-[var(--ind-petroleum)]/20' 
          : 'text-slate-600 border-transparent hover:text-white hover:bg-[var(--ind-panel)]'
        }`}
      >
        <div className={`min-w-[20px] flex justify-center ${isActive ? 'text-[var(--ind-cyan)]' : 'group-hover:rotate-90 transition-transform duration-500'}`}>
          {item.icon}
        </div>
        {isOpen && (
          <span className="ml-4 text-[10px] font-bold uppercase tracking-widest">
            {item.label}
          </span>
        )}
      </button>
    );
  })}

  {/* ⚠️ TERMINATE SESSION (Kill-Switch Stili) */}
  <button 
    onClick={handleLogout}
    className="w-full flex items-center p-3.5 rounded-[var(--ind-radius)] text-slate-600 hover:text-[var(--ind-red)] hover:bg-[var(--ind-red)]/5 transition-all mt-3 group border border-transparent hover:border-[var(--ind-red)]/20"
  >
    <div className="min-w-[20px] flex justify-center group-hover:scale-110 transition-transform">
      <LogOut size={18} strokeWidth={2.5} />
    </div>
    {isOpen && (
      <div className="ml-4 flex flex-col items-start leading-none">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Terminate</span>
        <span className="text-[7px] font-bold text-slate-700 uppercase mt-1 tracking-tighter group-hover:text-[var(--ind-red)]/50">End Secure Session</span>
      </div>
    )}
  </button>

  {/* SYSTEM STATUS FOOTER (V3.2 // SECURE_CORE) */}
  <div className={`flex items-center gap-3 px-3 py-4 mt-2 border-t border-[var(--ind-border)]/50 ${!isOpen && 'justify-center'}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      {isOpen && (
          <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold text-white uppercase tracking-tight">Core Online</span>
              <span className="ind-data text-[7px] text-[var(--ind-slate)] uppercase tracking-[0.2em] mt-1">V3.2.0 // STABLE</span>
          </div>
      )}
  </div>
</div>
    </aside>
  );
};

export default Sidebar;