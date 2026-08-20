import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { 
  CheckCircle2, AlertCircle, Clock, Upload, Download, 
  Plus, Shield, Sparkles, Filter, RefreshCw, Trash2, Edit3, Bug, Users
} from 'lucide-react';
import api from './services/api';
import useToast, { ToastProvider } from './hooks/useToast';
import HeaderNav from './components/HeaderNav';
import ExecutiveHero from './components/ExecutiveHero';
import BurndownPanel from './components/BurndownPanel';
import AIInsightsPanel from './components/AIInsightsPanel';
import TeamModal from './components/TeamModal';
import DefectModal from './components/DefectModal';
import ScenarioEditorModal from './components/ScenarioEditorModal';
import ToastNotification from './components/ToastNotification';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import SubscriptionScreen from './components/SubscriptionScreen';
import AdminDashboard from './components/AdminDashboard';
import HelpScreen from './components/HelpScreen';
import AboutScreen from './components/AboutScreen';
import { useTranslation } from './i18n';

function AppContent() {
  const { t } = useTranslation();
  const toast = useToast();

  // Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'lab' | 'subscription' | 'admin' | 'help' | 'about'
  const [isDark, setIsDark] = useState(true);

  // Data State
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, blocked: 0, pending: 0 });
  const [burndownData, setBurndownData] = useState([]);
  const [burndownMeta, setBurndownMeta] = useState({});
  const [testCases, setTestCases] = useState([]);
  const [defects, setDefects] = useState([]);
  const [insights, setInsights] = useState([]);
  const [testers, setTesters] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectFormData, setDefectFormData] = useState({ title: '', severity: 'P2', status: 'OPEN', owner: '', externalId: '' });
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      const list = Array.isArray(res.data) ? res.data : [];
      setProjects(list);
      if (list.length > 0 && !activeProjectId) {
        setActiveProjectId(list[0].id);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  }, [activeProjectId]);

  // Fetch Project Analytics & Cases
  const fetchProjectData = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const [statsRes, tcRes, bdRes, defRes, insRes] = await Promise.allSettled([
        api.get(`/test-cases/stats?projectId=${activeProjectId}`),
        api.get(`/test-cases?projectId=${activeProjectId}`),
        api.get(`/reports/burndown/${activeProjectId}`),
        api.get(`/defects?projectId=${activeProjectId}`),
        api.get(`/reports/insights?projectId=${activeProjectId}`)
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || {});
      if (tcRes.status === 'fulfilled') setTestCases(tcRes.value.data || []);
      if (bdRes.status === 'fulfilled') {
        setBurndownData(bdRes.value.data?.chart || []);
        setBurndownMeta(bdRes.value.data?.meta || {});
      }
      if (defRes.status === 'fulfilled') setDefects(defRes.value.data || []);
      if (insRes.status === 'fulfilled') setInsights(insRes.value.data || []);
    } catch (err) {
      console.error('Fetch project data error:', err);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  useEffect(() => {
    if (user && activeProjectId) {
      fetchProjectData();
    }
  }, [user, activeProjectId, fetchProjectData]);

  // Auth Handlers
  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    toast.success(`Welcome back, ${userData.name || userData.email}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out successfully.');
  };

  // Test Case Status Toggle
  const handleStatusToggle = async (tcId, newStatus) => {
    try {
      await api.patch(`/test-cases/${tcId}`, { status: newStatus });
      setTestCases((prev) => prev.map((tc) => (tc.id === tcId ? { ...tc, status: newStatus } : tc)));
      toast.success(`Status updated to ${newStatus}`);
      fetchProjectData();
    } catch (err) {
      toast.error(err.formattedMessage || 'Failed to update test case status');
    }
  };

  // PPT Export
  const handleExportPPT = async () => {
    if (!activeProjectId) return;
    try {
      toast.info('Generating executive PPT report...');
      const res = await api.get(`/reports/project/${activeProjectId}/ppt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TestNexus_Report_${activeProjectId}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PPT Report downloaded!');
    } catch (err) {
      toast.error('Failed to generate presentation report.');
    }
  };

  // Defect Modal Handlers
  const handleOpenDefectModal = () => {
    setDefectFormData({ title: '', severity: 'P2', status: 'OPEN', owner: '', externalId: '' });
    setIsDefectModalOpen(true);
  };

  const handleDefectSubmit = async (e) => {
    e.preventDefault();
    if (!defectFormData.title.trim()) return;
    try {
      await api.post('/defects', { ...defectFormData, projectId: activeProjectId });
      toast.success('Defect logged successfully');
      setIsDefectModalOpen(false);
      fetchProjectData();
    } catch (err) {
      toast.error(err.formattedMessage || 'Failed to log defect');
    }
  };

  // Team Management
  const handleAddTester = (newTester) => {
    setTesters((prev) => [...prev, { ...newTester, id: Date.now().toString() }]);
    toast.success(`Tester ${newTester.name} added.`);
  };

  const handleDeleteTester = (testerId) => {
    setTesters((prev) => prev.filter((t) => t.id !== testerId));
    toast.info('Tester removed.');
  };

  // Unauthenticated Views
  if (!user) {
    return authView === 'login' ? (
      <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterScreen onRegister={handleLogin} onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) || { name: 'Active Project' };
  const filteredCases = testCases.filter((tc) => 
    !searchFilter || 
    tc.summary?.toLowerCase().includes(searchFilter.toLowerCase()) || 
    tc.module?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <HeaderNav
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDark={isDark}
        setIsDark={setIsDark}
        onLogout={handleLogout}
        subscriptionStatus={user.subscriptionStatus || 'PRO'}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Project Selector Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Active Workspace:</span>
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
              }`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-indigo-400" /> Team & Capacity
            </button>
            <button
              onClick={handleOpenDefectModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-500 text-white transition-all flex items-center gap-1.5"
            >
              <Bug className="w-4 h-4" /> Log Defect
            </button>
          </div>
        </div>

        {/* View Switch Router */}
        {currentView === 'subscription' && <SubscriptionScreen user={user} />}
        {currentView === 'admin' && <AdminDashboard user={user} />}
        {currentView === 'help' && <HelpScreen />}
        {currentView === 'about' && <AboutScreen />}

        {(currentView === 'dashboard' || currentView === 'lab') && (
          <div className="space-y-8">
            {/* Executive Hero */}
            <ExecutiveHero
              stats={stats}
              isDark={isDark}
              projectName={activeProject.name}
            />

            {/* Analytics split grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <BurndownPanel
                  burndownData={burndownData}
                  burndownMeta={burndownMeta}
                  isDark={isDark}
                  onExportReport={handleExportPPT}
                />
              </div>
              <div>
                <AIInsightsPanel
                  insights={insights}
                  isDark={isDark}
                  onTriggerAnalysis={fetchProjectData}
                />
              </div>
            </div>

            {/* Scenarios / Test Cases Grid */}
            <div className={`p-6 rounded-3xl border-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300 shadow-xl'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black">Scenario Execution Grid</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Real-time test suite execution, status overrides, and defect tracking
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Filter scenarios..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className={`px-3 py-1.5 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'
                    }`}
                  />
                  <button
                    onClick={fetchProjectData}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-slate-300"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'} font-bold uppercase tracking-wider`}>
                      <th className="py-3 px-4">Key / ID</th>
                      <th className="py-3 px-4">Summary</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 opacity-60">
                          No test scenarios match current criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((tc) => (
                        <tr key={tc.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{tc.key || tc.id?.substring(0, 8)}</td>
                          <td className="py-3.5 px-4 font-semibold">{tc.summary || tc.title}</td>
                          <td className="py-3.5 px-4 opacity-80">{tc.module || 'Core'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              tc.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                              tc.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {tc.priority || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={tc.status}
                              onChange={(e) => handleStatusToggle(tc.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                tc.status === 'PASSED' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                                tc.status === 'FAILED' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
                                tc.status === 'BLOCKED' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                                'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              <option value="UNEXECUTED">UNEXECUTED</option>
                              <option value="PASSED">PASSED</option>
                              <option value="FAILED">FAILED</option>
                              <option value="BLOCKED">BLOCKED</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => { setEditingScenario(tc); setIsScenarioModalOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Edit Scenario"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Shared Modals */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        testers={testers}
        onAddTester={handleAddTester}
        onDeleteTester={handleDeleteTester}
        isDark={isDark}
      />

      <DefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        defectData={defectFormData}
        onChange={(field, val) => setDefectFormData((prev) => ({ ...prev, [field]: val }))}
        onSubmit={handleDefectSubmit}
        isDark={isDark}
      />

      <ScenarioEditorModal
        isOpen={isScenarioModalOpen}
        scenario={editingScenario}
        onClose={() => setIsScenarioModalOpen(false)}
        onChange={(field, val) => setEditingScenario((prev) => ({ ...prev, [field]: val }))}
        onSave={() => {
          setTestCases((prev) => prev.map((tc) => (tc.id === editingScenario.id ? editingScenario : tc)));
          setIsScenarioModalOpen(false);
          toast.success('Scenario updated.');
        }}
        isDark={isDark}
      />

      <ToastNotification />
      <Analytics />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
