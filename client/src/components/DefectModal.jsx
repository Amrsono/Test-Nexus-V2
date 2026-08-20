import React from 'react';
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
