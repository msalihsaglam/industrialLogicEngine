import React, { useState } from 'react';
import { 
  Activity, Lock, User, LogIn, ShieldCheck, AlertCircle, 
  Fingerprint, Key, Terminal, Info, ShieldAlert 
} from 'lucide-react';
import { api } from '../services/api';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, formData);
      
      if (isLogin) {
        onLogin(res.data);
      } else {
        setIsLogin(true);
        setError('');
        alert("Node Identity Established. Initialize protocol to enter.");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || "Access Denied.");
      } else if (err.request) {
        setError("Logic Server Unreachable.");
      } else {
        setError("Gateway Initialization Failure.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 🌌 INDUSTRIAL AMBIANCE (Background) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#009999]/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[150px]" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#00ffcc 1px, transparent 1px)', size: '40px 40px' }} />

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-[#0b1117] border-2 border-slate-800 rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden z-10 animate-in zoom-in-95 duration-700">
        
        {/* 🏛️ LEFT SIDE: BRANDING & GUIDE (The "Seal") */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900/50 border-r-2 border-slate-800 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Fingerprint size={200}/></div>
            
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#009999]/20 text-[#00ffcc] rounded-2xl border border-[#009999]/30">
                        <Activity size={32} className="animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter italic leading-none">LOGIC.IO</h1>
                </div>
                <p className="text-[#009999] text-[10px] font-black tracking-[0.5em] uppercase mt-2 italic">Industrial Intelligence Engine</p>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="bg-[#009999]/5 border-2 border-[#009999]/20 p-6 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3 text-[#00ffcc]">
                        <ShieldAlert size={20} />
                        <h5 className="text-[11px] font-black uppercase tracking-widest italic">Security Protocol</h5>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
                            ● Authorized operative access only.<br/>
                            ● Session persistence encrypted via SHA-256.<br/>
                            ● All gateway interactions are logged to Historian.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] ml-2">
                    <Terminal size={12} /> GATEWAY_STATUS: READY_FOR_HANDSHAKE
                </div>
            </div>
        </div>

        {/* 🛠️ RIGHT SIDE: AUTH FORM (The Console) */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              {isLogin ? 'Terminal Access' : 'Node Enrollment'}
            </h2>
            <div className="w-12 h-1 bg-[#00ffcc] mt-2"></div>
            <p className="text-slate-500 text-xs mt-4 font-bold uppercase tracking-widest italic">
              {isLogin ? 'Provide credentials to bridge control layer.' : 'Register unique operative ID in system core.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-black animate-in shake duration-300 italic tracking-widest uppercase">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="text-[10px] text-slate-600 block mb-2 uppercase font-black tracking-[0.2em] ml-2 transition-colors group-focus-within:text-[#00ffcc] italic">Operative Identity</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#00ffcc] transition-all" size={20} />
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] p-5 pl-14 text-sm text-white outline-none focus:border-[#009999] transition-all font-black placeholder:text-slate-800 shadow-inner"
                    placeholder="E.G. ADMIN_STATION_01" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] text-slate-600 block mb-2 uppercase font-black tracking-[0.2em] ml-2 transition-colors group-focus-within:text-[#00ffcc] italic">Security Hash Key</label>
                <div className="relative">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#00ffcc] transition-all" size={20} />
                  <input 
                    type="password" 
                    required 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] p-5 pl-14 text-sm text-white outline-none focus:border-[#009999] transition-all font-black placeholder:text-slate-800 shadow-inner"
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#009999] hover:bg-[#00cccc] disabled:bg-slate-800 disabled:text-slate-700 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-[#009999]/20 active:scale-95 text-[11px] uppercase tracking-[0.3em]"
            >
              {loading ? (
                <Activity size={24} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <ShieldCheck size={20} />}
                  {isLogin ? 'Initialize Session' : 'Establish Operative'}
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-slate-600 hover:text-[#00ffcc] transition-all uppercase tracking-[0.2em] text-[10px] font-black group flex items-center justify-center gap-2 mx-auto"
            >
                <span className="opacity-40">{isLogin ? "NEW OPERATIVE?" : "EXISTING OPERATIVE?"}</span>
                <span className="underline underline-offset-8 decoration-slate-800 group-hover:decoration-[#00ffcc]">
                    {isLogin ? 'Request Access' : 'Return to Gateway'}
                </span>
            </button>
          </div>
        </div>
      </div>

      {/* 🔐 FLOATING STATUS */}
      <div className="absolute bottom-10 flex items-center gap-3 px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-md opacity-40">
        <div className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_8px_rgba(0,255,204,0.5)]" />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Auth Protocol 2.6.0 // TLS 1.3 Active</span>
      </div>
    </div>
  );
};

export default Login;