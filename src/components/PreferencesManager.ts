/**
 * PreferencesManager.ts
 * Centralized user preferences storage manager.
 * Persists all configuration and UI states into a single JSON object in localStorage
 * under the application name key ('solar-system-3d').
 */

export const APP_STORAGE_KEY = 'solar-system-3d';

export interface UserPreferences {
    telemetry: boolean;
    language: string;
    audioEnabled: boolean;
    minimap: boolean;
    showOrbits: boolean;
    showMoons: boolean;
    showAsteroids: boolean;
    showKuiperBelt: boolean;
    showDwarfPlanets: boolean;
    showComets: boolean;
    showSpacecraft: boolean;
    showMeteors: boolean;
    showTrails: boolean;
    realisticDistances: boolean;
    showHabitableZone: boolean;
    showEclipticGrid: boolean;
    enableBloom: boolean;
    realisticLighting: boolean;
    showAxes: boolean;
    [key: string]: any;
}

export const DEFAULT_PREFERENCES: Readonly<UserPreferences> = {
    // Performance telemetry activated by default
    telemetry: true,
    language: 'en',
    audioEnabled: false,
    minimap: true,
    showOrbits: true,
    showMoons: true,
    showAsteroids: true,
    showKuiperBelt: true,
    showDwarfPlanets: true,
    showComets: true,
    showSpacecraft: true,
    showMeteors: false,
    showTrails: true,
    realisticDistances: false,
    showHabitableZone: false,
    showEclipticGrid: false,
    enableBloom: true,
    realisticLighting: false,
    showAxes: false
};

export type PreferenceChangeListener = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
    preferences: UserPreferences
) => void;

export class PreferencesManagerClass {
    private preferences: UserPreferences;
    private listeners: Set<PreferenceChangeListener> = new Set();
    private storageKey: string;

    constructor(storageKey: string = APP_STORAGE_KEY) {
        this.storageKey = storageKey;
        this.preferences = { ...DEFAULT_PREFERENCES };
        this.load();
    }

    /**
     * Loads preferences from localStorage, performing migrations from legacy keys if necessary.
     */
    public load(): void {
        let loaded: Partial<UserPreferences> = {};
        let migratedLegacy = false;

        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = window.localStorage.getItem(this.storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && typeof parsed === 'object') {
                        loaded = parsed;
                    }
                }
            } catch (err) {
                console.warn('[PreferencesManager] Failed to read from localStorage:', err);
            }

            // Check and migrate legacy disparate keys
            try {
                const legacyLang = window.localStorage.getItem('solar_system_language');
                if (legacyLang) {
                    loaded.language = legacyLang;
                    window.localStorage.removeItem('solar_system_language');
                    migratedLegacy = true;
                }

                const legacyAudio = window.localStorage.getItem('solar_system_audio_enabled');
                if (legacyAudio !== null) {
                    loaded.audioEnabled = legacyAudio === 'true';
                    window.localStorage.removeItem('solar_system_audio_enabled');
                    migratedLegacy = true;
                }
            } catch {
                // Ignore errors reading legacy keys
            }
        }

        this.preferences = {
            ...DEFAULT_PREFERENCES,
            ...loaded
        };

        if (migratedLegacy) {
            this.save();
        }
    }

    /**
     * Persists the current state to localStorage under the application key as a single JSON object.
     */
    private save(): void {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            window.localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
        } catch (err) {
            console.warn('[PreferencesManager] Failed to write to localStorage:', err);
        }
    }

    /**
     * Retrieves a single preference value.
     */
    public get<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
        return this.preferences[key] !== undefined
            ? this.preferences[key]
            : DEFAULT_PREFERENCES[key];
    }

    /**
     * Sets a preference value and automatically saves to localStorage.
     */
    public set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
        if (this.preferences[key] === value) return;

        this.preferences[key] = value;
        this.save();
        this.notifyListeners(key, value);
    }

    /**
     * Updates multiple preferences in a single batch.
     */
    public setMultiple(partial: Partial<UserPreferences>): void {
        let changed = false;
        for (const [key, value] of Object.entries(partial)) {
            if (this.preferences[key] !== value) {
                this.preferences[key] = value;
                changed = true;
                this.notifyListeners(key as keyof UserPreferences, value);
            }
        }
        if (changed) {
            this.save();
        }
    }

    /**
     * Returns a copy of all current preferences.
     */
    public getAll(): UserPreferences {
        return { ...this.preferences };
    }

    /**
     * Resets preferences to defaults and persists.
     */
    public reset(): void {
        this.preferences = { ...DEFAULT_PREFERENCES };
        this.save();
        for (const key of Object.keys(DEFAULT_PREFERENCES) as (keyof UserPreferences)[]) {
            this.notifyListeners(key, DEFAULT_PREFERENCES[key]);
        }
    }

    /**
     * Subscribes to preference changes.
     */
    public onPreferenceChange(listener: PreferenceChangeListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
        this.listeners.forEach(fn => {
            try {
                fn(key, value, this.getAll());
            } catch (err) {
                console.error('[PreferencesManager] Listener error:', err);
            }
        });
    }
}

export const PreferencesManager = new PreferencesManagerClass();
