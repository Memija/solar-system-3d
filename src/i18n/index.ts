import { SupportedLanguage, LocaleInfo, TranslationSchema } from './types';
import { en } from './locales/en';
import { id } from './locales/id';
import { bs } from './locales/bs';
import { de } from './locales/de';
import { pl } from './locales/pl';
import { sr } from './locales/sr';

export * from './types';

export const AVAILABLE_LOCALES: LocaleInfo[] = [
    { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'bs', label: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
    { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'pl', label: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'sr', label: 'Serbian', nativeName: 'Српски (ћирилица)', flag: '🇷🇸' }
];

const STORAGE_KEY = 'solar_system_language';

class I18nManager {
    private currentLang: SupportedLanguage | string = 'en';
    private locales: Map<string, { meta: LocaleInfo; translations: TranslationSchema }> = new Map();
    private listeners: Set<(lang: SupportedLanguage | string) => void> = new Set();

    constructor() {
        // Register built-in locales
        this.registerLocale('en', AVAILABLE_LOCALES[0], en);
        this.registerLocale('id', AVAILABLE_LOCALES[1], id);
        this.registerLocale('bs', AVAILABLE_LOCALES[2], bs);
        this.registerLocale('de', AVAILABLE_LOCALES[3], de);
        this.registerLocale('pl', AVAILABLE_LOCALES[4], pl);
        this.registerLocale('sr', AVAILABLE_LOCALES[5], sr);

        // Detect initial language
        this.currentLang = this.detectInitialLanguage();
        this.applyDocumentLanguage(this.currentLang);
    }

    private detectInitialLanguage(): SupportedLanguage {
        // 1. Check localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = window.localStorage.getItem(STORAGE_KEY);
                if (stored && this.locales.has(stored)) {
                    return stored as SupportedLanguage;
                }
            } catch {
                // Ignore storage errors
            }
        }

        // 2. Check navigator.language
        if (typeof navigator !== 'undefined' && navigator.language) {
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

    public registerLocale(code: string, meta: LocaleInfo, translations: TranslationSchema) {
        this.locales.set(code, { meta, translations });
    }

    public get currentLanguage(): SupportedLanguage | string {
        return this.currentLang;
    }

    public getLocaleInfo(code?: string): LocaleInfo {
        const langCode = code || this.currentLang;
        const entry = this.locales.get(langCode);
        return entry?.meta || AVAILABLE_LOCALES[0];
    }

    public getAvailableLocales(): LocaleInfo[] {
        return Array.from(this.locales.values()).map(e => e.meta);
    }

    public setLanguage(lang: SupportedLanguage | string) {
        if (!this.locales.has(lang)) {
            console.warn(`Locale '${lang}' is not registered, defaulting to 'en'`);
            lang = 'en';
        }

        if (this.currentLang === lang) return;

        this.currentLang = lang;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem(STORAGE_KEY, lang);
            } catch {
                // Ignore storage errors
            }
        }

        this.applyDocumentLanguage(lang);
        this.notifyListeners(lang);
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
        const currentTranslations = this.locales.get(this.currentLang)?.translations;
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
     * Translated Celestial Body Name
     */
    public getBodyName(canonicalName: string): string {
        const current = this.locales.get(this.currentLang)?.translations.bodies?.[canonicalName];
        if (current?.name) return current.name;

        const fallback = this.locales.get('en')?.translations.bodies?.[canonicalName];
        return fallback?.name || canonicalName;
    }

    /**
     * Translated Celestial Body Description
     */
    public getBodyDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.locales.get(this.currentLang)?.translations.bodies?.[canonicalName];
        if (current?.description) return current.description;

        const fallback = this.locales.get('en')?.translations.bodies?.[canonicalName];
        return fallback?.description || fallbackDesc || '';
    }

    private resolveSpacecraftEntry(lang: string, canonicalName: string) {
        const scMap = this.locales.get(lang)?.translations.spacecraft;
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
        const cometMap = this.locales.get(lang)?.translations.comets;
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
        const constMap = this.locales.get(lang)?.translations.constellations;
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

    /**
     * Translated Spacecraft Name & Description
     */
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

    /**
     * Translated Comet Name & Description
     */
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

    /**
     * Translated Constellation Name & Description
     */
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

    /**
     * Translated Star Name & Description
     */
    public getStarName(canonicalName: string): string {
        const current = this.locales.get(this.currentLang)?.translations.stars?.[canonicalName];
        if (current?.name) return current.name;

        const fallback = this.locales.get('en')?.translations.stars?.[canonicalName];
        return fallback?.name || canonicalName;
    }

    public getStarDescription(canonicalName: string, fallbackDesc?: string): string {
        const current = this.locales.get(this.currentLang)?.translations.stars?.[canonicalName];
        if (current?.description) return current.description;

        const fallback = this.locales.get('en')?.translations.stars?.[canonicalName];
        return fallback?.description || fallbackDesc || '';
    }

    public getMonths(): string[] {
        const entry = this.locales.get(this.currentLang)?.translations.datepicker?.months;
        if (Array.isArray(entry) && entry.length === 12) return entry;
        return this.locales.get('en')!.translations.datepicker.months;
    }

    public getWeekdays(): string[] {
        const entry = this.locales.get(this.currentLang)?.translations.datepicker?.weekdays;
        if (Array.isArray(entry) && entry.length === 7) return entry;
        return this.locales.get('en')!.translations.datepicker.weekdays;
    }
}

export const i18n = new I18nManager();
