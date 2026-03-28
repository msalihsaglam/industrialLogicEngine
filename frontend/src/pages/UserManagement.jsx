import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Shield, Trash2, UserCheck, Lock, Info, 
  Terminal, ShieldCheck, Fingerprint, Users, Settings2, Key 
} from 'lucide-react';
import { api } from '../services/api';

const UserManagement = () => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });

  // --- ⚙️ API HANDLERS (FULLY PRESERVED) ---
  useEffect(() => {
    // Tüm kullanıcıları listele (Admin yetkisi gerektirir)
    api.get('/auth/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error("Access Denied or Connection Error:", err));
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      alert("New operative successfully authorized and deployed.");
      setNewUser({ username: '', password: '', role: 'operator' });
      // Listeyi tazele
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      alert("Failed to provision user. Check admin privileges.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Terminate this operative's system access?")) {
      try {
        await api.delete(`/auth/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) { alert("Termination failed."); }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 pt-10 text-white">
      
      {/* 🏛️ SIEMENS STYLE HEADER (WITH INTEGRATED SECURITY GUIDE) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b-2 border-slate-800 pb-12">
        
        {/* Left: Title & Actions Area */}
        <div className="space-y-1 min-w-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-1 bg-[#00ffcc]"></div>
            <span className="text-[#00ffcc] text-[10px] font-black uppercase tracking-[0.5em]">Identity & Access Management</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Access Control</h1>
          <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase mt-4 italic">
             <Shield size={14} className="text-[#009999]" /> System Authorization & Node Security
          </p>
          <div className="mt-8 bg-slate-900 px-6 py-3 rounded-xl border-2 border-slate-800 text-[11px] font-black text-[#00ffcc] shadow-2xl inline-block italic tracking-widest">
            {users.length} AUTHORIZED OPERATIVES
          </div>
        </div>

        {/* 🎯 RIGHT: INTEGRATED SYSTEM ACCESS GUIDE */}
        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Lock size={80}/></div>
            
            <div className="p-4 bg-[#009999]/10 text-[#00ffcc] rounded-2xl h-fit shadow-inner border border-[#009999]/20">
                <Info size={24}/>
            </div>

            <div className="space-y-4">
                <h5 className="text-[11px] font-black text-white uppercase italic tracking-widest border-b border-slate-800 pb-2 inline-block">
                    Security Provisioning Guide
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-[#00ffcc] font-black uppercase tracking-tighter italic">Role Hierarchy</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Administrators manage infrastructure; Operators manage visualization.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-tighter italic">Credential Policy</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">Initial passwords should be rotated immediately upon first system entry.</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-800/50 pl-4">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter italic">Audit Trail</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">All provisioned operatives are logged for compliance and traceability.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* 🛠️ PROVISION FORM (Siemens Console Style) */}
        <div className="bg-[#0b1117] border-2 border-slate-800 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#009999]" />
          
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-10 flex items-center gap-4">
            <UserPlus size={24} className="text-[#00ffcc]" /> Provision Operative
          </h3>
          
          <form onSubmit={handleAddUser} className="space-y-8">
            <div className="space-y-3">
                <label className="text-[10px] text-slate-600 block ml-2 uppercase font-black italic tracking-widest">Operator Username</label>
                <div className="relative">
                    <Users size={18} className="absolute left-5 top-5 text-slate-600" />
                    <input 
                    type="text" placeholder="E.G. OP_STATION_01" 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-14 text-xs font-black text-white uppercase outline-none focus:border-[#009999] transition-all shadow-inner"
                    value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] text-slate-600 block ml-2 uppercase font-black italic tracking-widest">Access Credentials</label>
                <div className="relative">
                    <Key size={18} className="absolute left-5 top-5 text-slate-600" />
                    <input 
                    type="password" placeholder="••••••••" 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 pl-14 text-xs font-black text-white outline-none focus:border-[#009999] transition-all shadow-inner"
                    value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] text-slate-600 block ml-2 uppercase font-black italic tracking-widest">Security Role</label>
                <select 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-xs font-black text-white uppercase outline-none focus:border-[#009999] transition-all cursor-pointer shadow-inner appearance-none"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                    <option value="operator" className="bg-slate-900">Standard Operative</option>
                    <option value="admin" className="bg-slate-900 text-amber-500">System Administrator</option>
                </select>
            </div>

            <button className="w-full bg-[#009999] hover:bg-[#00cccc] text-white font-black py-5 rounded-[1.5rem] text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
              <ShieldCheck size={20} /> Authorize Access
            </button>
          </form>
        </div>

        {/* 📋 OPERATIVE LIST (Security Audit Table Style) */}
        <div className="xl:col-span-2 bg-[#0b1117]/50 border-2 border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#009999]/30 to-transparent"></div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b-2 border-slate-800">
                <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">System Operative</th>
                <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic text-center">Authorization Level</th>
                <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800/50">
              {users.map(u => (
                <tr key={u.id} className="group hover:bg-[#009999]/5 transition-all duration-300">
                  <td className="p-8 flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl flex items-center justify-center text-[#00ffcc] font-black text-lg uppercase shadow-xl group-hover:border-[#009999]/50 transition-all">
                      {u.username.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-white uppercase italic tracking-tighter group-hover:text-[#00ffcc] transition-colors">{u.username}</span>
                        <span className="text-[9px] font-mono text-slate-600 tracking-widest mt-1 uppercase">Node ID: {u.id || 'AUTH_V4'}</span>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest border-2 italic ${u.role === 'admin' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-[#009999]/10 border-[#009999]/30 text-[#00ffcc]'}`}>
                      {u.role === 'admin' ? 'Administrator' : 'Operative'}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-4 bg-slate-900/50 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border-2 border-transparent hover:border-red-500/20 shadow-xl"
                    >
                        <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20 italic">
                <Fingerprint size={80} />
                <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Identity Synchronization...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;