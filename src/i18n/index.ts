import { SupportedLanguage, LocaleInfo, TranslationSchema } from './types';
import { en } from './locales/en';
import { PreferencesManager } from '../components/PreferencesManager';

export * from './types';

export const FLAG_CODE_MAP: Record<string, string> = {
    en: 'gb.png',
    gb: 'gb.png',
    id: 'id.png',
    bs: 'ba.png',
    ba: 'ba.png',
    de: 'de.png',
    pl: 'pl.png',
    sr: 'rs.png',
    rs: 'rs.png'
};

export function getLocaleFlagUrl(localeOrCode: LocaleInfo | string): string {
    const code = typeof localeOrCode === 'string' ? localeOrCode : localeOrCode?.code || 'en';
    const customFile = typeof localeOrCode === 'object' ? localeOrCode.flagFile : undefined;
    const flagFile = customFile || FLAG_CODE_MAP[code] || `${code}.png`;
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
        ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`)
        : '/';
    return `${base}flags/${flagFile}`;
}

export const AVAILABLE_LOCALES: LocaleInfo[] = [
    { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', flagFile: 'id.png' },
    { code: 'bs', label: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', flagFile: 'ba.png' },
    { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪', flagFile: 'de.png' },
    { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧', flagFile: 'gb.png' },
    { code: 'pl', label: 'Polish', nativeName: 'Polski', flag: '🇵🇱', flagFile: 'pl.png' },
    { code: 'sr', label: 'Serbian', nativeName: 'Serbian', flag: '🇷🇸', flagFile: 'rs.png' }
];

const LOCALE_LOADERS: Record<string, () => Promise<TranslationSchema>> = {
    id: () => import('./locales/id').then(m => m.id),
    bs: () => import('./locales/bs').then(m => m.bs),
    de: () => import('./locales/de').then(m => m.de),
    pl: () => import('./locales/pl').then(m => m.pl),
    sr: () => import('./locales/sr').then(m => m.sr)
};

class I18nManager {
    private currentLang: SupportedLanguage | string = 'en';
    private locales: Map<string, { meta: LocaleInfo; translations: TranslationSchema; loaded: boolean }> = new Map();
    private inflightLoads: Map<string, Promise<void>> = new Map();
    private listeners: Set<(lang: SupportedLanguage | string) => void> = new Set();
    private numberFormatCache: Map<string, Intl.NumberFormat> = new Map();

    constructor() {
        // Register built-in locale metadata; English is loaded synchronously, others lazy-load on demand
        AVAILABLE_LOCALES.forEach(loc => {
            const code = loc.code as string;
            const isEn = code === 'en';
            this.locales.set(code, {
                meta: loc,
                translations: en,
                loaded: isEn
            });
        });

        // Detect initial language
        this.currentLang = this.detectInitialLanguage();
        this.applyDocumentLanguage(this.currentLang);
        if (this.currentLang !== 'en') {
            void this.preloadLocale(this.currentLang);
        }
    }

    private detectInitialLanguage(): SupportedLanguage {
        // 1. Check whether user explicitly saved a language in localStorage
        let hasExplicitStoredLang = false;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const raw = window.localStorage.getItem('solar-system-3d');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed.language === 'string' && this.locales.has(parsed.language)) {
                        hasExplicitStoredLang = true;
                        return parsed.language as SupportedLanguage;
                    }
                }
            } catch {
                // Fall back to PreferencesManager / navigator
            }
        }

        const stored = PreferencesManager.get('language');
        if (stored && stored !== 'en' && this.locales.has(stored)) {
            return stored as SupportedLanguage;
        }

        // 2. Check navigator.language if no explicit saved preference
        if (!hasExplicitStoredLang && typeof navigator !== 'undefined' && navigator.language) {
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('id')) return 'id';
            if (browserLang.startsWith('bs')) return 'bs';
            if (browserLang.startsWith('de')) return 'de';
            if (browserLang.startsWith('pl')) return 'pl';
            if (browserLang.startsWith('sr')) return 'sr';
            if (browserLang.startsWith('hr') || browserLang.startsWith('sh') || browserLang.startsWith('cnr')) return 'bs';
        }

        return 'en';
    }

    public async preloadLocale(code: string): Promise<void> {
        const entry = this.locales.get(code);
        if (entry?.loaded) return;
        const loader = LOCALE_LOADERS[code];
        if (!loader) return;

        const existing = this.inflightLoads.get(code);
        if (existing) return existing;

        const promise = loader()
            .then(translations => {
                const meta = entry?.meta || AVAILABLE_LOCALES.find(l => l.code === code) || AVAILABLE_LOCALES[0];
                this.locales.set(code, { meta, translations, loaded: true });
                if (this.currentLang === code) {
                    this.notifyListeners(code);
                }
            })
            .catch(err => {
                console.error(`[i18n] Failed to load locale '${code}':`, err);
            })
            .finally(() => {
                this.inflightLoads.delete(code);
            });

        this.inflightLoads.set(code, promise);
        return promise;
    }

    public registerLocale(code: string, meta: LocaleInfo, translations: TranslationSchema) {
        this.locales.set(code, { meta, translations, loaded: true });
    }

    public get currentLanguage(): SupportedLanguage | string {
        return this.currentLang;
    }

    public getLocaleInfo(code?: string): LocaleInfo {
        const langCode = code || this.currentLang;
        const entry = this.locales.get(langCode);
        return entry?.meta || AVAILABLE_LOCALES.find(l => l.code === langCode) || AVAILABLE_LOCALES.find(l => l.code === 'en') || AVAILABLE_LOCALES[0];
    }

    public getAvailableLocales(): LocaleInfo[] {
        return Array.from(this.locales.values()).map(e => e.meta);
    }

    public setLanguage(lang: SupportedLanguage | string) {
        if (!this.locales.has(lang)) {
            console.warn(`Locale '${lang}' is not registered, defaulting to 'en'`);
            lang = 'en';
        }

        const entry = this.locales.get(lang);
        const needsLazyLoad = !!entry && !entry.loaded && !!LOCALE_LOADERS[lang];

        if (this.currentLang === lang) {
            if (needsLazyLoad) {
                void this.preloadLocale(lang);
            }
            return;
        }

        this.currentLang = lang;
        PreferencesManager.set('language', lang);

        this.applyDocumentLanguage(lang);
        this.notifyListeners(lang);

        if (needsLazyLoad) {
            void this.preloadLocale(lang);
        }
    }

    private applyDocumentLanguage(lang: SupportedLanguage | string) {
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = lang;
        }
    }

    public onLanguageChange(callback: (lang: SupportedLanguage | string) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    public subscribe(callback: (lang: SupportedLanguage | string) => void): () => void {
        return this.onLanguageChange(callback);
    }

    private notifyListeners(lang: SupportedLanguage | string) {
        this.listeners.forEach(cb => {
            try {
                cb(lang);
            } catch (err) {
                console.error('Error in language change listener:', err);
            }
        });
    }

    /**
     * Resolves a dotted key path with fallback to English
     */
    public t(path: string, params?: Record<string, string | number>): string {
        const currentEntry = this.locales.get(this.currentLang);
        const currentTranslations = currentEntry?.loaded ? currentEntry.translations : undefined;
        const fallbackTranslations = this.locales.get('en')?.translations;

        let val: any = this.resolvePath(currentTranslations, path);
        if (val === undefined) {
            val = this.resolvePath(fallbackTranslations, path);
        }

        if (val === undefined) {
            return path;
        }

        if (typeof val === 'string' && params) {
            return Object.entries(params).reduce((acc, [key, replacement]) => {
                return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacement));
            }, val);
        }

        return String(val);
    }

    private resolvePath(obj: any, path: string): any {
        if (!obj) return undefined;
        const parts = path.split('.');
        let curr = obj;
        for (const part of parts) {
            if (curr === undefined || curr === null) return undefined;
            curr = curr[part];
        }
        return curr;
    }

    /**
     * Formats a numeric value according to the current locale using cached Intl.NumberFormat
     */
    public formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
        const localeMap: Record<string, string> = {
            en: 'en-US',
            de: 'de-DE',
            bs: 'bs-BA',
            sr: 'sr-RS',
            pl: 'pl-PL',
            id: 'id-ID'
        };
        const bcp47 = localeMap[this.currentLang] || this.currentLang || 'en-US';
        const cacheKey = options ? `${bcp47}:${JSON.stringify(options)}` : bcp47;

        let formatter = this.numberFormatCache.get(cacheKey);
        if (!formatter) {
            try {
                formatter = new Intl.NumberFormat(bcp47, options);
            } catch {
                formatter = new Intl.NumberFormat('en-US', options);
            }
            this.numberFormatCache.set(cacheKey, formatter);
        }
        return formatter.format(value);
    }

    private getLoadedTranslations(lang: string): TranslationSchema | undefined {
        const entry = this.locales.get(lang);
        return entry?.loaded ? entry.translations : undefined;
    }

    /**
     * Translated Celestial Body Name
     */
    public getBodyName(canonicalName: string): string {
        const current = this.getLoadedTranslations(this.currentLang)?.bodies?.[canonicalName];
        if (current?.name) return current.name;

        const fallback = this.getLoadedTranslations('en')?.bodies?.[canonicalName];
        return fallback?.name || canonicalName;
    }

    /**
     * Translated Celestial Body Description
     */
    public getBodyDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.getLoadedTranslations(this.currentLang)?.bodies?.[canonicalName];
        if (current?.description) return current.description;

        const fallback = this.getLoadedTranslations('en')?.bodies?.[canonicalName];
        return fallback?.description || fallbackDesc || '';
    }

    private resolveSpacecraftEntry(lang: string, canonicalName: string) {
        const scMap = this.getLoadedTranslations(lang)?.spacecraft;
        if (!scMap) return undefined;
        if (scMap[canonicalName]) return scMap[canonicalName];
        const aliases: Record<string, string[]> = {
            'ISS': ['ISS (International Space Station)', 'International Space Station (ISS)'],
            'ISS (International Space Station)': ['ISS', 'International Space Station (ISS)'],
            'JWST': ['James Webb Space Telescope', 'James Webb Space Telescope (JWST)'],
            'James Webb Space Telescope': ['JWST', 'James Webb Space Telescope (JWST)'],
            'Cassini': ['Cassini-Huygens'],
            'Cassini-Huygens': ['Cassini']
        };
        const candidates = aliases[canonicalName] || [];
        for (const cand of candidates) {
            if (scMap[cand]) return scMap[cand];
        }
        return undefined;
    }

    private resolveCometEntry(lang: string, canonicalName: string) {
        const cometMap = this.getLoadedTranslations(lang)?.comets;
        if (!cometMap) return undefined;
        if (cometMap[canonicalName]) return cometMap[canonicalName];
        const aliases: Record<string, string[]> = {
            'Hale-Bopp': ['Comet Hale-Bopp'],
            'Comet Hale-Bopp': ['Hale-Bopp'],
            "Halley's Comet": ['Halley', 'Comet Halley']
        };
        const candidates = aliases[canonicalName] || [];
        for (const cand of candidates) {
            if (cometMap[cand]) return cometMap[cand];
        }
        return undefined;
    }

    private resolveConstellationEntry(lang: string, canonicalName: string) {
        const constMap = this.getLoadedTranslations(lang)?.constellations;
        if (!constMap) return undefined;
        if (constMap[canonicalName]) return constMap[canonicalName];
        const aliases: Record<string, string[]> = {
            'Ursa Major (Big Dipper)': ['Ursa Major'],
            'Ursa Major': ['Ursa Major (Big Dipper)'],
            'Ursa Minor (Little Dipper)': ['Ursa Minor'],
            'Ursa Minor': ['Ursa Minor (Little Dipper)'],
            'Cygnus (The Swan)': ['Cygnus'],
            'Cygnus': ['Cygnus (The Swan)'],
            'Crux (Southern Cross)': ['Crux'],
            'Crux': ['Crux (Southern Cross)']
        };
        const candidates = aliases[canonicalName] || [];
        for (const cand of candidates) {
            if (constMap[cand]) return constMap[cand];
        }
        return undefined;
    }

    public getSpacecraftName(canonicalName: string): string {
        const current = this.resolveSpacecraftEntry(this.currentLang, canonicalName);
        if (current?.name) return current.name;

        const fallback = this.resolveSpacecraftEntry('en', canonicalName);
        return fallback?.name || canonicalName;
    }

    public getSpacecraftDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.resolveSpacecraftEntry(this.currentLang, canonicalName);
        if (current?.description) return current.description;

        const fallback = this.resolveSpacecraftEntry('en', canonicalName);
        return fallback?.description || fallbackDesc || '';
    }

    public getCometName(canonicalName: string): string {
        const current = this.resolveCometEntry(this.currentLang, canonicalName);
        if (current?.name) return current.name;

        const fallback = this.resolveCometEntry('en', canonicalName);
        return fallback?.name || canonicalName;
    }

    public getCometDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.resolveCometEntry(this.currentLang, canonicalName);
        if (current?.description) return current.description;

        const fallback = this.resolveCometEntry('en', canonicalName);
        return fallback?.description || fallbackDesc || '';
    }

    public getConstellationName(canonicalName: string): string {
        const current = this.resolveConstellationEntry(this.currentLang, canonicalName);
        if (current?.name) return current.name;

        const fallback = this.resolveConstellationEntry('en', canonicalName);
        return fallback?.name || canonicalName;
    }

    public getConstellationDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.resolveConstellationEntry(this.currentLang, canonicalName);
        if (current?.description) return current.description;

        const fallback = this.resolveConstellationEntry('en', canonicalName);
        return fallback?.description || fallbackDesc || '';
    }

    public getConstellationFamily(canonicalName: string, fallbackFamily?: string): string {
        const current = this.resolveConstellationEntry(this.currentLang, canonicalName);
        if (current?.family) return current.family;

        const fallback = this.resolveConstellationEntry('en', canonicalName);
        return fallback?.family || fallbackFamily || '';
    }

    public getStarName(canonicalName: string): string {
        const current = this.getLoadedTranslations(this.currentLang)?.stars?.[canonicalName];
        if (current?.name) return current.name;

        const fallback = this.getLoadedTranslations('en')?.stars?.[canonicalName];
        return fallback?.name || canonicalName;
    }

    public getStarDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.getLoadedTranslations(this.currentLang)?.stars?.[canonicalName];
        if (current?.description) return current.description;

        const fallback = this.getLoadedTranslations('en')?.stars?.[canonicalName];
        return fallback?.description || fallbackDesc || '';
    }

    public getMonths(): string[] {
        const entry = this.getLoadedTranslations(this.currentLang)?.datepicker?.months;
        if (Array.isArray(entry) && entry.length === 12) return entry;
        return this.locales.get('en')!.translations.datepicker.months;
    }

    public getWeekdays(): string[] {
        const entry = this.getLoadedTranslations(this.currentLang)?.datepicker?.weekdays;
        if (Array.isArray(entry) && entry.length === 7) return entry;
        return this.locales.get('en')!.translations.datepicker.weekdays;
    }

    /**
     * Resolves a popup identifier (key or localized title/description) to titleKey & descKey
     */
    public resolvePopup(identifier: string): { titleKey: string; descKey: string } | undefined {
        if (!identifier) return undefined;

        const clean = identifier.trim();

        // Direct key matches
        if (clean === 'popups.trueScaleTitle' || clean === 'trueScaleTitle' || clean === 'trueScale') {
            return { titleKey: 'popups.trueScaleTitle', descKey: 'popups.trueScaleDesc' };
        }
        if (clean === 'popups.meteorsTitle' || clean === 'meteorsTitle' || clean === 'meteors') {
            return { titleKey: 'popups.meteorsTitle', descKey: 'popups.meteorsDesc' };
        }

        // Localized string matches across all loaded locales
        for (const [, localeData] of this.locales) {
            if (!localeData.loaded) continue;
            const popups = localeData.translations.popups;
            if (!popups) continue;

            if ((popups.trueScaleTitle && popups.trueScaleTitle.toLowerCase() === clean.toLowerCase()) ||
                (popups.trueScaleDesc && popups.trueScaleDesc.toLowerCase() === clean.toLowerCase())) {
                return { titleKey: 'popups.trueScaleTitle', descKey: 'popups.trueScaleDesc' };
            }
            if ((popups.meteorsTitle && popups.meteorsTitle.toLowerCase() === clean.toLowerCase()) ||
                (popups.meteorsDesc && popups.meteorsDesc.toLowerCase() === clean.toLowerCase())) {
                return { titleKey: 'popups.meteorsTitle', descKey: 'popups.meteorsDesc' };
            }
        }

        return undefined;
    }

    public getPopupTitle(keyOrName: string): string {
        const resolved = this.resolvePopup(keyOrName);
        if (resolved) {
            return this.t(resolved.titleKey);
        }
        return this.t(keyOrName);
    }

    public getPopupDescription(keyOrName: string, fallbackDesc?: string): string {
        const resolved = this.resolvePopup(keyOrName);
        if (resolved) {
            return this.t(resolved.descKey);
        }
        return fallbackDesc ? this.t(fallbackDesc) : '';
    }
}

export const i18n = new I18nManager();
