import os

components_dir = "client/src/components"
admin_dir = "client/src/components/admin"
hooks_dir = "client/src/hooks"

# 1. ExecutiveHero.jsx
exec_hero_code = """import React from 'react';
import { ArrowUpRight, TrendingDown, CheckCircle2, AlertCircle, Clock, Bug, Shield } from 'lucide-react';

export const MetricCard = ({ label, value, icon, change, trend, isDark = true }) => (
  <div className={`p-6 rounded-3xl border-2 transition-all hover:scale-105 duration-300 ${
    isDark ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white border-slate-400 shadow-xl'
  }`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} shadow-sm`}>
        {icon}
      </div>
      {change && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
          trend === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 
          trend === 'down' ? 'text-rose-500 bg-rose-500/10' : 
          'text-slate-500 bg-slate-500/10'
        }`}>
          {trend === 'up' && <ArrowUpRight size={14} />}
          {trend === 'down' && <TrendingDown size={14} />}
          {change}
        </span>
      )}
    </div>
    <h3 className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
    <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
  </div>
);

export const ExecutiveHero = ({ stats = {}, isDark = true, projectName = 'Project' }) => {
  const total = stats.total || 0;
  const passed = stats.passed || 0;
  const failed = stats.failed || 0;
  const blocked = stats.blocked || 0;
  const pending = stats.pending || 0;

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const failRate = total > 0 ? Math.round((failed / total) * 100) : 0;

  const healthStatus =
    total === 0 ? 'NEUTRAL' :
    passRate >= 80 ? 'HEALTHY' :
    passRate >= 50 ? 'AT RISK' : 'CRITICAL';

  return (
    <div className="w-full mb-8">
      {/* Top Banner with Health */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Executive Overview — {projectName}
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time testing health status and quality gate progress.
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-black text-sm tracking-wide ${
          healthStatus === 'HEALTHY'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : healthStatus === 'AT RISK'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : healthStatus === 'CRITICAL'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-current" />
          GATE STATUS: {healthStatus} ({passRate}%)
        </div>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Scenarios"
          value={total}
          icon={<Shield className="w-6 h-6 text-indigo-400" />}
          change={`${total} cases`}
          trend="up"
          isDark={isDark}
        />
        <MetricCard
          label="Passed Journeys"
          value={passed}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          change={`${passRate}% pass`}
          trend="up"
          isDark={isDark}
        />
        <MetricCard
          label="Failed / Blocked"
          value={failed + blocked}
          icon={<Bug className="w-6 h-6 text-rose-400" />}
          change={`${failRate}% rate`}
          trend={failed + blocked > 0 ? "down" : "up"}
          isDark={isDark}
        />
        <MetricCard
          label="Pending Execution"
          value={pending}
          icon={<Clock className="w-6 h-6 text-amber-400" />}
          change={`${pending} remaining`}
          trend="neutral"
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default ExecutiveHero;
"""
with open(os.path.join(components_dir, "ExecutiveHero.jsx"), "w", encoding="utf-8") as f:
    f.write(exec_hero_code)

# 2. BurndownPanel.jsx
burndown_code = """import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';

export const BurndownPanel = ({ 
  burndownData = [], 
  burndownMeta = {}, 
  isDark = true,
  onExportReport
}) => {
  const data = Array.isArray(burndownData) ? burndownData : [];
  const meta = burndownMeta || {};

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black">Execution Burndown</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ideal vs. Actual Journey Completion Timeline
            </p>
          </div>
        </div>

        {onExportReport && (
          <button
            onClick={onExportReport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" /> Export Status PPT
          </button>
        )}
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-semibold opacity-60">
            No timeline data available for burndown plotting.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  color: isDark ? '#fff' : '#000'
                }} 
              />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#idealGrad)" />
              <Area type="monotone" dataKey="actual" name="Actual Remaining" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#actualGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
        <div>
          <span className="text-xs font-semibold block opacity-60">Total Target</span>
          <span className="text-base font-black">{meta.total || 0} Cases</span>
        </div>
        <div>
          <span className="text-xs font-semibold block opacity-60">Executed</span>
          <span className="text-base font-black text-indigo-400">{meta.currentExecuted || 0}</span>
        </div>
        <div>
          <span className="text-xs font-semibold block opacity-60">Remaining</span>
          <span className="text-base font-black text-amber-400">{meta.currentRemaining || 0}</span>
        </div>
        <div>
          <span className="text-xs font-semibold block opacity-60">Weeks Planned</span>
          <span className="text-base font-black">{meta.numWeeks || 8} Wks</span>
        </div>
      </div>
    </div>
  );
};

export default BurndownPanel;
"""
with open(os.path.join(components_dir, "BurndownPanel.jsx"), "w", encoding="utf-8") as f:
    f.write(burndown_code)

# 3. AIInsightsPanel.jsx
ai_insights_code = """import React from 'react';
import { Brain, AlertTriangle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export const AIInsightsPanel = ({ 
  insights = [], 
  isDark = true,
  onTriggerAnalysis
}) => {
  const items = Array.isArray(insights) ? insights : [];

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              AI Quality Advisor <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Continuous risk, slippage, and bottleneck heuristics
            </p>
          </div>
        </div>

        {onTriggerAnalysis && (
          <button
            onClick={onTriggerAnalysis}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Feed List */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-sm opacity-60">
            No active risk alerts. Quality velocity is on track.
          </div>
        ) : (
          items.map((ins, i) => {
            const isHigh = ins.severity === 'HIGH' || ins.type === 'SLIPPAGE';
            const isMedium = ins.severity === 'MEDIUM';

            return (
              <div
                key={ins.id || i}
                className={`p-4 rounded-2xl border transition-all ${
                  isHigh
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                    : isMedium
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isHigh ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    ) : isMedium ? (
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-snug mb-1">
                      {ins.title || ins.category || 'Strategic Insight'}
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {ins.message || ins.description || ins.content}
                    </p>
                    {ins.action && (
                      <div className="mt-2 text-xs font-bold underline opacity-80 cursor-pointer">
                        Suggested Action: {ins.action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
"""
with open(os.path.join(components_dir, "AIInsightsPanel.jsx"), "w", encoding="utf-8") as f:
    f.write(ai_insights_code)

# 4. TeamModal.jsx
team_modal_code = """import React, { useState } from 'react';
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
"""
with open(os.path.join(components_dir, "TeamModal.jsx"), "w", encoding="utf-8") as f:
    f.write(team_modal_code)

# 5. useScenarioEditor.js
use_scenario_code = """import { useState, useCallback } from 'react';

export const useScenarioEditor = (initialScenario = null, onSave) => {
  const [editingScenario, setEditingScenario] = useState(initialScenario);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openEditor = useCallback((scenario) => {
    setEditingScenario(scenario);
    setIsOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingScenario(null);
    setIsOpen(false);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setEditingScenario((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const saveScenario = useCallback(async () => {
    if (!editingScenario) return;
    setLoading(true);
    try {
      if (onSave) {
        await onSave(editingScenario);
      }
      closeEditor();
    } finally {
      setLoading(false);
    }
  }, [editingScenario, onSave, closeEditor]);

  return {
    editingScenario,
    isOpen,
    loading,
    openEditor,
    closeEditor,
    handleFieldChange,
    saveScenario,
  };
};

export default useScenarioEditor;
"""
with open(os.path.join(hooks_dir, "useScenarioEditor.js"), "w", encoding="utf-8") as f:
    f.write(use_scenario_code)

# 6. ScenarioEditorModal.jsx
scenario_modal_code = """import React from 'react';
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
"""
with open(os.path.join(components_dir, "ScenarioEditorModal.jsx"), "w", encoding="utf-8") as f:
    f.write(scenario_modal_code)

print('Modular frontend components created successfully!')
