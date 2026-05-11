import React from 'react';
import { Mail, Github, Info, Shield, Zap, Globe } from 'lucide-react';

const AboutScreen = ({ isDark }) => {
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border-2 border-slate-400 shadow-md';

  return (
    <div className={`max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`${cardBg} p-8 rounded-3xl shadow-xl`}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <Info size={32} className="text-primary" />
          </div>
          <div>
            <h2 className={`text-3xl font-extrabold ${textColor}`}>About Test Nexus</h2>
            <p className={`${subTextColor}`}>Version 2.4.0</p>
          </div>
        </div>

        <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none mb-8`}>
          <p className={`text-lg leading-relaxed ${textColor}`}>
            Test Nexus is a next-generation test management and quality assurance platform designed for modern engineering teams. 
            By combining AI-driven scenario generation with real-time analytics and seamless execution tracking, Test Nexus accelerates 
            delivery cycles while ensuring uncompromising product quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className={`p-5 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
            <Zap className="text-amber-500 mb-3" size={24} />
            <h3 className={`font-bold ${textColor} mb-2`}>Lightning Fast</h3>
            <p className={`text-xs ${subTextColor}`}>Optimized for speed with a reactive architecture.</p>
          </div>
          <div className={`p-5 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
            <Shield className="text-emerald-500 mb-3" size={24} />
            <h3 className={`font-bold ${textColor} mb-2`}>Enterprise Grade</h3>
            <p className={`text-xs ${subTextColor}`}>Built with security and scalability at its core.</p>
          </div>
          <div className={`p-5 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
            <Globe className="text-blue-500 mb-3" size={24} />
            <h3 className={`font-bold ${textColor} mb-2`}>Collaborative</h3>
            <p className={`text-xs ${subTextColor}`}>Real-time sync keeps your whole team aligned.</p>
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-white/10' : 'border-slate-200'} pt-8`}>
          <h3 className={`text-xl font-bold ${textColor} mb-6`}>Developer Contact</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="mailto:amr.f.sono@gmail.com" 
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:border-primary text-slate-800 shadow-sm'}`}
            >
              <Mail className="text-rose-500" />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</p>
                <p className="font-medium">amr.f.sono@gmail.com</p>
              </div>
            </a>
            
            <a 
              href="https://github.com/Amrsono" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:border-primary text-slate-800 shadow-sm'}`}
            >
              <Github className={`${isDark ? 'text-white' : 'text-slate-900'}`} />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">GitHub</p>
                <p className="font-medium">github.com/Amrsono</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
