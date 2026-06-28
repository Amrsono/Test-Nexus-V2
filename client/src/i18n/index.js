import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './translations/en';
import ar from './translations/ar';
import es from './translations/es';
import pt from './translations/pt';
import fr from './translations/fr';

const TRANSLATIONS = { en, ar, es, pt, fr };

const RTL_LANGS = ['ar'];

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('nexus_lang') || 'en';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('nexus_lang', newLang);
  };

  // Apply RTL direction on language change
  useEffect(() => {
    const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = (key, vars = {}) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    let str = dict[key] ?? TRANSLATIONS['en'][key] ?? key;
    // Simple variable interpolation: {{varName}}
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    });
    return str;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
};

export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
};
