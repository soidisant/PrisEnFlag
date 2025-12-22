import { translations } from './translations.js';

class LanguageManager {
  constructor() {
    // Try to get language from localStorage, default to browser language or English
    const saved = localStorage.getItem('pris-en-flag-lang');
    const browserLang = navigator.language?.startsWith('fr') ? 'fr' : 'en';
    this.currentLang = saved || browserLang;
    this.listeners = [];
  }

  get lang() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'fr') return;
    this.currentLang = lang;
    localStorage.setItem('pris-en-flag-lang', lang);
    this.notifyListeners();
  }

  toggle() {
    this.setLanguage(this.currentLang === 'en' ? 'fr' : 'en');
  }

  // Get UI translation
  t(key) {
    return translations[this.currentLang]?.[key] || translations.en[key] || key;
  }

  // Get country name in current language
  getCountryName(nameObj) {
    if (typeof nameObj === 'string') return nameObj;
    return nameObj?.[this.currentLang] || nameObj?.en || 'Unknown';
  }

  // Subscribe to language changes
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLang));
  }
}

// Singleton instance
export const languageManager = new LanguageManager();
