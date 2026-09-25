import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeaderSlotsManager } from '../HeaderSlotsManager';
import { DEFAULT_HEADER_SLOTS } from '../PreferencesManager';

describe('HeaderSlotsManager', () => {
    beforeEach(() => {
        localStorage.clear();
        HeaderSlotsManager.resetDefaults();
    });

    it('provides a catalog of available slots across optics, layers, and tools', () => {
        const slots = HeaderSlotsManager.getAvailableSlots();
        expect(slots.length).toBeGreaterThan(15);

        const categories = new Set(slots.map(s => s.category));
        expect(categories.has('optics')).toBe(true);
        expect(categories.has('layers')).toBe(true);
        expect(categories.has('tools')).toBe(true);
    });

    it('returns default header slots when no custom slots are configured', () => {
        const activeIds = HeaderSlotsManager.getActiveSlotIds();
        expect(activeIds).toEqual(DEFAULT_HEADER_SLOTS);
        expect(activeIds).toContain('minimap');
        expect(activeIds).toContain('snapshot');
        expect(activeIds).toContain('audio');
        expect(activeIds).toContain('telemetry');
        expect(activeIds).toContain('shortcuts');
    });

    it('can add a new slot to header slots', () => {
        const added = HeaderSlotsManager.addSlot('enableBloom');
        expect(added).toBe(true);
        expect(HeaderSlotsManager.isSlotActive('enableBloom')).toBe(true);
        expect(HeaderSlotsManager.getActiveSlotIds()).toContain('enableBloom');

        // Cannot add duplicate
        const addedAgain = HeaderSlotsManager.addSlot('enableBloom');
        expect(addedAgain).toBe(false);
    });

    it('can remove an existing slot from header slots', () => {
        expect(HeaderSlotsManager.isSlotActive('minimap')).toBe(true);
        const removed = HeaderSlotsManager.removeSlot('minimap');
        expect(removed).toBe(true);
        expect(HeaderSlotsManager.isSlotActive('minimap')).toBe(false);

        // Cannot remove non-existent
        const removedAgain = HeaderSlotsManager.removeSlot('minimap');
        expect(removedAgain).toBe(false);
    });

    it('can toggle slots active state', () => {
        expect(HeaderSlotsManager.isSlotActive('showOrbits')).toBe(false);

        const toggledOn = HeaderSlotsManager.toggleSlot('showOrbits');
        expect(toggledOn).toBe(true);
        expect(HeaderSlotsManager.isSlotActive('showOrbits')).toBe(true);

        const toggledOff = HeaderSlotsManager.toggleSlot('showOrbits');
        expect(toggledOff).toBe(false);
        expect(HeaderSlotsManager.isSlotActive('showOrbits')).toBe(false);
    });

    it('resets header slots back to default slots', () => {
        HeaderSlotsManager.addSlot('realisticLighting');
        HeaderSlotsManager.removeSlot('audio');
        expect(HeaderSlotsManager.getActiveSlotIds()).toContain('realisticLighting');
        expect(HeaderSlotsManager.getActiveSlotIds()).not.toContain('audio');

        HeaderSlotsManager.resetDefaults();
        expect(HeaderSlotsManager.getActiveSlotIds()).toEqual(DEFAULT_HEADER_SLOTS);
    });

    it('persists customized slots into the single solar-system-3d JSON object in localStorage', () => {
        HeaderSlotsManager.addSlot('showAxes');

        const raw = localStorage.getItem('solar-system-3d');
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(Array.isArray(parsed.headerSlots)).toBe(true);
        expect(parsed.headerSlots).toContain('showAxes');
    });

    it('renders slot buttons into DOM container with correct attributes and classes', () => {
        const container = document.createElement('div');
        const mockUi = {
            minimap: { isVisible: true },
            audioManager: { getAudioEnabled: () => true },
            performanceMonitor: { getVisible: () => false },
            shortcutsModal: { isOpen: false },
            sceneManager: null
        };

        HeaderSlotsManager.renderSlots(container, mockUi);

        const buttons = container.querySelectorAll<HTMLButtonElement>('.obs-header-slot-btn');
        expect(buttons.length).toBe(DEFAULT_HEADER_SLOTS.length);

        const radarBtn = container.querySelector('#hudRadarBtn') as HTMLButtonElement;
        expect(radarBtn).not.toBeNull();
        expect(radarBtn.classList.contains('active')).toBe(true);

        const soundBtn = container.querySelector('#hudSoundBtn') as HTMLButtonElement;
        expect(soundBtn).not.toBeNull();
        expect(soundBtn.textContent).toContain('🔊');
    });

    it('triggers action and updates states when a rendered slot button is clicked', () => {
        const container = document.createElement('div');
        const toggleMinimapSpy = vi.fn();
        const playTickSpy = vi.fn();

        const mockUi = {
            minimap: { isVisible: false },
            toggleMinimap: toggleMinimapSpy,
            audioManager: { playTick: playTickSpy, getAudioEnabled: () => false },
            performanceMonitor: { getVisible: () => false },
            shortcutsModal: { isOpen: false },
            controlCenter: { syncSwitches: vi.fn() },
            sceneManager: null
        };

        HeaderSlotsManager.renderSlots(container, mockUi);

        const radarBtn = container.querySelector('#hudRadarBtn') as HTMLButtonElement;
        expect(radarBtn).not.toBeNull();

        radarBtn.click();
        expect(toggleMinimapSpy).toHaveBeenCalledTimes(1);
        expect(playTickSpy).toHaveBeenCalledTimes(1);
        expect(mockUi.controlCenter.syncSwitches).toHaveBeenCalledTimes(1);
    });

    it('updates slot states and dynamic icons without re-creating buttons', () => {
        const container = document.createElement('div');
        let soundEnabled = false;

        const mockUi = {
            minimap: { isVisible: false },
            audioManager: { getAudioEnabled: () => soundEnabled },
            performanceMonitor: { getVisible: () => false },
            shortcutsModal: { isOpen: false },
            sceneManager: null
        };

        HeaderSlotsManager.renderSlots(container, mockUi);
        const soundBtn = container.querySelector('#hudSoundBtn') as HTMLButtonElement;
        expect(soundBtn.textContent).toContain('🔇');

        soundEnabled = true;
        HeaderSlotsManager.updateSlotStates(container, mockUi);
        expect(soundBtn.textContent).toContain('🔊');
        expect(soundBtn.classList.contains('active')).toBe(true);
    });
});
