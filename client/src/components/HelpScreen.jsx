import React from 'react';
import { PlayCircle, FileText, CheckCircle2, Upload, Users, Bug, PieChart, Shield } from 'lucide-react';
import { useTranslation } from '../i18n';

const HelpScreen = ({ isDark }) => {
  const { t } = useTranslation();
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border-2 border-slate-400 shadow-md';

  const sections = [
    {
      title: t('help_section1_title'),
      icon: <PlayCircle size={28} className="text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            {t('help_section1_p1')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('help_section1_li1')}</li>
            <li>{t('help_section1_li2')}</li>
            <li>{t('help_section1_li3')}</li>
          </ul>
        </div>
      )
    },
    {
      title: t('help_section2_title'),
      icon: <Upload size={28} className="text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            {t('help_section2_p1')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('help_section2_li1')}</li>
            <li>{t('help_section2_li2')}</li>
            <li>{t('help_section2_li3')}</li>
          </ul>
        </div>
      )
    },
    {
      title: t('help_section3_title'),
      icon: <FileText size={28} className="text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            {t('help_section3_p1')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('help_section3_li1')}</li>
            <li>{t('help_section3_li2')}</li>
            <li>{t('help_section3_li3')}</li>
            <li>{t('help_section3_li4')}</li>
          </ul>
        </div>
      )
    },
    {
      title: t('help_section4_title'),
      icon: <CheckCircle2 size={28} className="text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            {t('help_section4_p1')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('help_section4_li1')}</li>
            <li>{t('help_section4_li2')}</li>
            <li>{t('help_section4_li3')}</li>
            <li>{t('help_section4_li4')}</li>
          </ul>
        </div>
      )
    },
    {
      title: t('help_section5_title'),
      icon: <Users size={28} className="text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            {t('help_section5_p1')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('help_section5_li1')}</li>
            <li>{t('help_section5_li2')}</li>
            <li>{t('help_section5_li3')}</li>
          </ul>
        </div>
      )
    },
    {
      title: t('help_section6_title'),
      icon: <Bug size={28} className="text-rose-500" />,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            {t('help_section6_p1')}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('help_section6_li1')}</li>
            <li>{t('help_section6_li2')}</li>
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
            <h2 className={`text-3xl font-extrabold ${textColor} mb-2`}>{t('helpTitle')}</h2>
            <p className={`text-lg ${subTextColor}`}>{t('helpSubtitle')}</p>
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
            <h4 className={`text-xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>{t('needAdminSupport')}</h4>
            <p className={`text-base ${isDark ? 'text-indigo-300/80' : 'text-indigo-800/80'}`}>
              {t('adminSupportDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
