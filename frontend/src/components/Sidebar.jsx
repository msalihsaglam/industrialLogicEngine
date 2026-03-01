import React from 'react';
import { 
  Activity, Menu, LayoutDashboard, PlusCircle, 
  Settings, History, Zap, ShieldAlert 
} from 'lucide-react';

const Sidebar = ({ isOpen, toggle, activeTab, setActiveTab, alarmCount = 0 }) => {
  
  // Menü öğelerine Incidents (Olaylar) kısmını ekledik
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { 
      id: 'incidents', 
      label: 'Incidents', 
      icon: <Zap size={20} />, 
      badge: alarmCount > 0 ? alarmCount : null 
    },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} /> },
    { id: 'connections', label: 'Connections', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* LOGO ALANI */}
      <div className="p-6 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2 font-black text-blue-400 tracking-tighter">
            <div className="p-1 bg-blue-500/10 rounded-lg">
              <Activity size={22} />
            </div>
            <span className="text-lg">LOGIC.IO</span>
          </div>
        )}
        <button 
          onClick={toggle} 
          className={`p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors ${!isOpen && 'mx-auto'}`}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* NAVİGASYON LİSTESİ */}
      <nav className="flex-1 px-3 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center p-3 rounded-2xl transition-all relative group ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className={`min-w-[20px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>

              {isOpen && (
                <div className="ml-4 flex-1 flex justify-between items-center overflow-hidden">
                  <span className="font-bold text-sm whitespace-nowrap tracking-tight">
                    {item.label}
                  </span>
                  
                  {/* BİLDİRİM ROZETİ (Sadece Incidents için ve alarm varsa) */}
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* SIDEBAR KAPALIYKEN TOOLTIP (Opsiyonel) */}
              {!isOpen && item.badge && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ALT KISIM (OPSİYONEL: VERSİYON VEYA DURUM) */}
      <div className="p-4 border-t border-slate-800/50">
        <div className={`flex items-center gap-3 px-2 ${!isOpen && 'justify-center'}`}>
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           {isOpen && <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Core Engine v3.1</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;