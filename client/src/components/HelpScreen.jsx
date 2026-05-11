import React from 'react';
import { PlayCircle, FileText, CheckCircle2 } from 'lucide-react';

const HelpScreen = ({ isDark }) => {
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border-2 border-slate-400 shadow-md';

  const walkthroughs = [
    {
      title: 'Getting Started with Test Nexus',
      description: 'Learn how to set up your first project, import test cases, and invite your team members.',
      icon: <PlayCircle size={24} className="text-primary" />
    },
    {
      title: 'AI Scenario Generation',
      description: 'Discover how to use the AI Advisor to automatically generate comprehensive test scenarios based on your requirements.',
      icon: <FileText size={24} className="text-emerald-500" />
    },
    {
      title: 'Managing Test Executions',
      description: 'A complete guide on assigning test cases, tracking progress, and updating statuses in real-time.',
      icon: <CheckCircle2 size={24} className="text-blue-500" />
    }
  ];

  return (
    <div className={`max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`${cardBg} p-8 rounded-3xl shadow-xl`}>
        <h2 className={`text-2xl font-bold ${textColor} mb-2`}>Help & Walkthroughs</h2>
        <p className={`${subTextColor} mb-8`}>Master Test Nexus with these step-by-step guides and video walkthroughs.</p>

        <div className="space-y-4">
          {walkthroughs.map((item, idx) => (
            <div key={idx} className={`p-6 rounded-2xl flex items-start gap-4 transition-all hover:scale-[1.01] cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'} border ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-black/20' : 'bg-white'} shadow-sm`}>
                {item.icon}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textColor} mb-1`}>{item.title}</h3>
                <p className={`text-sm ${subTextColor}`}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
          <h4 className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Need more help?</h4>
          <p className={`text-sm ${isDark ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>Contact your system administrator or reach out to our support team for specialized assistance with your testing workflows.</p>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
