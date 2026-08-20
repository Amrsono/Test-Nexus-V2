import React, { useState } from 'react';
import { Plus, X, FolderPlus } from 'lucide-react';

export const NewProjectModal = ({
  isOpen,
  onClose,
  onCreateProject,
  isDark = true
}) => {
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [startDate, setStartDate] = useState('');
  const [goLiveDate, setGoLiveDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreateProject({
        name: name.trim(),
        themeColor,
        startDate: startDate || null,
        goLiveDate: goLiveDate || null,
      });
      setName('');
      setThemeColor('#6366f1');
      setStartDate('');
      setGoLiveDate('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-lg p-6 rounded-3xl border-2 shadow-2xl ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Create New Project / Workspace</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Set up a new QA environment, sprint, or release target
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Project Name *</label>
            <input
              type="text"
              placeholder="e.g. Phoenix Release 2.0"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Theme Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-70">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1 opacity-70">Target Go-Live Date</label>
            <input
              type="date"
              value={goLiveDate}
              onChange={(e) => setGoLiveDate(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
