import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  hu: { translation: require('../locales/hu.json') },
  de: { translation: require('../locales/de.json') },
  en: { translation: require('../locales/en.json') },
};

const isWeb = typeof window !== 'undefined';

if (isWeb) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'hu',
      interpolation: { escapeValue: false },
      detection: { order: ['querystring','localStorage','navigator'], caches: ['localStorage'] }
    });
} else {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: Localization.getLocales()?.[0]?.languageCode ?? 'hu',
      fallbackLng: 'hu',
      interpolation: { escapeValue: false },
    });
}

export default i18n;