import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, UserCheck } from 'lucide-react';
import { api } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });

  useEffect(() => {
    // Tüm kullanıcıları listele (Admin yetkisi gerektirir)
    api.get('/auth/users').then(res => setUsers(res.data)).catch(err => console.error(err));
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      alert("New operator successfully deployed to the system.");
      setNewUser({ username: '', password: '', role: 'operator' });
      // Listeyi tazele
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      alert("Failed to create user.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">User Management</h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-1">System Access Control & Node Security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* YENİ KULLANICI EKLEME FORMU */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
            <UserPlus size={16} className="text-blue-500" /> Provision New Operative
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <input 
              type="text" placeholder="USERNAME" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
              value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
            />
            <input 
              type="password" placeholder="INITIAL PASSWORD" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
              value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
            />
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
              Confirm Enrollment
            </button>
          </form>
        </div>

        {/* MEVCUT KULLANICI LİSTESİ */}
        <div className="xl:col-span-2 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operative</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Role</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                      {u.username.substring(0, 2)}
                    </div>
                    <span className="text-sm font-bold text-slate-300">{u.username}</span>
                  </td>
                  <td className="p-6">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${u.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;