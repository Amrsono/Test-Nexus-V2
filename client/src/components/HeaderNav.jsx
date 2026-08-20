import React from 'react';
import { Shield, Sparkles, LogOut, Sun, Moon, HelpCircle, Info, Settings } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export const HeaderNav = ({
  user,
  currentView,
  setCurrentView,
  isDark,
  setIsDark,
  onLogout,
  subscriptionStatus = 'TRIAL'
}) => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-slate-950/80">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            TEST NEXUS <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">v1.0</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise QA & Execution Intelligence</p>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentView('lab')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            currentView === 'lab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Scenario Lab
        </button>
        <button
          onClick={() => setCurrentView('subscription')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            currentView === 'subscription' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Plans
        </button>
        <button
          onClick={() => setCurrentView('help')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
            currentView === 'help' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Help
        </button>
      </div>

      {/* User / Settings / Action Items */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        {user && user.role === 'ADMIN' && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'admin'
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            <Settings className="w-4 h-4" /> Admin
          </button>
        )}

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-bold text-white">{user.name || user.email}</div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">{subscriptionStatus}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderNav;
