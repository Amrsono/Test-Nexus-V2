import React from 'react';

const SJProductLogo = ({ isDark = true }) => {
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-lg transition-all select-none pointer-events-none ${
      isDark 
        ? 'bg-slate-900/80 border-slate-700/60 text-slate-200 shadow-black/50' 
        : 'bg-white/90 border-slate-200/90 text-slate-800 shadow-slate-300/50'
    }`}>
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm tracking-tighter">
        SJ
      </div>
      <span className="text-xs font-black tracking-wider uppercase opacity-90">
        SJ Product
      </span>
    </div>
  );
};

export default SJProductLogo;
