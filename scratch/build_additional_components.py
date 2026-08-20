import os

comp_dir = "client/src/components"

# 1. HeaderNav.jsx
header_code = """import React from 'react';
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
"""
with open(os.path.join(comp_dir, "HeaderNav.jsx"), "w", encoding="utf-8") as f:
    f.write(header_code)

# 2. DefectModal.jsx
defect_modal_code = """import React from 'react';
import { Bug, X, Save } from 'lucide-react';

export const DefectModal = ({
  isOpen,
  onClose,
  defectData,
  onChange,
  onSubmit,
  isEditing = false,
  isDark = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-xl p-6 rounded-3xl border-2 shadow-2xl ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">{isEditing ? 'Edit Blocker / Defect' : 'Log New Defect'}</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Link defects to blocked test cases and action plans
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Defect Title</label>
            <input
              type="text"
              value={defectData.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Severity</label>
              <select
                value={defectData.severity || 'P2'}
                onChange={(e) => onChange('severity', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <option value="P1">P1 - Critical Blocker</option>
                <option value="P2">P2 - Major Impact</option>
                <option value="P3">P3 - Moderate Defect</option>
                <option value="P4">P4 - Low / Minor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Status</label>
              <select
                value={defectData.status || 'OPEN'}
                onChange={(e) => onChange('status', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <option value="OPEN">OPEN</option>
                <option value="FIXED">FIXED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Owner / Assignee</label>
              <input
                type="text"
                value={defectData.owner || ''}
                onChange={(e) => onChange('owner', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">External Jira / Bug ID</label>
              <input
                type="text"
                value={defectData.externalId || ''}
                onChange={(e) => onChange('externalId', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Description & Reproduction</label>
            <textarea
              rows={3}
              value={defectData.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Action Plan</label>
            <input
              type="text"
              value={defectData.actionPlan || ''}
              onChange={(e) => onChange('actionPlan', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" /> {isEditing ? 'Update Defect' : 'Log Defect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DefectModal;
"""
with open(os.path.join(comp_dir, "DefectModal.jsx"), "w", encoding="utf-8") as f:
    f.write(defect_modal_code)

print('Additional components built successfully!')
