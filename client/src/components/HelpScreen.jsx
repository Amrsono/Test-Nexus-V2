import React from 'react';
import { PlayCircle, FileText, CheckCircle2, Upload, Users, Bug, PieChart, Shield } from 'lucide-react';

const HelpScreen = ({ isDark }) => {
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border-2 border-slate-400 shadow-md';

  const sections = [
    {
      title: '1. Getting Started & Project Setup',
      icon: <PlayCircle size={28} className="text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Welcome to Test Nexus! To begin testing, you first need a Project. Projects act as containers for your test cases, test runs, and team assignments.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Create a Project:</strong> Click the <kbd className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>+</kbd> button in the top navigation bar. Enter a project name and configure the expected Go-Live and Start Dates.</li>
            <li><strong>Project Branding:</strong> You can upload a custom logo or a background image for each project by using the <strong>Logo</strong> and <strong>Background</strong> buttons in the header.</li>
            <li><strong>Switching Projects:</strong> If you have multiple projects, use the tabs at the top of the dashboard to quickly switch contexts.</li>
          </ul>
        </div>
      )
    },
    {
      title: '2. Importing Test Plans',
      icon: <Upload size={28} className="text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Test Nexus supports importing large sets of test cases via Excel files.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Import Format:</strong> The system accepts <code>.xlsx</code>, <code>.xls</code>, and <code>.csv</code> files.</li>
            <li><strong>Automatic Mapping:</strong> If your headers match standard QA terminology (e.g., "Summary", "Steps", "Expected Result"), Test Nexus will automatically map them.</li>
            <li><strong>Manual Mapping:</strong> If your headers are non-standard, you will be prompted to manually map the columns of your uploaded file to the platform's fields.</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. AI Scenario Generation (Scenario Lab)',
      icon: <FileText size={28} className="text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Save hours of manual writing by using the built-in AI Advisor to generate comprehensive edge cases and standard user journeys.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Navigate to Scenario Lab:</strong> Click the "Scenario Lab" tab.</li>
            <li><strong>Configure Scope:</strong> Select the target Release, Channels (Retail, Call Center), and Account Types (HBB, Mobile).</li>
            <li><strong>Input Requirements:</strong> Paste your Jira stories, acceptance criteria, or PRD text into the text box.</li>
            <li><strong>Generate:</strong> The AI will draft complete test scenarios including steps and expected outcomes. You can edit them individually, export them to Excel, or commit them directly to your project.</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. Test Execution & Tracking',
      icon: <CheckCircle2 size={28} className="text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Keep track of what's tested and what's pending in real-time.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Full Tracker:</strong> Click "Full Tracker" on the Dashboard to view all test cases in a spreadsheet-like view.</li>
            <li><strong>Status Updates:</strong> You can quickly mark tests as <strong>Pass</strong>, <strong>Fail</strong>, or <strong>Blocked</strong>.</li>
            <li><strong>Validations:</strong> Before passing complex cases, ensure the required operational steps (UI Check, Order Build, Completion, PCS/MCPR) are verified. The system enforces strict validation logic.</li>
            <li><strong>Export Reports:</strong> Click "Export Report" to generate an executive-ready PowerPoint status report containing the latest metrics.</li>
          </ul>
        </div>
      )
    },
    {
      title: '5. Team Management & Assignments',
      icon: <Users size={28} className="text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Distribute work efficiently among your QA engineers.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Manage Team:</strong> Click "Manage Team" to add testers. You just need to provide their Name and Email.</li>
            <li><strong>Assign Work:</strong> In the "Pending Pool" widget on the Dashboard, select a tester from the dropdown next to an unassigned test case and click the plus button to assign it.</li>
            <li><strong>Workload Balance:</strong> The dashboard displays a progress bar indicating how many assignments each tester currently has, ensuring work is distributed evenly.</li>
          </ul>
        </div>
      )
    },
    {
      title: '6. Defect Management',
      icon: <Bug size={28} className="text-rose-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Track blockers and failed cases efficiently so development teams can resolve them faster.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Report Blocker:</strong> Use the "Major Blockers" widget to log critical issues. Specify the Jira ID (External ID), severity, owner, and the cases it blocks.</li>
            <li><strong>Visibility:</strong> Blockers appear directly on the main dashboard to keep leadership aware of critical path impediments.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className={`max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12`}>
      <div className={`${cardBg} p-8 md:p-10 rounded-[2rem] shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-8">
          <div>
            <h2 className={`text-3xl font-extrabold ${textColor} mb-2`}>Test Nexus Documentation</h2>
            <p className={`text-lg ${subTextColor}`}>Learn how to manage your testing lifecycle effectively.</p>
          </div>
          <Shield size={48} className="text-slate-200 dark:text-white/5 hidden md:block" />
        </div>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-6 items-start">
              <div className={`shrink-0 p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-slate-50'} shadow-sm border ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                {section.icon}
              </div>
              <div className="flex-1 space-y-3">
                <h3 className={`text-2xl font-bold ${textColor}`}>{section.title}</h3>
                <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                  {section.content}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={`mt-12 p-8 rounded-[2rem] border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} flex flex-col md:flex-row items-center gap-6`}>
          <div className="p-4 bg-indigo-500 text-white rounded-2xl shrink-0">
            <PieChart size={32} />
          </div>
          <div>
            <h4 className={`text-xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Need Administrator Support?</h4>
            <p className={`text-base ${isDark ? 'text-indigo-300/80' : 'text-indigo-800/80'}`}>
              For role upgrades, quota increases for the AI Advisor, or advanced integrations, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
