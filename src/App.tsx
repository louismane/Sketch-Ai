import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArtMedium, SkillLevel, AppState, ViewState,
  UserSession, ArtRoadmap, UserProfile, SessionRecord, AIProvider
} from './types';
import { AIService } from './services/aiService';
import {
  UploadIcon, PlusSquareIcon, TrashIcon, ChevronRightIcon,
  ArrowLeftIcon, HomeIcon, GalleryIcon, EyeIcon, EyeSlashIcon, ScribbleIcon, PrismLogo, RefreshIcon
} from './components/Icons';
import { Loader } from './components/Loader';
import { sendPasswordResetEmail } from './services/emailService';

const DB_KEY = 'sketchai_pro_registry_v3';
const SESSION_KEY = 'sketchai_active_session_v3';
const DAILY_LIMIT = 10;

const mockHash = (p: string) => btoa(`DEV_SALT_${p}_2025`);

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const AuthManager = {
  getUsers: (): UserProfile[] => JSON.parse(localStorage.getItem(DB_KEY) || '[]'),
  setUsers: (u: UserProfile[]) => localStorage.setItem(DB_KEY, JSON.stringify(u)),

  register: (data: Partial<UserProfile>): UserProfile => {
    const users = AuthManager.getUsers();
    if (users.find(u => u.email === data.email)) throw new Error("Identity already in registry.");

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      firstName: data.firstName || 'Studio',
      lastName: data.lastName || 'User',
      email: data.email || '',
      username: data.username || data.email?.split('@')[0] || 'artist',
      passwordHash: mockHash(data.passwordHash || 'sso_bridge'),
      dob: data.dob || '1995-01-01',
      securityQuestion: 'city',
      securityAnswer: 'default',
      dailyCount: 0,
      lastResetDate: new Date().toLocaleDateString(),
      joinedAt: Date.now(),
      profilePic: data.profilePic,
      apiKeys: {},
      preferredProvider: AIProvider.OPENAI
    };
    AuthManager.setUsers([...users, newUser]);
    return newUser;
  },

  authenticate: (email: string, pass: string): UserProfile => {
    const users = AuthManager.getUsers();
    const hash = mockHash(pass);
    const user = users.find(u => u.email === email && (u.passwordHash === hash || u.passwordHash === mockHash('sso_bridge')));
    if (!user) throw new Error("Verification failed.");

    const today = new Date().toLocaleDateString();
    if (user.lastResetDate !== today) {
      user.dailyCount = 0;
      user.lastResetDate = today;
      AuthManager.updateUser(user.id, { dailyCount: 0, lastResetDate: today });
    }

    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },

  validate: (): UserSession | null => {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    const users = AuthManager.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const today = new Date().toLocaleDateString();
    if (user.lastResetDate !== today) {
      user.dailyCount = 0;
      user.lastResetDate = today;
      AuthManager.updateUser(user.id, { dailyCount: 0, lastResetDate: today });
    }

    return {
      ...user,
      userId: user.id,
      sessionId: crypto.randomUUID(),
      apiKeys: user.apiKeys || {},
      preferredProvider: user.preferredProvider || AIProvider.OPENAI
    };
  },

  updateUser: (userId: string, updates: Partial<UserProfile>) => {
    const users = AuthManager.getUsers().map(u => u.id === userId ? { ...u, ...updates } : u);
    AuthManager.setUsers(users);
  },

  updatePasswordByEmail: (email: string, newPass: string) => {
    const users = AuthManager.getUsers().map(u => u.email === email ? { ...u, passwordHash: mockHash(newPass) } : u);
    AuthManager.setUsers(users);
  },

  deleteAccount: (userId: string) => {
    AuthManager.setUsers(AuthManager.getUsers().filter(u => u.id !== userId));
    localStorage.removeItem(SESSION_KEY);
  }
};

const INITIAL_STATE: AppState = {
  view: 'landing',
  activeRoadmap: null,
  currentStepIndex: 0,
  inputImage: null,
  selectedMedium: ArtMedium.GRAPHITE,
  selectedSkill: SkillLevel.BEGINNER,
  preferredProvider: AIProvider.OPENAI,
  error: null,
  isProcessing: false,
  history: []
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const user = AuthManager.validate();
    return {
      ...INITIAL_STATE,
      view: user ? 'studio' : 'landing',
      user,
      preferredProvider: user?.preferredProvider || AIProvider.OPENAI,
      history: JSON.parse(localStorage.getItem('sketchai_pro_history_v1') || '[]')
    };
  });

  const [authData, setAuthData] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  const [prompt, setPrompt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const navigateTo = (v: any, roadmap: ArtRoadmap | null = null) => {
    setState(p => ({ ...p, view: v, activeRoadmap: roadmap || p.activeRoadmap, error: null }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const history = state.history.filter(h => h.id !== id);
    localStorage.setItem('sketchai_pro_history_v1', JSON.stringify(history));
    setState(p => ({ ...p, history }));
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setState(p => ({ ...p, error: null, isProcessing: true }));
    setTimeout(() => {
      try {
        if (state.view === 'signup') AuthManager.register(authData);
        AuthManager.authenticate(authData.email, authData.password);
        setState(p => ({ ...p, user: AuthManager.validate(), view: 'studio', isProcessing: false }));
      } catch (err: any) {
        setState(p => ({ ...p, error: err.message, isProcessing: false }));
      }
    }, 1200);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(p => ({ ...p, isProcessing: true, error: null }));
    setTimeout(async () => {
      const users = AuthManager.getUsers();
      const user = users.find(u => u.email === resetEmail);
      if (!user) {
        setState(p => ({ ...p, isProcessing: false, error: "Registry identifier not found." }));
        return;
      }
      await sendPasswordResetEmail(resetEmail, "https://sketchai.studio/recovery-hash-sim");
      navigateTo('recovery-success');
      setState(p => ({ ...p, isProcessing: false }));
    }, 1500);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setState(p => ({ ...p, error: "Security key must be at least 6 characters." }));
      return;
    }
    AuthManager.updatePasswordByEmail(resetEmail, newPass);
    navigateTo('login');
    alert("Registry credentials updated. Please re-authorize.");
  };

  const handleOAuth = (provider: 'Google' | 'Apple') => {
    const w = 480, h = 650;
    const left = (window.innerWidth - w) / 2, top = (window.innerHeight - h) / 2;
    const popup = window.open('about:blank', `Authorize ${provider}`, `width=${w},height=${h},left=${left},top=${top}`);
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Atelier Bridge Authorization</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-[#000] text-white flex flex-col items-center justify-center h-screen p-12 text-center font-sans overflow-hidden">
             <div class="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f0f12,black)]"></div>
            <div class="w-full max-w-sm relative z-10 backdrop-blur-3xl bg-white/[0.03] p-10 rounded-[4rem] border border-white/10 shadow-4xl">
              <img src="${provider === 'Google' ? 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png' : 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'}" class="w-16 h-16 mb-8 mx-auto ${provider === 'Apple' ? 'invert' : ''}">
              <h1 class="text-3xl font-black mb-2 tracking-tighter uppercase">Identity Bridge</h1>
              <p class="text-xs text-zinc-500 mb-10 uppercase tracking-widest font-bold">Synchronizing with Registry.</p>
              <div class="space-y-4 text-left">
                <input id="email" type="email" placeholder="Credential Email" class="w-full bg-black/60 border border-white/5 px-6 py-5 rounded-2xl focus:border-white outline-none transition-all text-sm">
                <input id="name" type="text" placeholder="Full Identity Name" class="w-full bg-black/60 border border-white/5 px-6 py-5 rounded-2xl focus:border-white outline-none transition-all text-sm">
                <button onclick="finish()" class="w-full py-6 rounded-2xl font-black bg-white text-black hover:bg-zinc-200 transition-all mt-6 uppercase tracking-[0.4em] text-[10px]">Verify identity</button>
              </div>
            </div>
            <script>
              function finish() {
                const email = document.getElementById('email').value;
                const name = document.getElementById('name').value;
                if (!email || !name) return alert('Input required.');
                window.opener.postMessage({ type: 'social_login', email, name }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `);
    }
  };

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.data?.type === 'social_login') {
        const [first, ...last] = e.data.name.split(' ');
        try {
          const user = AuthManager.register({ email: e.data.email, firstName: first, lastName: last.join(' ') });
          AuthManager.authenticate(user.email, 'sso_bridge');
        } catch {
          AuthManager.authenticate(e.data.email, 'sso_bridge');
        }
        setState(p => ({ ...p, user: AuthManager.validate(), view: 'studio' }));
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  const handleSynthesis = async () => {
    if (!state.user) return;
    const hasOwnKey = state.user.apiKeys[state.preferredProvider];

    if (!hasOwnKey && state.user.dailyCount >= DAILY_LIMIT) {
      navigateTo('limit');
      return;
    }

    setState(p => ({ ...p, isProcessing: true, error: null }));
    try {
      let image = state.inputImage;
      let finalPrompt = prompt;

      // Imagination Flow: Generate or Interpret Subject
      if (mode === 'generate') {
        if (!prompt) throw new Error("Composition parameters or poem required for manifestation.");
        // imagineImage now returns either a base64 image or a refined subject description
        const manifestation = await AIService.imagineImage(prompt, state.preferredProvider, state.user.apiKeys);

        if (manifestation.startsWith('data:image')) {
          image = manifestation;
          setState(p => ({ ...p, inputImage: manifestation }));
        } else {
          // If the provider returned text (refined subject), we use that for the roadmap
          finalPrompt = manifestation;
        }
      }

      // We need either a physical image OR a descriptive finalPrompt to build a roadmap
      if (!image && !finalPrompt) throw new Error("No target asset or description selected.");

      const guide = await AIService.generateRoadmap(
        state.user.userId,
        image || finalPrompt, // Pass prompt if image is missing
        state.selectedMedium,
        state.selectedSkill,
        state.preferredProvider,
        state.user.apiKeys
      );

      if (!hasOwnKey) {
        AuthManager.updateUser(state.user.userId, { dailyCount: state.user.dailyCount + 1 });
      }

      const history = [guide, ...state.history].slice(0, 10);
      localStorage.setItem('sketchai_pro_history_v1', JSON.stringify(history));

      setState(p => ({ ...p, history, activeRoadmap: guide, view: 'workspace', currentStepIndex: 0, isProcessing: false, user: AuthManager.validate() }));
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setState(p => ({ ...p, error: err.message || "Failed to generate roadmap.", isProcessing: false }));
    }
  };

  const secureUnmask = () => {
    setIsVerifying(true);
    setTimeout(() => {
      if (confirm("Biometric Identity Confirmed. Decrypt and reveal sensitive registry credential study?")) {
        setShowPass(true);
      }
      setIsVerifying(false);
    }, 2000);
  };

  const renderNav = () => (
    <nav className="h-16 md:h-20 fixed top-0 w-full z-50 advanced-glass border-b border-white/5 flex items-center justify-between px-4 md:px-8 lg:px-16">
      <div className="flex items-center gap-4 md:gap-8">
        <div onClick={() => navigateTo('studio')} className="flex items-center gap-2 md:gap-4 cursor-pointer group">
          <PrismLogo />
          <span className="font-black text-xl md:text-2xl lg:text-3xl tracking-tighter uppercase select-none bg-gradient-to-r from-white via-white/70 to-zinc-500 bg-clip-text text-transparent group-hover:tracking-widest transition-all duration-700">SketchAI</span>
        </div>
        {state.user && (
          <div className="hidden lg:flex gap-6 text-xs font-black uppercase tracking-wider text-zinc-600">
            <button onClick={() => navigateTo('studio')} className="hover:text-white transition-all">Atelier</button>
            <button onClick={() => navigateTo('studio')} className="hover:text-white transition-all">Library</button>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-3xl shadow-2xl transition-all ${state.user.dailyCount >= DAILY_LIMIT ? 'bg-red-950/30 border-red-500/20' : state.user.dailyCount >= DAILY_LIMIT - 2 ? 'bg-yellow-950/20 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}>
              <span className="text-zinc-500 text-xs">Studios:</span>
              <span className={`font-bold text-sm ${state.user.dailyCount >= DAILY_LIMIT ? 'text-red-400' : state.user.dailyCount >= DAILY_LIMIT - 2 ? 'text-yellow-400' : 'text-zinc-100'}`}>
                {state.user.dailyCount}/{DAILY_LIMIT}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 md:gap-8">
        {state.user && (
          <div className="flex gap-4 md:gap-8 mr-4 md:mr-8 border-r border-white/5 pr-4 md:pr-8">
            <button onClick={() => navigateTo('studio')} className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${state.view === 'studio' ? 'text-white' : 'text-zinc-600 hover:text-white'}`}>Studio</button>
            <button onClick={() => navigateTo('gallery')} className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${state.view === 'gallery' ? 'text-white' : 'text-zinc-600 hover:text-white'}`}>Gallery</button>
          </div>
        )}
        {state.user ? (
          <button onClick={() => navigateTo('profile')} className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-white/10 p-0.5 hover:border-white transition-all overflow-hidden flex items-center justify-center bg-zinc-950 shadow-2xl relative group">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {state.user.profilePic ? <img src={state.user.profilePic} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" /> : <span className="font-black text-base md:text-lg text-white">{state.user.firstName[0]}</span>}
          </button>
        ) : (
          <div className="flex gap-3 md:gap-6">
            <button onClick={() => navigateTo('login')} className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-all">Authorize</button>
            <button onClick={() => navigateTo('signup')} className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider shadow-4xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95">Enroll</button>
          </div>
        )}
      </div>
    </nav>
  );

  const renderView = () => {
    switch (state.view) {
      case 'landing':
        return (
          <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4 md:px-8 lg:px-12 pt-20 pb-12 fade-in relative">
            <div className="hero-glow"></div>
            <div className="advanced-glass border-white/10 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-black uppercase tracking-wider text-zinc-500 mb-8 md:mb-12 border border-white/5 shadow-7xl backdrop-blur-3xl animate-pulse">
              Digital Atelier Suite v4.0
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-tight mb-6 md:mb-8 select-none relative group">
              Anatomy <br />
              <span className="bg-gradient-to-b from-white via-white to-zinc-800 bg-clip-text text-transparent italic serif font-medium px-2 md:px-4">Science.</span>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 md:w-48 h-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-[1.5s] ease-out"></div>
            </h1>
            <p className="text-zinc-500 text-sm md:text-base lg:text-lg xl:text-xl max-w-4xl mx-auto leading-relaxed mb-8 md:mb-12 font-light tracking-tight px-4 md:px-6 opacity-70">
              Deconstruct visual complexity into absolute structural mastery. <br className="hidden md:block" />
              High-fidelity study assets for the modern draughtsman.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 relative z-10">
              <button onClick={() => navigateTo('signup')} className="bg-white text-black px-6 md:px-8 lg:px-12 py-3 md:py-4 rounded-2xl font-black text-sm md:text-base lg:text-lg uppercase tracking-wider shadow-[0_20px_60px_-20px_rgba(255,255,255,0.7)] hover:scale-105 active:scale-95 transition-all">Start Project</button>
              <button onClick={() => navigateTo('login')} className="bg-black/20 backdrop-blur-3xl border border-white/10 px-6 md:px-8 lg:px-12 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base lg:text-lg text-white hover:bg-white/10 transition-all">Verify Registry</button>
            </div>
          </div>
        );

      case 'login':
      case 'signup':
        return (
          <div className="flex items-center justify-center min-h-[90vh] py-8 md:py-12 px-4 md:px-8 overflow-y-auto">
            <div className="w-full max-w-2xl advanced-glass p-6 md:p-8 lg:p-12 rounded-[2.5rem] space-y-6 md:space-y-8 fade-in border-t-2 border-t-white shadow-7xl relative overflow-hidden flex-shrink-0">
              <div className="absolute top-2 right-4 p-4 opacity-[0.03] scale-150 rotate-12"><PrismLogo /></div>
              <div className="text-center space-y-3 md:space-y-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">{state.view === 'login' ? 'Credentials' : 'Enrollment'}</h2>
                <p className="text-zinc-700 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Studio registry identity.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button onClick={() => handleOAuth('Google')} className="flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 ultra-glass font-black rounded-xl text-[10px] md:text-xs uppercase tracking-widest shadow-4xl hover:bg-white/10 transition-all">
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 md:w-6 md:h-6" /> Google
                </button>
                <button onClick={() => handleOAuth('Apple')} className="flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 ultra-glass font-black rounded-xl text-[10px] md:text-xs uppercase tracking-widest shadow-4xl hover:bg-white/10 transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="w-5 h-5 md:w-6 md:h-6 invert" /> Apple
                </button>
              </div>
              <form onSubmit={handleAuth} className="space-y-4 md:space-y-6">
                {state.view === 'signup' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <input required placeholder="First Name" value={authData.firstName} onChange={e => setAuthData({ ...authData, firstName: e.target.value })} className="input-premium px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold tracking-tight border border-white/10" />
                    <input required placeholder="Last Name" value={authData.lastName} onChange={e => setAuthData({ ...authData, lastName: e.target.value })} className="input-premium px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold tracking-tight border border-white/10" />
                  </div>
                )}
                <input type="email" required placeholder="Identity Email" value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })} className="w-full input-premium px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold tracking-tight border border-white/10" />
                <div className="space-y-2">
                  <input type="password" required placeholder="Security Shield Key" value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} className="w-full input-premium px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold tracking-tight border border-white/10" />
                  {state.view === 'login' && (
                    <button type="button" onClick={() => navigateTo('forgot-password')} className="text-[10px] font-black text-zinc-700 hover:text-white uppercase tracking-widest ml-2 transition-colors">Forgot Security Key?</button>
                  )}
                </div>
                {state.error && <p className="text-red-500 text-[10px] md:text-xs font-black text-center uppercase tracking-widest italic">{state.error}</p>}
                <button disabled={state.isProcessing} className="w-full bg-white text-black py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-[0.2em] shadow-6xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">
                  {state.isProcessing ? 'Verifying...' : (state.view === 'login' ? 'Authorize Identity' : 'Initialize Enrollment')}
                </button>
              </form>
              <button onClick={() => navigateTo(state.view === 'login' ? 'signup' : 'login')} className="w-full text-[10px] md:text-xs font-black text-zinc-700 hover:text-white transition-colors uppercase tracking-widest block text-center mt-4">
                {state.view === 'login' ? "Register New Profile" : "Existing Atelier ID"}
              </button>
            </div>
          </div>
        );

      case 'profile':
        if (!state.user) return null;
        return (
          <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-20 fade-in space-y-12">
            <header className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-white/5 pb-8 gap-4">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none opacity-90 uppercase">Identity</h2>
                <div className="flex items-center gap-4">
                  <p className="text-zinc-700 font-black uppercase tracking-wider text-xs md:text-sm">Studio Registry Profile</p>
                  <span className="w-2 h-2 rounded-full bg-white/20"></span>
                  <p className="text-zinc-900 font-black uppercase tracking-wider text-xs">Member since {new Date(state.user.joinedAt).getFullYear()}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => {
                  setState(p => ({ ...p, isProcessing: true }));
                  setTimeout(() => setState(p => ({ ...p, isVaultUnlocked: !p.isVaultUnlocked, isProcessing: false })), 1500);
                }} className={`px-6 py-3 advanced-glass border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.isVaultUnlocked ? 'text-white border-white' : 'text-zinc-500 hover:text-white'}`}>
                  {state.isVaultUnlocked ? 'Lock Vault' : 'Secure Biometric Lock'}
                </button>
                <button onClick={() => { localStorage.removeItem(SESSION_KEY); navigateTo('landing'); }} className="px-6 py-3 bg-zinc-950 border border-white/5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all shadow-6xl">De-Authorize</button>
              </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-6">
                <div className="w-full aspect-square advanced-glass rounded-3xl flex items-center justify-center relative group cursor-pointer overflow-hidden border-2 border-transparent hover:border-white transition-all shadow-7xl" onClick={() => fileRef.current?.click()}>
                  {state.user.profilePic ? <img src={state.user.profilePic} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 duration-[3s] group-hover:scale-110" /> : <div className="text-center opacity-5 select-none"><span className="text-9xl font-black">{state.user.firstName[0]}</span></div>}
                  <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col items-center justify-center backdrop-blur-3xl">
                    <UploadIcon />
                    <span className="text-xs font-black uppercase tracking-wider mt-4">Update Identity Asset</span>
                  </div>
                  <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = ev => {
                        AuthManager.updateUser(state.user!.userId, { profilePic: ev.target?.result as string });
                        setState(p => ({ ...p, user: AuthManager.validate() }));
                      };
                      r.readAsDataURL(f);
                    }
                  }} />
                </div>
              </div>
              <div className="lg:col-span-8 space-y-12">
                {state.isVaultUnlocked ? (
                  <section className="space-y-6 fade-in">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 ml-2">Digital Vault (Orchestration Secrets)</h3>
                    <div className="space-y-8 advanced-glass p-8 rounded-2xl border border-white/20 shadow-inner">
                      <p className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest -mt-2">Keys are stored locally in your browser's encrypted registry and never transmitted to our servers.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(AIProvider).map(provider => (
                          <div key={provider} className="space-y-4 group">
                            <div className="flex justify-between items-center ml-1">
                              <label className="text-[9px] font-black text-zinc-500 group-hover:text-zinc-400 uppercase tracking-widest transition-colors">{provider} Master Key</label>
                              {state.user?.apiKeys[provider] && (state.user.apiKeys[provider].length < 10) && <span className="text-[8px] bg-red-950/40 text-red-500 px-2 py-0.5 rounded font-black uppercase">Insecure / Short</span>}
                            </div>
                            <input type="password" placeholder={`Enter ${provider} Token`} value={state.user?.apiKeys[provider] || ''} onChange={(e) => {
                              const newKeys = { ...state.user!.apiKeys, [provider as string]: e.target.value };
                              AuthManager.updateUser(state.user!.userId, { apiKeys: newKeys });
                              setState(p => ({ ...p, user: AuthManager.validate() }));
                            }} className={`w-full input-premium px-4 py-3 rounded-xl text-zinc-200 font-mono text-xs tracking-tight bg-black/60 border focus:border-white transition-all shadow-2xl ${state.user?.apiKeys[provider] && state.user.apiKeys[provider].length < 10 ? 'border-red-900/50' : 'border-white/30'}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 ml-2">Access Security</h3>
                    <div className="advanced-glass p-12 rounded-3xl border border-white/10 text-center space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ScribbleIcon />
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-tighter">Vault Encrypted</h4>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">Initialize biometric guard to reveal your private orchestration secrets and API credentials.</p>
                      <button onClick={() => {
                        setState(p => ({ ...p, isProcessing: true }));
                        setTimeout(() => setState(p => ({ ...p, isVaultUnlocked: true, isProcessing: false })), 1500);
                      }} className="mt-6 px-10 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-4xl">Initialize Scan</button>
                    </div>
                  </section>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-800 ml-1">Identity Display Name</label>
                    <input type="text" value={`${state.user.firstName} ${state.user.lastName}`} disabled className="w-full bg-black/20 border border-white/5 p-4 rounded-xl text-xs font-bold text-zinc-500 cursor-not-allowed uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-800 ml-1">Registry Email</label>
                    <input type="text" value={state.user.email} disabled className="w-full bg-black/20 border border-white/5 p-4 rounded-xl text-xs font-bold text-zinc-500 cursor-not-allowed uppercase" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'studio':
        return (
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-20 space-y-16 fade-in relative">
            <header className="space-y-6 flex flex-col xl:flex-row xl:items-end xl:justify-between">
              <div className="relative group">
                <h2 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter uppercase leading-tight select-none opacity-90">Studio</h2>
              </div>
              <div className="flex gap-4 p-3 advanced-glass border border-white/10 rounded-2xl w-fit shadow-7xl">
                <button onClick={() => setMode('upload')} className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${mode === 'upload' ? 'bg-white text-black shadow-5xl scale-105' : 'text-zinc-700 hover:text-white'}`}>Asset Scan</button>
                <button onClick={() => setMode('generate')} className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${mode === 'generate' ? 'bg-zinc-900 text-white shadow-5xl scale-105' : 'text-zinc-700 hover:text-white'}`}>Manifest Engine</button>
              </div>
            </header>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              <div className="xl:col-span-8 advanced-glass p-12 rounded-3xl space-y-8 border-t-2 border-t-white shadow-7xl">
                {mode === 'upload' ? (
                  <div className="relative h-[500px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center bg-black/60 cursor-pointer group hover:border-white transition-all overflow-hidden" onClick={() => !state.inputImage && fileRef.current?.click()}>
                    {state.inputImage ? <img src={state.inputImage} className="w-full h-full object-cover grayscale opacity-30 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-[7s]" /> : <div className="text-center space-y-6"><UploadIcon /><p className="text-lg font-black text-zinc-900 uppercase tracking-wider group-hover:text-white transition-all">Scan Target Asset</p></div>}
                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = ev => setState(p => ({ ...p, inputImage: ev.target?.result as string }));
                        r.readAsDataURL(f);
                      }
                    }} />
                  </div>
                ) : (
                  <div className="h-[500px] flex flex-col justify-center items-center text-center p-8 md:p-12 border-2 border-white/5 rounded-3xl bg-black/60 shadow-inner relative group/man">
                    <h3 className="text-4xl md:text-6xl font-black mb-6 italic serif uppercase tracking-tighter opacity-70">Manifest</h3>
                    <textarea placeholder="Describe a composition or paste a poem..." value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-6 text-lg focus:border-white outline-none transition-all resize-none shadow-8xl italic font-medium tracking-tight backdrop-blur-3xl relative z-10" />
                    <div className="flex flex-wrap justify-center gap-2 mt-6 relative z-10">
                      {["Anatomical study of a raven", "Old man in charcoal", "Watercolor sunrise over Kyoto", "Cyberpunk noir alleyway", "Mechanical heart schematic", "Deep sea bioluminescence", "Victorian street in rain", "Geometric fox portrait"].map(t => (
                        <button key={t} onClick={() => setPrompt(t)} className="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">+{t}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select value={state.selectedMedium} onChange={e => setState(p => ({ ...p, selectedMedium: e.target.value as any }))} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 font-black text-zinc-600 outline-none focus:border-white appearance-none shadow-7xl cursor-pointer text-base uppercase tracking-wider text-center">{Object.values(ArtMedium).map(m => <option key={m} value={m}>{m}</option>)}</select>
                  <select value={state.selectedSkill} onChange={e => setState(p => ({ ...p, selectedSkill: e.target.value as any }))} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 font-black text-zinc-600 outline-none focus:border-white appearance-none shadow-7xl cursor-pointer text-base uppercase tracking-wider text-center">{Object.values(SkillLevel).map(s => <option key={s} value={s}>{s}</option>)}</select>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800 ml-4">Orchestration Engine</label>
                    <select value={state.preferredProvider} onChange={e => {
                      const newProvider = e.target.value as any;
                      setState(p => ({ ...p, preferredProvider: newProvider }));
                      if (state.user) AuthManager.updateUser(state.user.userId, { preferredProvider: newProvider });
                    }} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 font-black text-zinc-100 outline-none focus:border-white appearance-none shadow-7xl cursor-pointer text-base uppercase tracking-wider text-center">{Object.values(AIProvider).map(p => <option key={p} value={p}>{p}</option>)}</select>
                  </div>
                </div>
                <button onClick={handleSynthesis} disabled={state.isProcessing} className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.6em] rounded-2xl hover:scale-105 active:scale-95 transition-all text-xl shadow-xl">{state.isProcessing ? 'Synthesizing...' : 'Initialize Session'}</button>
              </div>
              <div className="xl:col-span-4 space-y-8">
                <h3 className="text-xl font-black uppercase tracking-widest text-zinc-700 ml-4">Art Registry</h3>
                <div className="advanced-glass p-6 rounded-3xl h-[600px] overflow-y-auto no-scrollbar space-y-4">
                  {state.history.length === 0 ? <p className="text-zinc-500 font-black uppercase text-center mt-20 opacity-20">Registry is empty</p> : state.history.map(h => (
                    <div key={h.id} onClick={() => navigateTo('workspace', h)} className="p-4 advanced-glass rounded-2xl cursor-pointer hover:border-white transition-all flex items-center gap-4 group">
                      <div className="w-16 h-16 bg-black rounded-lg overflow-hidden shrink-0"><PrismLogo /></div>
                      <div>
                        <p className="font-black text-[10px] uppercase text-zinc-400 tracking-widest">{h.medium}</p>
                        <p className="text-[10px] text-zinc-700 font-bold uppercase">{new Date(h.timestamp).toLocaleDateString()}</p>
                      </div>
                      <button onClick={(e) => deleteHistoryItem(h.id, e)} className="ml-auto p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><TrashIcon /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'workspace':
        if (!state.activeRoadmap) return null;
        const totalSteps = state.activeRoadmap.steps.length;
        const step = state.activeRoadmap.steps[state.currentStepIndex];

        // Safety check if index out of bounds
        if (!step) {
          navigateTo('studio');
          return null;
        }

        return (
          <div className="min-h-screen py-24 px-4 md:px-8 lg:px-16 space-y-12 fade-in">
            <header className="flex justify-between items-center border-b border-white/5 pb-8">
              <button onClick={() => navigateTo('studio')} className="flex items-center gap-3 text-zinc-500 hover:text-white transition-all group font-black uppercase tracking-widest text-xs"><ArrowLeftIcon /> Back to Studio</button>
              <div className="flex items-center gap-4"><ScribbleIcon /><span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Phased Drawing Guide</span></div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                <div className="space-y-4">
                  <span className="text-5xl font-black uppercase tracking-tighter text-white opacity-20 italic">Step {String(state.currentStepIndex + 1).padStart(2, '0')}</span>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-tight">{step.title}</h2>
                  <p className="text-zinc-400 text-lg leading-relaxed font-medium">{step.instruction}</p>
                </div>
                <div className="advanced-glass p-8 rounded-3xl border border-white/10 space-y-4"><p className="text-xs font-black uppercase tracking-widest text-zinc-700">Artistic Insight</p><p className="italic text-zinc-300 font-medium">{step.technicalTip}</p></div>
                <div className="flex gap-4">
                  <button onClick={() => setState(p => ({ ...p, currentStepIndex: Math.max(0, p.currentStepIndex - 1) }))} disabled={state.currentStepIndex === 0} className="flex-1 py-4 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-20 hover:bg-white/5 transition-all">Back</button>
                  <button onClick={() => state.currentStepIndex < totalSteps - 1 ? setState(p => ({ ...p, currentStepIndex: p.currentStepIndex + 1 })) : navigateTo('studio')} className="flex-1 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-4xl">{state.currentStepIndex === totalSteps - 1 ? 'Archive' : 'Next Phase'}</button>
                  <button onClick={() => setState(p => ({ ...p, currentStepIndex: 0 }))} className="p-4 advanced-glass border border-white/10 rounded-xl hover:text-white text-zinc-700 transition-all" title="Restart Deconstruction"><RefreshIcon /></button>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-8">
                <div className="aspect-square advanced-glass rounded-[4rem] flex items-center justify-center p-12 shadow-7xl border-t-4 border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/[0.02] animate-pulse"></div>
                  <div className="w-full h-full border border-white/5 rounded-3xl bg-black/40 flex items-center justify-center text-zinc-900 font-black uppercase tracking-[2em] text-center select-none italic opacity-5">{step.visualType}</div>
                </div>
                <div className="flex justify-between items-center px-8 relative"><div className="absolute h-0.5 bg-white/5 left-12 right-12 top-1/2 -translate-y-1/2"></div>{state.activeRoadmap.steps.map((_, i) => <div key={i} onClick={() => setState(p => ({ ...p, currentStepIndex: i }))} className={`w-10 h-10 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all z-10 ${i === state.currentStepIndex ? 'bg-white border-white text-black scale-125 shadow-7xl' : 'bg-black border-white/10 text-zinc-700 hover:border-white/40'}`}><ScribbleIcon /></div>)}</div>
              </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-20 space-y-12 fade-in">
            <header className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b border-white/5 pb-8">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter opacity-90">Art Registry</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs underline decoration-white/20 underline-offset-8">{state.history.length} Manifestations Archived</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {state.history.length === 0 ? (
                <div className="col-span-full h-96 flex flex-col items-center justify-center text-zinc-800 space-y-6">
                  <GalleryIcon />
                  <p className="font-black uppercase tracking-[0.5em] text-sm italic opacity-10">Historical data empty</p>
                </div>
              ) : (
                state.history.map(h => (
                  <div key={h.id} onClick={() => navigateTo('workspace', h)} className="group advanced-glass rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-white/40 transition-all shadow-7xl hover:scale-[1.02]">
                    <div className="aspect-[4/5] bg-black/40 flex items-center justify-center p-12 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <PrismLogo />
                      <div className="bottom-6 left-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 absolute">
                        <button onClick={(e) => { e.stopPropagation(); navigateTo('workspace', h); }} className="flex-1 bg-white text-black py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-8xl">Reconstruct</button>
                        <button onClick={(e) => deleteHistoryItem(h.id, e)} className="p-3 advanced-glass border border-white/10 text-zinc-500 hover:text-red-500 rounded-xl transition-all"><TrashIcon /></button>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{h.medium}</p>
                      <p className="text-[10px] text-zinc-800 font-bold uppercase">{new Date(h.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'limit':
        return (
          <div className="flex flex-col h-screen bg-black text-white fade-in overflow-hidden">
            <header className="p-10 flex items-center justify-between border-b border-white/5 advanced-glass z-20">
              <button onClick={() => navigateTo('studio')} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group font-black uppercase tracking-widest text-xs"><ArrowLeftIcon /> Back to Studio</button>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Registry Status</h1>
              <div className="w-24"></div>
            </header>
            <main className="flex-1 flex items-center justify-center p-12 overflow-y-auto">
              <div className="w-full max-w-xl advanced-glass p-12 rounded-[3.5rem] space-y-8 shadow-7xl text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-red-950/30 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><span className="text-red-400 text-3xl">⚠</span></div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">Limit Reached</h2>
                <p className="text-zinc-500 text-xs font-medium px-4 mb-2 uppercase tracking-widest">You've reached your daily studio session limit of <span className="text-white font-black">{DAILY_LIMIT} generations</span>.</p>
                <div className="advanced-glass p-8 rounded-3xl border border-white/10 my-6">
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6"><b className="text-white">Provide your {state.preferredProvider} key</b> to continue high-fidelity deconstruction.</p>
                  <input type="password" placeholder={`Enter ${state.preferredProvider} Secret Key`} value={state.user?.apiKeys[state.preferredProvider] || ''} onChange={(e) => {
                    if (state.user) {
                      const newKeys = { ...state.user.apiKeys, [state.preferredProvider]: e.target.value };
                      AuthManager.updateUser(state.user.userId, { apiKeys: newKeys });
                      setState(p => ({ ...p, user: AuthManager.validate() }));
                    }
                  }} className="w-full input-premium px-6 py-4 rounded-xl text-zinc-200 font-mono text-sm tracking-tight mb-4 border border-white/30 focus:border-white shadow-inner" />
                  <button onClick={() => state.user?.apiKeys[state.preferredProvider] ? navigateTo('studio') : alert(`Please add a valid ${state.preferredProvider} key.`)} className="w-full bg-white text-black py-4 rounded-2xl font-black text-base uppercase tracking-wider shadow-6xl hover:scale-105 transition-all">Authenticate Access</button>
                  <div className="pt-6 flex flex-col gap-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Please enter your cloud access credentials in the input above."); }} className="text-[10px] text-zinc-500 hover:text-white underline uppercase tracking-widest transition-colors font-bold">Deploy Cloud Access Key</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Enter your engine credentials to continue."); }} className="text-[10px] text-zinc-500 hover:text-white underline uppercase tracking-widest transition-colors font-bold">Engine Provisioning</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => navigateTo('profile')} className="flex-1 bg-zinc-950 border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Profile Settings</button>
                  <button onClick={() => navigateTo('studio')} className="flex-1 bg-white/5 border border-white/5 text-zinc-700 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">Studio Home</button>
                </div>
              </div>
            </main>
          </div>
        );

      default:
        return <div className="h-screen flex items-center justify-center"><Loader text="Initializing Atelier Suite..." /></div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      {renderNav()}
      <main className="flex-1 relative overflow-hidden">{renderView()}</main>
      <footer className="py-12 px-8 border-t border-white/5 text-center text-[10px] font-black uppercase tracking-[1em] text-zinc-900 opacity-20">
        © 2024-2025 SketchAI Pro — The Advanced High-Fidelity Digital Atelier.
      </footer>
    </div>
  );
};

export default App;
