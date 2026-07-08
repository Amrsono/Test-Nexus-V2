import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Analytics } from '@vercel/analytics/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Activity, CheckCircle2, AlertCircle, Clock, 
  Upload, Download, Brain, Users, Bug, ArrowUpRight, TrendingDown, Settings, Plus, Terminal, Maximize2, Sparkles,
  ShoppingBag, Headphones, Smartphone, Home, Trash2, Monitor, MapPin, Layers, Lock, CreditCard, Shield, HelpCircle, Info
} from 'lucide-react';
import { io } from 'socket.io-client';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import SubscriptionScreen from './components/SubscriptionScreen';
import AdminDashboard from './components/AdminDashboard';
import HelpScreen from './components/HelpScreen';
import AboutScreen from './components/AboutScreen';
import { useTranslation } from './i18n';
import LanguageSwitcher from './components/LanguageSwitcher';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocal ? 'http://localhost:5000/api' : '/api';
const socket = io(isLocal ? 'http://localhost:5000' : window.location.origin, {
  transports: ['websocket', 'polling']
});

const MetricCard = ({ label, value, icon, change, trend, isDark }) => (
  <div className={`p-6 rounded-3xl border-2 transition-all hover:scale-105 duration-300 ${isDark ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white border-slate-400 shadow-xl'}`}>
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

/* ─── Animated number counter ─── */
const AnimatedCounter = ({ value, duration = 1.2, className = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  useEffect(() => {
    if (!inView || value === 0) { setDisplay(value); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(value / (duration * 60)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, inView, duration]);
  return <span ref={ref} className={className}>{display}</span>;
};

/* ─── Framer motion variants ─── */
const burndownContainerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const burndownItemV = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
const barGrowV = (i) => ({
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { type: 'spring', stiffness: 180, damping: 18, delay: 0.6 + i * 0.07 } },
});
const pulseGlow = {
  animate: {
    scale: [1, 1.12, 1],
    opacity: [0.45, 0.7, 0.45],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};
const floatOrb = {
  animate: {
    y: [0, -14, 0],
    x: [0, 8, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};

const App = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const selectedProjectIdRef = useRef(selectedProjectId);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, blocked: 0, pending: 0 });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentLogs, setAgentLogs] = useState([]);
  const [isEditScenarioModalOpen, setIsEditScenarioModalOpen] = useState(false);
  const [editingScenarioIndex, setEditingScenarioIndex] = useState(null);
  const [editingScenarioData, setEditingScenarioData] = useState(null);
  const [originalScenarioSnapshot, setOriginalScenarioSnapshot] = useState(null);
  const [unassignedCases, setUnassignedCases] = useState([]);
  const [testers, setTesters] = useState([]);
  const [selectedTesterId, setSelectedTesterId] = useState('');
  const [burndownData, setBurndownData] = useState([]);
  const [burndownMeta, setBurndownMeta] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTester, setNewTester] = useState({ name: '', email: '' });
  const [editingTester, setEditingTester] = useState(null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [activeHeaders, setActiveHeaders] = useState([]);
  const [activeUploadFile, setActiveUploadFile] = useState(null);
  const [activeFilename, setActiveFilename] = useState('');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerFilterStatus, setTrackerFilterStatus] = useState('ALL');
  const [trackerFilterTester, setTrackerFilterTester] = useState('ALL');
  const [allTestCases, setAllTestCases] = useState([]);
  const [manualProjectName, setManualProjectName] = useState('');
  const [manualMap, setManualMap] = useState({
    externalId: '',
    summary: '',
    steps: '',
    expectedResult: '',
    priority: '',
    module: ''
  });

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, lab
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // login, register
  const [labRequirements, setLabRequirements] = useState('');
  const [generatedScenarios, setGeneratedScenarios] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasLoadedDrafts, setHasLoadedDrafts] = useState(false);
  const [newProjDates, setNewProjDates] = useState({ start: new Date().toISOString().split('T')[0], goLive: '' });
  const [defects, setDefects] = useState([]);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [editingDefectId, setEditingDefectId] = useState(null);
  const [newDefectData, setNewDefectData] = useState({
    externalId: '', title: '', severity: 'P2', owner: '', actionPlan: '', 
    description: '', futImpact: '', relatedCaseId: '', blockedCases: '',
    raisedAt: new Date().toISOString().split('T')[0]
  });
  const [defectFilter, setDefectFilter] = useState('ALL');

  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem('nexus_theme') || '#f8fafc');
  const isDark = localTheme === '#1a1a2e' || localTheme === '#020617';

  const [labConfig, setLabConfig] = useState({
    release: '',
    status: '',
    channels: [], // Retail, Call Center
    accountTypes: [], // HBB, Mobile
    journeyTypes: [], // New connection, Upgrade, Downgrade
    tcSteps: '',
    tcExpectedResults: '',
    priority: 'MEDIUM'
  });
  const [customJourneyType, setCustomJourneyType] = useState('');
  const [extraJourneys, setExtraJourneys] = useState([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [hiddenProjectIds, setHiddenProjectIds] = useState([]);
  const [isImportDestinationModalOpen, setIsImportDestinationModalOpen] = useState(false);
  const [pendingImportScenarios, setPendingImportScenarios] = useState([]);
  const [pendingImportProjectId, setPendingImportProjectId] = useState(null);
  const [importDestination, setImportDestination] = useState('workload'); // 'workload' or 'both'
  const [importLabTargetProjectId, setImportLabTargetProjectId] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);


  useEffect(() => {
    if (selectedProject?.themeColor) {
      setLocalTheme(selectedProject.themeColor);
    }
  }, [selectedProject]);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    const savedToken = localStorage.getItem('nexus_token');
    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      
      // Load hidden projects for this user
      const savedHidden = localStorage.getItem(`nexus_hidden_projects_${parsedUser.id}`);
      let hidden = [];
      if (savedHidden) {
        hidden = JSON.parse(savedHidden);
        setHiddenProjectIds(hidden);
      }
      
      fetchProjects(hidden);
    }

    fetchTesters();

    socket.on('agent:status', (data) => {
      setAgentLogs(prev => [...prev.slice(-4), data.message]); // Keep last 5 logs
    });

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          setUser(null);
          setProjects([]);
          setSelectedProjectId(null);
          localStorage.removeItem('nexus_user');
          localStorage.removeItem('nexus_token');
          delete axios.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
      }
    );

    return () => {
      socket.off('agent:status');
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogin = (data) => {
    setUser(data.user);
    localStorage.setItem('nexus_user', JSON.stringify(data.user));
    localStorage.setItem('nexus_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    
    // Load hidden projects for the user
    const savedHidden = localStorage.getItem(`nexus_hidden_projects_${data.user.id}`);
    let hidden = [];
    if (savedHidden) {
      hidden = JSON.parse(savedHidden);
      setHiddenProjectIds(hidden);
    } else {
      setHiddenProjectIds([]);
    }

    fetchProjects(hidden);
  };

  const handleLogout = () => {
    setUser(null);
    setProjects([]);
    setSelectedProjectId(null);
    setAllTestCases([]);
    setGeneratedScenarios([]);
    setLabRequirements('');
    setHiddenProjectIds([]);
    setStats({ total: 0, passed: 0, failed: 0, blocked: 0, pending: 0 });
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    // We don't necessarily need to remove the user-specific drafts here 
    // because they are now keyed by user ID, but we clear the local state.
    delete axios.defaults.headers.common['Authorization'];
  };

  const fetchDefects = async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectId;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/defects?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      setDefects(res.data);
    } catch (err) {
      console.error('Fetch Defects Error:', err);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchStats(selectedProjectId);
      fetchInsights(selectedProjectId);
      fetchUnassigned(selectedProjectId);
      fetchAllTestCases(selectedProjectId);
      fetchBurndown(selectedProjectId);
      fetchDefects(selectedProjectId);
      const interval = setInterval(() => {
        fetchInsights(selectedProjectId);
        fetchDefects(selectedProjectId);
      }, 30000); 
      return () => clearInterval(interval);
    }
  }, [selectedProjectId]);

  // Reset hasLoadedDrafts whenever the project changes so the save effect
  // cannot fire (and overwrite stored data with []) before the load effect reads it.
  useEffect(() => {
    setHasLoadedDrafts(false);
  }, [selectedProjectId]);

  // Set theme background color/image and dark class on body/html dynamically to avoid cutoff glitches
  useEffect(() => {
    document.body.style.transition = 'background-color 0.7s ease-in-out, background-image 0.7s ease-in-out';
    document.body.style.backgroundColor = localTheme;
    if (selectedProject?.backgroundUrl) {
      document.body.style.backgroundImage = `url(${selectedProject.backgroundUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = 'none';
    }
  }, [localTheme, selectedProject?.backgroundUrl]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Sync Drafts with LocalStorage for persistence across tabs/refresh (USER & PROJECT ISOLATED)
  useEffect(() => {
    if (!user || !selectedProjectId) return;
    
    const draftKey = `nexus_drafts_${user.id}_${selectedProjectId}`;
    const reqsKey = `nexus_lab_reqs_${user.id}_${selectedProjectId}`;
    
    const savedDrafts = localStorage.getItem(draftKey);
    if (savedDrafts) {
      try {
        setGeneratedScenarios(JSON.parse(savedDrafts));
      } catch (e) {
        console.error('Failed to load drafts', e);
        setGeneratedScenarios([]);
      }
    } else {
      setGeneratedScenarios([]);
    }
    
    const savedReqs = localStorage.getItem(reqsKey);
    setLabRequirements(savedReqs || '');

    setHasLoadedDrafts(true);
  }, [user?.id, selectedProjectId]);

  // Only save to localStorage once we have fully loaded (hasLoadedDrafts === true).
  // Omit selectedProjectId from deps: we use the key built from it inside the effect,
  // but we must NOT re-save when selectedProjectId just changed (that would write
  // the old generatedScenarios into the new project's slot before the load runs).
  useEffect(() => {
    if (user && hasLoadedDrafts && selectedProjectId) {
      localStorage.setItem(`nexus_drafts_${user.id}_${selectedProjectId}`, JSON.stringify(generatedScenarios));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedScenarios, hasLoadedDrafts]);

  useEffect(() => {
    if (user && hasLoadedDrafts && selectedProjectId) {
      localStorage.setItem(`nexus_lab_reqs_${user.id}_${selectedProjectId}`, labRequirements);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labRequirements, hasLoadedDrafts]);

  // Persist hidden projects
  useEffect(() => {
    if (user) {
      localStorage.setItem(`nexus_hidden_projects_${user.id}`, JSON.stringify(hiddenProjectIds));
    }
  }, [hiddenProjectIds, user?.id]);

  const clearDrafts = () => {
    if (window.confirm('Are you sure you want to discard all current drafts?')) {
      setGeneratedScenarios([]);
      setLabRequirements('');
      if (user && selectedProjectId) {
        localStorage.removeItem(`nexus_drafts_${user.id}_${selectedProjectId}`);
        localStorage.removeItem(`nexus_lab_reqs_${user.id}_${selectedProjectId}`);
      }
    }
  };

  const fetchTesters = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setTesters(res.data);
      if (res.data.length > 0 && !selectedTesterId) setSelectedTesterId(res.data[0].id);
    } catch (err) {
      console.error('Fetch testers failed', err);
    }
  };

  const handleAddTester = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/users`, newTester);
      setNewTester({ name: '', email: '' });
      fetchTesters();
    } catch (err) {
      console.error('Add tester failed', err);
    }
  };

  const handleUpdateTester = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_BASE}/users/${editingTester.id}`, editingTester);
      setEditingTester(null);
      fetchTesters();
    } catch (err) {
      console.error('Update tester failed', err);
    }
  };

  const handleDeleteTester = async (id) => {
    if (!window.confirm('Are you sure? This will remove all assignments for this tester.')) return;
    try {
      await axios.delete(`${API_BASE}/users/${id}`);
      fetchTesters();
      fetchUnassigned();
      fetchStats();
    } catch (err) {
      console.error('Delete tester failed', err);
    }
  };

  const fetchUnassigned = async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectId;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/test-cases/unassigned?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      setUnassignedCases(res.data);
    } catch (err) {
      console.error('Fetch unassigned failed', err);
    }
  };

  const fetchProjects = async (hiddenOverride) => {
    try {
      const res = await axios.get(`${API_BASE}/projects`);
      // Filter out any projects the user has "closed"
      const hiddenList = hiddenOverride || hiddenProjectIds;
      const visibleProjects = res.data.filter(p => !hiddenList.includes(p.id));
      setProjects(visibleProjects);
      
      if (visibleProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(visibleProjects[0].id);
      } else if (visibleProjects.length === 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Projects error', err);
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setNewProjName('');
    setIsCreateProjectModalOpen(true);
  };

  const submitCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    try {
      setLoading(true);
      setIsCreateProjectModalOpen(false);
      const res = await axios.post(`${API_BASE}/projects`, { 
        name: newProjName.trim(), 
        themeColor: '#f8fafc',
        startDate: newProjDates.start,
        goLiveDate: newProjDates.goLive || null
      });
      await fetchProjects();
      setSelectedProjectId(res.data.id);
    } catch (err) {
      console.error('Create project failed', err);
      let errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      if (typeof errorMsg === 'object') errorMsg = errorMsg.message || JSON.stringify(errorMsg);
      alert(`Failed to create project: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetProject = async () => {
    if (!selectedProjectId) return;
    if (!window.confirm('Are you sure you want to MASTER RESET this project? This will delete ALL imported test plans, scenarios, assignments, defects, and insights for this project exclusively. The project name and logo will be preserved.')) return;

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/projects/${selectedProjectId}/reset`);
      
      // Clear drafts and requirements state and localStorage
      setGeneratedScenarios([]);
      setLabRequirements('');
      if (user) {
        localStorage.removeItem(`nexus_drafts_${user.id}_${selectedProjectId}`);
        localStorage.removeItem(`nexus_lab_reqs_${user.id}_${selectedProjectId}`);
      }

      await fetchStats();
      await fetchInsights();
      await fetchUnassigned();
      await fetchAllTestCases();
      await fetchBurndown();
      alert('Project scenarios have been fully reset.');
    } catch (err) {
      console.error('Reset project failed', err);
      alert('Failed to reset project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to completely DELETE the project "${name}" and all its data? This cannot be undone.`)) return;

    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/projects/${id}`);
      const res = await axios.get(`${API_BASE}/projects`);
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProjectId(res.data[0].id);
      } else {
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error('Delete Project Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDefect = (defect) => {
    setNewDefectData({
      externalId: defect.externalId || '',
      title: defect.title || '',
      severity: defect.severity || 'P2',
      owner: defect.owner || '',
      actionPlan: defect.actionPlan || '',
      description: defect.description || '',
      futImpact: defect.futImpact || '',
      relatedCaseId: defect.relatedCaseId || '',
      blockedCases: defect.blockedCases || '',
      raisedAt: defect.raisedAt ? new Date(defect.raisedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingDefectId(defect.id);
    setIsDefectModalOpen(true);
  };

  const handleDefectSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingDefectId) {
        await axios.patch(`${API_BASE}/defects/${editingDefectId}`, {
          ...newDefectData
        });
      } else {
        await axios.post(`${API_BASE}/defects`, { 
          ...newDefectData, 
          projectId: selectedProjectId 
        });
      }
      setIsDefectModalOpen(false);
      setEditingDefectId(null);
      setNewDefectData({
        externalId: '', title: '', severity: 'P2', owner: '', actionPlan: '', 
        description: '', futImpact: '', relatedCaseId: '', blockedCases: '',
        raisedAt: new Date().toISOString().split('T')[0]
      });
      await fetchDefects();
    } catch (err) {
      console.error('Defect Submission Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDefect = async (id) => {
    if (!window.confirm('Delete this blocker?')) return;
    try {
      await axios.delete(`${API_BASE}/defects/${id}`);
      await fetchDefects();
    } catch (err) {
      console.error('Delete Defect Error:', err);
    }
  };

  const handleExportDefects = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      setAgentLogs(prev => [...prev, 'System: Generating defects Excel report...']);
      
      const res = await axios.get(`${API_BASE}/defects/export`, {
        params: { projectId: selectedProjectId },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${(selectedProject?.name || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_')}_Defects.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      setAgentLogs(prev => [...prev, 'System: Defects Excel report downloaded successfully.']);
    } catch (err) {
      console.error('Defects Export Error:', err);
      alert('Failed to export defects list to Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportDefects = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', selectedProjectId);

    try {
      setLoading(true);
      setAgentLogs(prev => [...prev, 'System: Synchronizing defects database with Excel...']);

      const res = await axios.post(`${API_BASE}/defects/import`, formData);

      if (res.data.success) {
        setAgentLogs(prev => [...prev, `System: Successfully synchronized ${res.data.count} defects from Excel.`]);
        await fetchDefects(selectedProjectId);
        alert(`Sync complete! ${res.data.count} defects processed successfully.`);
      }
    } catch (err) {
      console.error('Defects Sync Error:', err);
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to import defects: ${msg}`);
    } finally {
      setLoading(false);
    }
  };



  const fetchStats = async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectId;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/test-cases/stats?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      setStats(res.data);
    } catch (err) {
      console.error('Stats error', err);
    }
  };

  const fetchInsights = async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectId;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/insights?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      setInsights(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Insights error', err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so the same file can be selected again if cancelled
    e.target.value = '';

    setActiveUploadFile(file);
    setImportDestination('workload');
    setImportLabTargetProjectId('');
    setIsImportDestinationModalOpen(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!activeUploadFile) return;

    const formData = new FormData();
    formData.append('file', activeUploadFile);
    formData.append('suiteName', 'Manual Import ' + new Date().toLocaleDateString());
    formData.append('projectId', importLabTargetProjectId || selectedProjectId);
    formData.append('manualMapping', JSON.stringify(manualMap));
    formData.append('manualProjectName', manualProjectName);
    formData.append('destination', importDestination);

    try {
      setLoading(true);
      setIsMappingModalOpen(false);
      setAgentLogs(prev => [...prev, 'System: Processing manual extraction...']);
      
      const res = await axios.post(`${API_BASE}/upload`, formData);
      const newProjectId = res.data.projectId;

      await fetchProjects();
      setSelectedProjectId(newProjectId);
      
      if (importDestination === 'lab') {
        setGeneratedScenarios(res.data.structuredCases || []);
        setCurrentView('lab');
        setAgentLogs(prev => [...prev, `System: ${res.data.count} scenarios loaded into Scenario Lab.`]);
        alert(`${res.data.count} scenarios loaded into Scenario Lab for drafts editing!`);
      } else {
        await fetchStats(newProjectId);
        await fetchUnassigned(newProjectId);
        await fetchAllTestCases(newProjectId);
        await handleAnalyze();
        setAgentLogs(prev => [...prev, 'System: Manual Import Successful.']);
        alert(`${res.data.count} scenarios imported to workload successfully!`);
      }
      
      setActiveUploadFile(null);
      setImportLabTargetProjectId('');
    } catch (err) {
      console.error('Manual upload failed', err);
      alert('Failed to import test plan manually');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    if (!selectedProjectId) {
      alert("Please import a test plan first to establish a project context for your logo.");
      e.target.value = '';
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/projects/${selectedProjectId}/logo`, formData);
      await fetchProjects();
      alert('Logo updated!');
    } catch (err) {
      console.error('Logo upload failed', err);
      alert('Logo upload failed. It might be too large.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportDestinationConfirm = async () => {
    setIsImportDestinationModalOpen(false);
    
    if (!activeUploadFile) return;

    const formData = new FormData();
    formData.append('file', activeUploadFile);
    formData.append('suiteName', 'Import ' + new Date().toLocaleDateString());
    formData.append('projectId', importLabTargetProjectId || selectedProjectId);
    formData.append('destination', importDestination);

    try {
      setLoading(true);
      setAgentLogs(['System: Initiating secure upload...']);
      const res = await axios.post(`${API_BASE}/upload`, formData);
      
      if (res.status === 202 && res.data.status === 'MAPPING_REQUIRED') {
        setActiveHeaders(res.data.headers);
        const nameFromFile = activeUploadFile.name ? activeUploadFile.name.replace(/\.[^.]+$/, '') : 'New Project';
        setManualProjectName(nameFromFile);
        setActiveFilename(activeUploadFile.name);
        setIsMappingModalOpen(true);
        setAgentLogs(prev => [...prev, 'System: Switching to Manual Mapping...']);
        return;
      }

      const newProjectId = res.data.projectId;
      
      await fetchProjects();
      setSelectedProjectId(newProjectId);
      
      if (importDestination === 'lab') {
        setGeneratedScenarios(res.data.structuredCases || []);
        setCurrentView('lab');
        setAgentLogs(prev => [...prev, `System: ${res.data.count} scenarios loaded into Scenario Lab for editing.`]);
        alert(`${res.data.count} scenarios loaded into Scenario Lab for drafts editing!`);
      } else {
        await fetchStats(newProjectId);
        await fetchUnassigned(newProjectId);
        await fetchAllTestCases(newProjectId);
        await handleAnalyze();
        alert(`${res.data.count} scenarios imported to workload successfully!`);
      }
      
      if (res.data.discoveredProject) {
        setAgentLogs(prev => [...prev, `System: Project Discovered - ${res.data.discoveredProject}`]);
      }

      setActiveUploadFile(null);
      setImportLabTargetProjectId('');
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to import test plan');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundUpload = async (e) => {
    if (!selectedProjectId) {
      alert("Please import a test plan first to establish a project context for your background.");
      e.target.value = '';
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('background', file);

    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/projects/${selectedProjectId}/background`, formData);
      await fetchProjects();
      alert('Background updated!');
    } catch (err) {
      console.error('Background upload failed', err);
      alert('Background upload failed. It might be too large.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetBackground = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/projects/${selectedProjectId}`, { backgroundUrl: null });
      await fetchProjects();
    } catch (err) {
      console.error('Reset failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetLogo = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/projects/${selectedProjectId}`, { logoUrl: null });
      await fetchProjects();
    } catch (err) {
      console.error('Reset failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      await axios.post(`${API_BASE}/insights/analyze`, { projectId: selectedProjectId });
      await fetchInsights();
      await fetchUnassigned();
    } catch (err) {
      console.error('Analysis failed', err);
    }
  };

  const handleAssign = async (caseId) => {
    if (!selectedTesterId) return;
    try {
      await axios.post(`${API_BASE}/assignments/assign`, {
        testerId: selectedTesterId,
        testCaseIds: [caseId]
      });
      await fetchUnassigned();
      await fetchStats();
      await fetchTesters();
    } catch (err) {
      console.error('Assignment failed', err);
    }
  };

  const fetchAllTestCases = async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectId;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/test-cases?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      setAllTestCases(res.data);

      if (user) {
        const draftKey = `nexus_drafts_${user.id}_${id}`;
        const savedDrafts = localStorage.getItem(draftKey);
        let drafts = [];
        if (savedDrafts) {
          try {
            drafts = JSON.parse(savedDrafts);
          } catch (e) {
            drafts = [];
          }
        }
        
        const mappedCases = res.data.map(tc => {
          let customVal = null;
          if (tc.customValidations) {
            try {
              customVal = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
            } catch (e) {
              customVal = tc.customValidations;
            }
          }
          return {
            id: tc.id,
            status: tc.status,
            checkUi: tc.checkUi,
            checkOrderBuild: tc.checkOrderBuild,
            checkOrderCompletion: tc.checkOrderCompletion,
            checkPcsMcpr: tc.checkPcsMcpr,
            summary: tc.summary,
            steps: tc.steps,
            expectedResult: tc.expectedResult,
            priority: tc.priority,
            module: tc.module || '',
            orderBuild: tc.orderBuild || '',
            orderCompletion: tc.orderCompletion || '',
            tcAssurance: tc.tcAssurance || '',
            billing: tc.billing || '',
            customValidations: customVal
          };
        });

        const uncommittedDrafts = drafts.filter(d => !d.id && !mappedCases.some(mc => mc.summary === d.summary));
        const mergedScenarios = [...mappedCases, ...uncommittedDrafts];

        setGeneratedScenarios(mergedScenarios);
      }
    } catch (err) {
      console.error('Fetch all cases error', err);
    }
  };

  const fetchBurndown = async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectId;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/test-cases/burndown?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      if (res.data && res.data.data) {
        setBurndownData(res.data.data);
        setBurndownMeta(res.data.meta);
      } else {
        setBurndownData(res.data);
        setBurndownMeta(null);
      }
    } catch (err) {
      console.error('Burndown error', err);
    }
  };

  const handleProjectDateUpdate = async (field, value) => {
    if (!selectedProjectId) return;
    try {
      const res = await axios.patch(`${API_BASE}/projects/${selectedProjectId}`, { [field]: value });
      setProjects(projects.map(p => p.id === selectedProjectId ? res.data : p));
      fetchBurndown();
    } catch (err) {
      console.error('Date update failed', err);
    }
  };

  const handleExportPPT = async () => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    // Must use axios (not window.open) so the Authorization header is included
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/reports/project/${selectedProjectId}/ppt`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const safeFileName = `${(selectedProject?.name || 'Report').replace(/[^a-z0-9]/gi, '_')}_Status_Report.pptx`;
      link.setAttribute('download', safeFileName);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('PPT Export Error:', err);
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to export report: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', selectedProjectId);

    try {
      setLoading(true);
      setAgentLogs(prev => [...prev, 'System: Synchronizing project database with Excel...']);

      const res = await axios.post(`${API_BASE}/test-cases/sync`, formData);

      if (res.data.success) {
        setAgentLogs(prev => [...prev, `System: Successfully synchronized ${res.data.count} journeys from Excel.`]);

        // Force update Scenario Lab drafts state & localStorage
        const mappedCases = res.data.testCases.map(tc => {
          let customVal = null;
          if (tc.customValidations) {
            try {
              customVal = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
            } catch (err) {
              customVal = tc.customValidations;
            }
          }
          return {
            id: tc.id,
            status: tc.status,
            checkUi: tc.checkUi,
            checkOrderBuild: tc.checkOrderBuild,
            checkOrderCompletion: tc.checkOrderCompletion,
            checkPcsMcpr: tc.checkPcsMcpr,
            summary: tc.summary,
            steps: tc.steps,
            expectedResult: tc.expectedResult,
            priority: tc.priority,
            module: tc.module || '',
            orderBuild: tc.orderBuild || '',
            orderCompletion: tc.orderCompletion || '',
            tcAssurance: tc.tcAssurance || '',
            billing: tc.billing || '',
            customValidations: customVal
          };
        });

        if (user) {
          localStorage.setItem(`nexus_drafts_${user.id}_${selectedProjectId}`, JSON.stringify(mappedCases));
        }
        setGeneratedScenarios(mappedCases);

        await fetchStats(selectedProjectId);
        await fetchInsights(selectedProjectId);
        await fetchUnassigned(selectedProjectId);
        await fetchAllTestCases(selectedProjectId);
        await fetchBurndown(selectedProjectId);
        await fetchDefects(selectedProjectId);

        alert(`Sync complete! ${res.data.count} journeys updated. Generating status report...`);
        await handleExportPPT();
      }
    } catch (err) {
      console.error('Excel sync failed', err);
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to sync from Excel: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCaseStatus = async (caseId, status) => {
    // Enforcement: Journey will not be considered completed/passed unless all ACTIVE validation points are ticked
    if (status === 'PASS') {
      const tc = allTestCases.find(c => c.id === caseId);
      if (tc) {
        // Build the same dynamic checklist the UI renders so we only require what is actually shown
        const required = [];
        required.push({ field: 'checkUi', checked: !!tc.checkUi });
        if (tc.orderBuild)     required.push({ field: 'checkOrderBuild',      checked: !!tc.checkOrderBuild });
        if (tc.orderCompletion) required.push({ field: 'checkOrderCompletion', checked: !!tc.checkOrderCompletion });
        if (tc.tcAssurance)    required.push({ field: 'checkPcsMcpr',         checked: !!tc.checkPcsMcpr });
        if (tc.billing) {
          let parsedCustom = [];
          try {
            let p = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : (tc.customValidations || []);
            if (typeof p === 'string') p = JSON.parse(p);
            parsedCustom = Array.isArray(p) ? p : [];
          } catch (_) {}
          const billingItem = parsedCustom.find(cv => cv.id === 'billing_check');
          required.push({ field: 'billing_check', checked: !!(billingItem?.checked) });
        }
        // Any additional custom validations
        if (tc.customValidations) {
          try {
            let parsedCustom = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : (tc.customValidations || []);
            if (typeof parsedCustom === 'string') parsedCustom = JSON.parse(parsedCustom);
            if (Array.isArray(parsedCustom)) {
              parsedCustom
                .filter(cv => cv.id !== 'billing_check')
                .forEach(cv => required.push({ field: cv.id, checked: !!cv.checked }));
            }
          } catch (_) {}
        }

        const allTicked = required.every(r => r.checked);
        if (!allTicked) {
          const total = required.length;
          const ticked = required.filter(r => r.checked).length;
          alert(`Validation Blocked: You must tick all ${total} validation point(s) before passing this journey. (${ticked}/${total} done)`);
          return;
        }
      }
    }

    try {
      await axios.patch(`${API_BASE}/test-cases/${caseId}/status`, { status });
      await fetchAllTestCases();
      await fetchStats();
      await fetchInsights();
      fetchBurndown();
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const updateCaseValidation = async (caseId, field, value) => {
    try {
      await axios.patch(`${API_BASE}/test-cases/${caseId}/validations`, { [field]: value });
      // Optimized state update to avoid full refresh for just a checkbox
      setAllTestCases(prev => prev.map(c => c.id === caseId ? { ...c, [field]: value } : c));
    } catch (err) {
      console.error('Validation update failed', err);
    }
  };

  const updateCaseCustomValidation = async (caseId, customVpId, isChecked) => {
    try {
      const tc = allTestCases.find(c => c.id === caseId);
      if (!tc) return;
      
      let customList = [];
      try {
        let parsed = typeof tc.customValidations === 'string' 
          ? JSON.parse(tc.customValidations) 
          : (tc.customValidations || []);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        customList = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error(err);
      }
      
      let updatedList;
      const exists = customList.some(cv => cv.id === customVpId);
      if (exists) {
        updatedList = customList.map(cv => cv.id === customVpId ? { ...cv, checked: isChecked } : cv);
      } else {
        updatedList = [...customList, { id: customVpId, label: 'Billing', checked: isChecked, value: tc.billing || '' }];
      }
      
      await axios.patch(`${API_BASE}/test-cases/${caseId}/validations`, {
        customValidations: JSON.stringify(updatedList)
      });
      
      setAllTestCases(prev => prev.map(c => c.id === caseId ? { ...c, customValidations: JSON.stringify(updatedList) } : c));
    } catch (err) {
      console.error('Custom validation update failed', err);
    }
  };

  const updateCaseAssignment = async (caseId, testerId) => {
    try {
      await axios.post(`${API_BASE}/assignments/assign`, {
        testerId: testerId || null,
        testCaseIds: [caseId]
      });
      await fetchAllTestCases();
      await fetchUnassigned();
      await fetchTesters();
      fetchBurndown();
    } catch (err) {
      console.error('Assignment update failed', err);
    }
  };

  const handleGenerateScenarios = async () => {
    if (!labRequirements.trim()) return;
    try {
      setIsGenerating(true);
      setAgentLogs(['System: Priming AI Drafting Lab...']);
      const res = await axios.post(`${API_BASE}/generator/generate`, {
        requirements: labRequirements,
        options: labConfig
      });
      setGeneratedScenarios(res.data);
      setAgentLogs(prev => [...prev, 'System: Scenarios drafted successfully.']);
    } catch (err) {
      console.error('Generation failed', err);
      let errorObj = err.response?.data?.error;
      const isQuota = errorObj === 'AI_QUOTA_EXCEEDED' || err.message?.includes('429');
      
      if (isQuota) {
        setAgentLogs(prev => [...prev, 'System: AI is currently busy. Please wait 30s and try again.']);
        alert('AI Quota Exceeded: Gemini is processing too many requests right now. Please wait about 30-60 seconds before trying again.');
      } else {
        let msg = typeof errorObj === 'object' ? (errorObj.message || JSON.stringify(errorObj)) : errorObj;
        alert(`Failed to generate scenarios. ${msg || 'Please check your API key or requirements complexity.'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportLabExcel = async () => {
    if (generatedScenarios.length === 0) return;
    try {
      const res = await axios.post(`${API_BASE}/generator/export`, { 
        scenarios: generatedScenarios,
        projectName: selectedProject?.name || 'Test_Nexus'
      }, { responseType: 'blob' });
      
      // Robust blob handling for browser compatibility
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${(selectedProject?.name || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_')}_Draft.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Excel export failed', err);
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to export Excel: ${msg}. Please check your connection and try again.`);
    }
  };

  const handleExportExecutionTracker = async () => {
    if (allTestCases.length === 0) return;
    try {
      const filteredCases = allTestCases.filter(tc => {
        if (trackerFilterStatus !== 'ALL' && tc.status !== trackerFilterStatus) return false;
        if (trackerFilterTester !== 'ALL') {
          const isAssigned = tc.assignments?.some(a => a.testerId === trackerFilterTester);
          if (!isAssigned) return false;
        }
        return true;
      });

      if (filteredCases.length === 0) {
        alert("No test cases match the current filters to export.");
        return;
      }

      const res = await axios.post(`${API_BASE}/test-cases/export`, { 
        projectName: selectedProject?.name || 'Test_Nexus',
        projectId: selectedProjectId,
        filterStatus: trackerFilterStatus,
        filterTester: trackerFilterTester
      }, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${(selectedProject?.name || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_')}_Execution_Tracker.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Execution tracker export failed', err);
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to export Tracker to Excel: ${msg}.`);
    }
  };

  const handleCommitScenarios = async () => {
    if (!selectedProjectId || generatedScenarios.length === 0) return;

    // Filter to only send new drafts (scenarios without a database id)
    const uncommittedScenarios = generatedScenarios.filter(s => !s.id);
    if (uncommittedScenarios.length === 0) {
      alert("All scenarios in this draft are already committed to the project.");
      return;
    }

    if (!window.confirm(`Save ${uncommittedScenarios.length} new scenarios to ${selectedProject?.name || 'the project'}?`)) return;

    try {
      setLoading(true);
      // Create a default suite for AI generated cases if none exists or just use a generic name
      const suiteName = 'AI Generated - ' + new Date().toLocaleDateString();
      
      // We'll reuse the upload-style logic but for JSON
      const res = await axios.post(`${API_BASE}/test-cases/bulk`, {
        projectId: selectedProjectId,
        suiteName,
        testCases: uncommittedScenarios
      });

      alert('Scenarios saved to project!');

      if (res.data && res.data.testCases) {
        const newlyCommittedMapped = res.data.testCases.map(tc => {
          let customVal = null;
          if (tc.customValidations) {
            try {
              customVal = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
            } catch (err) {
              customVal = tc.customValidations;
            }
          }
          return {
            id: tc.id,
            status: tc.status,
            checkUi: tc.checkUi,
            checkOrderBuild: tc.checkOrderBuild,
            checkOrderCompletion: tc.checkOrderCompletion,
            checkPcsMcpr: tc.checkPcsMcpr,
            summary: tc.summary,
            steps: tc.steps,
            expectedResult: tc.expectedResult,
            priority: tc.priority,
            module: tc.module || '',
            orderBuild: tc.orderBuild || '',
            orderCompletion: tc.orderCompletion || '',
            tcAssurance: tc.tcAssurance || '',
            billing: tc.billing || '',
            customValidations: customVal
          };
        });

        // Merge newly committed cases in-place
        const updatedScenarios = generatedScenarios.map(s => {
          if (s.id) return s;
          const matching = newlyCommittedMapped.find(nc => nc.summary === s.summary);
          return matching || s;
        });

        setGeneratedScenarios(updatedScenarios);
        if (user) {
          localStorage.setItem(`nexus_drafts_${user.id}_${selectedProjectId}`, JSON.stringify(updatedScenarios));
        }
      }

      await fetchStats(selectedProjectId);
      await fetchAllTestCases(selectedProjectId);
    } catch (err) {
      console.error('Commit failed', err);
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to save scenarios: ${msg}. Please check the console for details.`);
    } finally {
      setLoading(false);
    }
  };


  const handleThemeChange = async (color) => {
    setLocalTheme(color);
    localStorage.setItem('nexus_theme', color); // persist across refreshes instantly
    if (!selectedProjectId) return;
    try {
      const res = await axios.patch(`${API_BASE}/projects/${selectedProjectId}`, { themeColor: color });
      setProjects(projects.map(p => p.id === selectedProjectId ? res.data : p));
    } catch (err) {
      console.error('Theme change failed', err);
    }
  };

  const handleDiscardScenario = (index) => {
    setGeneratedScenarios(prev => prev.filter((_, i) => i !== index));
  };

  const openEditScenario = (index) => {
    setEditingScenarioIndex(index);
    const scenario = generatedScenarios[index];
    
    // Normalize validation points into a dynamic list
    const validationPoints = [];
    if (scenario.orderBuild) validationPoints.push({ id: 'orderBuild', label: 'Order Build', value: scenario.orderBuild });
    if (scenario.orderCompletion) validationPoints.push({ id: 'orderCompletion', label: 'Status Sync', value: scenario.orderCompletion });
    if (scenario.tcAssurance) validationPoints.push({ id: 'tcAssurance', label: 'T&C / Comms', value: scenario.tcAssurance });
    if (scenario.billing) validationPoints.push({ id: 'billing', label: 'Billing', value: scenario.billing });

    if (scenario.customValidations) {
      try {
        const customList = typeof scenario.customValidations === 'string' ? JSON.parse(scenario.customValidations) : scenario.customValidations;
        if (Array.isArray(customList)) {
          customList.forEach((cv, idx) => {
            // Avoid duplicate additions if standard fields already covered it
            if (!validationPoints.some(vp => vp.label.toLowerCase() === (cv.label || '').toLowerCase())) {
              validationPoints.push({
                id: cv.id || `custom_${Date.now()}_${idx}`,
                label: cv.label || 'Custom Check',
                value: cv.value || '',
                checked: cv.checked || false
              });
            }
          });
        }
      } catch (err) {
        console.error('Error parsing custom validations in openEditScenario', err);
      }
    }

    const editData = { ...scenario, validationPoints };
    setEditingScenarioData(editData);
    // Snapshot the original state so we can diff later for "Sync to All"
    setOriginalScenarioSnapshot({ ...scenario, validationPoints });
    setIsEditScenarioModalOpen(true);
  };

  const handleSaveEditedScenario = (e) => {
    e.preventDefault();
    if (editingScenarioIndex === null || !editingScenarioData) return;
    
    const applyToAll = window.confirm("Would you like to apply these validation points to all scenarios in your draft?");
    
    // Serialize validationPoints back to standard fields and customValidations
    const serialized = (() => {
      let orderBuild = null;
      let orderCompletion = null;
      let tcAssurance = null;
      let billing = null;
      const customValidations = [];

      (editingScenarioData.validationPoints || []).forEach(vp => {
        const labelLower = (vp.label || '').toLowerCase();
        if (vp.id === 'orderBuild' || labelLower === 'order build' || labelLower === 'order build / pricing') {
          orderBuild = vp.value || null;
        } else if (vp.id === 'orderCompletion' || labelLower === 'status sync' || labelLower === 'completion' || labelLower === 'status sync / completion') {
          orderCompletion = vp.value || null;
        } else if (vp.id === 'tcAssurance' || labelLower === 't&c / comms' || labelLower === 't&c / comms assurance' || labelLower === 'tc assurance' || labelLower === 't&c assurance') {
          tcAssurance = vp.value || null;
        } else if (vp.id === 'billing' || labelLower === 'billing' || labelLower === 'billing expectations') {
          billing = vp.value || null;
        } else {
          customValidations.push({
            id: vp.id,
            label: vp.label,
            value: vp.value,
            checked: vp.checked || false
          });
        }
      });

      return {
        orderBuild,
        orderCompletion,
        tcAssurance,
        billing,
        customValidations: customValidations.length > 0 ? customValidations : null
      };
    })();

    const savedScenario = {
      ...editingScenarioData,
      ...serialized
    };
    delete savedScenario.validationPoints; // clean temporary field

    let updated;
    if (applyToAll) {
      // Reset checked states for other scenarios since their validation requirements changed
      let resetCustomValidations = null;
      if (serialized.customValidations) {
        resetCustomValidations = serialized.customValidations.map(cv => ({ ...cv, checked: false }));
      }

      updated = generatedScenarios.map((s, i) => {
        if (i === editingScenarioIndex) return savedScenario;
        return {
          ...s,
          orderBuild: serialized.orderBuild,
          orderCompletion: serialized.orderCompletion,
          tcAssurance: serialized.tcAssurance,
          billing: serialized.billing,
          customValidations: resetCustomValidations,
          // Reset all standard check fields so testers must re-validate
          checkOrderBuild: false,
          checkOrderCompletion: false,
          checkPcsMcpr: false,
          // Reset to PENDING only if they were PASS (avoid touching FAIL or IN_PROGRESS)
          status: s.status === 'PASS' ? 'PENDING' : s.status
        };
      });
      setAgentLogs(prev => [...prev, `System: Validation points synced to all ${generatedScenarios.length} scenarios. Previously PASS scenarios reset to PENDING.`]);

      // Database sync for any database-backed scenarios
      const dbUpdates = updated
        .filter(s => s.id)
        .map(s => axios.patch(`${API_BASE}/test-cases/${s.id}`, s));
      if (dbUpdates.length > 0) {
        Promise.all(dbUpdates)
          .then(async () => {
            await fetchAllTestCases();
            await fetchStats();
            await fetchInsights();
            fetchBurndown();
          })
          .catch(err => console.error("Database sync failed", err));
      }
    } else {
      updated = [...generatedScenarios];
      updated[editingScenarioIndex] = savedScenario;

      if (savedScenario.id) {
        axios.patch(`${API_BASE}/test-cases/${savedScenario.id}`, savedScenario)
          .then(async () => {
            await fetchAllTestCases();
            await fetchStats();
            await fetchInsights();
            fetchBurndown();
          })
          .catch(err => console.error("Database sync failed", err));
      }
    }
    
    setGeneratedScenarios(updated);
    setIsEditScenarioModalOpen(false);
    setEditingScenarioIndex(null);
    setEditingScenarioData(null);
  };

  const handleSaveAndSyncAll = (e) => {
    e.preventDefault();
    if (editingScenarioIndex === null || !editingScenarioData) return;
    
    const count = generatedScenarios.length;

    // --- Serialize current validationPoints to flat fields ---
    const serializeValidationPoints = (validationPoints) => {
      let orderBuild = null;
      let orderCompletion = null;
      let tcAssurance = null;
      let billing = null;
      const customValidations = [];
      (validationPoints || []).forEach(vp => {
        const labelLower = (vp.label || '').toLowerCase();
        if (vp.id === 'orderBuild' || labelLower === 'order build' || labelLower === 'order build / pricing') {
          orderBuild = vp.value || null;
        } else if (vp.id === 'orderCompletion' || labelLower === 'status sync' || labelLower === 'completion' || labelLower === 'status sync / completion') {
          orderCompletion = vp.value || null;
        } else if (vp.id === 'tcAssurance' || labelLower === 't&c / comms' || labelLower === 't&c / comms assurance' || labelLower === 'tc assurance' || labelLower === 't&c assurance') {
          tcAssurance = vp.value || null;
        } else if (vp.id === 'billing' || labelLower === 'billing' || labelLower === 'billing expectations') {
          billing = vp.value || null;
        } else {
          customValidations.push({ id: vp.id, label: vp.label, value: vp.value, checked: vp.checked || false });
        }
      });
      return { orderBuild, orderCompletion, tcAssurance, billing, customValidations: customValidations.length > 0 ? customValidations : null };
    };

    const newSerialized = serializeValidationPoints(editingScenarioData.validationPoints);
    const origSerialized = serializeValidationPoints(originalScenarioSnapshot?.validationPoints);

    // --- Diff: figure out exactly which fields the user changed ---
    const simpleFields = ['summary', 'steps', 'expectedResult', 'module', 'priority'];
    const validationFields = ['orderBuild', 'orderCompletion', 'tcAssurance', 'billing', 'customValidations'];

    const changedSimple = {};
    simpleFields.forEach(field => {
      const oldVal = originalScenarioSnapshot?.[field] ?? null;
      const newVal = editingScenarioData[field] ?? null;
      if (oldVal !== newVal) changedSimple[field] = newVal;
    });

    const changedValidation = {};
    validationFields.forEach(field => {
      const oldVal = JSON.stringify(origSerialized[field] ?? null);
      const newVal = JSON.stringify(newSerialized[field] ?? null);
      if (oldVal !== newVal) changedValidation[field] = newSerialized[field];
    });

    const totalChangedFields = Object.keys(changedSimple).length + Object.keys(changedValidation).length;
    if (totalChangedFields === 0) {
      alert('No changes detected to sync.');
      return;
    }

    const changedLabels = [
      ...Object.keys(changedSimple).map(f => ({ summary: 'Title', steps: 'Test Steps', expectedResult: 'Expected Result', module: 'Module', priority: 'Priority' }[f] || f)),
      ...(Object.keys(changedValidation).length > 0 ? ['Validation Points'] : [])
    ];

    if (!window.confirm(`Apply to All: The following change(s) will be synced to all ${count} scenarios:\n\n• ${changedLabels.join('\n• ')}\n\nEverything else in each scenario stays untouched. Proceed?`)) return;

    // --- Build the fully saved version of the scenario being edited ---
    const savedScenario = { ...editingScenarioData, ...newSerialized };
    delete savedScenario.validationPoints; // clean temporary UI field

    // --- Apply only the changed fields to every other scenario ---
    const patchForOthers = { ...changedSimple, ...changedValidation };

    // If validation points changed, also reset their check states so testers must re-validate
    const validationChanged = Object.keys(changedValidation).length > 0;
    if (validationChanged) {
      // Reset custom validation checked flags
      if (patchForOthers.customValidations && Array.isArray(patchForOthers.customValidations)) {
        patchForOthers.customValidations = patchForOthers.customValidations.map(cv => ({ ...cv, checked: false }));
      }
      patchForOthers.checkOrderBuild = false;
      patchForOthers.checkOrderCompletion = false;
      patchForOthers.checkPcsMcpr = false;
    }

    const updated = generatedScenarios.map((s, i) => {
      if (i === editingScenarioIndex) return savedScenario;
      const patched = { ...s, ...patchForOthers };
      // Reset PASS → PENDING only if validation changed (test coverage requirements changed)
      if (validationChanged && patched.status === 'PASS') {
        patched.status = 'PENDING';
      }
      return patched;
    });

    setGeneratedScenarios(updated);
    setIsEditScenarioModalOpen(false);
    setEditingScenarioIndex(null);
    setEditingScenarioData(null);
    setOriginalScenarioSnapshot(null);

    setAgentLogs(prev => [...prev, `System: Synced [${changedLabels.join(', ')}] to all ${count} scenarios.${validationChanged ? ' PASS statuses reset to PENDING.' : ''}`]);

    // Database sync for any database-backed scenarios
    const dbUpdates = updated
      .filter(s => s.id)
      .map(s => axios.patch(`${API_BASE}/test-cases/${s.id}`, s));
    if (dbUpdates.length > 0) {
      Promise.all(dbUpdates)
        .then(async () => {
          await fetchAllTestCases();
          await fetchStats();
          await fetchInsights();
          fetchBurndown();
        })
        .catch(err => console.error("Database sync failed", err));
    }
  };

  // Scroll to results when scenarios are generated
  useEffect(() => {
    if (generatedScenarios.length > 0 && !isGenerating) {
      const resultsSection = document.getElementById('lab-results-applet');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [generatedScenarios.length, isGenerating]);


  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border-2 border-slate-400 shadow-md';

  const themes = [
    { name: 'Light', color: '#f8fafc' },
    { name: 'Burgundy', color: '#1a1a2e' },
    { name: 'Stealth', color: '#020617' }
  ];

  if (!user) {
    if (authView === 'register') {
      return <RegisterScreen onRegister={handleLogin} onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
  }

  const isPremium = user.subscriptionStatus === 'ACTIVE';
  const isTrial = !isPremium && user.role !== 'ADMIN';
  const canImportFull = user.role === 'ADMIN' || isPremium;
  const canMultipleProjects = user.role === 'ADMIN' || isPremium;

  return (
    <div 
      className="min-h-screen p-6 md:p-10 font-sans transition-all duration-700 ease-in-out"
    >
      <header className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            {selectedProject?.logoUrl ? (
               <img src={selectedProject.logoUrl} alt="Project Logo" className="w-12 h-12 rounded-2xl object-cover shadow-md" />
            ) : (
              <div className={`w-12 h-12 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-2xl flex items-center justify-center shadow-md`}>
                <Brain className="text-primary" />
              </div>
            )}
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
                {selectedProject?.name || 'TestNexus'}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Start:</span>
                  <input 
                    type="date"
                    value={selectedProject?.startDate ? new Date(selectedProject.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleProjectDateUpdate('startDate', e.target.value)}
                    className={`bg-transparent border-none text-[10px] font-bold ${textColor} focus:ring-0 cursor-pointer p-0`}
                  />
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-slate-700">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Go-Live:</span>
                  <input 
                    type="date"
                    value={selectedProject?.goLiveDate ? new Date(selectedProject.goLiveDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleProjectDateUpdate('goLiveDate', e.target.value)}
                    className={`bg-transparent border-none text-[10px] font-bold ${textColor} focus:ring-0 cursor-pointer p-0`}
                  />
                </div>
              </div>
           </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto justify-start xl:justify-end">
            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100'} border`}>
              {themes.map(theme => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeChange(theme.color)}
                  className={`w-8 h-8 rounded-lg border transition-all ${localTheme === theme.color ? 'ring-2 ring-primary scale-90' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                />
              ))}
            </div>
            <LanguageSwitcher isDark={isDark} />
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100'} border ${isPremium ? 'border-emerald-500/30' : ''}`}>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold ${textColor}`}>{user.name}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'text-primary' : isPremium ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {user.role}{isPremium && <span className="ml-1 inline-flex items-center gap-0.5">· <span className="text-emerald-400">★ {t('premium')}</span></span>}{isTrial && <span className="text-amber-500 ml-1">({t('trial')})</span>}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all"
                title={t('logout')}
              >
                <Lock size={16} />
              </button>
            </div>
             <button 
              onClick={(e) => {
                if (!canImportFull) {
                  alert(t('trialRestrictionReport'));
                } else {
                  handleExportPPT();
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 ${canImportFull ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-400 opacity-50 cursor-not-allowed'} text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20`}
            >
              <Upload className="w-4 h-4 rotate-180" />
              {t('exportReport')}
            </button>
            <label className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer`}>
              <Upload className="w-4 h-4" />
              {t('syncReport')}
              <input type="file" className="hidden" onChange={handleSyncExcel} accept=".xlsx,.xls" />
            </label>
            <button 
              onClick={handleResetProject}
              className={`flex items-center gap-2 px-5 py-2.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-semibold hover:bg-red-600/20 transition-all shadow-sm`}
              title={`Master Reset: Delete all scenarios for ${selectedProject?.name || 'this project'}`}
            >
              <AlertCircle size={18} />
              {t('reset')} {selectedProject?.name ? `(${selectedProject.name})` : ''}
            </button>
            <div className="flex gap-2">
              <label className={`flex items-center gap-2 px-5 py-2.5 ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-slate-200'} border rounded-xl font-semibold hover:opacity-80 transition-all shadow-sm cursor-pointer`}>
                <Plus size={18} />
                {t('background')}
                <input type="file" className="hidden" onChange={handleBackgroundUpload} accept="image/*" />
              </label>
              {selectedProject?.backgroundUrl && (
                <button 
                  onClick={handleResetBackground}
                  className={`flex items-center justify-center w-10 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all`}
                  title="Reset Background"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <label className={`flex items-center gap-2 px-5 py-2.5 ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-slate-200'} border rounded-xl font-semibold hover:opacity-80 transition-all shadow-sm cursor-pointer`}>
                <Plus size={18} />
                {t('logo')}
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
              {selectedProject?.logoUrl && (
                <button 
                  onClick={handleResetLogo}
                  className={`flex items-center justify-center w-10 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all`}
                  title="Reset Logo"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <label 
              className={`flex items-center gap-2 px-5 py-2.5 ${canImportFull ? 'bg-primary' : 'bg-slate-400 opacity-50 cursor-not-allowed'} text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer`}
              onClick={(e) => {
                if (!canImportFull) {
                  e.preventDefault();
                  alert(t('trialRestrictionImport'));
                }
              }}
            >
              <Upload size={18} />
              {t('import')}
              {canImportFull && <input type="file" className="hidden" onChange={handleUpload} accept=".xlsx,.xls,.csv" />}
            </label>
          </div>
        </div>

        {/* Project Tabs */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className={`flex gap-2 p-1 ${isDark ? 'bg-black/20' : 'bg-slate-100'} backdrop-blur-sm rounded-2xl border-2 ${isDark ? 'border-white/10' : 'border-slate-400'} w-fit flex-nowrap whitespace-nowrap`}>
            {projects.map(project => (
              <div key={project.id} className="relative group flex items-center shrink-0">
                <button
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    selectedProjectId === project.id 
                    ? (isDark ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white text-primary shadow-lg')
                    : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:bg-white/40')
                  }`}
                >
                  {project.name}
                </button>
                {selectedProjectId === project.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close = remove from UI list
                      const remaining = projects.filter(p => p.id !== project.id);
                      setProjects(remaining);
                      setHiddenProjectIds(prev => [...prev, project.id]);
                      
                      // Switch selection to another project if one exists
                      if (remaining.length > 0) {
                        setSelectedProjectId(remaining[0].id);
                      } else {
                        setSelectedProjectId(null);
                      }
                    }}
                    className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 z-10`}
                    title="Close Project"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                if (!canMultipleProjects && projects.length >= 1) {
                  alert('Multi-Project is a Premium feature (£100/mo). Upgrade your subscription to create additional projects.');
                  return;
                }
                handleCreateProject();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center justify-center transition-all shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'} border border-dashed border-slate-400/50`}
              title={canMultipleProjects ? 'Create New Project' : 'Upgrade to Premium for multiple projects'}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        {/* View Switcher */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className={`flex gap-6 mt-4 border-b-2 ${isDark ? 'border-white/10' : 'border-slate-400'} w-full min-w-max flex-nowrap`}>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative shrink-0 ${
                currentView === 'dashboard' 
                ? (isDark ? 'text-primary' : 'text-primary') 
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              {t('dashboard')}
              {currentView === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
            <button 
              onClick={() => setCurrentView('lab')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
                currentView === 'lab' 
                ? (isDark ? 'text-primary' : 'text-primary') 
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <Brain size={16} />
              {t('scenarioLab')}
              {currentView === 'lab' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
            <button 
              onClick={() => setCurrentView('billing')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
                currentView === 'billing' 
                ? (isDark ? 'text-primary' : 'text-primary') 
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <CreditCard size={16} />
              {t('billing')}
              {currentView === 'billing' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setCurrentView('admin')}
                className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
                  currentView === 'admin' 
                  ? (isDark ? 'text-primary' : 'text-primary') 
                  : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                }`}
              >
                <Shield size={16} />
                {t('systemAdmin')}
                {currentView === 'admin' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
              </button>
            )}
            <button 
              onClick={() => setCurrentView('help')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
                currentView === 'help' 
                ? (isDark ? 'text-primary' : 'text-primary') 
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <HelpCircle size={16} />
              {t('help')}
              {currentView === 'help' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
            <button 
              onClick={() => setCurrentView('about')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
                currentView === 'about' 
                ? (isDark ? 'text-primary' : 'text-primary') 
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <Info size={16} />
              {t('about')}
              {currentView === 'about' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
          </div>
        </div>
      </header>
      {loading && !selectedProjectId && currentView !== 'billing' && currentView !== 'admin-subs' ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {currentView === 'billing' ? (
            <SubscriptionScreen user={user} onBack={() => setCurrentView('dashboard')} onStatusUpdate={(u) => { setUser(u); localStorage.setItem('nexus_user', JSON.stringify(u)); }} />
          ) : currentView === 'admin' ? (
            <AdminDashboard />
          ) : currentView === 'help' ? (
            <HelpScreen isDark={isDark} />
          ) : currentView === 'about' ? (
            <AboutScreen isDark={isDark} />
          ) : currentView === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Top Hero: Executive Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard label="Total Cases" value={stats.total} icon={<Activity className="text-blue-500" />} isDark={isDark} />
                <MetricCard label="Passed" value={stats.passed} icon={<CheckCircle2 className="text-emerald-500" />} isDark={isDark} change={`${Math.round((stats.passed / (stats.total || 1)) * 100)}%`} trend="up" />
                <MetricCard label="Failed" value={stats.failed} icon={<Bug className="text-rose-500" />} isDark={isDark} change={`${Math.round((stats.failed / (stats.total || 1)) * 100)}%`} trend="down" />
                <MetricCard label="Blocked" value={stats.blocked} icon={<AlertCircle className="text-amber-500" />} isDark={isDark} change={`${Math.round((stats.blocked / (stats.total || 1)) * 100)}%`} />
                <MetricCard label="Pending" value={stats.pending} icon={<Clock className="text-slate-400" />} isDark={isDark} />
              </div>

              {/* ═══ ANIMATED BURNDOWN DASHBOARD ═══ */}
              <motion.div
                className={`${cardBg} p-8 rounded-3xl shadow-xl overflow-hidden relative`}
                variants={burndownContainerV}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
              >
                {/* Decorative animated gradient orbs */}
                <motion.div
                  className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
                  {...floatOrb}
                />
                <motion.div
                  className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }}
                  animate={{ y: [0, 12, 0], x: [0, -10, 0], transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }}
                  {...pulseGlow}
                />

                {/* Header row */}
                <motion.div variants={burndownItemV} className="relative z-10 flex flex-wrap justify-between items-start gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div
                        animate={{ rotate: [0, -8, 0, 8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <TrendingDown size={18} className="text-primary" />
                      </motion.div>
                      <h3 className={`text-xl font-bold ${textColor}`}>Execution Burndown</h3>
                      <motion.div
                        className="ml-2 w-2 h-2 rounded-full bg-emerald-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${subTextColor}`}>Live</span>
                    </div>
                    <p className={`text-sm ${subTextColor}`}>
                      {burndownMeta ? `${burndownMeta.numWeeks}-week sprint · ${new Date(burndownMeta.startDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} → ${new Date(burndownMeta.goLiveDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}` : 'Actual vs. Ideal Progress'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Launch readiness badge — animated */}
                    <motion.div
                      className={`px-4 py-2 rounded-2xl text-center backdrop-blur-sm ${stats.passed/(stats.total||1) > 0.8 ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-amber-500/10 ring-1 ring-amber-500/20'}`}
                      whileHover={{ scale: 1.08, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <p className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Launch Readiness</p>
                      <p className={`text-2xl font-black ${stats.passed/(stats.total||1) > 0.8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        <AnimatedCounter value={Math.round((stats.passed / (stats.total || 1)) * 100)} />%
                      </p>
                    </motion.div>
                    {/* Days to go-live — animated */}
                    {burndownMeta && (() => {
                      const daysLeft = Math.max(0, Math.ceil((new Date(burndownMeta.goLiveDate) - new Date()) / (1000*60*60*24)));
                      return (
                        <motion.div
                          className={`px-4 py-2 rounded-2xl text-center backdrop-blur-sm ${daysLeft < 7 ? 'bg-rose-500/10 ring-1 ring-rose-500/20' : 'bg-primary/10 ring-1 ring-primary/20'}`}
                          whileHover={{ scale: 1.08, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Days Left</p>
                          <p className={`text-2xl font-black ${daysLeft < 7 ? 'text-rose-500' : 'text-primary'}`}>
                            <AnimatedCounter value={daysLeft} duration={0.8} />
                          </p>
                          {daysLeft < 7 && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl ring-2 ring-rose-500/30"
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      );
                    })()}
                  </div>
                </motion.div>

                {/* KPI strip — animated */}
                {burndownMeta && (
                  <motion.div variants={burndownItemV} className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Remaining', value: burndownMeta.currentRemaining, color: 'text-blue-500',    bg: 'bg-blue-500/10', ring: 'ring-blue-500/20',    glow: 'rgba(59,130,246,0.15)' },
                      { label: 'Executed',  value: burndownMeta.currentExecuted,  color: 'text-indigo-500', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/20', glow: 'rgba(99,102,241,0.15)' },
                      { label: 'Passed',    value: burndownMeta.currentPassed,    color: 'text-emerald-500',bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20',glow: 'rgba(16,185,129,0.15)' },
                      { label: 'Blocked',   value: burndownMeta.currentBlocked,   color: 'text-amber-500',  bg: 'bg-amber-500/10', ring: 'ring-amber-500/20',  glow: 'rgba(245,158,11,0.15)' },
                    ].map(({ label, value, color, bg, ring, glow }, idx) => (
                      <motion.div
                        key={label}
                        className={`${bg} rounded-2xl p-3 text-center ring-1 ${ring} backdrop-blur-sm relative overflow-hidden`}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 + idx * 0.08 }}
                        whileHover={{ scale: 1.06, boxShadow: `0 12px 36px ${glow}` }}
                      >
                        <p className={`text-2xl font-black ${color}`}>
                          <AnimatedCounter value={value} duration={1 + idx * 0.2} />
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>{label}</p>
                        <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'} overflow-hidden`}>
                          <motion.div
                            className={`h-full rounded-full ${color.replace('text-','bg-')}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.round((value / (burndownMeta.total || 1)) * 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.4 + idx * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Main chart — animated entrance */}
                <motion.div
                  variants={burndownItemV}
                  className="relative z-10 h-[280px] w-full mb-6"
                >
                  <motion.div
                    className="w-full h-full"
                    initial={{ opacity: 0, scaleX: 0.85 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left center' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={burndownData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bdActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="bdPassed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="bdBlocked" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                          {/* Animated glow filter for the actual line */}
                          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', backgroundColor: isDark ? '#0f172a' : '#fff', color: isDark ? '#fff' : '#1e293b', padding: '12px 16px' }}
                          formatter={(value, name) => {
                            if (value === null || value === undefined) return ['—', name];
                            const labels = { ideal: 'Ideal Remaining', actual: 'Actual Remaining', passed: 'Passed', blocked: 'Blocked', failed: 'Failed' };
                            return [value, labels[name] || name];
                          }}
                          labelFormatter={(label, payload) => {
                            const pt = payload && payload[0] && payload[0].payload;
                            return pt ? `${label} · ${pt.label || ''}` : label;
                          }}
                          cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend
                          iconType="circle" iconSize={8}
                          formatter={(value) => <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{value}</span>}
                          wrapperStyle={{ paddingTop: 8 }}
                        />
                        {/* Ideal burndown — dashed line */}
                        <Area type="monotone" dataKey="ideal" name="Ideal" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth={2} strokeDasharray="6 4" fill="none" dot={false} isAnimationActive={true} animationDuration={1800} animationEasing="ease-in-out" />
                        {/* Actual remaining — blue filled area with glow */}
                        <Area type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={3} fill="url(#bdActual)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#1d4ed8' }} activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={true} animationDuration={2000} animationEasing="ease-out" />
                        {/* Passed — green area */}
                        <Area type="monotone" dataKey="passed" name="Passed" stroke="#10b981" strokeWidth={2} fill="url(#bdPassed)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} connectNulls={false} isAnimationActive={true} animationDuration={2200} animationEasing="ease-out" />
                        {/* Blocked — amber area */}
                        <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#f59e0b" strokeWidth={2} fill="url(#bdBlocked)" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} connectNulls={false} isAnimationActive={true} animationDuration={2400} animationEasing="ease-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                </motion.div>

                {/* Week-by-week progress bars — animated */}
                {burndownData.length > 0 && (
                  <motion.div variants={burndownItemV} className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Weekly Execution Progress</p>
                      <motion.div
                        className="flex-1 h-px"
                        style={{ background: isDark ? 'linear-gradient(90deg, rgba(148,163,184,0.3), transparent)' : 'linear-gradient(90deg, rgba(148,163,184,0.2), transparent)' }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        style={{ transformOrigin: 'left' }}
                      />
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {burndownData.map((w, i) => {
                        const pct = burndownMeta && w.executed !== null
                          ? Math.round((w.executed / (burndownMeta.total || 1)) * 100)
                          : null;
                        const isCurrent = w.isCurrentWeek;
                        return (
                          <motion.div
                            key={i}
                            className={`rounded-xl p-2 text-center relative ${isCurrent ? (isDark ? 'bg-primary/20 ring-1 ring-primary/50' : 'bg-primary/10 ring-1 ring-primary/30') : (isDark ? 'bg-white/5' : 'bg-slate-50')}`}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.5 + i * 0.06 }}
                            whileHover={{ scale: 1.08, y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                          >
                            {/* Current week pulsing dot */}
                            {isCurrent && (
                              <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary"
                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                            <p className={`text-[10px] font-black ${isCurrent ? 'text-primary' : subTextColor}`}>{w.name}</p>
                            <p className={`text-[9px] ${subTextColor} mb-1`}>{w.label}</p>
                            <div className={`h-16 rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-200'} relative overflow-hidden flex flex-col-reverse`}>
                              {pct !== null ? (
                                <motion.div
                                  className="w-full rounded-lg bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400"
                                  style={{ originY: 1, transformOrigin: 'bottom' }}
                                  initial={{ scaleY: 0 }}
                                  whileInView={{ scaleY: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.7 + i * 0.07 }}
                                  whileHover={{ filter: 'brightness(1.2)' }}
                                  layout
                                  style={{ height: `${pct}%`, transformOrigin: 'bottom' }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className={`text-[9px] ${subTextColor}`}>—</span>
                                </div>
                              )}
                            </div>
                            <motion.p
                              className={`text-[9px] font-bold mt-1 ${isCurrent ? 'text-primary' : subTextColor}`}
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: 1.0 + i * 0.07 }}
                            >
                              {pct !== null ? `${pct}%` : ''}
                            </motion.p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`${cardBg} p-6 rounded-3xl shadow-lg`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`font-bold ${textColor} flex items-center gap-2`}>
                      <Users size={20} className={subTextColor} />
                      Workload Balance
                    </h4>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          fetchAllTestCases();
                          setIsTrackerOpen(true);
                        }}
                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'} hover:opacity-70 transition-all`}
                      >
                        <Maximize2 size={12} />
                        Full Tracker
                      </button>
                      <button 
                        onClick={() => setIsTeamModalOpen(true)}
                        className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-primary' : 'text-slate-500'} hover:opacity-70 transition-all`}
                      >
                        Manage Team
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="max-h-[120px] overflow-y-auto pr-2 space-y-3 mb-6">
                      {testers.map(tester => (
                        <div key={tester.id} className="flex justify-between items-center text-sm">
                          <span className={`${subTextColor} font-medium`}>{tester.name}</span>
                          <div className={`w-1/2 ${isDark ? 'bg-white/10' : 'bg-slate-100'} h-2 rounded-full overflow-hidden`}>
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, (tester.assignments?.length || 0) * 20)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`border-t ${isDark ? 'border-white/10' : 'border-slate-100'} pt-4`}>
                      <div className="flex justify-between items-center mb-3">
                        <h5 className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Pending Pool</h5>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">{unassignedCases.length} Cases</span>
                      </div>
                      
                      {unassignedCases.length > 0 ? (
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                          {unassignedCases.map(c => (
                            <div key={c.id} className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} p-3 rounded-xl border ${isDark ? 'border-white/10' : 'border-slate-200'} flex justify-between items-center gap-4`}>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold ${textColor} truncate`}>{c.summary}</p>
                                <p className={`text-[10px] ${subTextColor} uppercase`}>{c.priority}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <select 
                                  value={selectedTesterId}
                                  onChange={(e) => setSelectedTesterId(e.target.value)}
                                  className={`text-[11px] font-bold px-4 py-2 rounded-xl border cursor-pointer transition-all ${isDark ? 'bg-slate-900 border-white/20 text-white hover:border-primary/50' : 'bg-white border-slate-200 text-slate-900 hover:border-primary/50'} focus:ring-2 focus:ring-primary/20 outline-none min-w-[120px] h-9`}
                                >
                                  <option value="">Assign Tester...</option>
                                  {testers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={() => handleAssign(c.id)}
                                  className="h-9 w-9 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-6 border-2 border-dashed ${isDark ? 'border-white/5' : 'border-slate-100'} rounded-2xl`}>
                          <p className={`text-xs ${subTextColor} italic`}>All work currently assigned</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`${cardBg} p-6 rounded-3xl shadow-lg`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`font-bold ${textColor} flex items-center gap-2`}>
                      <Bug size={20} className={subTextColor} />
                      Major Blockers
                      <select 
                        value={defectFilter}
                        onChange={(e) => setDefectFilter(e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'} outline-none ml-2 cursor-pointer`}
                      >
                        <option value="ALL">All</option>
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                        <option value="P4">P4</option>
                      </select>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleExportDefects}
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 ${isDark ? 'text-blue-400' : 'text-blue-600'} rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all`}
                        title="Export Blockers to Excel"
                      >
                        <Download size={12} />
                        Export
                      </button>
                      
                      <label 
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all cursor-pointer`}
                        title="Import Blockers from Excel"
                      >
                        <Upload size={12} />
                        Import
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleImportDefects} 
                          accept=".xlsx,.xls" 
                        />
                      </label>

                      <button 
                        onClick={() => {
                          setEditingDefectId(null);
                          setNewDefectData({
                            externalId: '', title: '', severity: 'P2', owner: '', actionPlan: '', 
                            description: '', futImpact: '', relatedCaseId: '', blockedCases: '',
                            raisedAt: new Date().toISOString().split('T')[0]
                          });
                          setIsDefectModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                      >
                        <Plus size={12} />
                        Report Blocker
                      </button>
                    </div>

                  </div>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {defects.filter(d => defectFilter === 'ALL' || d.severity === defectFilter).length > 0 ? (
                      defects.filter(d => defectFilter === 'ALL' || d.severity === defectFilter).map(defect => (
                        <div 
                          key={defect.id} 
                          onClick={() => handleOpenEditDefect(defect)}
                          className={`group relative flex flex-col gap-2 p-4 cursor-pointer ${isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50/50 border-red-100'} rounded-2xl border hover:border-red-500/30 transition-all animate-in fade-in slide-in-from-right-2`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md">{defect.severity}</span>
                              <span className={`text-[10px] font-bold ${subTextColor}`}>#{defect.externalId || 'MANUAL'}</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDefect(defect.id);
                              }} 
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>{defect.title}</p>
                            {defect.description && (
                              <p className={`text-xs ${subTextColor} mt-1 line-clamp-2`}>{defect.description}</p>
                            )}
                          </div>
                          {defect.owner && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <Users size={10} className="text-indigo-400" />
                              </div>
                              <span className="text-[10px] font-medium text-indigo-400">{defect.owner}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-12 border-2 border-dashed ${isDark ? 'border-white/5' : 'border-slate-100'} rounded-2xl`}>
                        <p className={`text-sm ${subTextColor} italic`}>No active blockers reported</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden h-fit">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Brain size={120} />
                </div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10 text-white">
                  <Brain className="text-primary" />
                  AI Advisor
                </h3>

                {agentLogs.length > 0 && (
                  <div className="mb-8 relative z-10 bg-black/40 rounded-2xl p-4 border border-white/10 overflow-hidden group">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                      <Terminal size={12} className="animate-pulse" />
                      Agent Live Status
                    </div>
                    <div className="space-y-2">
                      {agentLogs.map((log, i) => (
                        <div key={i} className={`text-xs font-mono transition-all duration-500 ${i === agentLogs.length - 1 ? 'text-white' : 'text-white/40'}`}>
                          <span className="text-primary mr-2">›</span>
                          {log}
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20">
                      <div className="h-full bg-primary animate-progress-indefinite w-1/3" />
                    </div>
                  </div>
                )}

                <div className="space-y-5 relative z-10">
                  {insights.length > 0 ? insights.map((insight, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">{insight.type}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  )) : (
                    <div className="text-slate-400 italic text-sm py-4">Generating daily insights for {selectedProject?.name}...</div>
                  )}
                </div>
                <button 
                  onClick={handleAnalyze}
                  className="w-full mt-8 py-4 bg-white/10 border border-white/20 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all text-white"
                >
                  Refresh Strategy
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Configuration Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className={`${cardBg} p-6 rounded-3xl shadow-xl space-y-6`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings size={18} className="text-primary" />
                    <h3 className={`font-bold ${textColor}`}>Drafting Scope</h3>
                  </div>

                  {/* Release & Status */}
                  <div className="space-y-4">
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} mb-2 block`}>Release</label>
                      <input 
                        type="text" 
                        value={labConfig.release}
                        onChange={(e) => setLabConfig({...labConfig, release: e.target.value})}
                        placeholder="e.g. R24.4"
                        className={`w-full p-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  </div>

                  {/* Channel Selection */}
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} block`}>Channel</label>
                    <div className="flex flex-wrap gap-2">
                      {['Retail', 'Call Center'].map(channel => (
                        <button
                          key={channel}
                          onClick={() => {
                            const newChannels = labConfig.channels.includes(channel)
                              ? labConfig.channels.filter(c => c !== channel)
                              : [...labConfig.channels, channel];
                            setLabConfig({...labConfig, channels: newChannels});
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                            labConfig.channels.includes(channel)
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : (isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
                          }`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Type Selection */}
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} block`}>Account Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['HBB', 'Mobile'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            const newTypes = labConfig.accountTypes.includes(type)
                              ? labConfig.accountTypes.filter(t => t !== type)
                              : [...labConfig.accountTypes, type];
                            setLabConfig({...labConfig, accountTypes: newTypes});
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                            labConfig.accountTypes.includes(type)
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105'
                            : (isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Journey Type Selection */}
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} block`}>Journey Type</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['New connection', 'Upgrade', 'Downgrade', ...extraJourneys].map(j => (
                        <button
                          key={j}
                          onClick={() => {
                            const newJourneys = labConfig.journeyTypes.includes(j)
                              ? labConfig.journeyTypes.filter(jt => jt !== j)
                              : [...labConfig.journeyTypes, j];
                            setLabConfig({...labConfig, journeyTypes: newJourneys});
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-2 ${
                            labConfig.journeyTypes.includes(j)
                            ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20 scale-105'
                            : (isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
                          }`}
                        >
                          {j}
                          {extraJourneys.includes(j) && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExtraJourneys(prev => prev.filter(ej => ej !== j));
                                setLabConfig(prev => ({...prev, journeyTypes: prev.journeyTypes.filter(jt => jt !== j)}));
                              }}
                              className="hover:scale-125 transition-transform opacity-60 hover:opacity-100"
                            >
                              ✕
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Manual Journey Type */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customJourneyType}
                        onChange={(e) => setCustomJourneyType(e.target.value)}
                        placeholder="Add custom..."
                        className={`flex-1 p-2 rounded-lg border text-[11px] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                      <button 
                        onClick={() => {
                          const val = customJourneyType.trim();
                          if (!val || extraJourneys.includes(val) || ['New connection', 'Upgrade', 'Downgrade'].includes(val)) {
                            setCustomJourneyType('');
                            return;
                          }
                          setExtraJourneys(prev => [...prev, val]);
                          setLabConfig(prev => ({...prev, journeyTypes: [...prev.journeyTypes, val]}));
                          setCustomJourneyType('');
                        }}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Test Case Metadata */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} mb-2 block`}>Priority</label>
                      <select 
                        value={labConfig.priority}
                        onChange={(e) => setLabConfig({...labConfig, priority: e.target.value})}
                        className={`w-full p-3 rounded-xl border text-sm ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>

                    {/* Matrix Preview */}
                    {(labConfig.channels.length > 1 || labConfig.accountTypes.length > 1 || labConfig.journeyTypes.length > 1) && (
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity size={14} className="text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Combinatorial Matrix</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${subTextColor}`}>
                          AI will draft scenarios for every combination:
                          <br />
                          <strong className="text-primary">
                            {Math.max(1, labConfig.channels.length)} Channels × {Math.max(1, labConfig.accountTypes.length)} Account Types × {Math.max(1, labConfig.journeyTypes.length)} Journeys
                            = {Math.max(1, labConfig.channels.length) * Math.max(1, labConfig.accountTypes.length) * Math.max(1, labConfig.journeyTypes.length)} Distinct Scope Blends
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Requirements Area */}
              <div className="lg:col-span-3 space-y-8">
                <div className={`${cardBg} p-8 rounded-3xl shadow-xl relative overflow-hidden h-full flex flex-col`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                      <Brain size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className={`text-2xl font-black ${textColor}`}>AI Scenario Drafting Lab</h2>
                        {selectedProject && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                            Target: {selectedProject.name}
                          </span>
                        )}
                      </div>
                      <p className={subTextColor}>Describe your feature or paste requirements to generate structured test plans.</p>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col">
                    <textarea 
                      value={labRequirements}
                      onChange={(e) => setLabRequirements(e.target.value)}
                      placeholder="Enter feature description, user stories, or technical requirements here..."
                      className={`w-full flex-1 p-6 rounded-2xl border transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'
                      } resize-none outline-none text-sm font-medium leading-relaxed min-h-[300px]`}
                    />
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>
                        {labRequirements.length} characters entered
                      </p>
                    <div className="flex flex-col items-end gap-2">
                        {(!labRequirements.trim() || labConfig.channels.length === 0 || labConfig.accountTypes.length === 0 || labConfig.journeyTypes.length === 0) && (
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'} animate-pulse`}>
                            {!labRequirements.trim() ? 'Draft your requirements first' : 'Select at least one option for Channel, Account, and Journey'}
                          </span>
                        )}
                        <button 
                          onClick={handleGenerateScenarios}
                          disabled={isGenerating || !labRequirements.trim() || labConfig.channels.length === 0 || labConfig.accountTypes.length === 0 || labConfig.journeyTypes.length === 0}
                          className={`relative overflow-hidden flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 ${!isGenerating && !isGenerating && labRequirements.trim() && labConfig.channels.length > 0 && labConfig.accountTypes.length > 0 && labConfig.journeyTypes.length > 0 && 'animate-ai-pulse'}`}
                        >
                          {isGenerating && <div className="absolute inset-0 shimmer-bg opacity-30" />}
                          {isGenerating ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Analyzing Requirements...
                            </>
                          ) : (
                            <>
                              <Sparkles size={18} className="animate-pulse" />
                              Generate Test Plan
                            </>
                          )}
                        </button>
                    </div>
                    </div>
                  </div>

                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Brain size={300} />
                  </div>
                </div>
              </div>
            </div>

            {(isGenerating || agentLogs.length > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isGenerating ? 'bg-primary/20 animate-pulse' : 'bg-slate-800'}`}>
                      <Terminal size={18} className="text-primary" />
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Agent Live Status</h4>
                  </div>
                  {isGenerating && (
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 font-mono">
                  {agentLogs.slice(-4).map((log, i) => (
                    <div key={i} className={`text-xs flex gap-3 transition-opacity duration-300 ${i === agentLogs.slice(-4).length - 1 ? 'text-white' : 'text-slate-500'}`}>
                      <span className="text-primary opacity-50 select-none">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <span className="flex-1">{log}</span>
                    </div>
                  ))}
                </div>

                {isGenerating && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary animate-progress-indefinite w-1/3" />
                  </div>
                )}
              </div>
            )}

            {generatedScenarios.length > 0 && (
              <div id="lab-results-applet" className="space-y-8 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black ${textColor}`}>Drafting Results</h3>
                      <p className={`text-sm ${subTextColor}`}>We've prepared {generatedScenarios.length} scenarios covering your selected scope matrix.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={clearDrafts}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isDark 
                        ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10' 
                        : 'border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm'
                      }`}
                    >
                      <Trash2 size={16} className="shrink-0" />
                      Discard All Journeys
                    </button>
                    <button 
                      onClick={handleExportLabExcel}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isDark 
                        ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <Upload size={16} className="rotate-180 shrink-0" />
                      Export to Excel
                    </button>
                    <button 
                      onClick={handleCommitScenarios}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 size={16} className="shrink-0" />
                      Commit to Project
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {generatedScenarios.map((s, i) => {
                    const isRetail = s.summary?.toLowerCase().includes('retail') || s.module?.toLowerCase().includes('retail');
                    const isCallCenter = s.summary?.toLowerCase().includes('call center') || s.module?.toLowerCase().includes('call center');
                    const isHBB = s.summary?.toLowerCase().includes('hbb') || s.module?.toLowerCase().includes('hbb');
                    const isMobile = s.summary?.toLowerCase().includes('mobile') || s.module?.toLowerCase().includes('mobile');

                    return (
                      <div key={i} className={`group relative ${cardBg} p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all border overflow-hidden animate-in fade-in zoom-in duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all rotate-12 group-hover:rotate-0">
                           {isHBB ? <Home size={120} /> : isMobile ? <Smartphone size={120} /> : <Layers size={120} />}
                         </div>

                         <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex gap-2">
                                {isRetail && <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg" title="Retail"><ShoppingBag size={14} /></div>}
                                {isCallCenter && <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg" title="Call Center"><Headphones size={14} /></div>}
                                {isHBB && <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg" title="HBB"><Home size={14} /></div>}
                                {isMobile && <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg" title="Mobile"><Smartphone size={14} /></div>}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => openEditScenario(i)}
                                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                  title="Refine Scenario"
                                >
                                  <Settings size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDiscardScenario(i)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Discard Journey"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="mb-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${
                                s.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-500' : 
                                s.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                              }`}>
                                {s.priority}
                              </span>
                              <h4 className={`text-lg font-bold leading-tight ${textColor} mb-2`}>{s.summary}</h4>
                              <p className={`text-xs font-semibold ${isDark ? 'text-primary/70' : 'text-primary'}`}>{s.module}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-6">
                              <div>
                                <h5 className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} mb-2 flex items-center gap-2`}>
                                  <Activity size={12} /> Test Steps
                                </h5>
                                <div className={`text-xs leading-relaxed space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {s.steps?.split('\n').map((step, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <span className="text-primary font-bold opacity-50">{idx + 1}.</span>
                                      <span className="flex-1">{step.replace(/^\d+\.\s*/, '')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} mb-2 flex items-center gap-2`}>
                                  <CheckCircle2 size={12} /> Expected Result
                                </h5>
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-400/80' : 'text-emerald-600'}`}>{s.expectedResult}</p>
                              </div>

                              {/* Dynamic Validation Highlights Section */}
                              {(() => {
                                const validations = [];
                                if (s.orderBuild) validations.push({ label: 'Order Build', value: s.orderBuild, bgClass: isDark ? 'bg-primary/5 border-primary/10' : 'bg-slate-50 border-slate-100', textClass: isDark ? 'text-primary' : 'text-primary', labelTextClass: isDark ? 'text-primary/70' : 'text-primary/80' });
                                if (s.orderCompletion) validations.push({ label: 'Status Sync', value: s.orderCompletion, bgClass: isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100', textClass: isDark ? 'text-emerald-400' : 'text-emerald-700', labelTextClass: 'text-emerald-500/70' });
                                if (s.tcAssurance) validations.push({ label: 'T&C / Comms', value: s.tcAssurance, bgClass: isDark ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100', textClass: isDark ? 'text-indigo-400' : 'text-indigo-700', labelTextClass: 'text-indigo-500/70' });
                                if (s.billing) validations.push({ label: 'Billing', value: s.billing, bgClass: isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-100', textClass: isDark ? 'text-amber-400' : 'text-amber-700', labelTextClass: 'text-amber-500/70' });

                                if (s.customValidations) {
                                  try {
                                    const customList = typeof s.customValidations === 'string' ? JSON.parse(s.customValidations) : s.customValidations;
                                    if (Array.isArray(customList)) {
                                      customList.forEach(cv => {
                                        validations.push({
                                          label: cv.label || 'Custom Check',
                                          value: cv.value || '',
                                          bgClass: isDark ? 'bg-purple-500/5 border-purple-500/10' : 'bg-purple-50 border-purple-100',
                                          textClass: isDark ? 'text-purple-400' : 'text-purple-700',
                                          labelTextClass: 'text-purple-500/70'
                                        });
                                      });
                                    }
                                  } catch (err) {
                                    // Fallback
                                  }
                                }

                                if (validations.length === 0) return null;

                                return (
                                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'} space-y-3`}>
                                    <div className="grid grid-cols-2 gap-3">
                                      {validations.map((v, vIdx) => (
                                        <div key={vIdx} className={`p-2.5 rounded-xl border ${v.bgClass}`} title={`${v.label}: ${v.value}`}>
                                          <span className={`text-[9px] font-black uppercase tracking-tighter ${v.labelTextClass} block mb-1 truncate`}>{v.label}</span>
                                          <p className={`text-[10px] leading-tight font-bold ${v.textClass} truncate`}>{v.value || 'N/A'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          )}

      
      {/* New Project Modal */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className={`text-lg font-bold ${textColor}`}>New Project</h3>
              <button onClick={() => setIsCreateProjectModalOpen(false)} className={subTextColor}>×</button>
            </div>
            <form onSubmit={submitCreateProject} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Project Name</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Q2 Quality Assurance"
                  className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm focus:border-primary outline-none transition-all`}
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Start Date</label>
                  <input 
                    type="date"
                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm focus:border-primary outline-none transition-all`}
                    value={newProjDates.start}
                    onChange={(e) => setNewProjDates({...newProjDates, start: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Go-Live Date</label>
                  <input 
                    type="date"
                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm focus:border-primary outline-none transition-all`}
                    value={newProjDates.goLive}
                    onChange={(e) => setNewProjDates({...newProjDates, goLive: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Management Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className={`text-lg font-bold ${textColor}`}>Manage Team Members</h3>
              <button onClick={() => setIsTeamModalOpen(false)} className={subTextColor}>×</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Add/Edit Form */}
              <form onSubmit={editingTester ? handleUpdateTester : handleAddTester} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Tester Name"
                  className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm`}
                  value={editingTester ? editingTester.name : newTester.name}
                  onChange={(e) => editingTester ? setEditingTester({...editingTester, name: e.target.value}) : setNewTester({...newTester, name: e.target.value})}
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm`}
                  value={editingTester ? editingTester.email : newTester.email}
                  onChange={(e) => editingTester ? setEditingTester({...editingTester, email: e.target.value}) : setNewTester({...newTester, email: e.target.value})}
                  required
                />
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-all">
                  {editingTester ? 'Update Member' : 'Add Team Member'}
                </button>
                {editingTester && (
                  <button type="button" onClick={() => setEditingTester(null)} className={`w-full py-2 ${subTextColor} text-xs font-bold uppercase`}>
                    Cancel Edit
                  </button>
                )}
              </form>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                <h4 className={`text-xs font-bold uppercase tracking-widest ${subTextColor}`}>Current Team</h4>
                {testers.map(t => (
                  <div key={t.id} className={`flex justify-between items-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'} border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <div>
                      <p className={`text-sm font-bold ${textColor}`}>{t.name}</p>
                      <p className={`text-[10px] ${subTextColor}`}>{t.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingTester(t)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <Settings size={14} />
                      </button>
                      <button onClick={() => handleDeleteTester(t.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        <AlertCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manual Mapping Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Manual Mapping</h3>
                  <p className="text-sm text-slate-400">AI analysis failed. Please pick columns.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid gap-4">
                {/* Project Name - always shown so user can set/override it */}
                <div className="space-y-1.5 pb-2 border-b border-slate-700">
                  <label className="text-xs font-medium text-indigo-400 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={manualProjectName}
                    onChange={(e) => setManualProjectName(e.target.value)}
                    placeholder="e.g. My Test Project"
                    className="w-full bg-slate-800 border border-indigo-500/50 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"
                  />
                  <p className="text-[10px] text-slate-500">A new project tab will be created with this name.</p>
                </div>
                {[
                  { field: 'externalId', label: 'Test Case ID (#)', icon: <Activity className="w-4 h-4" /> },
                  { field: 'summary', label: 'Test Case Title', icon: <Plus className="w-4 h-4" /> },
                  { field: 'steps', label: 'Test Steps', icon: <Terminal className="w-4 h-4" /> },
                  { field: 'expectedResult', label: 'Expected Results', icon: <CheckCircle2 className="w-4 h-4" /> },
                  { field: 'priority', label: 'Priority Column', icon: <AlertCircle className="w-4 h-4" /> },
                  { field: 'module', label: 'Module/Release Tab', icon: <Activity className="w-4 h-4" /> },
                ].map(({ field, label, icon }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                      {icon} {label}
                    </label>
                    <select
                      required={['externalId', 'summary'].includes(field)}
                      value={manualMap[field]}
                      onChange={(e) => setManualMap(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select Column...</option>
                      {activeHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </form>

            <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMappingModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Scenarios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Destination Modal */}
      {isImportDestinationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-white">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Import Destination</h3>
                  <p className="text-sm text-slate-400">Choose where to place the imported scenarios.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Import Option</label>
                
                {/* Option 1: Workload Only */}
                <div 
                  onClick={() => setImportDestination('workload')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    importDestination === 'workload' 
                      ? 'bg-indigo-600/25 border-indigo-500 text-white' 
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="importDestination" 
                      value="workload" 
                      checked={importDestination === 'workload'} 
                      onChange={() => setImportDestination('workload')}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-sm">Import directly to Workload</p>
                      <p className="text-xs text-slate-400 mt-1">Saves scenarios directly to the database workload.</p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Scenario Lab */}
                <div 
                  onClick={() => setImportDestination('lab')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    importDestination === 'lab' 
                      ? 'bg-indigo-600/25 border-indigo-500 text-white' 
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="importDestination" 
                      value="lab" 
                      checked={importDestination === 'lab'} 
                      onChange={() => setImportDestination('lab')}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-sm">Import to Scenario Lab for Editing</p>
                      <p className="text-xs text-slate-400 mt-1">Parses scenarios and loads them into the Scenario Lab as drafts.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project selector */}
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Target Project Scope
                </label>
                <select
                  value={importLabTargetProjectId}
                  onChange={(e) => setImportLabTargetProjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Auto-Detect / Active Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">Scenarios will be bound to this project, or the AI will auto-detect the scope.</p>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsImportDestinationModalOpen(false);
                  setActiveUploadFile(null);
                  setImportLabTargetProjectId('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportDestinationConfirm}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Scenario Modal */}
      {isEditScenarioModalOpen && editingScenarioData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className={`text-xl font-black ${textColor}`}>Refine Test Journey</h3>
              <button onClick={() => setIsEditScenarioModalOpen(false)} className={subTextColor}>×</button>
            </div>
            <form onSubmit={handleSaveEditedScenario} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Scenario Summary</label>
                  <input 
                    type="text" 
                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm`}
                    value={editingScenarioData.summary}
                    onChange={(e) => setEditingScenarioData({...editingScenarioData, summary: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Module / Release</label>
                  <input 
                    type="text" 
                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm`}
                    value={editingScenarioData.module}
                    onChange={(e) => setEditingScenarioData({...editingScenarioData, module: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Priority</label>
                  <select 
                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} text-sm`}
                    value={editingScenarioData.priority}
                    onChange={(e) => setEditingScenarioData({...editingScenarioData, priority: e.target.value})}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Test Steps</label>
                <textarea 
                  className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm h-32 resize-none`}
                  value={editingScenarioData.steps}
                  onChange={(e) => setEditingScenarioData({...editingScenarioData, steps: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Expected Result</label>
                <textarea 
                  className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm h-20 resize-none`}
                  value={editingScenarioData.expectedResult}
                  onChange={(e) => setEditingScenarioData({...editingScenarioData, expectedResult: e.target.value})}
                  required
                />
              </div>

              {/* Dynamic Validation Points Editing */}
              <div className={`p-6 rounded-3xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} border space-y-4`}>
                <div className="flex justify-between items-center">
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor} flex items-center gap-2`}>
                    <CheckCircle2 size={12} className="text-primary" />
                    Validation Architecture
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingScenarioData.validationPoints || [];
                      setEditingScenarioData({
                        ...editingScenarioData,
                        validationPoints: [
                          ...current,
                          { id: `custom_${Date.now()}`, label: '', value: '', checked: false }
                        ]
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-lg hover:bg-primary/20 transition-all"
                  >
                    <Plus size={10} /> Add Point
                  </button>
                </div>

                <div className="space-y-4">
                  {(editingScenarioData.validationPoints || []).map((vp, vpIdx) => (
                    <div key={vp.id || vpIdx} className={`p-4 rounded-2xl ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-100'} border flex gap-3 items-end`}>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <label className={`text-[9px] font-black uppercase tracking-tighter ${subTextColor}`}>Label / Field</label>
                        <input
                          type="text"
                          required
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-xs`}
                          value={vp.label}
                          placeholder="e.g. Order Build, Completion"
                          onChange={(e) => {
                            const updated = [...(editingScenarioData.validationPoints || [])];
                            updated[vpIdx] = { ...vp, label: e.target.value };
                            setEditingScenarioData({ ...editingScenarioData, validationPoints: updated });
                          }}
                        />
                      </div>
                      <div className="flex-[2] space-y-1.5 min-w-0">
                        <label className={`text-[9px] font-black uppercase tracking-tighter ${subTextColor}`}>Expected Outcome / Description</label>
                        <input
                          type="text"
                          required
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-xs`}
                          value={vp.value}
                          placeholder="e.g. Price shows £59.99"
                          onChange={(e) => {
                            const updated = [...(editingScenarioData.validationPoints || [])];
                            updated[vpIdx] = { ...vp, value: e.target.value };
                            setEditingScenarioData({ ...editingScenarioData, validationPoints: updated });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingScenarioData.validationPoints || []).filter(item => item.id !== vp.id);
                          setEditingScenarioData({ ...editingScenarioData, validationPoints: updated });
                        }}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all shrink-0 h-9 flex items-center justify-center animate-in fade-in duration-200"
                        title="Remove Validation Point"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(editingScenarioData.validationPoints || []).length === 0 && (
                    <div className={`text-center py-6 border-2 border-dashed ${isDark ? 'border-white/5' : 'border-slate-200'} rounded-2xl`}>
                      <p className={`text-xs ${subTextColor} italic`}>No validation checkpoints defined. Add one above.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditScenarioModalOpen(false)}
                  className={`flex-1 py-3 border rounded-xl font-bold ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-all`}
                >
                  Discard Changes
                </button>
                <div className="flex-[2] flex gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all border border-white/10"
                  >
                    Update One
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveAndSyncAll}
                    className="flex-[1.5] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Sync to All ({generatedScenarios.length})
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}




      {/* Global Execution Tracker Modal */}
      {isTrackerOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-12">
          <div className="bg-slate-900 border border-slate-800 w-full h-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <Activity className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Global Execution Tracker</h2>
                  <p className="text-slate-400 text-sm">Managing {allTestCases.length} scenarios for {selectedProject?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportExecutionTracker}
                  className="px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-all text-sm"
                >
                  Export Tracker
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to reset all scenarios to PENDING? This will clear all checklist validations as well.")) {
                      try {
                        await axios.post(`${API_BASE}/test-cases/reset`, { projectId: selectedProjectId });
                        await fetchAllTestCases();
                        await fetchStats();
                        await fetchInsights();
                        fetchBurndown();
                      } catch (e) {
                        console.error('Reset error', e);
                      }
                    }
                  }}
                  className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold transition-all text-sm"
                >
                  Reset Journey Status
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`⚠️ CLEAR ALL JOURNEYS\n\nThis will permanently delete all ${allTestCases.length} journey(s) in this project. This action cannot be undone.\n\nAre you sure?`)) {
                      if (window.confirm(`Final confirmation: Delete all ${allTestCases.length} journeys permanently?`)) {
                        try {
                          await axios.delete(`${API_BASE}/test-cases/clear-all`, { params: { projectId: selectedProjectId } });
                          await fetchAllTestCases();
                          await fetchStats();
                          await fetchInsights();
                          fetchBurndown();
                          fetchUnassigned();
                        } catch (e) {
                          console.error('Clear all error', e);
                          alert('Failed to clear journeys: ' + (e.response?.data?.error || e.message));
                        }
                      }
                    }
                  }}
                  className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition-all text-sm mr-4"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setIsTrackerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <Plus className="w-8 h-8 rotate-45" />
                </button>
              </div>

            </div>

            {/* Filters */}
            <div className="px-8 py-4 border-b border-slate-800 bg-slate-900/80 flex gap-4">
              <select 
                value={trackerFilterStatus}
                onChange={e => setTrackerFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PASS">Passed</option>
                <option value="FAIL">Failed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              
              <select 
                value={trackerFilterTester}
                onChange={e => setTrackerFilterTester(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Testers</option>
                {Array.from(new Set(allTestCases.map(tc => tc.assignments?.[0]?.tester?.name).filter(Boolean))).map(testerName => (
                  <option key={testerName} value={testerName}>{testerName}</option>
                ))}
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const filteredCases = allTestCases.filter(tc => {
                    if (trackerFilterStatus !== 'ALL' && tc.status !== trackerFilterStatus) return false;
                    const testerName = tc.assignments?.[0]?.tester?.name;
                    if (trackerFilterTester === 'UNASSIGNED' && testerName) return false;
                    if (trackerFilterTester !== 'ALL' && trackerFilterTester !== 'UNASSIGNED' && testerName !== trackerFilterTester) return false;
                    return true;
                  });

                  return filteredCases.length > 0 ? (
                    filteredCases.map(tc => {
                      const assignee = tc.assignments?.[0]?.tester;
                    return (
                      <div 
                        key={tc.id} 
                        className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all group flex flex-col md:flex-row md:items-center gap-6"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase whitespace-nowrap">
                              ID: {tc.externalId || 'N/A'}
                            </span>
                            <h4 className="text-white font-semibold truncate text-sm">
                              {tc.summary}
                            </h4>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest mb-4">
                            Priority: {tc.priority}
                          </p>
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                             {(() => {
                               const checklist = [];
                               checklist.push({ isCustom: false, field: 'checkUi', label: 'UI Valid', checked: !!tc.checkUi, description: 'Verify UI components' });
                               if (tc.orderBuild) checklist.push({ isCustom: false, field: 'checkOrderBuild', label: 'Order Build', checked: !!tc.checkOrderBuild, description: tc.orderBuild });
                               if (tc.orderCompletion) checklist.push({ isCustom: false, field: 'checkOrderCompletion', label: 'Completion', checked: !!tc.checkOrderCompletion, description: tc.orderCompletion });
                               if (tc.tcAssurance) checklist.push({ isCustom: false, field: 'checkPcsMcpr', label: 'T&C / Comms', checked: !!tc.checkPcsMcpr, description: tc.tcAssurance });
                               let parsedCustomList = [];
                               if (tc.customValidations) {
                                 try {
                                   let parsed = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
                                   if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                                   parsedCustomList = Array.isArray(parsed) ? parsed : [];
                                 } catch (e) {}
                               }

                               if (tc.billing) {
                                 let isBillingChecked = false;
                                 const billingItem = parsedCustomList.find(cv => cv.id === 'billing_check');
                                 if (billingItem) {
                                   isBillingChecked = !!billingItem.checked;
                                 }
                                 checklist.push({ isCustom: true, id: 'billing_check', label: 'Billing', checked: isBillingChecked, description: tc.billing });
                               }

                               parsedCustomList.forEach(cv => {
                                 if (cv.id !== 'billing_check') {
                                   checklist.push({
                                     isCustom: true,
                                     id: cv.id,
                                     label: cv.label || 'Custom Check',
                                     checked: !!cv.checked,
                                     description: cv.value || ''
                                   });
                                 }
                               });

                               return checklist.map((val, valIdx) => (
                                 <button
                                   key={val.field || val.id || valIdx}
                                   onClick={() => {
                                     if (val.isCustom) {
                                       updateCaseCustomValidation(tc.id, val.id, !val.checked);
                                     } else {
                                       updateCaseValidation(tc.id, val.field, !val.checked);
                                     }
                                   }}
                                   className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-left group/btn relative ${
                                     val.checked 
                                     ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                     : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600'
                                   }`}
                                   title={`${val.label}: ${val.description || 'No details'}`}
                                 >
                                   <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                     val.checked ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-600'
                                   }`}>
                                     {val.checked && <CheckCircle2 size={10} className="text-white" />}
                                   </div>
                                   <div className="min-w-0">
                                     <span className="text-[9px] font-black uppercase tracking-tighter block truncate">{val.label}</span>
                                     {val.description && (
                                       <span className="text-[7px] font-bold block truncate opacity-60 max-w-[100px]">{val.description}</span>
                                     )}
                                   </div>
                                 </button>
                               ));
                             })()}
                           </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="min-w-[140px]">
                            <select
                              value={assignee?.id || ''}
                              onChange={(e) => updateCaseAssignment(tc.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-4 py-2 hover:border-indigo-500 transition-colors outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                            >
                              <option value="" className="bg-slate-900">Unassigned</option>
                              {testers.map(t => (
                                <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                            {[
                              { status: 'PENDING', color: 'bg-slate-700 text-slate-300' },
                              { status: 'PASS', color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
                              { status: 'FAIL', color: 'bg-red-500 text-white shadow-lg shadow-red-500/20' },
                              { status: 'BLOCKED', color: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' }
                            ].map(s => (
                              <button
                                key={s.status}
                                onClick={() => updateCaseStatus(tc.id, s.status)}
                                className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${
                                  tc.status === s.status 
                                    ? s.color 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {s.status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-20 text-center text-slate-500 italic">No scenarios found matching the current filters.</div>
                );
                })()}
              </div>
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Total Scenarios</span>
                  <span className="text-white text-xl font-black">{allTestCases.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-emerald-500 text-[10px] uppercase font-bold">Passed</span>
                  <span className="text-emerald-400 text-xl font-black">
                    {allTestCases.filter(c => c.status === 'PASS').length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-rose-500 text-[10px] uppercase font-bold">Failed</span>
                  <span className="text-rose-400 text-xl font-black">
                    {allTestCases.filter(c => c.status === 'FAIL').length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-amber-500 text-[10px] uppercase font-bold">Blocked</span>
                  <span className="text-amber-400 text-xl font-black">
                    {allTestCases.filter(c => c.status === 'BLOCKED').length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Pending</span>
                  <span className="text-slate-300 text-xl font-black">
                    {allTestCases.filter(c => c.status === 'PENDING').length}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsTrackerOpen(false)}
                className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                Close Tracker
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Defect Modal */}
      {isDefectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/20 rounded-2xl">
                  <Bug className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                    {editingDefectId ? 'Edit Major Blocker' : 'Report Major Blocker'}
                  </h3>
                  <p className="text-slate-400 text-xs">Full Defect Template v2026.3</p>
                </div>
              </div>
              <button onClick={() => setIsDefectModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <Plus size={32} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleDefectSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Identifiers */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Issue Name / Summary</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CCS 26.3 || Phoenix || Return Order Failure"
                      className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all"
                      value={newDefectData.title}
                      onChange={(e) => setNewDefectData({...newDefectData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Issue Number</label>
                      <input 
                        type="text" 
                        placeholder="4171756"
                        className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all"
                        value={newDefectData.externalId}
                        onChange={(e) => setNewDefectData({...newDefectData, externalId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Date Raised</label>
                      <input 
                        type="date"
                        className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all"
                        value={newDefectData.raisedAt}
                        onChange={(e) => setNewDefectData({...newDefectData, raisedAt: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Priority</label>
                      <select 
                        className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                        value={newDefectData.severity}
                        onChange={(e) => setNewDefectData({...newDefectData, severity: e.target.value})}
                      >
                        <option value="P1" className="bg-slate-900">P1 - Critical</option>
                        <option value="P2" className="bg-slate-900">P2 - High</option>
                        <option value="P3" className="bg-slate-900">P3 - Medium</option>
                        <option value="P4" className="bg-slate-900">P4 - Low</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Issue Owner</label>
                      <input 
                        type="text" 
                        placeholder="Owner Name"
                        className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all"
                        value={newDefectData.owner}
                        onChange={(e) => setNewDefectData({...newDefectData, owner: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Failed Test (Journey)</label>
                    <select 
                      className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                      value={newDefectData.relatedCaseId}
                      onChange={(e) => setNewDefectData({...newDefectData, relatedCaseId: e.target.value})}
                    >
                      <option value="" className="bg-slate-900">Select failure journey...</option>
                      {allTestCases.map(tc => (
                        <option key={tc.id} value={tc.id} className="bg-slate-900">{tc.summary}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Action Plan</label>
                    <textarea 
                      placeholder="Next steps and mitigation..."
                      className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all h-[100px] resize-none"
                      value={newDefectData.actionPlan}
                      onChange={(e) => setNewDefectData({...newDefectData, actionPlan: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Further Info</label>
                    <textarea 
                      placeholder="Root cause, logs, or details..."
                      className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all h-[100px] resize-none"
                      value={newDefectData.description}
                      onChange={(e) => setNewDefectData({...newDefectData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">FUT Impact</label>
                      <input 
                        type="text" 
                        placeholder="Impact on Future Testing"
                        className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all"
                        value={newDefectData.futImpact}
                        onChange={(e) => setNewDefectData({...newDefectData, futImpact: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Blocked Test Areas</label>
                      <input 
                        type="text" 
                        placeholder="Modules or journeys blocked"
                        className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500 outline-none transition-all"
                        value={newDefectData.blockedCases}
                        onChange={(e) => setNewDefectData({...newDefectData, blockedCases: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-rose-900/40 disabled:opacity-50"
                >
                  {loading ? 'POSTING...' : (editingDefectId ? 'UPDATE BLOCKER REPORT' : 'UNLEASH BLOCKER REPORT')}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDefectModalOpen(false)}
                  className="px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-[2rem] transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
      )}
      <Analytics />
    </div>
  );
};



export default App;
