import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import en from './en.json';
import ar from './ar.json';

const deviceLang = Localization.getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: deviceLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

/**
 * Cambio lingua + direzione RTL.
 * Nota: React Native applica il mirroring RTL completo solo dopo un riavvio
 * dell'app (I18nManager.forceRTL ha effetto al reload) — comportamento standard.
 */
export async function setLanguage(lang: 'en' | 'ar') {
  await i18n.changeLanguage(lang);
  const rtl = lang === 'ar';
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    // In produzione: Updates.reloadAsync() per applicare subito il mirroring.
  }
}

export default i18n;
