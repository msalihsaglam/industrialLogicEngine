import React, { useState } from 'react';
import { 
  Activity, User, LogIn, ShieldCheck, AlertCircle, 
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

  // --- ⚙️ AUTH HANDLERS ---
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
    <div className="min-h-screen bg-[var(--ind-bg)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 🌌 AMBIANCE (Grid Layer) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--ind-border) 1px, transparent 1px), linear-gradient(90deg, var(--ind-border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 ind-panel shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden z-10 animate-in zoom-in-95 duration-500">
        
        {/* 🏛️ LEFT SIDE: BRANDING & PROTOCOL (Branding Zone) */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-[var(--ind-bg)] border-r border-[var(--ind-border)] relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Fingerprint size={200}/></div>
            
            <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-[var(--ind-petroleum)]/10 text-[var(--ind-cyan)] rounded border border-[var(--ind-petroleum)]/30 shadow-inner">
                        <Activity size={32} className="animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="ind-title !text-3xl">LOGIC.IO</h1>
                      <span className="ind-label !text-[var(--ind-petroleum)] mt-1 tracking-[0.3em]">Industrial Intelligence</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8 relative z-10">
                <div className="ind-panel p-8 bg-[var(--ind-panel)]/40 border-l-4 border-l-[var(--ind-petroleum)] space-y-5">
                    <div className="flex items-center gap-3 text-[var(--ind-cyan)]">
                        <ShieldAlert size={18} />
                        <h5 className="ind-label !text-[var(--ind-cyan)]">Security Protocol</h5>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] text-[var(--ind-slate)] font-bold leading-relaxed uppercase tracking-widest">
                            ● Authorized operative access only.<br/>
                            ● Session persistence encrypted via AES-256.<br/>
                            ● All gateway handshakes are logged to Core.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ind-data text-[10px] text-[var(--ind-slate)] opacity-40 uppercase tracking-widest ml-2 italic">
                    <Terminal size={14} /> STATUS: READY_FOR_HANDSHAKE
                </div>
            </div>
        </div>

        {/* 🛠️ RIGHT SIDE: AUTH CONSOLE (Action Zone) */}
        <div className="p-12 lg:p-20 flex flex-col justify-center bg-[var(--ind-panel)]">
          <div className="mb-12">
            <h2 className="ind-title !text-3xl">
              {isLogin ? 'Terminal Access' : 'Node Enrollment'}
            </h2>
            <div className="w-12 h-1.5 bg-[var(--ind-petroleum)] mt-4 rounded-full"></div>
            <p className="ind-label opacity-50 mt-8 normal-case italic">
              {isLogin ? 'Provide credentials to bridge control layer.' : 'Register unique operative ID in system core.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-[var(--ind-red)]/5 border border-[var(--ind-red)]/20 rounded text-[var(--ind-red)] text-[10px] font-black tracking-widest uppercase flex items-center gap-3 animate-in shake">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-3">
                <label className="ind-label ml-1 opacity-60">Operative Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)] transition-colors group-focus-within:text-[var(--ind-cyan)]" size={18} />
                  <input 
                    type="text" 
                    required 
                    className="w-full ind-input !pl-12 !py-4 !text-sm placeholder:opacity-20"
                    placeholder="E.G. OP_STATION_01" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="ind-label ml-1 opacity-60">Security Hash Key</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ind-petroleum)] transition-colors group-focus-within:text-[var(--ind-cyan)]" size={18} />
                  <input 
                    type="password" 
                    required 
                    className="w-full ind-input !pl-12 !py-4 !text-sm placeholder:opacity-20"
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
              className={`ind-btn-primary w-full !py-5 shadow-2xl flex items-center justify-center gap-3 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <Activity size={20} className="animate-spin text-[var(--ind-cyan)]" />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <ShieldCheck size={20} />}
                  <span className="mt-0.5">{isLogin ? 'Initialize Session' : 'Establish Operative'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center border-t border-[var(--ind-border)] pt-8">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="ind-label !text-[9px] hover:text-[var(--ind-cyan)] transition-all group flex items-center justify-center gap-3 mx-auto"
            >
                <span className="opacity-40">{isLogin ? "NEW OPERATIVE?" : "EXISTING OPERATIVE?"}</span>
                <span className="border-b border-transparent group-hover:border-[var(--ind-cyan)] pb-0.5 transition-all">
                    {isLogin ? 'Request Access' : 'Return to Gateway'}
                </span>
            </button>
          </div>
        </div>
      </div>

      {/* 🔐 SYSTEM FOOTER (Secure Node Status) */}
      <div className="absolute bottom-8 ind-panel !bg-transparent !border-[var(--ind-border)]/50 px-6 py-3 opacity-30 flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-[var(--ind-cyan)] shadow-[0_0_10px_var(--ind-cyan)] animate-pulse" />
        <span className="ind-data text-[9px] uppercase tracking-[0.3em]">Auth Protocol 2.6.0 // Secure_Node_Active</span>
      </div>
    </div>
  );
};

export default Login;