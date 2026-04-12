import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Shield, Trash2, Lock, Info, 
  ShieldCheck, Fingerprint, Users, Key, X 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const UserManagement = () => {
  const { t } = useTranslation();

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
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-8 pt-10 font-sans">
      
      {/* 🏛️ HEADER & GUIDE SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[var(--ind-border)] pb-10">
        <div className="space-y-4 min-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--ind-cyan)]"></div>
            <span className="ind-label">Identity & Access Management</span>
          </div>
          <h1 className="ind-title">Access Control</h1>
          <div className="mt-6 inline-flex items-center gap-3 bg-[var(--ind-panel)] px-4 py-2 border border-[var(--ind-border)] rounded-[var(--ind-radius)] ind-label !text-[var(--ind-cyan)] shadow-inner">
            <Shield size={14} /> {users.length} Authorized Operatives
          </div>
        </div>

        {/* 🎯 RIGHT: SECURITY GUIDE */}
        <div className="flex-1 ind-panel p-6 border-l-4 border-l-[var(--ind-petroleum)] relative overflow-hidden flex flex-col md:flex-row gap-8">
            <div className="p-3 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded h-fit"><Info size={24}/></div>
            <div className="space-y-4">
                <h5 className="ind-label border-b border-[var(--ind-border)] pb-2 inline-block">Security Provisioning Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                        <p className="ind-label !text-[var(--ind-cyan)]">Role Hierarchy</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Admins manage infrastructure; Operators manage data.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-[var(--ind-amber)]">Credentials</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Rotate passwords upon initial system entry.</p>
                    </div>
                    <div className="space-y-1 border-l border-[var(--ind-border)] pl-4">
                        <p className="ind-label !text-blue-400">Audit Trail</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">All accounts are logged for compliance.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* 🛠️ PROVISION FORM (Security Console) */}
        <div className="ind-panel p-10 bg-[var(--ind-panel)]/40 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--ind-petroleum)] shadow-[0_0_15px_rgba(0,100,112,0.5)]" />
          
          <h3 className="ind-subtitle !text-xl !text-white mb-10 flex items-center gap-4">
            <UserPlus size={22} className="text-[var(--ind-cyan)]" /> Provision Operative
          </h3>
          
          <form onSubmit={handleAddUser} className="space-y-8">
            <div className="space-y-3">
                <label className="ind-label opacity-50 ml-1">Operator Username</label>
                <div className="relative">
                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)]" />
                    <input 
                      type="text" placeholder="E.G. STATION_OPERATOR_A" 
                      className="w-full ind-input !pl-12 !font-black !tracking-widest"
                      value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="ind-label opacity-50 ml-1">Access Credentials</label>
                <div className="relative">
                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)]" />
                    <input 
                      type="password" placeholder="••••••••" 
                      className="w-full ind-input !pl-12 !font-black !tracking-widest"
                      value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="ind-label opacity-50 ml-1">Security Role</label>
                <select 
                    className="w-full ind-input cursor-pointer"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                    <option value="operator" className="bg-slate-900">Standard Operative</option>
                    <option value="admin" className="bg-slate-900 text-[var(--ind-amber)]">System Administrator</option>
                </select>
            </div>

            <button className="ind-btn-primary w-full !py-5 shadow-xl flex items-center justify-center gap-3">
              <ShieldCheck size={20} /> Authorize Access
            </button>
          </form>
        </div>

        {/* 📋 OPERATIVE LIST (Security Audit Grid) */}
        <div className="xl:col-span-2 ind-panel !p-0 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--ind-header)] border-b border-[var(--ind-border)]">
                <th className="px-10 py-6 ind-label !text-slate-600">System Operative</th>
                <th className="px-10 py-6 ind-label !text-slate-600 text-center">Auth Level</th>
                <th className="px-10 py-6 ind-label !text-slate-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ind-border)]">
              {users.map(u => (
                <tr key={u.id} className="group hover:bg-[var(--ind-header)]/50 transition-all">
                  <td className="px-10 py-6 flex items-center gap-6">
                    {/* User Identity Box */}
                    <div className="w-12 h-12 bg-[var(--ind-bg)] border border-[var(--ind-border)] rounded-[var(--ind-radius)] flex items-center justify-center text-[var(--ind-cyan)] font-black text-xs shadow-inner group-hover:border-[var(--ind-cyan)]/40 transition-all">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-white uppercase tracking-tight group-hover:text-[var(--ind-cyan)] transition-colors leading-none">{u.username}</span>
                        <span className="ind-data text-[8px] text-[var(--ind-slate)] mt-2 uppercase">Core_UID: {u.id}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`ind-status-badge ${u.role === 'admin' ? 'text-[var(--ind-amber)] border-[var(--ind-amber)]/20 bg-amber-500/5' : 'text-[var(--ind-cyan)] border-[var(--ind-cyan)]/20 bg-cyan-500/5'}`}>
                      {u.role === 'admin' ? 'Administrator' : 'Operative'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-3 text-slate-700 hover:text-[var(--ind-red)] hover:bg-red-500/5 rounded-[var(--ind-radius)] transition-all group/btn"
                    >
                        <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20 grayscale">
                <Fingerprint size={64} className="text-[var(--ind-petroleum)]" />
                <p className="ind-label tracking-[0.5em]">Awaiting Identity Sync...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;