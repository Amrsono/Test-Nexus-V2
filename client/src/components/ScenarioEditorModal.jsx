import React from 'react';
import { Edit3, X, Save } from 'lucide-react';

export const ScenarioEditorModal = ({
  isOpen,
  scenario,
  onClose,
  onChange,
  onSave,
  loading = false,
  isDark = true
}) => {
  if (!isOpen || !scenario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-2xl p-6 rounded-3xl border-2 shadow-2xl ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Edit Test Scenario</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Refine journey steps, validations, and expected outcomes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Summary</label>
            <input
              type="text"
              value={scenario.summary || ''}
              onChange={(e) => onChange('summary', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Module</label>
              <input
                type="text"
                value={scenario.module || ''}
                onChange={(e) => onChange('module', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Priority</label>
              <select
                value={scenario.priority || 'MEDIUM'}
                onChange={(e) => onChange('priority', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Steps</label>
            <textarea
              rows={4}
              value={scenario.steps || ''}
              onChange={(e) => onChange('steps', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Expected Result</label>
            <textarea
              rows={3}
              value={scenario.expectedResult || ''}
              onChange={(e) => onChange('expectedResult', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioEditorModal;
