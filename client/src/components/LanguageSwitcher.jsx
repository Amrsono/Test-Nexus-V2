import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const LanguageSwitcher = ({ isDark }) => {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setLang(code);
    setIsOpen(false);
  };

  const isRtl = lang === 'ar';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${
          isDark
            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-40 rounded-xl shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
            isRtl ? 'left-0' : 'right-0'
          } ${
            isDark
              ? 'bg-[#0f172a]/95 backdrop-blur-md border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
          }`}
        >
          <div className="py-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-primary/10 transition-colors ${
                  l.code === lang ? 'font-bold text-indigo-400 dark:text-indigo-400' : ''
                }`}
                style={{ textAlign: isRtl ? 'right' : 'left' }}
              >
                <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-base leading-none">{l.flag}</span>
                  <span>{l.name}</span>
                </div>
                {l.code === lang && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
