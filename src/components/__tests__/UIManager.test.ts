import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../UIManager';
import { Modal } from '../Modal';
import { i18n } from '../../i18n';

// Mock dat.gui
vi.mock('dat.gui', () => ({
    GUI: class {
addFolder = vi.fn(() => ({
            add: vi.fn().mockReturnValue({
                name: vi.fn().mockReturnThis(),
                onChange: vi.fn().mockReturnThis(),
                step: vi.fn().mockReturnThis(),
                min: vi.fn().mockReturnThis(),
                setValue: vi.fn().mockReturnThis()
            }),
            open: vi.fn()
        }));
        domElement = document.createElement('div');
        add = vi.fn(() => ({
            name: vi.fn().mockReturnThis(),
            onChange: vi.fn().mockReturnThis(),
            step: vi.fn().mockReturnThis(),
            min: vi.fn().mockReturnThis(),
            setValue: vi.fn().mockReturnThis()
        }));
        destroy = vi.fn();
    }
}));

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
            detachCamera: vi.fn(),
            tourMode: false,
            tourTargets: []
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
        i18n.setLanguage('en');
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should automatically open the modal when a planet is selected from the dropdown', () => {
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

        // Baseline menu container z-index must be higher than modal z-index (1500)
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

    it('should display simulation speed badge in date panel', () => {
        const speedBadge = uiContainer.querySelector('.sim-speed-badge') as HTMLElement;
        expect(speedBadge).toBeDefined();
        expect(speedBadge.textContent).toContain('1.0 day/s');
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

        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('CONTROLS');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Earth');

        // Switch to Bosnian
        i18n.setLanguage('bs');
        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('KONTROLE');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Zemlja');

        // Switch to German
        i18n.setLanguage('de');
        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('STEUERUNG');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Erde');

        // Switch to Serbian
        i18n.setLanguage('sr');
        expect(controlsBtn.querySelector('.ctrl-label')?.textContent).toBe('КОНТРОЛЕ');
        expect(targetPill.querySelector('.target-name')?.textContent).toBe('Земља');
    });

    it('should have customize header slots button (+) in the observatory header bar', () => {
        const slotAddBtn = uiContainer.querySelector('#hudSlotAddBtn') as HTMLButtonElement;
        expect(slotAddBtn).not.toBeNull();
        expect(slotAddBtn.textContent).toContain('＋');

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
        expect(modalArg.description).toContain('header-slots-customizer-modal');
        expect(modalArg.description).toContain('slotsResetBtn');
        expect(modalArg.description).toContain('slotsDoneBtn');
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
});

