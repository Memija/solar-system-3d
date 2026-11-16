import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UIManager } from '../UIManager';
import { Modal } from '../Modal';
import { HeaderSlotsManager } from '../HeaderSlotsManager';
import { i18n } from '../../i18n';

vi.mock('three', () => ({
    Raycaster: class {
        setFromCamera = vi.fn();
        intersectObjects = vi.fn(() => []);
    },
    Vector2: class {
        x = 0;
        y = 0;
        distanceTo = vi.fn(() => 0);
        set = vi.fn();
    },
    Vector3: class {
        x = 0;
        y = 0;
        z = 0;
        set = vi.fn();
        copy = vi.fn();
        clone = vi.fn(() => new (this.constructor as any)());
        distanceTo = vi.fn(() => 0);
    }
}));

// Provide proper implementation of Minimap mock
vi.mock('../Minimap', () => {
    return {
        Minimap: class MockMinimap {
            update = vi.fn();
            dispose = vi.fn();
            invalidate = vi.fn();
            isVisible = true;
            setVisible = vi.fn(function(this: any, val: boolean) {
                this.isVisible = val;
            });
        }
    };
});

describe('UIManager', () => {
    let uiContainer: HTMLElement;
    let sceneManager: any;
    let uiManager: UIManager;

    beforeEach(() => {
        i18n.setLanguage('en');
        uiContainer = document.createElement('div');
        uiContainer.id = 'ui-container';
        document.body.appendChild(uiContainer);

        sceneManager = {
            renderer: { domElement: document.createElement('canvas') },
            camera: {},
            simDate: new Date(),
            planets: [
                { data: { name: 'Mars', description: 'Red planet' }, moons: [] },
                { data: { name: 'Jupiter', description: 'Gas giant' }, moons: [] }
            ],
            starMeshes: [],
            comets: [],
            spacecrafts: [],
            constellationManager: {
                getConstellationCenter: vi.fn(),
                constellationMeshes: []
            },
            focusOnBody: vi.fn(),
            setSurfaceView: vi.fn(),
            detachCamera: vi.fn(),
            tourMode: false,
            tourTargets: [],
            measureMode: false,
            setMeasureTarget: vi.fn(),
            toggleMeasureMode: vi.fn(function(this: any, val: boolean) {
                this.measureMode = val;
            }),
            clearMeasureTargets: vi.fn(function(this: any) {
                this.measureTargetA = null;
                this.measureTargetB = null;
            }),
            toggleOrbits: vi.fn(),
            toggleMoons: vi.fn(),
            toggleAsteroids: vi.fn(),
            toggleKuiperBelt: vi.fn(),
            toggleDwarfPlanets: vi.fn(),
            toggleComets: vi.fn(),
            toggleSpacecrafts: vi.fn(),
            toggleMeteors: vi.fn(),
            toggleTrails: vi.fn(),
            toggleConstellations: vi.fn()
        };

        // Mock modal to avoid errors
        vi.spyOn(Modal.prototype, 'show').mockImplementation(function(this: any, data: any) {
            this.isOpen = true;
            this.currentData = data;
            if (this.contentElement) {
                this.contentElement.innerHTML = data?.description || '';
            }
        });
        vi.spyOn(Modal.prototype, 'hide').mockImplementation(function(this: any) {
            this.isOpen = false;
        });
        vi.spyOn(Modal.prototype, 'dispose').mockImplementation(vi.fn());

        uiManager = new UIManager(sceneManager);
    });

    afterEach(() => {
        if (uiManager) {
            uiManager.dispose();
        }
        i18n.setLanguage('en');
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should automatically open the modal when a planet is selected from the dropdown', () => {
        sceneManager.measureMode = false;
        const typeSelect = uiContainer.querySelector('#typeSelect') as HTMLSelectElement;
        const bodySelect = uiContainer.querySelector('#bodySelect') as HTMLSelectElement;

        const showModalSpy = vi.spyOn(uiManager, 'showModal');
        const hideInfoSpy = vi.spyOn(uiManager, 'hideInfo');

        // Simulate changing type to Planet
        typeSelect.value = 'Planet';
        typeSelect.dispatchEvent(new Event('change'));

        // Simulate selecting Mars
        bodySelect.value = 'Mars';
        bodySelect.dispatchEvent(new Event('change'));

        // Verify that hideInfo was called first
        expect(hideInfoSpy).toHaveBeenCalled();

        // Verify that showModal was called with Mars data
        expect(showModalSpy).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Mars' })
        );

        // Verify that sceneManager.focusOnBody was called with 'Mars'
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Mars');
    });

    it('should synchronize initial bodySelect dropdown and active chip to Earth on boot when Earth exists', () => {
        uiManager.dispose();
        uiContainer.innerHTML = '';

        sceneManager.planets = [
            { data: { name: 'Mercury', description: 'Innermost planet' }, moons: [] },
            { data: { name: 'Venus', description: 'Second planet' }, moons: [] },
            { data: { name: 'Earth', description: 'Blue marble' }, moons: [] },
            { data: { name: 'Mars', description: 'Red planet' }, moons: [] }
        ];

        uiManager = new UIManager(sceneManager);
        const bodySelect = uiContainer.querySelector('#bodySelect') as HTMLSelectElement;
        expect(bodySelect.value).toBe('Earth');

        const activeChip = uiContainer.querySelector('.target-chip-btn.active .chip-name');
        expect(activeChip?.textContent).toBe('Earth');
    });

    it('should cleanly dispose all event listeners and subcomponents on dispose()', () => {
        const removeWindowListenerSpy = vi.spyOn(window, 'removeEventListener');
        const removeDocListenerSpy = vi.spyOn(document, 'removeEventListener');
        const canvas = sceneManager.renderer.domElement;
        const removeCanvasListenerSpy = vi.spyOn(canvas, 'removeEventListener');

        const minimapDisposeSpy = vi.spyOn(uiManager.minimap, 'dispose');
        const modalDisposeSpy = vi.spyOn(uiManager.modal, 'dispose');
        const eventModalDisposeSpy = vi.spyOn(uiManager.eventModal, 'dispose');

        uiManager.dispose();

        expect(removeWindowListenerSpy).toHaveBeenCalledWith('tour-focus', expect.any(Function));
        expect(removeWindowListenerSpy).toHaveBeenCalledWith('jump-to-date', expect.any(Function));
        expect(removeWindowListenerSpy).toHaveBeenCalledWith('select-celestial-body', expect.any(Function));
        expect(removeWindowListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        expect(removeDocListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        expect(removeCanvasListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        expect(removeCanvasListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

        expect(minimapDisposeSpy).toHaveBeenCalled();
        expect(modalDisposeSpy).toHaveBeenCalled();
        expect(eventModalDisposeSpy).toHaveBeenCalled();
        expect(document.getElementById('gui-custom-tooltip')).toBeNull();
    });

    it('should open language dropdown above modals with proper z-index and active classes', () => {
        const langBtn = uiContainer.querySelector('#hudLanguageBtn') as HTMLButtonElement;
        const langDropdown = uiContainer.querySelector('.lang-dropdown-menu') as HTMLElement;
        const langContainer = uiContainer.querySelector('.lang-switcher-container') as HTMLElement;
        const menuContainer = uiContainer.querySelector('.selection-menu-container') as HTMLElement;

        expect(langBtn).toBeTruthy();
        expect(langDropdown).toBeTruthy();
        expect(langContainer).toBeTruthy();
        expect(menuContainer).toBeTruthy();

        // Baseline menu container z-index must be >= 1600
        expect(parseInt(menuContainer.style.zIndex, 10)).toBeGreaterThanOrEqual(1600);

        // Initially dropdown is hidden
        expect(langDropdown.style.display).toBe('none');
        expect(langBtn.classList.contains('active')).toBe(false);
        expect(langContainer.classList.contains('open')).toBe(false);
        expect(menuContainer.classList.contains('has-lang-open')).toBe(false);

        // Click to open language selection
        langBtn.click();
        expect(langDropdown.style.display).toBe('block');
        expect(langBtn.classList.contains('active')).toBe(true);
        expect(langContainer.classList.contains('open')).toBe(true);
        expect(menuContainer.classList.contains('has-lang-open')).toBe(true);

        // Click again to close
        langBtn.click();
        expect(langDropdown.style.display).toBe('none');
        expect(langBtn.classList.contains('active')).toBe(false);
        expect(langContainer.classList.contains('open')).toBe(false);
        expect(menuContainer.classList.contains('has-lang-open')).toBe(false);
    });

    it('should select language and close dropdown when an item is clicked', () => {
        const langBtn = uiContainer.querySelector('#hudLanguageBtn') as HTMLButtonElement;
        const langDropdown = uiContainer.querySelector('.lang-dropdown-menu') as HTMLElement;
        const langContainer = uiContainer.querySelector('.lang-switcher-container') as HTMLElement;
        const menuContainer = uiContainer.querySelector('.selection-menu-container') as HTMLElement;

        // Verify initial flag image on button
        const initialBtnFlag = langBtn.querySelector<HTMLImageElement>('.lang-btn-flag');
        expect(initialBtnFlag).toBeTruthy();
        expect(initialBtnFlag?.src).toContain('flags/gb.png');

        // Open dropdown
        langBtn.click();
        expect(langDropdown.style.display).toBe('block');

        // Select a language item (e.g. Bosnian 'bs' or German 'de')
        const items = langDropdown.querySelectorAll('.lang-dropdown-item');
        expect(items.length).toBeGreaterThan(0);

        // Every dropdown item should contain a flag image
        items.forEach(item => {
            const flagImg = item.querySelector<HTMLImageElement>('.lang-flag-img');
            expect(flagImg).toBeTruthy();
            expect(flagImg?.src).toContain('flags/');
        });

        // Serbian item should show Cyrillic native name next to the Serbian flag
        const srItem = Array.from(items).find(el => (el as HTMLElement).dataset.lang === 'sr') as HTMLElement;
        expect(srItem).toBeTruthy();
        expect(srItem.querySelector<HTMLImageElement>('.lang-flag-img')?.src).toContain('flags/rs.png');
        expect(srItem.querySelector('.lang-label')?.textContent).toBe('Српски');

        // Click Bosnian item
        const bsItem = Array.from(items).find(el => el.textContent?.includes('Bosanski')) as HTMLElement;
        expect(bsItem).toBeTruthy();
        bsItem.click();

        // Should close dropdown and remove active classes
        expect(langDropdown.style.display).toBe('none');
        expect(langBtn.classList.contains('active')).toBe(false);
        expect(langContainer.classList.contains('open')).toBe(false);
        expect(menuContainer.classList.contains('has-lang-open')).toBe(false);

        // Button flag should update to Bosnian flag (ba.png)
        const updatedBtnFlag = langBtn.querySelector<HTMLImageElement>('.lang-btn-flag');
        expect(updatedBtnFlag?.src).toContain('flags/ba.png');
    });

    it('should close language dropdown when Escape key is pressed', () => {
        const langBtn = uiContainer.querySelector('#hudLanguageBtn') as HTMLButtonElement;
        const langDropdown = uiContainer.querySelector('.lang-dropdown-menu') as HTMLElement;
        const langContainer = uiContainer.querySelector('.lang-switcher-container') as HTMLElement;
        const menuContainer = uiContainer.querySelector('.selection-menu-container') as HTMLElement;

        langBtn.click();
        expect(langDropdown.style.display).toBe('block');
        expect(langContainer.classList.contains('open')).toBe(true);

        // Trigger Escape key
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(langDropdown.style.display).toBe('none');
        expect(langBtn.classList.contains('active')).toBe(false);
        expect(langContainer.classList.contains('open')).toBe(false);
        expect(menuContainer.classList.contains('has-lang-open')).toBe(false);
    });

    it('should dismiss top modal on Escape while keeping Control Center drawer open until second Escape', () => {
        uiManager.controlCenter?.open('optics');
        expect(uiManager.controlCenter?.isOpen).toBe(true);

        // Open dossier/popup modal on top of open Control Center
        uiManager.modal.show({ name: 'True Scale', description: 'True scale warning' });
        expect(uiManager.modal.isOpen).toBe(true);

        // First Escape dismisses the top modal only; Control Center remains open
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(uiManager.modal.isOpen).toBe(false);
        expect(uiManager.controlCenter?.isOpen).toBe(true);

        // Second Escape closes the Control Center
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(uiManager.controlCenter?.isOpen).toBe(false);
    });

    it('should display Real-Time (1:1) simulation speed badge, live indicator, and active preset by default', () => {
        const speedBadge = uiContainer.querySelector('.sim-speed-badge') as HTMLElement;
        const liveIndicator = uiContainer.querySelector('.sim-live-indicator') as HTMLElement;
        expect(speedBadge).toBeDefined();
        expect(speedBadge.textContent).toContain('Real-Time (1:1)');
        expect(liveIndicator.style.display).toBe('inline-flex');

        const realTimePresetBtn = uiManager.controlCenter!.drawerElement.querySelector(
            '.preset-btn[data-preset-key="realTime"]'
        ) as HTMLButtonElement;
        expect(realTimePresetBtn).toBeTruthy();
        expect(realTimePresetBtn.classList.contains('active')).toBe(true);
    });

    it('should pause and resume when speed badge is clicked', () => {
        const speedBadge = uiContainer.querySelector('.sim-speed-badge') as HTMLButtonElement;
        expect(speedBadge).toBeDefined();

        sceneManager.timeScale = 0.00273785;
        sceneManager.onTimeScaleChange = vi.fn();

        // Click to pause
        speedBadge.click();
        expect(sceneManager.timeScale).toBe(0);
        expect(sceneManager.onTimeScaleChange).toHaveBeenCalledWith(0);

        // Click to resume
        speedBadge.click();
        expect(sceneManager.timeScale).toBeCloseTo(0.00273785);
    });

    it('should toggle pause when Space key is pressed', () => {
        sceneManager.timeScale = 0.00273785;
        sceneManager.onTimeScaleChange = vi.fn();

        // Press space to pause
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        expect(sceneManager.timeScale).toBe(0);

        // Press space again to resume
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        expect(sceneManager.timeScale).toBeCloseTo(0.00273785);
    });

    it('should toggle minimap visibility when M key is pressed', () => {
        const radarBtn = uiContainer.querySelector('#hudRadarBtn') as HTMLElement;
        const initialVisible = uiManager.minimap.isVisible;

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM' }));
        expect(uiManager.minimap.isVisible).toBe(!initialVisible);
        if (radarBtn) {
            expect(radarBtn.classList.contains('active')).toBe(!initialVisible);
        }

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'M', code: 'KeyM' }));
        expect(uiManager.minimap.isVisible).toBe(initialVisible);
        if (radarBtn) {
            expect(radarBtn.classList.contains('active')).toBe(initialVisible);
        }
    });

    it('should toggle optics options via keyboard shortcuts (B, L, G, Z, X)', () => {
        sceneManager.toggleBloom = vi.fn();
        sceneManager.toggleRealisticLighting = vi.fn();
        sceneManager.toggleEclipticGrid = vi.fn();
        sceneManager.toggleHabitableZone = vi.fn();
        sceneManager.toggleAxes = vi.fn();
        sceneManager.realisticLighting = false;
        sceneManager.showEclipticGrid = false;
        sceneManager.showHabitableZone = false;
        sceneManager.showAxes = false;

        // B toggles bloom
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', code: 'KeyB' }));
        expect(sceneManager.toggleBloom).toHaveBeenCalledTimes(1);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B', code: 'KeyB' }));
        expect(sceneManager.toggleBloom).toHaveBeenCalledTimes(2);

        // L toggles realistic lighting
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL' }));
        expect(sceneManager.toggleRealisticLighting).toHaveBeenCalledWith(true);

        // G toggles ecliptic grid
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG' }));
        expect(sceneManager.toggleEclipticGrid).toHaveBeenCalledWith(true);

        // Z toggles habitable zone
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
        expect(sceneManager.toggleHabitableZone).toHaveBeenCalledWith(true);

        // X toggles axes
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX' }));
        expect(sceneManager.toggleAxes).toHaveBeenCalledWith(true);
    });

    it('should include optics section in the keyboard shortcuts guide modal', () => {
        const modalShowSpy = vi.spyOn(uiManager.shortcutsModal, 'show');

        uiManager.toggleShortcutsModal();

        expect(modalShowSpy).toHaveBeenCalledTimes(1);
        const modalArg = modalShowSpy.mock.calls[0][0] as any;
        expect(modalArg.description).toContain('<kbd>B</kbd>');
        expect(modalArg.description).toContain('<kbd>L</kbd>');
        expect(modalArg.description).toContain('<kbd>G</kbd>');
        expect(modalArg.description).toContain('<kbd>Z</kbd>');
        expect(modalArg.description).toContain('<kbd>X</kbd>');
        expect(modalArg.description).toContain('<kbd>R</kbd>');
        expect(modalArg.description).toContain('<kbd>A</kbd>');
        expect(modalArg.description).toContain('<kbd>V</kbd>');
        expect(modalArg.description).toContain('<kbd>D</kbd>');
        expect(modalArg.description).toContain('<kbd>T</kbd>');
        expect(modalArg.description).toContain('<kbd>O</kbd>');
        expect(modalArg.description).toContain('<kbd>N</kbd>');
        expect(modalArg.description).toContain('<kbd>E</kbd>');
        expect(modalArg.description).toContain('<kbd>U</kbd>');
        expect(modalArg.description).toContain('<kbd>W</kbd>');
        expect(modalArg.description).toContain('<kbd>Q</kbd>');
        expect(modalArg.description).toContain('<kbd>J</kbd>');
        expect(modalArg.description).toContain('<kbd>Y</kbd>');
        expect(modalArg.description).toContain('<kbd>I</kbd>');
        expect(modalArg.description).toContain('<kbd>C</kbd>');
    });

    it('should toggle celestial layers via keyboard shortcuts (O, N, E, U, W, Q, J, Y, I, C)', () => {
        sceneManager.toggleOrbits = vi.fn();
        sceneManager.toggleMoons = vi.fn();
        sceneManager.toggleAsteroids = vi.fn();
        sceneManager.toggleKuiperBelt = vi.fn();
        sceneManager.toggleDwarfPlanets = vi.fn();
        sceneManager.toggleComets = vi.fn();
        sceneManager.toggleSpacecrafts = vi.fn();
        sceneManager.toggleMeteors = vi.fn();
        sceneManager.toggleTrails = vi.fn();
        sceneManager.toggleConstellations = vi.fn();

        sceneManager.showOrbits = true;
        sceneManager.showMoons = true;
        sceneManager.showAsteroids = true;
        sceneManager.showKuiperBelt = true;
        sceneManager.showDwarfPlanets = true;
        sceneManager.showComets = true;
        sceneManager.showSpacecrafts = true;
        sceneManager.showMeteors = false;
        sceneManager.showTrails = true;
        sceneManager.showConstellations = true;

        // O toggles orbits
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', code: 'KeyO' }));
        expect(sceneManager.toggleOrbits).toHaveBeenCalledWith(false);

        // N toggles moons
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', code: 'KeyN' }));
        expect(sceneManager.toggleMoons).toHaveBeenCalledWith(false);

        // E toggles asteroids
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE' }));
        expect(sceneManager.toggleAsteroids).toHaveBeenCalledWith(false);

        // U toggles Kuiper Belt
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'u', code: 'KeyU' }));
        expect(sceneManager.toggleKuiperBelt).toHaveBeenCalledWith(false);

        // W toggles dwarf planets
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW' }));
        expect(sceneManager.toggleDwarfPlanets).toHaveBeenCalledWith(false);

        // Q toggles comets
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ' }));
        expect(sceneManager.toggleComets).toHaveBeenCalledWith(false);

        // J toggles spacecraft
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ' }));
        expect(sceneManager.toggleSpacecrafts).toHaveBeenCalledWith(false);

        // Y toggles meteors
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', code: 'KeyY' }));
        expect(sceneManager.toggleMeteors).toHaveBeenCalledWith(true);

        // I toggles trails
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', code: 'KeyI' }));
        expect(sceneManager.toggleTrails).toHaveBeenCalledWith(false);

        // C toggles constellations
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC' }));
        expect(sceneManager.toggleConstellations).toHaveBeenCalledWith(false);
    });

    it('should handle camera keyboard shortcuts (A, V, D)', () => {
        uiManager.cameraTarget = 'Mars';

        // A attaches / focuses camera
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Mars');

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', code: 'KeyA' }));
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Mars');

        // V enters surface view
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV' }));
        expect(sceneManager.setSurfaceView).toHaveBeenCalledWith('Mars');

        // D detaches camera (free camera)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD' }));
        expect(sceneManager.detachCamera).toHaveBeenCalled();
    });

    it('should stay in surface view mode when switching from one planet to another', () => {
        sceneManager.measureMode = false;
        sceneManager.surfaceViewBody = { data: { name: 'Earth' }, mesh: {} };
        sceneManager.setSurfaceView = vi.fn().mockReturnValue(true);

        const bodySelect = uiContainer.querySelector('#bodySelect') as HTMLSelectElement;
        bodySelect.value = 'Mars';
        bodySelect.dispatchEvent(new Event('change'));

        expect(sceneManager.setSurfaceView).toHaveBeenCalledWith('Mars');
        expect(sceneManager.focusOnBody).not.toHaveBeenCalled();
    });

    it('should fall back to focusOnBody when switching to a target that does not support surface view', () => {
        sceneManager.measureMode = false;
        sceneManager.surfaceViewBody = { data: { name: 'Earth' }, mesh: {} };
        sceneManager.setSurfaceView = vi.fn().mockImplementation(() => {
            sceneManager.surfaceViewBody = null;
            return false;
        });

        const bodySelect = uiContainer.querySelector('#bodySelect') as HTMLSelectElement;
        bodySelect.value = 'Jupiter';
        bodySelect.dispatchEvent(new Event('change'));

        expect(sceneManager.setSurfaceView).toHaveBeenCalledWith('Jupiter');
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Jupiter');
    });

    it('should retain surface view when select-celestial-body event is dispatched', () => {
        sceneManager.measureMode = false;
        sceneManager.surfaceViewBody = { data: { name: 'Earth' }, mesh: {} };
        sceneManager.setSurfaceView = vi.fn().mockReturnValue(true);

        window.dispatchEvent(new CustomEvent('select-celestial-body', { detail: { name: 'Mars' } }));

        expect(sceneManager.setSurfaceView).toHaveBeenCalledWith('Mars');
        expect(sceneManager.focusOnBody).not.toHaveBeenCalled();
    });

    it('should not mark Real-Time preset as paused', () => {
        const speedBadge = uiContainer.querySelector('.sim-speed-badge') as HTMLElement;
        sceneManager.timeScale = 3.9817e-7;
        sceneManager.getFormattedTimeSpeed = vi.fn().mockReturnValue('Real-Time (1:1)');

        uiManager.update();

        expect(speedBadge.textContent).toBe('▶ Real-Time (1:1)');
        expect(speedBadge.classList.contains('paused')).toBe(false);
    });

    it('should update live UTC clock badge and display real-time live indicator and telemetry ticker', () => {
        const timeBadge = uiContainer.querySelector('.sim-time-badge') as HTMLElement;
        const liveIndicator = uiContainer.querySelector('.sim-live-indicator') as HTMLElement;
        const telemetryTicker = uiContainer.querySelector('.sim-telemetry-ticker') as HTMLElement;

        expect(timeBadge).not.toBeNull();
        expect(liveIndicator).not.toBeNull();
        expect(telemetryTicker).not.toBeNull();

        // Set sim date to fixed UTC time: 14:30:45
        sceneManager.simDate = new Date(Date.UTC(2026, 8, 6, 14, 30, 45));
        sceneManager.timeScale = 3.9817e-7; // Real-Time (1:1)

        uiManager.update();

        expect(timeBadge.textContent).toContain('14:30:45');
        expect(timeBadge.textContent).toContain('UTC');
        expect(liveIndicator.style.display).toBe('inline-flex');
        expect(telemetryTicker.style.display).toBe('flex');
        expect(telemetryTicker.textContent).toContain('Earth');
        expect(telemetryTicker.textContent).toContain('29.8 km/s');

        // When paused, live indicator and telemetry ticker should hide
        sceneManager.timeScale = 0;
        uiManager.update();

        expect(liveIndicator.style.display).toBe('none');
        expect(telemetryTicker.style.display).toBe('none');
    });

    it('should dynamically update header controls button label and target pill when language changes', () => {
        i18n.setLanguage('en');
        const controlsBtn = uiContainer.querySelector('#hudControlsBtn') as HTMLButtonElement;
        const targetPill = uiContainer.querySelector('#obsTargetPill') as HTMLButtonElement;
        expect(controlsBtn).not.toBeNull();
        expect(targetPill).not.toBeNull();

        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('Controls');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Earth');

        // Switch to Bosnian
        i18n.setLanguage('bs');
        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('Kontrole');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Zemlja');

        // Switch to German
        i18n.setLanguage('de');
        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('Steuerung');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Erde');

        // Switch to Serbian
        i18n.setLanguage('sr');
        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('Контроле');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Земља');
    });

    it('should have customize header slots button (+) with monochrome SVG icon in the observatory header bar', () => {
        const slotAddBtn = uiContainer.querySelector('#hudSlotAddBtn') as HTMLButtonElement;
        expect(slotAddBtn).not.toBeNull();
        expect(slotAddBtn.querySelector('svg[data-icon="plus"]')).not.toBeNull();

        const slotsContainer = uiContainer.querySelector('.obs-header-slots') as HTMLElement;
        expect(slotsContainer).not.toBeNull();
        expect(slotsContainer.children.length).toBeGreaterThan(0);
    });

    it('should open header slots customizer modal when (+) button is clicked', () => {
        const slotAddBtn = uiContainer.querySelector('#hudSlotAddBtn') as HTMLButtonElement;
        const modalShowSpy = vi.spyOn(uiManager.headerSlotsModal, 'show');

        slotAddBtn.click();
        expect(modalShowSpy).toHaveBeenCalledTimes(1);
        const modalArg = modalShowSpy.mock.calls[0][0] as any;
        expect(modalArg.name).toContain('Header Quick Access');
        expect(modalArg.hideAudioGuide).toBe(true);
        expect(modalArg.description).toContain('header-slots-customizer-modal');
        expect(modalArg.description).toContain('slotsResetBtn');
        expect(modalArg.description).toContain('slotsDoneBtn');
        expect(uiManager.headerSlotsModal.modalElement.querySelector('.modal-audio-guide-btn')).toBeNull();
        modalShowSpy.mockRestore();
    });

    it('should allow toggling slots in customizer and update header buttons immediately', () => {
        uiManager.openHeaderSlotsCustomizer();
        const content = uiManager.headerSlotsModal.contentElement;
        expect(content).not.toBeNull();

        // Find checkbox for showOrbits (which is off by default)
        const orbitsCheckbox = content.querySelector('.slot-toggle-input[data-slot-id="showOrbits"]') as HTMLInputElement;
        expect(orbitsCheckbox).not.toBeNull();
        expect(orbitsCheckbox.checked).toBe(false);

        // Toggle on
        orbitsCheckbox.checked = true;
        if (orbitsCheckbox.onchange) {
            orbitsCheckbox.onchange(new Event('change'));
        }

        const slotsContainer = uiContainer.querySelector('.obs-header-slots') as HTMLElement;
        const orbitsBtn = slotsContainer.querySelector('#hudSlot_showOrbits');
        expect(orbitsBtn).not.toBeNull();

        // Toggle off
        orbitsCheckbox.checked = false;
        if (orbitsCheckbox.onchange) {
            orbitsCheckbox.onchange(new Event('change'));
        }
        const orbitsBtnAfter = slotsContainer.querySelector('#hudSlot_showOrbits');
        expect(orbitsBtnAfter).toBeNull();
    });

    it('should render camera related settings in their own section in the slots customizer', () => {
        uiManager.openHeaderSlotsCustomizer();
        const content = uiManager.headerSlotsModal.contentElement;
        expect(content).not.toBeNull();

        const cameraSection = content.querySelector('.slots-category-section[data-cat-id="camera"]');
        expect(cameraSection).not.toBeNull();

        const cameraTitle = cameraSection?.querySelector('.slots-category-title');
        expect(cameraTitle?.textContent).toContain('Camera Controls');

        const freeCamCard = cameraSection?.querySelector('.slot-config-card[data-slot-id="freeCamera"]');
        expect(freeCamCard).not.toBeNull();

        const tourCard = cameraSection?.querySelector('.slot-config-card[data-slot-id="cinematicTour"]');
        expect(tourCard).not.toBeNull();
    });

    it('should mark cinematicTour as locked and non-removable in the slots customizer', () => {
        uiManager.openHeaderSlotsCustomizer();
        const content = uiManager.headerSlotsModal.contentElement;
        expect(content).not.toBeNull();

        const tourCard = content?.querySelector('.slot-config-card[data-slot-id="cinematicTour"]');
        expect(tourCard).not.toBeNull();
        expect(tourCard?.classList.contains('is-locked')).toBe(true);
        expect(tourCard?.querySelector('.slot-locked-badge')).not.toBeNull();

        const checkbox = tourCard?.querySelector('.slot-toggle-input') as HTMLInputElement;
        expect(checkbox).not.toBeNull();
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(true);

        // Clicking the card does not disable or remove it
        (tourCard as HTMLElement).click();
        expect(checkbox.checked).toBe(true);
        const slotsContainer = uiContainer.querySelector('.obs-header-slots') as HTMLElement;
        expect(slotsContainer.querySelector('#hudSlot_cinematicTour')).not.toBeNull();
    });

    it('should enforce the 8-slot limit in the slots customizer modal and disable remaining inactive slots', () => {
        uiManager.openHeaderSlotsCustomizer();
        const content = uiManager.headerSlotsModal.contentElement!;
        expect(content).not.toBeNull();

        const counterBadge = content.querySelector('#slotsCounterBadge') as HTMLElement;
        const limitBanner = content.querySelector('#slotsLimitBanner') as HTMLElement;
        const orbitsCheckbox = content.querySelector('.slot-toggle-input[data-slot-id="showOrbits"]') as HTMLInputElement;
        const axesCard = content.querySelector('.slot-config-card[data-slot-id="showAxes"]') as HTMLElement;
        const axesCheckbox = content.querySelector('.slot-toggle-input[data-slot-id="showAxes"]') as HTMLInputElement;
        const minimapCheckbox = content.querySelector('.slot-toggle-input[data-slot-id="minimap"]') as HTMLInputElement;

        // Initially 7 / 8 active slots
        expect(counterBadge.textContent).toContain('7 / 8');
        expect(counterBadge.classList.contains('is-at-limit')).toBe(false);
        expect(limitBanner.style.display).toBe('none');
        expect(orbitsCheckbox.disabled).toBe(false);
        expect(axesCheckbox.disabled).toBe(false);

        // Toggle 8th slot ON -> reaches 8 / 8 limit
        orbitsCheckbox.checked = true;
        orbitsCheckbox.onchange?.(new Event('change'));

        expect(counterBadge.textContent).toContain('8 / 8');
        expect(counterBadge.classList.contains('is-at-limit')).toBe(true);
        expect(limitBanner.style.display).toBe('flex');
        expect(axesCheckbox.disabled).toBe(true);
        expect(axesCard.classList.contains('is-limit-disabled')).toBe(true);
        expect(minimapCheckbox.disabled).toBe(false); // Active removable slots remain enabled

        // Clicking a limit-disabled card does not activate it or exceed 8 buttons
        axesCard.click();
        expect(axesCheckbox.checked).toBe(false);
        const slotsContainer = uiContainer.querySelector('.obs-header-slots') as HTMLElement;
        expect(slotsContainer.children.length).toBe(8);

        // Removing an active slot drops to 7 / 8 and re-enables inactive options
        minimapCheckbox.checked = false;
        minimapCheckbox.onchange?.(new Event('change'));

        expect(counterBadge.textContent).toContain('7 / 8');
        expect(counterBadge.classList.contains('is-at-limit')).toBe(false);
        expect(limitBanner.style.display).toBe('none');
        expect(axesCheckbox.disabled).toBe(false);
        expect(axesCard.classList.contains('is-limit-disabled')).toBe(false);
    });

    it('should dynamically update measurement HUD bar when objects move/rotate in animation loop', () => {
        sceneManager.measureMode = true;
        const meshA = { getWorldPosition: vi.fn((v: any) => v.set(0, 0, 0)) };
        const meshB = { getWorldPosition: vi.fn((v: any) => v.set(130, 0, 0)) };
        sceneManager.measureTargetA = { data: { name: 'Earth' }, mesh: meshA };
        sceneManager.measureTargetB = { data: { name: 'Mars' }, mesh: meshB };

        // Initial measurement
        sceneManager.currentMeasureDistance = {
            distanceScale: 130,
            distanceAUVal: 1.0,
            distanceMkmVal: 149.6,
            distanceAU: '1.00',
            distanceMkm: '149.6',
            unitAU: 'AU',
            unitMkm: 'Mkm'
        };

        uiManager.updateMeasureHud();

        const hud = document.getElementById('measureHudBar');
        expect(hud).not.toBeNull();
        expect(hud?.style.display).toBe('flex');
        const valEl = hud?.querySelector('.measure-val');
        const mkmEl = hud?.querySelector('.measure-mkm');
        expect(valEl?.textContent).toBe('1.00 AU');
        expect(mkmEl?.textContent).toBe('(149.6 Mkm)');

        // Simulate celestial objects moving/rotating over time
        sceneManager.currentMeasureDistance = {
            distanceScale: 195,
            distanceAUVal: 1.5,
            distanceMkmVal: 224.4,
            distanceAU: '1.50',
            distanceMkm: '224.4',
            unitAU: 'AU',
            unitMkm: 'Mkm'
        };

        // Call update() on UIManager as done in animate() loop
        uiManager.update();

        expect(valEl?.textContent).toBe('1.50 AU');
        expect(mkmEl?.textContent).toBe('(224.4 Mkm)');
    });

    it('should hide Measure Mode HUD bar by default when measureMode is deactivated by default', () => {
        const hud = document.getElementById('measureHudBar');
        expect(hud).not.toBeNull();
        expect(hud?.style.display).toBe('none');
    });

    it('should display Measure Mode HUD bar when measureMode is active and hide it on close button click', () => {
        const hud = document.getElementById('measureHudBar');
        const clearBtn = hud?.querySelector('.measure-action-btn.clear-btn') as HTMLButtonElement;
        const closeBtn = hud?.querySelector('.measure-action-btn.close-btn') as HTMLButtonElement;
        const textEl = hud?.querySelector('.measure-hud-text');

        sceneManager.measureMode = true;
        uiManager.updateMeasureHud();

        expect(hud?.style.display).toBe('flex');
        expect(closeBtn.style.display).toBe('inline-flex');
        expect(clearBtn.style.display).toBe('none');
        expect(textEl?.textContent).toContain('Click a celestial body to begin measuring');

        // Clicking close button exits active measure mode and hides the HUD bar cleanly
        closeBtn.click();
        expect(sceneManager.measureMode).toBe(false);
        expect(hud?.style.display).toBe('none');
    });

    it('should localize header mission clock live badge, telemetry ticker, and milestone event modal on language change', async () => {
        await Promise.all(['en', 'bs', 'de', 'id', 'pl', 'sr'].map(code => i18n.preloadLocale(code)));

        const liveText = uiContainer.querySelector('.sim-live-indicator .live-text') as HTMLElement;
        const tickerBody = uiContainer.querySelector('.sim-telemetry-ticker .ticker-body') as HTMLElement;
        const tickerDist = uiContainer.querySelector('.sim-telemetry-ticker .ticker-dist') as HTMLElement;

        sceneManager.simDate = new Date(Date.UTC(2026, 8, 6, 14, 30, 45));
        sceneManager.timeScale = 3.9817e-7; // Real-Time (1:1)
        sceneManager.focusedBody = { data: { name: 'Sun' } };
        uiManager.update();

        expect(liveText.textContent).toBe('Live 1:1');
        expect(tickerBody.textContent).toBe('Sun (Milky Way)');
        expect(tickerDist.textContent).toContain('Orbit: +');

        // Switch to Bosnian while real-time ticker is visible
        i18n.setLanguage('bs');
        expect(liveText.textContent).toBe('Uživo 1:1');
        expect(tickerBody.textContent).toBe('Sunce (Mliječni put)');
        expect(tickerDist.textContent).toContain('Orbita: +');

        // Switch to Serbian
        i18n.setLanguage('sr');
        expect(liveText.textContent).toBe('Уживо 1:1');
        expect(tickerBody.textContent).toBe('Сунце (Млечни пут)');
        expect(tickerDist.textContent).toContain('Орбита: +');

        // Dispatch milestone selection with eventId and verify eventModal updates on language switch
        window.dispatchEvent(new CustomEvent('select-celestial-body', {
            detail: {
                name: 'Mars',
                eventId: 'apollo11',
                eventName: 'Аполо 11 слетање на Месец',
                eventImpact: 'Први људи на Месецу — историјска прекретница у истраживању свемира.'
            }
        }));
        expect(uiManager.eventModal.isOpen).toBe(true);
        expect(uiManager.eventModal.currentData?.name).toContain('Аполо 11');

        i18n.setLanguage('de');
        expect(uiManager.eventModal.currentData?.name).toBe('Apollo-11-Mondlandung');
        expect(uiManager.eventModal.contentElement.textContent).toContain('Die ersten Menschen auf dem Mond');

        i18n.setLanguage('en');
    });

    it('should expose Distance Measuring Tool in header quick access and Control Center (deactivated by default), keep them synced, and route body selection while active', () => {
        const headerMeasureBtn = uiContainer.querySelector('#hudSlot_measureMode') as HTMLButtonElement;
        expect(headerMeasureBtn).toBeTruthy();
        expect(headerMeasureBtn.classList.contains('active')).toBe(false);

        const systemCheckboxes = uiManager.controlCenter!.drawerElement.querySelectorAll<HTMLInputElement>(
            '.drawer-panel[data-panel="system"] input[type="checkbox"]'
        );
        const ccMeasureInput = systemCheckboxes[2];
        expect(ccMeasureInput).toBeTruthy();
        expect(ccMeasureInput.checked).toBe(false);

        // Toggle ON via header quick-access button
        headerMeasureBtn.click();
        expect(sceneManager.toggleMeasureMode).toHaveBeenCalledWith(true);
        expect(sceneManager.measureMode).toBe(true);
        expect(headerMeasureBtn.classList.contains('active')).toBe(true);
        expect(ccMeasureInput.checked).toBe(true);

        // Selecting a body via select-celestial-body (Quick Focus chip / number shortcut) routes to setMeasureTarget
        sceneManager.setMeasureTarget = vi.fn();
        window.dispatchEvent(new CustomEvent('select-celestial-body', { detail: { name: 'Mars' } }));
        expect(sceneManager.setMeasureTarget).toHaveBeenCalledWith('Mars');

        // Closing via Measure HUD close button syncs both header button and Control Center switch to off
        uiManager.updateMeasureHud();
        const hudCloseBtn = document.querySelector('#measureHudBar .measure-action-btn.close-btn') as HTMLButtonElement;
        hudCloseBtn.click();
        expect(sceneManager.measureMode).toBe(false);
        expect(headerMeasureBtn.classList.contains('active')).toBe(false);
        expect(ccMeasureInput.checked).toBe(false);
    });

    it('should provide Type and Body dropdowns exclusively in the header without duplicating them in settings', () => {
        const headerTypeSelect = uiContainer.querySelector('#obsTargetPill #typeSelect') as HTMLSelectElement;
        const headerBodySelect = uiContainer.querySelector('#obsTargetPill #bodySelect') as HTMLSelectElement;
        const drawerSelects = uiManager.controlCenter!.drawerElement.querySelectorAll('select');

        expect(headerTypeSelect).not.toBeNull();
        expect(headerBodySelect).not.toBeNull();
        expect(drawerSelects.length).toBe(0);

        // Disable measureMode so selection calls focusOnBody directly
        sceneManager.measureMode = false;
        sceneManager.planets.unshift({ data: { name: 'Sun', description: 'Star' }, moons: [] });
        sceneManager.planets[1].moons = [{ data: { name: 'Phobos', description: 'Moon of Mars' } }];

        // Change category in header -> updates body options and focuses first body
        headerTypeSelect.value = 'Star';
        headerTypeSelect.dispatchEvent(new Event('change'));
        expect(headerBodySelect.value).toBe('Sun');
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Sun');

        // Change category back to Planet and select Jupiter
        headerTypeSelect.value = 'Planet';
        headerTypeSelect.dispatchEvent(new Event('change'));
        headerBodySelect.value = 'Jupiter';
        headerBodySelect.dispatchEvent(new Event('change'));
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Jupiter');

        // External selection via syncDropdownSelection updates header category & body
        uiManager.syncDropdownSelection('Phobos');
        expect(headerTypeSelect.value).toBe('Moon');
        expect(headerBodySelect.value).toBe('Phobos');
    });

    it('should render record-player transport buttons in the header to speed up and slow down the simulation', async () => {
        await Promise.all(['en', 'bs', 'de'].map(code => i18n.preloadLocale(code)));

        const transportDeck = uiContainer.querySelector('.sim-transport-deck') as HTMLElement;
        const slowDownBtn = uiContainer.querySelector('#simSlowDownBtn') as HTMLButtonElement;
        const speedUpBtn = uiContainer.querySelector('#simSpeedUpBtn') as HTMLButtonElement;
        const speedBadge = uiContainer.querySelector('.sim-speed-badge') as HTMLButtonElement;

        expect(transportDeck).not.toBeNull();
        expect(slowDownBtn).not.toBeNull();
        expect(speedUpBtn).not.toBeNull();
        expect(slowDownBtn.querySelector('svg[data-icon="rewind"]')).not.toBeNull();
        expect(speedUpBtn.querySelector('svg[data-icon="fast-forward"]')).not.toBeNull();

        // Starts at Real-Time (1:1) — both buttons enabled
        expect(speedBadge.textContent).toBe('▶ Real-Time (1:1)');
        expect(slowDownBtn.disabled).toBe(false);
        expect(speedUpBtn.disabled).toBe(false);

        // Step up through presets: Real-Time -> 1 hr/s -> 1 day/s -> 1 wk/s -> 1 mo/s
        speedUpBtn.click();
        expect(speedBadge.textContent).toBe('▶ 1.0 hr/s');

        speedUpBtn.click();
        expect(speedBadge.textContent).toBe('▶ 1.0 day/s');

        speedUpBtn.click();
        expect(speedBadge.textContent).toBe('▶ 1.0 wk/s');

        speedUpBtn.click();
        expect(speedBadge.textContent).toBe('▶ 1.0 mo/s');
        expect(speedUpBtn.disabled).toBe(true);
        expect(speedUpBtn.classList.contains('is-limit')).toBe(true);

        // Step down via slowDownBtn and keyboard shortcut '['
        slowDownBtn.click();
        expect(speedBadge.textContent).toBe('▶ 1.0 wk/s');
        expect(speedUpBtn.disabled).toBe(false);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: '[' }));
        expect(speedBadge.textContent).toBe('▶ 1.0 day/s');

        slowDownBtn.click();
        expect(speedBadge.textContent).toBe('▶ 1.0 hr/s');

        slowDownBtn.click();
        expect(speedBadge.textContent).toBe('▶ Real-Time (1:1)');

        // Stepping down from Real-Time pauses the simulation and disables slowDownBtn
        slowDownBtn.click();
        expect(sceneManager.timeScale).toBe(0);
        expect(speedBadge.textContent).toBe('⏸ Paused');
        expect(slowDownBtn.disabled).toBe(true);
        expect(slowDownBtn.classList.contains('is-limit')).toBe(true);

        // Stepping up from Paused resumes at Real-Time (1:1)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' }));
        expect(speedBadge.textContent).toBe('▶ Real-Time (1:1)');
        expect(slowDownBtn.disabled).toBe(false);

        // Localizes transport button tooltips on language switch
        i18n.setLanguage('de');
        expect(slowDownBtn.title).toContain('Simulation verlangsamen');
        expect(speedUpBtn.title).toContain('Simulation beschleunigen');
        i18n.setLanguage('en');
    });

    it('keeps Header Quick Access fully responsive after opening Settings and performing actions there', () => {
        // Restore real Modal prototype methods so lazy DOM insertion, event wiring, and close callbacks run end-to-end
        vi.restoreAllMocks();
        uiManager.dispose();
        uiContainer.innerHTML = '';
        localStorage.clear();
        HeaderSlotsManager.resetDefaults();

        sceneManager.realisticDistances = false;
        sceneManager.toggleRealisticDistances = vi.fn(function(this: any, val: boolean) {
            this.realisticDistances = val;
        });

        uiManager = new UIManager(sceneManager);

        const slotAddBtn = uiContainer.querySelector('#hudSlotAddBtn') as HTMLButtonElement;
        const controlsBtn = uiContainer.querySelector('#hudControlsBtn') as HTMLButtonElement;
        expect(slotAddBtn).toBeTruthy();
        expect(controlsBtn).toBeTruthy();
        expect(slotAddBtn.getAttribute('aria-expanded')).toBe('false');

        // 1. Open Header Quick Access first (instantiates headerSlotsModal before primary dossier modal)
        slotAddBtn.click();
        expect(uiManager.headerSlotsModal.isOpen).toBe(true);
        expect(uiManager.headerSlotsModal.modalElement.classList.contains('obs-dialog-modal')).toBe(true);
        expect(slotAddBtn.classList.contains('active')).toBe(true);
        expect(slotAddBtn.getAttribute('aria-expanded')).toBe('true');

        // 2. Open Settings (Control Center) while Header Quick Access is open -> Header Quick Access closes cleanly
        controlsBtn.click();
        expect(uiManager.controlCenter?.isOpen).toBe(true);
        expect(uiManager.headerSlotsModal.isOpen).toBe(false);
        expect(slotAddBtn.classList.contains('active')).toBe(false);
        expect(slotAddBtn.getAttribute('aria-expanded')).toBe('false');

        // 3. Perform actions in Settings:
        // 3a. Click a target chip ("Mars"), which lazily creates uiManager.modal AFTER headerSlotsModal in #ui-container
        const marsChip = Array.from(
            uiManager.controlCenter!.drawerElement.querySelectorAll<HTMLButtonElement>('.target-chip-btn')
        ).find(btn => btn.textContent?.includes('Mars'))!;
        expect(marsChip).toBeTruthy();
        marsChip.click();
        expect(uiManager.modal.isOpen).toBe(true);

        // Confirm uiManager.modal was appended after headerSlotsModal in #ui-container,
        // while headerSlotsModal carries .obs-dialog-modal to stack above uiManager.modal
        const children = Array.from(uiContainer.children);
        expect(children.indexOf(uiManager.modal.modalElement)).toBeGreaterThan(
            children.indexOf(uiManager.headerSlotsModal.modalElement)
        );
        expect(uiManager.modal.modalElement.classList.contains('obs-dialog-modal')).toBe(false);
        expect(uiManager.headerSlotsModal.modalElement.classList.contains('obs-dialog-modal')).toBe(true);

        // 3b. Toggle Realistic Scale in Settings -> updates uiManager.modal popup
        const opticsSwitch = uiManager.controlCenter!.drawerElement.querySelector<HTMLInputElement>(
            '.drawer-panel[data-panel="optics"] input[type="checkbox"]'
        )!;
        opticsSwitch.checked = true;
        opticsSwitch.dispatchEvent(new Event('change'));
        expect(sceneManager.toggleRealisticDistances).toHaveBeenCalledWith(true);
        expect(uiManager.modal.isOpen).toBe(true);

        // 3c. Toggle Tactical Radar Minimap in Settings -> header quick-access slot updates immediately
        const systemSwitches = uiManager.controlCenter!.drawerElement.querySelectorAll<HTMLInputElement>(
            '.drawer-panel[data-panel="system"] input[type="checkbox"]'
        );
        const radarSwitch = systemSwitches[0];
        radarSwitch.checked = false;
        radarSwitch.dispatchEvent(new Event('change'));
        const headerRadarBtn = uiContainer.querySelector('#hudRadarBtn') as HTMLButtonElement;
        expect(headerRadarBtn.classList.contains('active')).toBe(false);

        // 4. Header quick-access bar buttons remain immediately interactive
        headerRadarBtn.click();
        expect(uiManager.minimap.isVisible).toBe(true);
        expect(headerRadarBtn.classList.contains('active')).toBe(true);

        // 5. Re-open Header Quick Access via '+' while Settings & dossier modal are open:
        // Settings closes automatically and all Header Quick Access controls react properly
        slotAddBtn.click();
        expect(uiManager.controlCenter?.isOpen).toBe(false);
        expect(uiManager.headerSlotsModal.isOpen).toBe(true);
        expect(slotAddBtn.classList.contains('active')).toBe(true);

        // Card click adds a new quick-access slot (8th slot: showOrbits)
        const orbitsCard = uiManager.headerSlotsModal.contentElement.querySelector<HTMLElement>(
            '.slot-config-card[data-slot-id="showOrbits"]'
        )!;
        expect(orbitsCard).toBeTruthy();
        orbitsCard.click();
        expect(HeaderSlotsManager.isSlotActive('showOrbits')).toBe(true);
        expect(uiContainer.querySelector('#hudSlot_showOrbits')).not.toBeNull();

        // Newly added quick-access slot in header reacts immediately
        const orbitsSlotBtn = uiContainer.querySelector('#hudSlot_showOrbits') as HTMLButtonElement;
        orbitsSlotBtn.click();
        expect(sceneManager.toggleOrbits).toHaveBeenCalled();

        // Reset button inside Header Quick Access reacts and restores defaults
        const resetBtn = uiManager.headerSlotsModal.contentElement.querySelector<HTMLButtonElement>('#slotsResetBtn')!;
        resetBtn.click();
        expect(HeaderSlotsManager.isSlotActive('showOrbits')).toBe(false);
        expect(uiContainer.querySelector('#hudSlot_showOrbits')).toBeNull();

        // Escape dismisses Header Quick Access first while leaving dossier modal intact until next Escape
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(uiManager.headerSlotsModal.isOpen).toBe(false);
        expect(slotAddBtn.classList.contains('active')).toBe(false);
        expect(uiManager.modal.isOpen).toBe(true);

        // Clicking '+' toggles Header Quick Access open and clicking '+' again toggles it closed
        slotAddBtn.click();
        expect(uiManager.headerSlotsModal.isOpen).toBe(true);
        slotAddBtn.click();
        expect(uiManager.headerSlotsModal.isOpen).toBe(false);
        expect(slotAddBtn.classList.contains('active')).toBe(false);
    });

    it('preserves Header Quick Access interactive listeners when switching language while open', async () => {
        vi.restoreAllMocks();
        uiManager.dispose();
        uiContainer.innerHTML = '';
        localStorage.clear();
        HeaderSlotsManager.resetDefaults();

        await Promise.all(['en', 'de', 'bs'].map(code => i18n.preloadLocale(code)));
        uiManager = new UIManager(sceneManager);

        const slotAddBtn = uiContainer.querySelector('#hudSlotAddBtn') as HTMLButtonElement;
        slotAddBtn.click();
        expect(uiManager.headerSlotsModal.isOpen).toBe(true);

        // Switch languages while Header Quick Access is open (previously Modal.onLanguageChange wiped event handlers)
        i18n.setLanguage('de');
        i18n.setLanguage('bs');
        i18n.setLanguage('en');

        expect(uiManager.headerSlotsModal.isOpen).toBe(true);

        const bloomCard = uiManager.headerSlotsModal.contentElement.querySelector<HTMLElement>(
            '.slot-config-card[data-slot-id="enableBloom"]'
        )!;
        expect(bloomCard).toBeTruthy();
        bloomCard.click();
        expect(HeaderSlotsManager.isSlotActive('enableBloom')).toBe(true);
        expect(uiContainer.querySelector('#hudSlot_enableBloom')).not.toBeNull();

        const doneBtn = uiManager.headerSlotsModal.contentElement.querySelector<HTMLButtonElement>('#slotsDoneBtn')!;
        doneBtn.click();
        expect(uiManager.headerSlotsModal.isOpen).toBe(false);
        expect(slotAddBtn.classList.contains('active')).toBe(false);

        HeaderSlotsManager.resetDefaults();
    });

    it('enforces z-index hierarchy ($z-dialog > $z-modal > $z-drawer) and zero-specificity pointer-events in SCSS', () => {
        const stylesDir = resolve(process.cwd(), 'src/styles');
        const tokensScss = readFileSync(resolve(stylesDir, '_tokens.scss'), 'utf8');
        const modalScss = readFileSync(resolve(stylesDir, '_modal.scss'), 'utf8');
        const responsiveScss = readFileSync(resolve(stylesDir, '_responsive.scss'), 'utf8');
        const baseScss = readFileSync(resolve(stylesDir, '_base.scss'), 'utf8');

        const getToken = (name: string) => {
            const match = tokensScss.match(new RegExp(`\\$${name}:\\s*(\\d+)`));
            return match ? parseInt(match[1], 10) : NaN;
        };

        const zDrawer = getToken('z-drawer');
        const zHeader = getToken('z-header');
        const zModal = getToken('z-modal');
        const zDialog = getToken('z-dialog');
        const zDropdown = getToken('z-dropdown');

        expect(zDrawer).toBeLessThan(zHeader);
        expect(zHeader).toBeLessThan(zModal);
        expect(zModal).toBeLessThan(zDialog);
        expect(zDialog).toBeLessThan(zDropdown);

        expect(modalScss).toContain('&.obs-dialog-modal');
        expect(modalScss).toContain('z-index: $z-dialog');
        expect(responsiveScss.match(/z-index:\s*\$z-dialog\s*!important/g)?.length).toBeGreaterThanOrEqual(2);
        expect(baseScss).toContain(':where(#ui-container)');
    });

    it('displays Solar System as the application name across header brand, index.html, and manifest', () => {
        const brand = uiContainer.querySelector('.obs-brand') as HTMLElement;
        expect(brand).not.toBeNull();
        expect(brand.textContent).toContain('Solar System');
        expect(brand.textContent).not.toContain('Solar System 3D');
        expect(brand.title).toBe('Solar System — Deep Space Astronomical Observatory');

        const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
        expect(indexHtml).toContain('<title>Solar System</title>');
        expect(indexHtml).toContain('<h1 class="loading-title">Solar System</h1>');
        expect(indexHtml).not.toContain('Solar System 3D');

        const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8'));
        expect(manifest.name).toBe('Solar System — Deep Space Observatory');
        expect(manifest.short_name).toBe('Solar System');
    });

    it('synchronizes transport speed memory, radar minimap, UTC clock, and fallback target selection on simulation date change', () => {
        const oneWeekSpeed = 0.24;
        sceneManager.timeScale = oneWeekSpeed;
        const invalidateSpy = vi.spyOn(uiManager.minimap, 'invalidate');

        const jwstMock = { data: { name: 'James Webb Space Telescope' } };
        const earthMock = sceneManager.planets.find((p: any) => p.data.name === 'Earth') || { data: { name: 'Earth' } };
        sceneManager.focusedBody = jwstMock;
        uiManager.cameraTarget = 'James Webb Space Telescope';
        sceneManager.setSimDate = vi.fn((d: Date) => {
            sceneManager.simDate = new Date(d.getTime());
            // Simulate pre-launch fallback from JWST -> Earth in 1969
            if (d.getUTCFullYear() < 2021) {
                sceneManager.focusedBody = earthMock;
            }
        });

        window.dispatchEvent(new CustomEvent('jump-to-date', { detail: '1969-07-20T20:17:40Z' }));

        expect(sceneManager.setSimDate).toHaveBeenCalledTimes(1);
        expect(sceneManager.timeScale).toBe(0);
        expect(invalidateSpy).toHaveBeenCalled();
        expect(uiManager.cameraTarget).toBe('Earth');

        // Resuming from pause restores the user's prior speed (1 wk/s) rather than losing it
        uiManager.togglePause();
        expect(sceneManager.timeScale).toBeCloseTo(oneWeekSpeed, 8);
    });

    it('syncs date picker, minimap, and layer switches when selecting a pre-launch spacecraft advances simDate', () => {
        sceneManager.simDate = new Date('1969-07-20T20:17:40Z');
        sceneManager.showSpacecrafts = false;
        const setDateSpy = vi.spyOn(uiManager.customDatePicker!, 'setDate');
        const invalidateSpy = vi.spyOn(uiManager.minimap, 'invalidate');

        sceneManager.focusOnBody = vi.fn((name: string) => {
            if (name === 'James Webb Space Telescope') {
                sceneManager.showSpacecrafts = true;
                sceneManager.simDate = new Date('2021-12-26T12:20:00Z');
            }
        });

        uiManager.focusOrSurfaceTarget('James Webb Space Telescope');

        expect(setDateSpy).toHaveBeenCalledWith(sceneManager.simDate);
        expect(invalidateSpy).toHaveBeenCalled();
        const scSwitch = uiManager.controlCenter!.drawerElement.querySelector<HTMLInputElement>(
            '.drawer-panel[data-panel="layers"] input[type="checkbox"]'
        );
        expect(scSwitch).toBeTruthy();
    });

    it('hides spacecraft Launch Date button when clicking it or viewing launch date, and restores it when switching to another date', () => {
        vi.mocked(Modal.prototype.show).mockRestore();
        vi.mocked(Modal.prototype.hide).mockRestore();

        const voyagerData = {
            name: 'Voyager 1',
            targetBody: 'Earth',
            launchDate: '1977-09-05T12:56:00Z',
            escaping: true,
            distance: 2.0,
            period: 0,
            color: 0xaaaaaa,
            description: 'Interstellar probe'
        };
        sceneManager.spacecrafts = [{ data: voyagerData, mesh: {} }];
        sceneManager.simDate = new Date('2026-11-16T12:00:00Z');
        sceneManager.setSimDate = vi.fn((d: Date) => {
            sceneManager.simDate = new Date(d.getTime());
        });

        // 1. Viewing Voyager 1 on 2026-11-16 shows the Jump to Launch Date button
        uiManager.showModal(voyagerData);
        let jumpBtn = uiManager.modal.contentElement.querySelector<HTMLButtonElement>('.jump-to-date-btn');
        expect(jumpBtn).not.toBeNull();
        expect(jumpBtn!.textContent).toBe('Jump to Launch Date (1977-09-05)');

        // 2. Clicking the Jump to Launch Date button jumps to 1977-09-05, opens the launch importance eventModal, and hides the button
        jumpBtn!.click();
        expect(sceneManager.simDate.toISOString()).toBe('1977-09-05T12:56:00.000Z');
        expect(uiManager.modal.contentElement.querySelector('.jump-to-date-btn')).toBeNull();
        expect(uiManager.eventModal.isOpen).toBe(true);
        expect(uiManager.eventModal.titleElement?.textContent).toBe('Voyager 1 Launch');
        expect(uiManager.eventModal.contentElement.textContent).toContain('interstellar space');
        uiManager.eventModal.hide();

        // 3. Changing simulation date to another date while modal remains open restores the button
        window.dispatchEvent(new CustomEvent('jump-to-date', { detail: '2026-11-16T00:00:00Z' }));
        jumpBtn = uiManager.modal.contentElement.querySelector<HTMLButtonElement>('.jump-to-date-btn');
        expect(jumpBtn).not.toBeNull();
        expect(jumpBtn!.textContent).toBe('Jump to Launch Date (1977-09-05)');

        // 4. Selecting JWST while viewing an earlier historical date (e.g. 1969-07-20) keeps simDate unchanged and shows Jump to Launch Date (2021-12-25)
        const jwstData = {
            name: 'James Webb Space Telescope',
            targetBody: 'Earth',
            launchDate: '2021-12-25T12:20:00Z',
            distance: 5.0,
            period: 1.0,
            color: 0xffd700,
            description: 'Infrared space observatory'
        };
        sceneManager.spacecrafts.push({ data: jwstData, mesh: {} });
        sceneManager.simDate = new Date('1969-07-20T12:00:00Z');

        const typeSelect = uiContainer.querySelector('#typeSelect') as HTMLSelectElement;
        const bodySelect = uiContainer.querySelector('#bodySelect') as HTMLSelectElement;
        typeSelect.value = 'Spacecraft';
        typeSelect.dispatchEvent(new Event('change'));
        bodySelect.value = 'James Webb Space Telescope';
        bodySelect.dispatchEvent(new Event('change'));

        expect(sceneManager.simDate.toISOString()).toBe('1969-07-20T12:00:00.000Z');
        const jwstJumpBtn = uiManager.modal.contentElement.querySelector<HTMLButtonElement>('.jump-to-date-btn');
        expect(jwstJumpBtn).not.toBeNull();
        expect(jwstJumpBtn!.textContent).toBe('Jump to Launch Date (2021-12-25)');

        jwstJumpBtn!.click();
        expect(sceneManager.simDate.toISOString()).toBe('2021-12-25T12:20:00.000Z');
        expect(uiManager.modal.contentElement.querySelector('.jump-to-date-btn')).toBeNull();
        expect(uiManager.eventModal.isOpen).toBe(true);
        expect(uiManager.eventModal.titleElement?.textContent).toBe('James Webb Telescope Launch');
        expect(uiManager.eventModal.contentElement.textContent).toContain('infrared');

        // 5. Non-calendar spacecraft (Cassini & Voyager 2) also display their launch importance modal when clicking Jump to Launch Date
        const cassiniData = {
            name: 'Cassini',
            targetBody: 'Saturn',
            launchDate: '1997-10-15T08:43:00Z',
            endDate: '2017-09-15T11:55:46Z',
            distance: 25,
            period: 0.1,
            color: 0xdddddd,
            description: 'Saturn orbiter'
        };
        sceneManager.spacecrafts.push({ data: cassiniData, mesh: {} });
        uiManager.showModal(cassiniData);
        const cassiniJumpBtn = uiManager.modal.contentElement.querySelector<HTMLButtonElement>('.jump-to-date-btn');
        expect(cassiniJumpBtn).not.toBeNull();
        cassiniJumpBtn!.click();
        expect(sceneManager.simDate.toISOString()).toBe('1997-10-15T08:43:00.000Z');
        expect(uiManager.eventModal.isOpen).toBe(true);
        expect(uiManager.eventModal.titleElement?.textContent).toBe('Cassini-Huygens Launch');
        expect(uiManager.eventModal.contentElement.textContent).toContain('Titan');
    });
});
