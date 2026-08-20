import React, { useState } from 'react';
import { Users, X, Plus, Trash2, Edit3, Check } from 'lucide-react';

export const TeamModal = ({
  isOpen,
  onClose,
  testers = [],
  onAddTester,
  onDeleteTester,
  isDark = true
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState('15');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (onAddTester) {
      onAddTester({ name, email, dailyCapacity: parseInt(dailyCapacity, 10) || 15 });
    }
    setName('');
    setEmail('');
    setDailyCapacity('15');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-xl p-6 rounded-3xl border-2 shadow-2xl ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Team Capacity & Testers</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Manage testers and calculate daily execution velocity
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

        {/* Add Tester Form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            placeholder="Tester Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`flex-1 min-w-[140px] px-3 py-2 text-sm rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
            }`}
            required
          />
          <input
            type="email"
            placeholder="Email (Optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`flex-1 min-w-[140px] px-3 py-2 text-sm rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
            }`}
          />
          <input
            type="number"
            placeholder="Daily Cap"
            value={dailyCapacity}
            onChange={(e) => setDailyCapacity(e.target.value)}
            className={`w-24 px-3 py-2 text-sm rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Tester List */}
        <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
          {testers.length === 0 ? (
            <div className="text-center py-6 text-sm opacity-60">
              No testers assigned to this project yet.
            </div>
          ) : (
            testers.map((t, idx) => (
              <div
                key={t.id || idx}
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs opacity-60">{t.email || 'No email provided'} • {t.dailyCapacity || 15} cases/day</div>
                </div>

                {onDeleteTester && (
                  <button
                    onClick={() => onDeleteTester(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamModal;
