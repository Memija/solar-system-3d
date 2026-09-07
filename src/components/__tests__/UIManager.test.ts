import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../UIManager';
import { Modal } from '../Modal';

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
            setVisible = vi.fn();
            isVisible = false;
        }
    };
});

describe('UIManager', () => {
    let uiContainer: HTMLElement;
    let sceneManager: any;
    let uiManager: UIManager;

    beforeEach(() => {
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
        vi.spyOn(Modal.prototype, 'show').mockImplementation(vi.fn());
        vi.spyOn(Modal.prototype, 'hide').mockImplementation(vi.fn());
        vi.spyOn(Modal.prototype, 'dispose').mockImplementation(vi.fn());

        uiManager = new UIManager(sceneManager);
    });

    afterEach(() => {
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

        // Open dropdown
        langBtn.click();
        expect(langDropdown.style.display).toBe('block');

        // Select a language item (e.g. German 'de')
        const items = langDropdown.querySelectorAll('.lang-dropdown-item');
        expect(items.length).toBeGreaterThan(0);
        const secondItem = items[1] as HTMLElement;
        secondItem.click();

        // Should close dropdown and remove active classes
        expect(langDropdown.style.display).toBe('none');
        expect(langBtn.classList.contains('active')).toBe(false);
        expect(langContainer.classList.contains('open')).toBe(false);
        expect(menuContainer.classList.contains('has-lang-open')).toBe(false);
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
});

