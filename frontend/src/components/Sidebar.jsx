import React from 'react';
import { Activity, Menu, LayoutDashboard, PlusCircle, Settings, History } from 'lucide-react';

const Sidebar = ({ isOpen, toggle, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'rules', label: 'Rule Management', icon: <PlusCircle size={20} /> },
    { id: 'connections', label: 'Connections', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-6 flex items-center justify-between">
        {isOpen && <div className="flex items-center gap-2 font-bold text-blue-400 tracking-wider"><Activity size={24} /> <span>LOGIC.IO</span></div>}
        <button onClick={toggle} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Menu size={20} /></button>
      </div>
      <nav className="flex-1 px-3 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <div className="min-w-[20px]">{item.icon}</div>
            {isOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;