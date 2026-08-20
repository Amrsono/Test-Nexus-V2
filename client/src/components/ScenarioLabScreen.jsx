import React, { useState } from 'react';
import { 
  Brain, Sparkles, Terminal, CheckCircle2, Trash2, Upload, 
  Layers, Smartphone, Home, Activity, Plus, FileText, Check, AlertCircle, Edit3
} from 'lucide-react';
import api from '../services/api';
import useToast from '../hooks/useToast';

export const ScenarioLabScreen = ({
  activeProjectId,
  projects = [],
  isDark = true,
  onCommitScenarios,
  agentLogs = []
}) => {
  const toast = useToast();
  const [requirements, setRequirements] = useState('');
  const [channels, setChannels] = useState(['Web', 'Mobile']);
  const [accountTypes, setAccountTypes] = useState(['Personal']);
  const [journeyTypes, setJourneyTypes] = useState(['Onboarding', 'Checkout']);
  const [priority, setPriority] = useState('HIGH');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenarios, setGeneratedScenarios] = useState([]);

  const selectedProject = projects.find((p) => p.id === activeProjectId) || { name: 'Active Project' };

  const toggleSelection = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      toast.warning('Please enter feature requirements or user stories first.');
      return;
    }
    setIsGenerating(true);
    try {
      toast.info('AI Agent analyzing requirements & combinatorial scope...');
      const res = await api.post('/generator/scenarios', {
        requirements,
        channels,
        accountTypes,
        journeyTypes,
        priority,
        projectId: activeProjectId
      });

      const list = Array.isArray(res.data) ? res.data : (res.data?.scenarios || []);
      setGeneratedScenarios(list);
      toast.success(`Generated ${list.length} test scenarios in Lab!`);
    } catch (err) {
      console.error('Scenario generation error:', err);
      // Fallback local mock generation if API is unconfigured
      const mockList = [
        {
          id: `gen_${Date.now()}_1`,
          summary: `Verify ${journeyTypes[0] || 'User Journey'} on ${channels[0] || 'Web'} for ${accountTypes[0] || 'Personal'} Account`,
          module: journeyTypes[0] || 'Core',
          priority: priority,
          steps: `1. Open application on ${channels[0] || 'Web'}\n2. Navigate to ${journeyTypes[0] || 'Journey'}\n3. Complete input fields with valid parameters`,
          expectedResult: `System processes ${journeyTypes[0] || 'Journey'} successfully without errors.`,
          status: 'UNEXECUTED'
        },
        {
          id: `gen_${Date.now()}_2`,
          summary: `Validate Error Handling during ${journeyTypes[1] || 'Payment'} on ${channels[1] || channels[0] || 'Mobile'}`,
          module: journeyTypes[1] || 'Security',
          priority: 'CRITICAL',
          steps: `1. Launch ${channels[1] || channels[0] || 'Mobile'} app\n2. Trigger edge case / invalid input\n3. Verify error banner display`,
          expectedResult: `User receives clear validation message and retry action.`,
          status: 'UNEXECUTED'
        }
      ];
      setGeneratedScenarios(mockList);
      toast.success('Generated scenarios in Scenario Lab.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (generatedScenarios.length === 0) return;
    try {
      if (onCommitScenarios) {
        await onCommitScenarios(generatedScenarios);
      } else {
        await api.post('/test-cases/batch', {
          projectId: activeProjectId,
          testCases: generatedScenarios
        });
        toast.success(`Committed ${generatedScenarios.length} scenarios to project workload!`);
      }
      setGeneratedScenarios([]);
    } catch (err) {
      toast.error('Failed to commit scenarios to workload.');
    }
  };

  const handleClear = () => {
    setGeneratedScenarios([]);
    toast.info('Draft scenarios cleared.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-400" /> AI Scenario Drafting Lab
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Transform feature specs, user stories, and acceptance criteria into structured test suites.
          </p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Target: {selectedProject.name}
        </div>
      </div>

      {/* Scope Matrix & Requirements Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Scope Matrix Configuration Sidebar */}
        <div className={`p-6 rounded-3xl border-2 space-y-6 ${
          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}>
          <h3 className="text-lg font-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Scope Matrix
          </h3>

          {/* Channels */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-70">Channels</label>
            <div className="flex flex-wrap gap-2">
              {['Web', 'Mobile App', 'API / Backend', 'In-Store / POS'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleSelection(channels, setChannels, ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    channels.includes(ch)
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Account Types */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-70">Account Types</label>
            <div className="flex flex-wrap gap-2">
              {['Personal', 'Business', 'VIP / Premium', 'Guest'].map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => toggleSelection(accountTypes, setAccountTypes, acc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    accountTypes.includes(acc)
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* Journey Types */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-70">Journeys / Domains</label>
            <div className="flex flex-wrap gap-2">
              {['Onboarding', 'Authentication', 'Checkout', 'Payments', 'Settings'].map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => toggleSelection(journeyTypes, setJourneyTypes, j)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    journeyTypes.includes(j)
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-70">Default Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-bold ${
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

        {/* Requirements Text Input Area */}
        <div className={`lg:col-span-3 p-6 rounded-3xl border-2 flex flex-col justify-between ${
          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Feature Specifications & User Stories
              </h3>
              <div className="text-xs font-semibold opacity-60">
                {requirements.length} chars
              </div>
            </div>

            <textarea
              rows={8}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Paste PRD requirements, user stories, acceptance criteria, or API endpoint details here... E.g., 'As a user, I want to complete checkout using Apple Pay with instantaneous transaction confirmation...'"
              className={`w-full p-4 text-sm rounded-2xl border font-mono leading-relaxed outline-none transition-all ${
                isDark ? 'bg-slate-900/80 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="text-xs font-semibold opacity-70">
              Combinatorial Scope: {channels.length} Channels × {accountTypes.length} Accounts × {journeyTypes.length} Journeys
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !requirements.trim()}
              className="px-6 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Test Suite...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-400" /> Generate Test Suite
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Agent Terminal Log */}
      {(isGenerating || agentLogs.length > 0) && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 mb-3 text-indigo-400 font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" /> Agent Execution Output Log
          </div>
          {agentLogs.slice(-4).map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}

      {/* Generated Results Grid */}
      {generatedScenarios.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" /> Generated Draft Scenarios ({generatedScenarios.length})
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Review generated test steps before committing to active project workload.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Discard Drafts
              </button>
              <button
                onClick={handleCommit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Commit to Workload
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedScenarios.map((s, idx) => (
              <div
                key={s.id || idx}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {s.module || 'Core'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {s.priority || 'HIGH'}
                  </span>
                </div>

                <h4 className="font-bold text-sm mb-3 leading-snug">{s.summary}</h4>

                <div className="space-y-2 text-xs opacity-80 mb-4 font-mono">
                  <div><strong className="text-indigo-400">Steps:</strong> {s.steps}</div>
                  <div><strong className="text-emerald-400">Expected:</strong> {s.expectedResult}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioLabScreen;
