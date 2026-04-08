import React, { useState } from 'react';
import { 
  Activity, Lock, User, LogIn, ShieldCheck, AlertCircle, 
  Fingerprint, Key, Terminal, Info, ShieldAlert 
} from 'lucide-react';
import { api } from '../services/api';

const Login = ({ onLogin }) => {
  // --- 🔒 CORE STATE (FULLY PRESERVED) ---
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
    <div className="min-h-screen bg-[#0B1215] flex items-center justify-center p-6 relative overflow-hidden font-['IBM_Plex_Sans']">
      
      {/* 🔡 INDUSTRIAL CORE STYLES */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
          .font-data { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
          .industrial-panel { background-color: #141F24; border: 1px solid #23333A; }
          .label-caps { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; }
          .input-field { background-color: #0B1215; border: 1px solid #23333A; padding: 14px 16px; border-radius: 4px; font-weight: 600; outline: none; color: #fff; }
          .input-field:focus { border-color: #006470; }
        `}
      </style>

      {/* 🌌 AMBIANCE (Subtle Engineering Grid) */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#23333A 1px, transparent 1px), linear-gradient(90deg, #23333A 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-[#141F24] border border-[#23333A] rounded-md shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-500">
        
        {/* 🏛️ LEFT SIDE: BRANDING & PROTOCOL */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0B1215] border-r border-[#23333A] relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Fingerprint size={180}/></div>
            
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#006470]/20 text-[#00FFCC] rounded border border-[#006470]/30">
                        <Activity size={32} />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-3xl font-bold text-white tracking-tighter leading-none uppercase">LOGIC.IO</h1>
                      <span className="label-caps !text-[#006470] mt-1">Industrial Intelligence</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="bg-[#141F24] border border-[#23333A] p-6 rounded-md space-y-4 border-l-4 border-l-[#006470]">
                    <div className="flex items-center gap-2 text-[#00FFCC]">
                        <ShieldAlert size={16} />
                        <h5 className="label-caps !text-[#00FFCC]">Security Protocol</h5>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] text-[#64748B] font-bold leading-relaxed uppercase tracking-widest">
                            ● Authorized operative access only.<br/>
                            ● Session persistence encrypted via AES-256.<br/>
                            ● All gateway handshakes are logged to Core.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-data text-slate-700 uppercase tracking-widest ml-2">
                    <Terminal size={12} /> STATUS: READY_FOR_HANDSHAKE
                </div>
            </div>
        </div>

        {/* 🛠️ RIGHT SIDE: AUTH CONSOLE */}
        <div className="p-12 lg:p-16 flex flex-col justify-center bg-[#141F24]">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">
              {isLogin ? 'Terminal Access' : 'Node Enrollment'}
            </h2>
            <div className="w-10 h-1 bg-[#006470] mt-3"></div>
            <p className="label-caps opacity-50 mt-6">
              {isLogin ? 'Provide credentials to bridge control layer.' : 'Register unique operative ID in system core.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded text-red-500 text-[10px] font-bold tracking-widest uppercase flex items-center gap-3 animate-in shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="label-caps ml-1">Operative Identity</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="text" 
                    required 
                    className="w-full input-field pl-12 text-sm font-bold uppercase tracking-wider placeholder:text-slate-800"
                    placeholder="E.G. OP_STATION_01" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps ml-1">Security Hash Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="password" 
                    required 
                    className="w-full input-field pl-12 text-sm font-bold placeholder:text-slate-800"
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
              className="w-full bg-[#006470] hover:bg-[#007a8a] disabled:bg-[#1C262B] disabled:text-slate-700 text-white font-bold py-4 rounded shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em]"
            >
              {loading ? (
                <Activity size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <ShieldCheck size={18} />}
                  {isLogin ? 'Initialize Session' : 'Establish Operative'}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-slate-600 hover:text-[#00FFCC] transition-all uppercase tracking-widest text-[9px] font-bold group flex items-center justify-center gap-2 mx-auto"
            >
                <span className="opacity-50">{isLogin ? "NEW OPERATIVE?" : "EXISTING OPERATIVE?"}</span>
                <span className="border-b border-slate-800 group-hover:border-[#00FFCC] pb-0.5 transition-all">
                    {isLogin ? 'Request Access' : 'Return to Gateway'}
                </span>
            </button>
          </div>
        </div>
      </div>

      {/* 🔐 SYSTEM FOOTER */}
      <div className="absolute bottom-8 flex items-center gap-3 px-5 py-2.5 bg-[#141F24] border border-[#23333A] rounded shadow-sm opacity-50">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]" />
        <span className="text-[9px] font-data text-slate-500 uppercase tracking-widest">Auth Protocol 2.6.0 // Secure_Node_Active</span>
      </div>
    </div>
  );
};

export default Login;