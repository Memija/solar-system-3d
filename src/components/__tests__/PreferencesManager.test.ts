import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    PreferencesManagerClass,
    APP_STORAGE_KEY,
    DEFAULT_PREFERENCES
} from '../PreferencesManager';

describe('PreferencesManager', () => {
    let manager: PreferencesManagerClass;

    beforeEach(() => {
        localStorage.clear();
        manager = new PreferencesManagerClass(APP_STORAGE_KEY);
    });

    it('has telemetry activated by default', () => {
        expect(DEFAULT_PREFERENCES.telemetry).toBe(true);
        expect(manager.get('telemetry')).toBe(true);
    });

    it('uses the exact application name key for localStorage', () => {
        expect(APP_STORAGE_KEY).toBe('solar-system-3d');
    });

    it('persists preferences under a single key in localStorage as a JSON object', () => {
        manager.set('telemetry', false);

        // Verify ONLY one item exists in localStorage and it is 'solar-system-3d'
        expect(localStorage.getItem('solar-system-3d')).not.toBeNull();
        const raw = localStorage.getItem('solar-system-3d')!;
        const parsed = JSON.parse(raw);

        expect(typeof parsed).toBe('object');
        expect(parsed.telemetry).toBe(false);
        expect(parsed.audioEnabled).toBe(false);
    });

    it('stores multiple preferences within the same single JSON object', () => {
        manager.set('audioEnabled', true);
        manager.set('language', 'de');
        manager.set('showOrbits', false);

        const raw = localStorage.getItem('solar-system-3d')!;
        const parsed = JSON.parse(raw);

        expect(parsed.audioEnabled).toBe(true);
        expect(parsed.language).toBe('de');
        expect(parsed.showOrbits).toBe(false);
        expect(parsed.telemetry).toBe(true); // default maintained
    });

    it('updates multiple preferences in batch via setMultiple', () => {
        manager.setMultiple({
            language: 'pl',
            realisticLighting: true,
            showAxes: true
        });

        const all = manager.getAll();
        expect(all.language).toBe('pl');
        expect(all.realisticLighting).toBe(true);
        expect(all.showAxes).toBe(true);

        const parsed = JSON.parse(localStorage.getItem('solar-system-3d')!);
        expect(parsed.language).toBe('pl');
        expect(parsed.realisticLighting).toBe(true);
    });

    it('notifies subscribers when a preference changes', () => {
        const listener = vi.fn();
        const unsubscribe = manager.onPreferenceChange(listener);

        manager.set('telemetry', false);
        expect(listener).toHaveBeenCalledWith('telemetry', false, expect.any(Object));

        unsubscribe();
        manager.set('telemetry', true);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('resets preferences back to defaults and updates localStorage', () => {
        manager.set('telemetry', false);
        manager.set('audioEnabled', true);
        manager.set('language', 'sr');

        manager.reset();

        expect(manager.get('telemetry')).toBe(true);
        expect(manager.get('audioEnabled')).toBe(false);
        expect(manager.get('language')).toBe('en');

        const parsed = JSON.parse(localStorage.getItem('solar-system-3d')!);
        expect(parsed.telemetry).toBe(true);
        expect(parsed.audioEnabled).toBe(false);
    });

    it('migrates legacy separate keys into the single application JSON object and removes legacy keys', () => {
        localStorage.clear();
        localStorage.setItem('solar_system_language', 'id');
        localStorage.setItem('solar_system_audio_enabled', 'true');

        const newManager = new PreferencesManagerClass('solar-system-3d');

        expect(newManager.get('language')).toBe('id');
        expect(newManager.get('audioEnabled')).toBe(true);

        // Verify legacy keys were cleaned up
        expect(localStorage.getItem('solar_system_language')).toBeNull();
        expect(localStorage.getItem('solar_system_audio_enabled')).toBeNull();

        // Verify single unified object exists
        const parsed = JSON.parse(localStorage.getItem('solar-system-3d')!);
        expect(parsed.language).toBe('id');
        expect(parsed.audioEnabled).toBe(true);
    });

    it('handles corrupted JSON in localStorage gracefully without crashing', () => {
        localStorage.setItem('solar-system-3d', '{invalid_json');

        const safeManager = new PreferencesManagerClass('solar-system-3d');
        expect(safeManager.get('telemetry')).toBe(true);
        expect(safeManager.get('audioEnabled')).toBe(false);
    });

    it('handles localStorage errors gracefully when storage is restricted', () => {
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        expect(() => {
            manager.set('telemetry', false);
        }).not.toThrow();

        spy.mockRestore();
    });
});
