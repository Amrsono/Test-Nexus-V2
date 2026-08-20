import React, { useState } from 'react';
import { Shield, Sparkles, LogOut, Upload, Download, Settings, ChevronDown, FileSpreadsheet, Presentation, FileText } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export const HeaderNav = ({
  user,
  currentView,
  setCurrentView,
  isDark,
  setIsDark,
  onLogout,
  onOpenImportModal,
  onExportExcel,
  onExportCSV,
  onExportPPT,
  subscriptionStatus = 'PRO'
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const isAdmin = user && (user.role === 'ADMIN' || user.isAdmin === true);

  return (
    <header className="w-full flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-slate-950/90 shadow-xl">
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
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800">
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
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Scenario Lab
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
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            currentView === 'help' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Help
        </button>
      </div>

      {/* Import / Export & User Controls */}
      <div className="flex items-center gap-2.5">
        {/* Import Button */}
        {onOpenImportModal && (
          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-2 rounded-xl border text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 shadow-sm"
            title="Import Excel / CSV Test Cases"
          >
            <Upload className="w-4 h-4 text-indigo-400" /> Import Data
          </button>
        )}

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-3.5 py-2 rounded-xl border text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 py-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs font-bold animate-in fade-in">
              {onExportExcel && (
                <button
                  onClick={() => { onExportExcel(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel (.xlsx)
                </button>
              )}
              {onExportCSV && (
                <button
                  onClick={() => { onExportCSV(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Export CSV (.csv)
                </button>
              )}
              {onExportPPT && (
                <button
                  onClick={() => { onExportPPT(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <Presentation className="w-4 h-4 text-amber-400" /> Export PPT Report
                </button>
              )}
            </div>
          )}
        </div>

        <LanguageSwitcher />

        {/* Admin Dashboard Tab Button */}
        {isAdmin && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'admin'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-300" /> Admin
          </button>
        )}

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {user.name || user.email}
                {isAdmin && <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] border border-purple-500/30">ADMIN</span>}
              </div>
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
