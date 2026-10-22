import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ControlCenter } from '../ControlCenter';
import { i18n } from '../../i18n';
import { EventBus } from '../EventBus';

describe('ControlCenter Component', () => {
    let container: HTMLElement;
    let mockSceneManager: any;
    let mockUIManager: any;
    let controlCenter: ControlCenter;

    beforeEach(() => {
        i18n.setLanguage('en');
        container = document.createElement('div');
        container.id = 'ui-container';
        document.body.appendChild(container);

        mockSceneManager = {
            timeScale: 0.0027,
            showOrbits: true,
            showMoons: true,
            showAsteroids: true,
            showKuiperBelt: true,
            showDwarfPlanets: true,
            showComets: true,
            showSpacecrafts: true,
            showMeteors: false,
            showTrails: true,
            showHabitableZone: false,
            showEclipticGrid: false,
            realisticLighting: false,
            showAxes: false,
            realisticDistances: false,
            tourMode: false,
            tourTimer: 0,
            tourIndex: 0,
            tourTargets: ['Mercury', 'Venus', 'Earth'],
            measureMode: false,
            bloomPass: { enabled: true },
            focusOnBody: vi.fn(),
            setSurfaceView: vi.fn(),
            detachCamera: vi.fn(),
            toggleOrbits: vi.fn(),
            toggleMoons: vi.fn(),
            toggleAsteroids: vi.fn(),
            toggleKuiperBelt: vi.fn(),
            toggleDwarfPlanets: vi.fn(),
            toggleComets: vi.fn(),
            toggleSpacecrafts: vi.fn(),
            toggleMeteors: vi.fn(),
            toggleTrails: vi.fn(),
            toggleHabitableZone: vi.fn(),
            toggleEclipticGrid: vi.fn(),
            toggleRealisticLighting: vi.fn(),
            toggleAxes: vi.fn(),
            toggleRealisticDistances: vi.fn(),
            toggleMeasureMode: vi.fn(),
            captureScreenshot: vi.fn(),
            getFormattedTimeSpeed: vi.fn().mockReturnValue('1.0 day/s')
        };

        mockUIManager = {
            cameraTarget: 'Earth',
            previousTimeSpeed: null,
            togglePause: vi.fn(),
            syncDropdownSelection: vi.fn(),
            toggleShortcutsModal: vi.fn(),
            modal: { show: vi.fn(), hide: vi.fn() },
            minimap: { isVisible: true, setVisible: vi.fn() },
            performanceMonitor: { getVisible: vi.fn().mockReturnValue(false), setVisible: vi.fn() },
            audioManager: { getAudioEnabled: vi.fn().mockReturnValue(true), toggle: vi.fn().mockReturnValue(false), playShutter: vi.fn() },
            customDatePicker: { setDate: vi.fn() },
            openHeaderSlotsCustomizer: vi.fn()
        };

        controlCenter = new ControlCenter(mockUIManager, mockSceneManager, container);
    });

    afterEach(() => {
        controlCenter.dispose();
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should initialize with correct drawer and backdrop elements attached to container', () => {
        expect(container.querySelector('#unifiedControlCenter')).toBeTruthy();
        expect(container.querySelector('.drawer-backdrop')).toBeTruthy();
        expect(controlCenter.drawerElement.classList.contains('closed')).toBe(true);
        expect(controlCenter.isOpen).toBe(false);
    });

    it('should toggle open and closed states cleanly', () => {
        controlCenter.toggle();
        expect(controlCenter.isOpen).toBe(true);
        expect(controlCenter.drawerElement.classList.contains('closed')).toBe(false);
        expect(controlCenter.backdropElement.classList.contains('open')).toBe(true);

        controlCenter.close();
        expect(controlCenter.isOpen).toBe(false);
        expect(controlCenter.drawerElement.classList.contains('closed')).toBe(true);
        expect(controlCenter.backdropElement.classList.contains('open')).toBe(false);
    });

    it('should switch tabs and update active classes on tab buttons and panels', () => {
        controlCenter.switchTab('time');
        expect(controlCenter.activeTab).toBe('time');

        const timeBtn = controlCenter.drawerElement.querySelector('.drawer-tab[data-tab="time"]');
        const timePanel = controlCenter.drawerElement.querySelector('.drawer-panel[data-panel="time"]');
        expect(timeBtn?.classList.contains('active')).toBe(true);
        expect(timePanel?.classList.contains('active')).toBe(true);

        controlCenter.switchTab('layers');
        expect(controlCenter.activeTab).toBe('layers');
        const layersBtn = controlCenter.drawerElement.querySelector('.drawer-tab[data-tab="layers"]');
        const layersPanel = controlCenter.drawerElement.querySelector('.drawer-panel[data-panel="layers"]');
        expect(layersBtn?.classList.contains('active')).toBe(true);
        expect(layersPanel?.classList.contains('active')).toBe(true);
        expect(timePanel?.classList.contains('active')).toBe(false);
    });

    it('should select quick target chips and trigger focus and synchronization', () => {
        const emitSpy = vi.spyOn(EventBus, 'emit');
        const marsChip = controlCenter.drawerElement.querySelector('.target-chip-btn:nth-child(6)') as HTMLButtonElement;
        expect(marsChip).toBeTruthy();

        marsChip.click();
        expect(mockUIManager.syncDropdownSelection).toHaveBeenCalledWith('Mars', 'Planet');
        expect(emitSpy).toHaveBeenCalledWith('select-celestial-body', { name: 'Mars' });
    });

    it('should toggle cosmic layer options and call sceneManager methods', () => {
        controlCenter.switchTab('layers');
        const orbitsInput = controlCenter.drawerElement.querySelector('.drawer-panel[data-panel="layers"] input[type="checkbox"]') as HTMLInputElement;
        expect(orbitsInput).toBeTruthy();

        orbitsInput.checked = false;
        orbitsInput.dispatchEvent(new Event('change'));
        expect(mockSceneManager.toggleOrbits).toHaveBeenCalledWith(false);
    });

    it('should close on Escape key press when open', () => {
        controlCenter.open();
        expect(controlCenter.isOpen).toBe(true);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(controlCenter.isOpen).toBe(false);
        expect(controlCenter.drawerElement.classList.contains('closed')).toBe(true);
    });

    it('should render system instruments and omit redundant header action/language controls', () => {
        controlCenter.switchTab('system');
        const systemPanel = controlCenter.drawerElement.querySelector('.drawer-panel[data-panel="system"]');
        expect(systemPanel).toBeTruthy();

        // Minimap radar toggle and telemetry toggle should be present
        const switches = systemPanel?.querySelectorAll('.ctrl-row-toggle');
        expect(switches?.length).toBe(2);

        // Language presets, snapshot, audio, and shortcuts buttons should not be in system controls
        expect(systemPanel?.querySelector('.lang-presets-grid')).toBeNull();
        expect(systemPanel?.querySelector('.snap-action-btn')).toBeNull();
        expect(systemPanel?.querySelector('.audio-action-btn')).toBeNull();
        expect(systemPanel?.querySelector('.shortcuts-action-btn')).toBeNull();
    });

    it('should dynamically update drawer headers, tabs, section titles, and chips when language changes', () => {
        // Initially in English
        i18n.setLanguage('en');
        const mainTitle = controlCenter.drawerElement.querySelector('.drawer-main-title');
        const subTitle = controlCenter.drawerElement.querySelector('.drawer-sub-title');
        const targetTab = controlCenter.drawerElement.querySelector('.drawer-tab[data-tab="target"] .tab-label');
        const timeTab = controlCenter.drawerElement.querySelector('.drawer-tab[data-tab="time"] .tab-label');
        const earthChip = controlCenter.drawerElement.querySelector('.target-chip-btn:nth-child(4) .chip-name');

        expect(mainTitle?.textContent).toBe('Observatory Command');
        expect(subTitle?.textContent).toBe('Unified Celestial Simulation Controls');
        expect(targetTab?.textContent).toBe('Target');
        expect(timeTab?.textContent).toBe('Simulation');
        expect(earthChip?.textContent).toBe('Earth');

        // Change to Bosnian
        i18n.setLanguage('bs');
        expect(mainTitle?.textContent).toBe('Komanda opservatorije');
        expect(subTitle?.textContent).toBe('Objedinjene kontrole simulacije neba');
        expect(targetTab?.textContent).toBe('Cilj');
        expect(timeTab?.textContent).toBe('Simulacija');
        expect(earthChip?.textContent).toBe('Zemlja');

        // Change to Serbian
        i18n.setLanguage('sr');
        expect(mainTitle?.textContent).toBe('Команда опсерваторије');
        expect(subTitle?.textContent).toBe('Обједињене контроле симулације неба');
        expect(targetTab?.textContent).toBe('Циљ');
        expect(timeTab?.textContent).toBe('Симулација');
        expect(earthChip?.textContent).toBe('Земља');
    });

    it('should cleanly remove elements and listeners on dispose', () => {
        controlCenter.dispose();
        expect(container.querySelector('#unifiedControlCenter')).toBeNull();
        expect(container.querySelector('.drawer-backdrop')).toBeNull();
    });

    it('should assign accessible titles and aria-labels to tab buttons and render shortcut badges in system panel', () => {
        const tabs = controlCenter.drawerElement.querySelectorAll<HTMLButtonElement>('.drawer-tab');
        expect(tabs.length).toBe(6);
        tabs.forEach(tab => {
            expect(tab.getAttribute('title')).toBeTruthy();
            expect(tab.getAttribute('aria-label')).toBeTruthy();
        });

        const kbdBadges = controlCenter.drawerElement.querySelectorAll('.ctrl-kbd-badge');
        const badgeTexts = Array.from(kbdBadges).map(b => b.textContent);
        expect(badgeTexts).toContain('M');
        expect(badgeTexts).toContain('P');
        expect(badgeTexts).toContain('R');
        expect(badgeTexts).toContain('Z');
        expect(badgeTexts).toContain('G');
        expect(badgeTexts).toContain('B');
        expect(badgeTexts).toContain('L');
        expect(badgeTexts).toContain('X');
        expect(badgeTexts).toContain('A');
        expect(badgeTexts).toContain('V');
        expect(badgeTexts).toContain('D');
        expect(badgeTexts).toContain('T');
        expect(badgeTexts).toContain('O');
        expect(badgeTexts).toContain('N');
        expect(badgeTexts).toContain('E');
        expect(badgeTexts).toContain('U');
        expect(badgeTexts).toContain('W');
        expect(badgeTexts).toContain('Q');
        expect(badgeTexts).toContain('J');
        expect(badgeTexts).toContain('Y');
        expect(badgeTexts).toContain('I');
    });

    it('should not contain unnecessary header quick access section in system controls', () => {
        controlCenter.switchTab('system');
        const customizeBtn = controlCenter.drawerElement.querySelector('#controlCenterHeaderSlotsBtn');
        expect(customizeBtn).toBeNull();
    });

    it('should synchronize camera mode buttons based on sceneManager state', () => {
        controlCenter.switchTab('camera');
        const orbitBtn = controlCenter.drawerElement.querySelector('.cam-mode-btn[data-mode-key="orbit"]');
        const surfaceBtn = controlCenter.drawerElement.querySelector('.cam-mode-btn[data-mode-key="surface"]');
        const detachBtn = controlCenter.drawerElement.querySelector('.cam-mode-btn[data-mode-key="detach"]');

        // Focused on body (Orbit Focus)
        mockSceneManager.focusedBody = { data: { name: 'Earth' } };
        mockSceneManager.surfaceViewBody = null;
        controlCenter.syncSwitches();
        expect(orbitBtn?.classList.contains('active')).toBe(true);
        expect(surfaceBtn?.classList.contains('active')).toBe(false);
        expect(detachBtn?.classList.contains('active')).toBe(false);

        // Surface View active
        mockSceneManager.surfaceViewBody = { data: { name: 'Mars' } };
        mockSceneManager.focusedBody = null;
        controlCenter.syncSwitches();
        expect(orbitBtn?.classList.contains('active')).toBe(false);
        expect(surfaceBtn?.classList.contains('active')).toBe(true);
        expect(detachBtn?.classList.contains('active')).toBe(false);

        // Free Camera active
        mockSceneManager.surfaceViewBody = null;
        mockSceneManager.focusedBody = null;
        mockSceneManager.focusedStar = null;
        mockSceneManager.focusedConstellation = null;
        controlCenter.syncSwitches();
        expect(orbitBtn?.classList.contains('active')).toBe(false);
        expect(surfaceBtn?.classList.contains('active')).toBe(false);
        expect(detachBtn?.classList.contains('active')).toBe(true);
    });

    it('should not render Measure Mode toggle in settings drawer', () => {
        controlCenter.switchTab('camera');
        const cameraPanel = controlCenter.drawerElement.querySelector('.drawer-panel[data-panel="camera"]');
        expect(cameraPanel).toBeTruthy();
        expect(cameraPanel?.querySelector('[data-i18n-key="controls.measureMode"]')).toBeNull();
        expect(cameraPanel?.querySelector('[data-i18n-key="controls.measureTool"]')).toBeNull();
    });

    it('should not render Pause Simulation button or paused preset in settings drawer', () => {
        controlCenter.switchTab('time');
        const timePanel = controlCenter.drawerElement.querySelector('.drawer-panel[data-panel="time"]');
        expect(timePanel).toBeTruthy();
        expect(timePanel?.querySelector('.pause-action-btn')).toBeNull();
        expect(timePanel?.querySelector('[data-i18n-key="controls.sections.simulationState"]')).toBeNull();
        expect(timePanel?.querySelector('.preset-btn[data-preset-key="paused"]')).toBeNull();
    });

    it('should render info buttons on setting options across panels', () => {
        const infoBtns = controlCenter.drawerElement.querySelectorAll<HTMLButtonElement>('.ctrl-info-btn');
        expect(infoBtns.length).toBeGreaterThanOrEqual(20);

        // Verify specific option info buttons exist
        const optionIds = Array.from(infoBtns).map(btn => btn.dataset.optionId);
        expect(optionIds).not.toContain('pauseResume');
        expect(optionIds).toContain('speedPresets');
        expect(optionIds).toContain('timeSpeed');
        expect(optionIds).toContain('jumpToDate');
        expect(optionIds).toContain('showOrbits');
        expect(optionIds).toContain('showMoons');
        expect(optionIds).toContain('showAsteroids');
        expect(optionIds).toContain('showKuiperBelt');
        expect(optionIds).toContain('showDwarfPlanets');
        expect(optionIds).toContain('showComets');
        expect(optionIds).toContain('showSpacecraft');
        expect(optionIds).toContain('showMeteors');
        expect(optionIds).toContain('showTrails');
        expect(optionIds).toContain('orbitFocus');
        expect(optionIds).toContain('surfaceView');
        expect(optionIds).toContain('freeCamera');
        expect(optionIds).toContain('cinematicTour');
        expect(optionIds).toContain('tourSpeed');
        expect(optionIds).toContain('realisticDistances');
        expect(optionIds).toContain('showHabitableZone');
        expect(optionIds).toContain('showEclipticGrid');
        expect(optionIds).toContain('enableBloom');
        expect(optionIds).toContain('realisticLighting');
        expect(optionIds).toContain('showAxes');
        expect(optionIds).toContain('minimap');
        expect(optionIds).toContain('telemetry');
    });

    it('should display concise tooltip on info button hover (mouseenter) and hide on mouseleave', () => {
        controlCenter.switchTab('layers');
        const orbitsInfoBtn = controlCenter.drawerElement.querySelector('.ctrl-info-btn[data-option-id="showOrbits"]') as HTMLButtonElement;
        expect(orbitsInfoBtn).toBeTruthy();

        // Mouse enter triggers tooltip
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));

        const tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.getAttribute('role')).toBe('tooltip');
        expect(tooltip.classList.contains('visible')).toBe(true);

        const title = tooltip.querySelector('.ctrl-info-tooltip-title');
        expect(title?.textContent).toBe(i18n.t('controls.showOrbits'));

        const desc = tooltip.querySelector('.ctrl-info-tooltip-desc');
        expect(desc?.textContent).toBeTruthy();
        // Concise summary should be present
        expect(desc?.textContent?.length).toBeLessThan(200);

        // Shortcut badge should be included
        const kbd = tooltip.querySelector('.ctrl-kbd-badge');
        expect(kbd?.textContent).toBe('O');

        // Mouse leave hides tooltip
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));
        expect(tooltip.classList.contains('visible')).toBe(false);
    });

    it('should display tooltip on focus and hide on blur', () => {
        controlCenter.switchTab('layers');
        const moonsInfoBtn = controlCenter.drawerElement.querySelector('.ctrl-info-btn[data-option-id="showMoons"]') as HTMLButtonElement;
        expect(moonsInfoBtn).toBeTruthy();

        moonsInfoBtn.dispatchEvent(new FocusEvent('focus'));
        const tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.classList.contains('visible')).toBe(true);

        moonsInfoBtn.dispatchEvent(new FocusEvent('blur'));
        expect(tooltip.classList.contains('visible')).toBe(false);
    });

    it('should handle Escape key hierarchy: dismiss tooltip first, then close drawer', () => {
        controlCenter.open();
        expect(controlCenter.isOpen).toBe(true);

        controlCenter.openOptionInfoModal('speedPresets');
        const tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.classList.contains('visible')).toBe(true);

        // First Escape dismisses tooltip, keeping drawer open
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(tooltip.classList.contains('visible')).toBe(false);
        expect(controlCenter.isOpen).toBe(true);

        // Second Escape closes the drawer
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(controlCenter.isOpen).toBe(false);
    });

    it('should clean up active tooltip when drawer is closed or disposed', () => {
        controlCenter.openOptionInfoModal('telemetry');
        const tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.classList.contains('visible')).toBe(true);

        controlCenter.close();
        expect(tooltip.classList.contains('visible')).toBe(false);

        controlCenter.openOptionInfoModal('telemetry');
        expect(tooltip.classList.contains('visible')).toBe(true);
        controlCenter.dispose();
        expect(container.querySelector('.ctrl-info-tooltip')).toBeNull();
    });

    it('should dynamically localize option tooltip title and summary across languages', () => {
        controlCenter.switchTab('layers');
        const orbitsInfoBtn = controlCenter.drawerElement.querySelector('.ctrl-info-btn[data-option-id="showOrbits"]') as HTMLButtonElement;
        expect(orbitsInfoBtn).toBeTruthy();

        // 1. In English
        i18n.setLanguage('en');
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        let tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-title')?.textContent).toBe('Show Orbits');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toBe(
            'Toggles elliptical Keplerian orbital trajectory paths for all celestial bodies.'
        );
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // 2. In Bosnian
        i18n.setLanguage('bs');
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-title')?.textContent).toBe('Prikaži orbite');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toBe(
            'Prikazuje eliptične Keplerove orbitalne putanje za sva nebeska tijela.'
        );
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // 3. In Serbian
        i18n.setLanguage('sr');
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-title')?.textContent).toBe('Прикажи орбите');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toBe(
            'Приказује елиптичне Кеплерове орбиталне путање за сва небеска тела.'
        );
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // 4. In German
        i18n.setLanguage('de');
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-title')?.textContent).toBe('Umlaufbahnen anzeigen');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toBe(
            'Zeigt elliptische Kepler-Bahnen aller Himmelskörper im Raum an.'
        );
        orbitsInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // Restore language to English
        i18n.setLanguage('en');
    });

    it('should include expanded full values for FPS and GPU in telemetry option summaries', () => {
        controlCenter.switchTab('system');
        const telemetryInfoBtn = controlCenter.drawerElement.querySelector('.ctrl-info-btn[data-option-id="telemetry"]') as HTMLButtonElement;
        expect(telemetryInfoBtn).toBeTruthy();

        // English
        i18n.setLanguage('en');
        telemetryInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        let tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toContain('FPS (Frames Per Second)');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toContain('GPU (Graphics Processing Unit)');
        telemetryInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // Bosnian
        i18n.setLanguage('bs');
        telemetryInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toContain('FPS (broj sličica u sekundi)');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toContain('GPU (grafički procesor)');
        telemetryInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // German
        i18n.setLanguage('de');
        telemetryInfoBtn.dispatchEvent(new MouseEvent('mouseenter'));
        tooltip = container.querySelector('.ctrl-info-tooltip') as HTMLElement;
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toContain('FPS (Bilder pro Sekunde)');
        expect(tooltip.querySelector('.ctrl-info-tooltip-desc')?.textContent).toContain('GPU-Last (Grafikprozessor)');
        telemetryInfoBtn.dispatchEvent(new MouseEvent('mouseleave'));

        // Restore language
        i18n.setLanguage('en');
    });
});

