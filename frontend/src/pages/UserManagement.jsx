import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Shield, Trash2, Lock, Info, 
  ShieldCheck, Fingerprint, Users, Key, X
} from 'lucide-react';
import { api } from '../services/api';

const UserManagement = () => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });

  // --- ⚙️ API HANDLERS (FULLY PRESERVED) ---
  useEffect(() => {
    api.get('/auth/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error("Access Denied or Connection Error:", err));
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      setNewUser({ username: '', password: '', role: 'operator' });
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
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-8 pt-10 text-[#F1F5F9] font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL CORE STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 12px 16px; border-radius: 4px; font-weight: 600; outline: none; color: #fff; }
          .table-header { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #64748B; background-color: #1C262B; }
        `}
      </style>

      {/* 🏛️ HEADER & GUIDE SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#23333A] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#00FFCC]"></div>
            <span className="label-caps">Identity & Access Management</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight uppercase text-white leading-none">Access Control</h1>
          <div className="mt-6 inline-flex items-center gap-2 bg-[#141F24] px-4 py-2 border border-[#23333A] rounded text-[10px] font-bold text-[#00FFCC] uppercase tracking-widest">
            <Shield size={14} /> {users.length} Authorized Operatives
          </div>
        </div>

        {/* 🎯 RIGHT: SECURITY GUIDE */}
        <div className="flex-1 industrial-panel p-6 rounded-md relative overflow-hidden flex flex-col md:flex-row gap-6 border-l-4 border-l-[#006470] shadow-sm">
            <div className="p-3 bg-[#006470]/10 text-[#00FFCC] rounded h-fit"><Info size={20}/></div>
            <div className="space-y-4">
                <h5 className="label-caps border-b border-[#23333A] pb-2 inline-block">Security Provisioning Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[#00FFCC] text-[10px] font-bold uppercase tracking-tighter">Role Hierarchy</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Admins manage core infrastructure; Operators manage visualization.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-tighter">Credentials</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">Passwords must be rotated immediately upon first system entry.</p>
                    </div>
                    <div className="space-y-1 border-l border-[#23333A] pl-4">
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-tighter">Audit Trail</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">All provisioned accounts are logged for compliance and traceability.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* 🛠️ PROVISION FORM (Security Console) */}
        <div className="industrial-panel p-8 rounded-md shadow-sm h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#006470]" />
          
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <UserPlus size={20} className="text-[#00FFCC]" /> Provision Operative
          </h3>
          
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="space-y-2">
                <label className="label-caps opacity-50">Operator Username</label>
                <div className="relative">
                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input 
                      type="text" placeholder="E.G. STATION_OPERATOR_A" 
                      className="w-full input-field pl-12 text-xs font-bold uppercase tracking-widest"
                      value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="label-caps opacity-50">Access Credentials</label>
                <div className="relative">
                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input 
                      type="password" placeholder="••••••••" 
                      className="w-full input-field pl-12 text-xs font-bold"
                      value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="label-caps opacity-50">Security Role</label>
                <select 
                    className="w-full input-field text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                    <option value="operator" className="bg-[#141F24]">Standard Operative</option>
                    <option value="admin" className="bg-[#141F24] text-amber-500">System Administrator</option>
                </select>
            </div>

            <button className="w-full bg-[#006470] hover:bg-[#007a8a] text-white font-bold py-4 rounded shadow-lg text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Authorize Access
            </button>
          </form>
        </div>

        {/* 📋 OPERATIVE LIST (Security Audit Grid) */}
        <div className="xl:col-span-2 industrial-panel rounded-md overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="px-8 py-5">System Operative</th>
                <th className="px-8 py-5 text-center">Authorization Level</th>
                <th className="px-8 py-5 text-right pr-10">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23333A]">
              {users.map(u => (
                <tr key={u.id} className="group hover:bg-[#0B1215] transition-all">
                  <td className="px-8 py-5 flex items-center gap-5">
                    <div className="w-12 h-12 bg-[#0B1215] border border-[#23333A] rounded flex items-center justify-center text-[#00FFCC] font-bold text-sm uppercase group-hover:border-[#006470] transition-all">
                      {u.username.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-[#00FFCC] transition-colors">{u.username}</span>
                        <span className="text-[9px] font-data text-[#64748B] tracking-widest mt-0.5 uppercase">Node UID: {u.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-[8px] font-bold px-3 py-1 rounded border uppercase tracking-widest ${u.role === 'admin' ? 'bg-amber-500/5 border-amber-600/30 text-amber-500' : 'bg-[#006470]/5 border-[#006470]/30 text-[#00FFCC]'}`}>
                      {u.role === 'admin' ? 'Administrator' : 'Operative'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right pr-10">
                    <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/5 rounded transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center gap-4 opacity-20">
                <Fingerprint size={48} />
                <p className="label-caps tracking-[0.4em]">Awaiting Identity Sync...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;