import { SceneManager } from './SceneManager';
import { UIManager } from './UIManager';
import { i18n } from '../i18n';
import { EventBus } from './EventBus';

export type ControlCenterTab = 'target' | 'time' | 'layers' | 'camera' | 'optics' | 'system';

export class ControlCenter {
    uiManager: UIManager;
    sceneManager: SceneManager;
    uiContainer: HTMLElement;

    drawerElement: HTMLElement;
    backdropElement: HTMLElement;
    activeTab: ControlCenterTab = 'target';
    isOpen: boolean = false;

    // References for reactive updates
    private tabButtons: Map<ControlCenterTab, HTMLElement> = new Map();
    private tabPanels: Map<ControlCenterTab, HTMLElement> = new Map();
    private switches: Map<string, HTMLInputElement> = new Map();
    private presetButtons: Map<string, HTMLElement> = new Map();
    private speedSlider: HTMLInputElement | null = null;
    private speedDisplay: HTMLElement | null = null;
    private pauseBtn: HTMLElement | null = null;
    private targetChipButtons: Map<string, HTMLElement> = new Map();
    private camModeButtons: Map<string, HTMLElement> = new Map();
    private tourSpeedDisplay: HTMLElement | null = null;
    private mainTitleEl: HTMLElement | null = null;
    private subTitleEl: HTMLElement | null = null;
    private closeBtnEl: HTMLElement | null = null;

    private onKeyDownBound: ((e: KeyboardEvent) => void) | null = null;
    private unregisterI18n: (() => void) | null = null;

    constructor(uiManager: UIManager, sceneManager: SceneManager, uiContainer: HTMLElement) {
        this.uiManager = uiManager;
        this.sceneManager = sceneManager;
        this.uiContainer = uiContainer;

        this.backdropElement = this.createBackdrop();
        this.drawerElement = this.createDrawer();

        this.uiContainer.appendChild(this.backdropElement);
        this.uiContainer.appendChild(this.drawerElement);

        this.initEventListeners();
    }

    private createBackdrop(): HTMLElement {
        const backdrop = document.createElement('div');
        backdrop.className = 'drawer-backdrop';
        backdrop.onclick = () => this.close();
        return backdrop;
    }

    private createDrawer(): HTMLElement {
        const drawer = document.createElement('aside');
        drawer.id = 'unifiedControlCenter';
        drawer.className = 'unified-control-drawer closed';
        drawer.setAttribute('aria-label', 'Observatory Control Center');

        // Header
        const header = document.createElement('div');
        header.className = 'drawer-header';

        const titleGroup = document.createElement('div');
        titleGroup.className = 'drawer-title-group';

        const mainTitle = document.createElement('span');
        mainTitle.className = 'drawer-main-title';
        mainTitle.textContent = i18n.t('controls.drawerTitle') || 'Observatory Command';
        titleGroup.appendChild(mainTitle);
        this.mainTitleEl = mainTitle;

        const subTitle = document.createElement('span');
        subTitle.className = 'drawer-sub-title';
        subTitle.textContent = i18n.t('controls.drawerSubtitle') || 'Unified Celestial Simulation Controls';
        titleGroup.appendChild(subTitle);
        this.subTitleEl = subTitle;

        header.appendChild(titleGroup);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'drawer-close-btn';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', i18n.t('ui.close') || 'Close Menu');
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => this.close();
        header.appendChild(closeBtn);
        this.closeBtnEl = closeBtn;

        drawer.appendChild(header);

        // Navigation Tabs Strip
        const tabsStrip = document.createElement('div');
        tabsStrip.className = 'drawer-tabs-strip';

        const tabsConfig: { id: ControlCenterTab; icon: string; key: string }[] = [
            { id: 'target', icon: '🎯', key: 'categories.planet' },
            { id: 'time', icon: '⏱️', key: 'controls.simulationFolder' },
            { id: 'layers', icon: '🪐', key: 'controls.showOrbits' },
            { id: 'camera', icon: '🔭', key: 'controls.cameraFolder' },
            { id: 'optics', icon: '✨', key: 'controls.environmentFolder' },
            { id: 'system', icon: '⚙️', key: 'controls.toolsFolder' }
        ];

        tabsConfig.forEach(cfg => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `drawer-tab ${cfg.id === this.activeTab ? 'active' : ''}`;
            btn.dataset.tab = cfg.id;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'tab-icon';
            iconSpan.textContent = cfg.icon;
            btn.appendChild(iconSpan);

            const labelSpan = document.createElement('span');
            labelSpan.className = 'tab-label';
            const label = this.getTabLabel(cfg.id);
            labelSpan.textContent = label;
            btn.appendChild(labelSpan);

            btn.title = label;
            btn.setAttribute('aria-label', label);

            btn.onclick = () => this.switchTab(cfg.id);
            tabsStrip.appendChild(btn);
            this.tabButtons.set(cfg.id, btn);
        });

        drawer.appendChild(tabsStrip);

        // Drawer Body with Tab Panels
        const body = document.createElement('div');
        body.className = 'drawer-body';

        body.appendChild(this.createTargetPanel());
        body.appendChild(this.createTimePanel());
        body.appendChild(this.createLayersPanel());
        body.appendChild(this.createCameraPanel());
        body.appendChild(this.createOpticsPanel());
        body.appendChild(this.createSystemPanel());

        drawer.appendChild(body);
        return drawer;
    }

    private getTabLabel(tab: ControlCenterTab): string {
        switch (tab) {
            case 'target': return i18n.t('controls.tabs.target') || 'Target';
            case 'time': return i18n.t('controls.tabs.time') || i18n.t('controls.simulationFolder') || 'Simulation';
            case 'layers': return i18n.t('controls.tabs.layers') || 'Layers';
            case 'camera': return i18n.t('controls.tabs.camera') || i18n.t('controls.cameraFolder') || 'Camera';
            case 'optics': return i18n.t('controls.tabs.optics') || i18n.t('controls.environmentFolder') || 'Optics';
            case 'system': return i18n.t('controls.tabs.system') || i18n.t('controls.toolsFolder') || 'System';
        }
    }

    // =========================================================================
    // TAB 1: TARGET PANEL
    // =========================================================================
    private createTargetPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = `drawer-panel ${this.activeTab === 'target' ? 'active' : ''}`;
        panel.dataset.panel = 'target';
        this.tabPanels.set('target', panel);

        // Category & Body Selection Group
        const selectGroup = document.createElement('div');
        selectGroup.className = 'ctrl-group';

        const groupTitle = document.createElement('h4');
        groupTitle.className = 'ctrl-group-title';
        groupTitle.innerHTML = `<span data-i18n-key="controls.sections.celestialNav">${i18n.t('controls.sections.celestialNav') || 'Celestial Navigation'}</span><span class="group-tag">EPHEMERIS</span>`;
        selectGroup.appendChild(groupTitle);

        const selectRow = document.createElement('div');
        selectRow.className = 'target-select-row';
        selectRow.id = 'unifiedTargetSelectRow';
        // Note: typeSelect and bodySelect will be moved into this container by UIManager
        selectGroup.appendChild(selectRow);

        panel.appendChild(selectGroup);

        // Quick Jump Chips Group
        const quickGroup = document.createElement('div');
        quickGroup.className = 'ctrl-group';

        const quickTitle = document.createElement('h4');
        quickTitle.className = 'ctrl-group-title';
        quickTitle.innerHTML = `<span data-i18n-key="controls.sections.quickTargets">${i18n.t('controls.sections.quickTargets') || 'Quick Focus Targets'}</span>`;
        quickGroup.appendChild(quickTitle);

        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'quick-target-chips';

        const quickTargets = [
            { name: 'Sun', icon: '☀️', type: 'Star' },
            { name: 'Mercury', icon: '🪐', type: 'Planet' },
            { name: 'Venus', icon: '🪐', type: 'Planet' },
            { name: 'Earth', icon: '🌎', type: 'Planet' },
            { name: 'Moon', icon: '🌕', type: 'Moon' },
            { name: 'Mars', icon: '🪐', type: 'Planet' },
            { name: 'Jupiter', icon: '🪐', type: 'Planet' },
            { name: 'Saturn', icon: '🪐', type: 'Planet' },
            { name: 'Uranus', icon: '🪐', type: 'Planet' },
            { name: 'Neptune', icon: '🪐', type: 'Planet' },
            { name: 'Pluto', icon: '🪐', type: 'Planet' },
            { name: 'ISS', icon: '🛰️', type: 'Spacecraft' },
            { name: 'Voyager 1', icon: '🛰️', type: 'Spacecraft' }
        ];

        quickTargets.forEach(t => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `target-chip-btn ${this.uiManager?.cameraTarget === t.name ? 'active' : ''}`;
            const locName = i18n.getBodyName(t.name) || i18n.getStarName(t.name) || i18n.getSpacecraftName(t.name) || t.name;
            chip.innerHTML = `${t.icon} <span class="chip-name">${locName}</span>`;
            chip.onclick = () => {
                this.uiManager.syncDropdownSelection(t.name, t.type);
                EventBus.emit('select-celestial-body', { name: t.name });
                this.updateActiveTargetChips(t.name);
            };
            chipsWrap.appendChild(chip);
            this.targetChipButtons.set(t.name, chip);
        });

        quickGroup.appendChild(chipsWrap);
        panel.appendChild(quickGroup);

        // Target Actions Group
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'ctrl-group';

        const actionBtn1 = document.createElement('button');
        actionBtn1.type = 'button';
        actionBtn1.className = 'master-action-btn focus-action-btn';
        actionBtn1.innerHTML = `<span>🎯 <span data-i18n-key="controls.sections.focusAlign">${i18n.t('controls.sections.focusAlign') || 'Focus & Align Camera'}</span></span>`;
        actionBtn1.onclick = () => {
            this.sceneManager.focusOnBody(this.uiManager.cameraTarget);
        };
        actionsGroup.appendChild(actionBtn1);

        const actionBtn2 = document.createElement('button');
        actionBtn2.type = 'button';
        actionBtn2.className = 'master-action-btn surface-action-btn';
        actionBtn2.innerHTML = `<span>🪐 <span data-i18n-key="controls.sections.viewSurface">${i18n.t('controls.sections.viewSurface') || 'View From Surface'}</span></span>`;
        actionBtn2.onclick = () => {
            this.sceneManager.setSurfaceView(this.uiManager.cameraTarget);
        };
        actionsGroup.appendChild(actionBtn2);

        panel.appendChild(actionsGroup);
        return panel;
    }

    // =========================================================================
    // TAB 2: TIME & SIMULATION PANEL
    // =========================================================================
    private createTimePanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = `drawer-panel ${this.activeTab === 'time' ? 'active' : ''}`;
        panel.dataset.panel = 'time';
        this.tabPanels.set('time', panel);

        // Master Pause / Resume Group
        const masterGroup = document.createElement('div');
        masterGroup.className = 'ctrl-group';

        const pauseBtn = document.createElement('button');
        pauseBtn.type = 'button';
        pauseBtn.className = 'master-action-btn pause-action-btn';
        pauseBtn.onclick = () => {
            this.uiManager.togglePause();
            this.syncTimePanel();
        };
        masterGroup.appendChild(pauseBtn);
        this.pauseBtn = pauseBtn;
        this.updatePauseButton();

        panel.appendChild(masterGroup);

        // Speed Presets Group
        const presetGroup = document.createElement('div');
        presetGroup.className = 'ctrl-group';

        const presetTitle = document.createElement('h4');
        presetTitle.className = 'ctrl-group-title';
        presetTitle.innerHTML = `<span data-i18n-key="controls.speedPreset">${i18n.t('controls.speedPreset') || 'Speed Presets'}</span>`;
        presetGroup.appendChild(presetTitle);

        const presetGrid = document.createElement('div');
        presetGrid.className = 'speed-presets-grid';

        const presets: { key: string; labelKey: string; fallback: string; speed: number }[] = [
            { key: 'realTime', labelKey: 'controls.speedPresets.realTime', fallback: '1:1 Real', speed: SceneManager.SPEED_PRESETS.realTime },
            { key: 'oneHour', labelKey: 'controls.speedPresets.oneHourPerSec', fallback: '1 hr / s', speed: SceneManager.SPEED_PRESETS.oneHour },
            { key: 'oneDay', labelKey: 'controls.speedPresets.oneDayPerSec', fallback: '1 day / s', speed: SceneManager.SPEED_PRESETS.oneDay },
            { key: 'oneWeek', labelKey: 'controls.speedPresets.oneWeekPerSec', fallback: '1 wk / s', speed: SceneManager.SPEED_PRESETS.oneWeek },
            { key: 'oneMonth', labelKey: 'controls.speedPresets.oneMonthPerSec', fallback: '1 mo / s', speed: SceneManager.SPEED_PRESETS.oneMonth },
            { key: 'paused', labelKey: 'controls.speedPresets.paused', fallback: 'Paused', speed: 0 }
        ];

        presets.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preset-btn';
            btn.dataset.presetKey = p.key;
            btn.textContent = i18n.t(p.labelKey) || p.fallback;
            btn.onclick = () => {
                if (p.key === 'paused') {
                    if (this.sceneManager.timeScale !== 0) {
                        this.uiManager.previousTimeSpeed = this.sceneManager.timeScale;
                        this.sceneManager.timeScale = 0;
                        if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(0);
                    }
                } else {
                    this.sceneManager.timeScale = p.speed;
                    if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(p.speed);
                }
                this.syncTimePanel();
            };
            presetGrid.appendChild(btn);
            this.presetButtons.set(p.key, btn);
        });

        presetGroup.appendChild(presetGrid);
        panel.appendChild(presetGroup);

        // Fine Speed Slider Group
        const sliderGroup = document.createElement('div');
        sliderGroup.className = 'ctrl-group';

        const sliderTitle = document.createElement('h4');
        sliderTitle.className = 'ctrl-group-title';
        sliderTitle.innerHTML = `<span data-i18n-key="controls.timeSpeed">${i18n.t('controls.timeSpeed') || 'Time Speed Fine Scrubber'}</span>`;
        sliderGroup.appendChild(sliderTitle);

        const sliderWrap = document.createElement('div');
        sliderWrap.className = 'speed-slider-wrap';

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'stepper-btn';
        decBtn.innerHTML = '◀';
        decBtn.title = 'Decrease speed by 0.005';
        decBtn.onclick = () => {
            const next = Math.max(0, Math.round((this.sceneManager.timeScale - 0.005) * 10000) / 10000);
            this.sceneManager.timeScale = next;
            if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(next);
            this.syncTimePanel();
        };
        sliderWrap.appendChild(decBtn);

        const range = document.createElement('input');
        range.type = 'range';
        range.min = '0';
        range.max = '0.08';
        range.step = '0.0005';
        range.value = (this.sceneManager?.timeScale || 0.0027).toString();
        range.oninput = () => {
            const val = parseFloat(range.value);
            this.sceneManager.timeScale = val;
            if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(val);
            this.syncTimePanel();
        };
        sliderWrap.appendChild(range);
        this.speedSlider = range;

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'stepper-btn';
        incBtn.innerHTML = '▶';
        incBtn.title = 'Increase speed by 0.005';
        incBtn.onclick = () => {
            const next = Math.round((this.sceneManager.timeScale + 0.005) * 10000) / 10000;
            this.sceneManager.timeScale = next;
            if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(next);
            this.syncTimePanel();
        };
        sliderWrap.appendChild(incBtn);

        const display = document.createElement('span');
        display.className = 'speed-val-display';
        display.textContent = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
            ? this.sceneManager.getFormattedTimeSpeed()
            : '1.0 day/s';
        sliderWrap.appendChild(display);
        this.speedDisplay = display;

        sliderGroup.appendChild(sliderWrap);
        panel.appendChild(sliderGroup);

        // Date Controls & Ephemeris
        const dateGroup = document.createElement('div');
        dateGroup.className = 'ctrl-group';

        const dateTitle = document.createElement('h4');
        dateTitle.className = 'ctrl-group-title';
        dateTitle.innerHTML = `<span data-i18n-key="ui.simDate">${i18n.t('ui.simDate') || 'Observation Date'}</span>`;
        dateGroup.appendChild(dateTitle);

        const jumpBtn = document.createElement('button');
        jumpBtn.type = 'button';
        jumpBtn.className = 'master-action-btn jump-date-action-btn';
        jumpBtn.innerHTML = `<span>📅 <span data-i18n-key="ui.liveRealTime">${i18n.t('ui.liveRealTime') || 'Jump to Real-Time Today'}</span></span>`;
        jumpBtn.onclick = () => {
            const now = new Date();
            if (this.sceneManager.setSimDate) {
                this.sceneManager.setSimDate(now);
                if (this.uiManager.customDatePicker) {
                    this.uiManager.customDatePicker.setDate(now);
                }
            }
        };
        dateGroup.appendChild(jumpBtn);

        panel.appendChild(dateGroup);
        return panel;
    }

    // =========================================================================
    // TAB 3: COSMIC LAYERS PANEL
    // =========================================================================
    private createLayersPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = `drawer-panel ${this.activeTab === 'layers' ? 'active' : ''}`;
        panel.dataset.panel = 'layers';
        this.tabPanels.set('layers', panel);

        const group = document.createElement('div');
        group.className = 'ctrl-group';

        const title = document.createElement('h4');
        title.className = 'ctrl-group-title';
        title.innerHTML = `<span data-i18n-key="controls.sections.entitiesTrails">${i18n.t('controls.sections.entitiesTrails') || 'Cosmic Entities & Trails'}</span>`;
        group.appendChild(title);

        const layersConfig: { prop: string; key: string; icon: string; initial: boolean; onChange: (v: boolean) => void }[] = [
            {
                prop: 'showOrbits',
                key: 'controls.showOrbits',
                icon: '🪐',
                initial: true,
                onChange: (v) => this.sceneManager.toggleOrbits(v)
            },
            {
                prop: 'showMoons',
                key: 'controls.showMoons',
                icon: '🌕',
                initial: true,
                onChange: (v) => this.sceneManager.toggleMoons(v)
            },
            {
                prop: 'showAsteroids',
                key: 'controls.showAsteroids',
                icon: '🪨',
                initial: true,
                onChange: (v) => this.sceneManager.toggleAsteroids(v)
            },
            {
                prop: 'showKuiperBelt',
                key: 'controls.showKuiperBelt',
                icon: '❄️',
                initial: true,
                onChange: (v) => this.sceneManager.toggleKuiperBelt(v)
            },
            {
                prop: 'showDwarfPlanets',
                key: 'controls.showDwarfPlanets',
                icon: '⚪',
                initial: true,
                onChange: (v) => this.sceneManager.toggleDwarfPlanets(v)
            },
            {
                prop: 'showComets',
                key: 'controls.showComets',
                icon: '☄️',
                initial: true,
                onChange: (v) => this.sceneManager.toggleComets(v)
            },
            {
                prop: 'showSpacecraft',
                key: 'controls.showSpacecraft',
                icon: '🛰️',
                initial: true,
                onChange: (v) => this.sceneManager.toggleSpacecrafts(v)
            },
            {
                prop: 'showMeteors',
                key: 'controls.showMeteors',
                icon: '🌠',
                initial: false,
                onChange: (v) => this.sceneManager.toggleMeteors(v)
            },
            {
                prop: 'showTrails',
                key: 'controls.showTrails',
                icon: '〰️',
                initial: true,
                onChange: (v) => this.sceneManager.toggleTrails(v)
            }
        ];

        layersConfig.forEach(cfg => {
            const row = document.createElement('div');
            row.className = 'ctrl-row-toggle';

            const labelWrap = document.createElement('label');
            labelWrap.className = 'toggle-label-wrap';

            const icon = document.createElement('span');
            icon.className = 'toggle-icon';
            icon.textContent = cfg.icon;
            labelWrap.appendChild(icon);

            const labelText = document.createElement('span');
            labelText.dataset.i18nKey = cfg.key;
            labelText.textContent = i18n.t(cfg.key);
            labelWrap.appendChild(labelText);

            row.appendChild(labelWrap);

            const switchWrap = document.createElement('label');
            switchWrap.className = 'sci-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = cfg.initial;
            input.onchange = () => cfg.onChange(input.checked);
            switchWrap.appendChild(input);

            const slider = document.createElement('span');
            slider.className = 'sci-slider';
            switchWrap.appendChild(slider);

            row.appendChild(switchWrap);
            group.appendChild(row);

            this.switches.set(cfg.prop, input);
        });

        panel.appendChild(group);
        return panel;
    }

    // =========================================================================
    // TAB 4: CAMERA & OBSERVATORY MODES PANEL
    // =========================================================================
    private createCameraPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = `drawer-panel ${this.activeTab === 'camera' ? 'active' : ''}`;
        panel.dataset.panel = 'camera';
        this.tabPanels.set('camera', panel);

        // View Modes Segmented Control
        const modesGroup = document.createElement('div');
        modesGroup.className = 'ctrl-group';

        const modesTitle = document.createElement('h4');
        modesTitle.className = 'ctrl-group-title';
        modesTitle.innerHTML = `<span data-i18n-key="controls.sections.cameraPerspective">${i18n.t('controls.sections.cameraPerspective') || 'Camera Perspective'}</span>`;
        modesGroup.appendChild(modesTitle);

        const segmented = document.createElement('div');
        segmented.className = 'camera-modes-segmented';

        const modes = [
            { key: 'orbit', icon: '🎯', labelKey: 'controls.sections.orbitFocus', fallback: 'Orbit Focus', action: () => this.sceneManager.focusOnBody(this.uiManager.cameraTarget) },
            { key: 'surface', icon: '🪐', labelKey: 'controls.sections.surfaceView', fallback: 'Surface View', action: () => this.sceneManager.setSurfaceView(this.uiManager.cameraTarget) },
            { key: 'detach', icon: '🚀', labelKey: 'controls.sections.freeCam', fallback: 'Free Camera', action: () => this.sceneManager.detachCamera() }
        ];

        modes.forEach(m => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `cam-mode-btn ${m.key === 'orbit' ? 'active' : ''}`;
            btn.dataset.modeKey = m.key;
            btn.innerHTML = `${m.icon} <span data-i18n-key="${m.labelKey}">${i18n.t(m.labelKey) || m.fallback}</span>`;
            btn.onclick = () => {
                m.action();
                this.camModeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            segmented.appendChild(btn);
            this.camModeButtons.set(m.key, btn);
        });

        modesGroup.appendChild(segmented);
        panel.appendChild(modesGroup);

        // Cinematic Tour Section
        const tourGroup = document.createElement('div');
        tourGroup.className = 'ctrl-group';

        const tourTitle = document.createElement('h4');
        tourTitle.className = 'ctrl-group-title';
        tourTitle.innerHTML = `<span data-i18n-key="controls.cinematicTour">${i18n.t('controls.cinematicTour') || 'Cinematic Grand Tour'}</span>`;
        tourGroup.appendChild(tourTitle);

        const tourRow = document.createElement('div');
        tourRow.className = 'ctrl-row-toggle';

        const tourLabel = document.createElement('label');
        tourLabel.className = 'toggle-label-wrap';
        tourLabel.innerHTML = `<span class="toggle-icon">🎬</span><span data-i18n-key="controls.sections.autonomousTour">${i18n.t('controls.sections.autonomousTour') || 'Autonomous Grand Tour'}</span>`;
        tourRow.appendChild(tourLabel);

        const tourSwitch = document.createElement('label');
        tourSwitch.className = 'sci-switch';

        const tourInput = document.createElement('input');
        tourInput.type = 'checkbox';
        tourInput.checked = this.sceneManager.tourMode;
        tourInput.onchange = () => {
            const val = tourInput.checked;
            this.sceneManager.tourMode = val;
            if (this.uiManager.tourController) {
                this.uiManager.tourController.setValue(val);
            }
            if (val) {
                this.sceneManager.tourTimer = 0;
                const targetName = this.sceneManager.tourTargets[this.sceneManager.tourIndex];
                this.sceneManager.focusOnBody(targetName);
                EventBus.emit('tour-focus', targetName);
            } else {
                this.sceneManager.detachCamera();
            }
        };
        tourSwitch.appendChild(tourInput);
        tourSwitch.appendChild(document.createElement('span')).className = 'sci-slider';
        tourRow.appendChild(tourSwitch);
        tourGroup.appendChild(tourRow);
        this.switches.set('tourMode', tourInput);

        // Tour Speed Slider
        const tourSpeedWrap = document.createElement('div');
        tourSpeedWrap.className = 'speed-slider-wrap';

        const tourSlider = document.createElement('input');
        tourSlider.type = 'range';
        tourSlider.min = '1';
        tourSlider.max = '10';
        tourSlider.step = '1';
        tourSlider.value = '5';
        tourSlider.oninput = () => {
            const speed = parseInt(tourSlider.value, 10);
            this.sceneManager.tourInterval = 22 - (speed * 2);
            if (this.tourSpeedDisplay) {
                this.tourSpeedDisplay.textContent = `${this.sceneManager.tourInterval}s / body`;
            }
        };
        tourSpeedWrap.appendChild(tourSlider);

        const tourSpeedVal = document.createElement('span');
        tourSpeedVal.className = 'speed-val-display';
        tourSpeedVal.textContent = '12s / body';
        tourSpeedWrap.appendChild(tourSpeedVal);
        this.tourSpeedDisplay = tourSpeedVal;

        tourGroup.appendChild(tourSpeedWrap);
        panel.appendChild(tourGroup);

        // Distance Measurement Tool
        const measureGroup = document.createElement('div');
        measureGroup.className = 'ctrl-group';

        const measureTitle = document.createElement('h4');
        measureTitle.className = 'ctrl-group-title';
        measureTitle.innerHTML = `<span data-i18n-key="controls.measureDistance">${i18n.t('controls.measureDistance') || 'Distance Measuring Tool'}</span>`;
        measureGroup.appendChild(measureTitle);

        const measureRow = document.createElement('div');
        measureRow.className = 'ctrl-row-toggle';

        const measureLabel = document.createElement('label');
        measureLabel.className = 'toggle-label-wrap';
        measureLabel.innerHTML = `<span class="toggle-icon">📐</span><span data-i18n-key="controls.measureDistance">${i18n.t('controls.measureDistance') || 'Measure Mode'}</span>`;
        measureRow.appendChild(measureLabel);

        const measureSwitch = document.createElement('label');
        measureSwitch.className = 'sci-switch';

        const measureInput = document.createElement('input');
        measureInput.type = 'checkbox';
        measureInput.checked = this.sceneManager.measureMode;
        measureInput.onchange = () => {
            this.sceneManager.toggleMeasureMode(measureInput.checked);
        };
        measureSwitch.appendChild(measureInput);
        measureSwitch.appendChild(document.createElement('span')).className = 'sci-slider';
        measureRow.appendChild(measureSwitch);
        measureGroup.appendChild(measureRow);
        this.switches.set('measureMode', measureInput);

        panel.appendChild(measureGroup);
        return panel;
    }

    // =========================================================================
    // TAB 5: OPTICS & ENVIRONMENT PANEL
    // =========================================================================
    private createOpticsPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = `drawer-panel ${this.activeTab === 'optics' ? 'active' : ''}`;
        panel.dataset.panel = 'optics';
        this.tabPanels.set('optics', panel);

        const group = document.createElement('div');
        group.className = 'ctrl-group';

        const title = document.createElement('h4');
        title.className = 'ctrl-group-title';
        title.innerHTML = `<span data-i18n-key="controls.sections.opticsScale">${i18n.t('controls.sections.opticsScale') || 'Optics & Physical Scale'}</span>`;
        group.appendChild(title);

        const opticsConfig = [
            {
                prop: 'realisticDistances',
                key: 'controls.realisticScale',
                icon: '📏',
                initial: false,
                onChange: (v: boolean) => {
                    this.sceneManager.toggleRealisticDistances(v);
                    if (v) {
                        this.uiManager.modal.show({
                            name: i18n.t('popups.trueScaleTitle'),
                            description: i18n.t('popups.trueScaleDesc')
                        });
                    }
                }
            },
            {
                prop: 'showHabitableZone',
                key: 'controls.habitableZone',
                icon: '🌱',
                initial: false,
                onChange: (v: boolean) => this.sceneManager.toggleHabitableZone(v)
            },
            {
                prop: 'showEclipticGrid',
                key: 'controls.eclipticGrid',
                icon: '🌐',
                initial: false,
                onChange: (v: boolean) => this.sceneManager.toggleEclipticGrid(v)
            },
            {
                prop: 'enableBloom',
                key: 'controls.enableBloom',
                icon: '✨',
                initial: true,
                onChange: (v: boolean) => {
                    if (this.sceneManager.bloomPass) {
                        this.sceneManager.bloomPass.enabled = v;
                    }
                }
            },
            {
                prop: 'realisticLighting',
                key: 'controls.realisticLighting',
                icon: '💡',
                initial: false,
                onChange: (v: boolean) => this.sceneManager.toggleRealisticLighting(v)
            },
            {
                prop: 'showAxes',
                key: 'controls.showAxes',
                icon: '🧭',
                initial: false,
                onChange: (v: boolean) => this.sceneManager.toggleAxes(v)
            }
        ];

        opticsConfig.forEach(cfg => {
            const row = document.createElement('div');
            row.className = 'ctrl-row-toggle';

            const labelWrap = document.createElement('label');
            labelWrap.className = 'toggle-label-wrap';

            const icon = document.createElement('span');
            icon.className = 'toggle-icon';
            icon.textContent = cfg.icon;
            labelWrap.appendChild(icon);

            const labelText = document.createElement('span');
            labelText.dataset.i18nKey = cfg.key;
            labelText.textContent = i18n.t(cfg.key);
            labelWrap.appendChild(labelText);

            row.appendChild(labelWrap);

            const switchWrap = document.createElement('label');
            switchWrap.className = 'sci-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = cfg.initial;
            input.onchange = () => cfg.onChange(input.checked);
            switchWrap.appendChild(input);

            const slider = document.createElement('span');
            slider.className = 'sci-slider';
            switchWrap.appendChild(slider);

            row.appendChild(switchWrap);
            group.appendChild(row);

            this.switches.set(cfg.prop, input);
        });

        panel.appendChild(group);
        return panel;
    }

    // =========================================================================
    // TAB 6: SYSTEM & OBSERVATORY TOOLS PANEL
    // =========================================================================
    private createSystemPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = `drawer-panel ${this.activeTab === 'system' ? 'active' : ''}`;
        panel.dataset.panel = 'system';
        this.tabPanels.set('system', panel);

        // Tools Group
        const toolsGroup = document.createElement('div');
        toolsGroup.className = 'ctrl-group';

        const toolsTitle = document.createElement('h4');
        toolsTitle.className = 'ctrl-group-title';
        toolsTitle.innerHTML = `<span data-i18n-key="controls.sections.observatoryInstruments">${i18n.t('controls.sections.observatoryInstruments') || 'Observatory Instruments'}</span>`;
        toolsGroup.appendChild(toolsTitle);

        // Radar Toggle
        const radarRow = document.createElement('div');
        radarRow.className = 'ctrl-row-toggle';
        radarRow.innerHTML = `<span class="toggle-label-wrap"><span class="toggle-icon">🛰️</span><span data-i18n-key="controls.showMinimap">${i18n.t('controls.showMinimap') || 'Tactical Radar Minimap'}</span><kbd class="ctrl-kbd-badge">M</kbd></span>`;
        const radarSwitch = document.createElement('label');
        radarSwitch.className = 'sci-switch';
        const radarInput = document.createElement('input');
        radarInput.type = 'checkbox';
        radarInput.checked = this.uiManager?.minimap?.isVisible || false;
        radarInput.onchange = () => {
            this.uiManager.minimap.setVisible(radarInput.checked);
            const radarBtn = document.getElementById('hudRadarBtn');
            if (radarBtn) radarBtn.classList.toggle('active', radarInput.checked);
            if (this.uiManager.audioManager) this.uiManager.audioManager.playTick();
        };
        radarSwitch.appendChild(radarInput);
        radarSwitch.appendChild(document.createElement('span')).className = 'sci-slider';
        radarRow.appendChild(radarSwitch);
        toolsGroup.appendChild(radarRow);
        this.switches.set('minimap', radarInput);

        // Performance Telemetry Toggle
        const perfRow = document.createElement('div');
        perfRow.className = 'ctrl-row-toggle';
        perfRow.innerHTML = `<span class="toggle-label-wrap"><span class="toggle-icon">⚡</span><span data-i18n-key="ui.telemetry">${i18n.t('ui.telemetry') || 'Engine Performance Telemetry'}</span><kbd class="ctrl-kbd-badge">P</kbd></span>`;
        const perfSwitch = document.createElement('label');
        perfSwitch.className = 'sci-switch';
        const perfInput = document.createElement('input');
        perfInput.type = 'checkbox';
        perfInput.checked = this.uiManager?.performanceMonitor?.getVisible() || false;
        perfInput.onchange = () => {
            this.uiManager.performanceMonitor.setVisible(perfInput.checked);
            const perfBtn = document.getElementById('hudPerfBtn');
            if (perfBtn) perfBtn.classList.toggle('active', perfInput.checked);
            if (this.uiManager.audioManager) this.uiManager.audioManager.playTick();
        };
        perfSwitch.appendChild(perfInput);
        perfSwitch.appendChild(document.createElement('span')).className = 'sci-slider';
        perfRow.appendChild(perfSwitch);
        toolsGroup.appendChild(perfRow);
        this.switches.set('telemetry', perfInput);

        panel.appendChild(toolsGroup);
        return panel;
    }

    // =========================================================================
    // PUBLIC CONTROL METHODS
    // =========================================================================
    public toggle(forceOpen?: boolean) {
        if (forceOpen !== undefined) {
            this.isOpen = forceOpen;
        } else {
            this.isOpen = !this.isOpen;
        }

        if (this.isOpen) {
            this.drawerElement.classList.remove('closed');
            this.backdropElement.classList.add('open');
            this.syncTimePanel();
            this.syncSwitches();
        } else {
            this.drawerElement.classList.add('closed');
            this.backdropElement.classList.remove('open');
        }

        const controlsBtn = document.getElementById('hudControlsBtn');
        if (controlsBtn) {
            controlsBtn.classList.toggle('active', this.isOpen);
        }
    }

    public open(tab?: ControlCenterTab) {
        if (tab) this.switchTab(tab);
        this.toggle(true);
    }

    public close() {
        this.toggle(false);
    }

    public switchTab(tab: ControlCenterTab) {
        this.activeTab = tab;

        this.tabButtons.forEach((btn, id) => {
            btn.classList.toggle('active', id === tab);
        });

        this.tabPanels.forEach((panel, id) => {
            panel.classList.toggle('active', id === tab);
        });
    }

    public updateActiveTargetChips(targetName: string) {
        this.targetChipButtons.forEach((btn, name) => {
            btn.classList.toggle('active', name === targetName);
        });
    }

    public updatePauseButton() {
        if (!this.pauseBtn) return;
        const isPaused = this.sceneManager?.timeScale === 0;
        const pauseText = i18n.t('controls.sections.pauseSimulation') || i18n.t('controls.pause') || 'Pause Simulation';
        const resumeText = i18n.t('controls.sections.resumeSimulation') || i18n.t('controls.resume') || 'Resume Simulation';
        this.pauseBtn.innerHTML = isPaused
            ? `<span>▶ ${resumeText}</span>`
            : `<span>⏸ ${pauseText}</span>`;
    }

    public syncTimePanel() {
        this.updatePauseButton();

        const currentSpeed = this.sceneManager?.timeScale || 0;
        const isPaused = this.sceneManager?.timeScale === 0;
        if (this.speedSlider) {
            this.speedSlider.value = currentSpeed.toString();
        }

        if (this.speedDisplay) {
            const formatted = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
                ? this.sceneManager.getFormattedTimeSpeed()
                : '1.0 day/s';
            const pausedText = i18n.t('controls.speedPresets.paused') || 'Paused';
            this.speedDisplay.textContent = isPaused ? pausedText : formatted;
        }

        // Update active preset button
        const presets = SceneManager.SPEED_PRESETS;
        let matchedKey = 'custom';
        if (isPaused) matchedKey = 'paused';
        else if (currentSpeed > 0 && currentSpeed <= presets.realTime * 1.5) matchedKey = 'realTime';
        else if (Math.abs(currentSpeed - presets.oneHour) < 0.0002) matchedKey = 'oneHour';
        else if (Math.abs(currentSpeed - presets.oneDay) < 0.002) matchedKey = 'oneDay';
        else if (Math.abs(currentSpeed - presets.oneWeek) < 0.01) matchedKey = 'oneWeek';
        else if (Math.abs(currentSpeed - presets.oneMonth) < 0.05) matchedKey = 'oneMonth';

        this.presetButtons.forEach((btn, key) => {
            btn.classList.toggle('active', key === matchedKey);
        });
    }

    public syncSwitches() {
        const sm = this.sceneManager;
        if (!sm) return;

        const setChecked = (key: string, val: boolean) => {
            const sw = this.switches.get(key);
            if (sw && sw.checked !== val) sw.checked = val;
        };

        setChecked('showOrbits', sm.showOrbits);
        setChecked('showMoons', sm.showMoons);
        setChecked('showAsteroids', sm.showAsteroids);
        setChecked('showKuiperBelt', sm.showKuiperBelt);
        setChecked('showDwarfPlanets', sm.showDwarfPlanets);
        setChecked('showComets', sm.showComets);
        setChecked('showSpacecraft', sm.showSpacecrafts);
        setChecked('showTrails', sm.showTrails);
        setChecked('showHabitableZone', sm.showHabitableZone);
        setChecked('showEclipticGrid', sm.showEclipticGrid);
        setChecked('enableBloom', sm.bloomPass ? sm.bloomPass.enabled : true);
        setChecked('realisticLighting', sm.realisticLighting);
        setChecked('showAxes', sm.showAxes);
        setChecked('realisticDistances', sm.realisticDistances);
        setChecked('tourMode', sm.tourMode);
        setChecked('measureMode', sm.measureMode);
        setChecked('minimap', this.uiManager?.minimap?.isVisible || false);
        setChecked('telemetry', this.uiManager?.performanceMonitor?.getVisible() || false);
    }

    public updateTranslations() {
        if (this.mainTitleEl) {
            this.mainTitleEl.textContent = i18n.t('controls.drawerTitle') || 'Observatory Command';
        }
        if (this.subTitleEl) {
            this.subTitleEl.textContent = i18n.t('controls.drawerSubtitle') || 'Unified Celestial Simulation Controls';
        }
        if (this.closeBtnEl) {
            this.closeBtnEl.setAttribute('aria-label', i18n.t('ui.close') || 'Close Menu');
        }

        this.tabButtons.forEach((btn, id) => {
            const labelSpan = btn.querySelector('.tab-label');
            const label = this.getTabLabel(id);
            if (labelSpan) labelSpan.textContent = label;
            btn.title = label;
            btn.setAttribute('aria-label', label);
        });

        if (this.drawerElement) {
            this.drawerElement.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach(el => {
                const key = el.dataset.i18nKey;
                if (key) {
                    const text = i18n.t(key);
                    if (text) el.textContent = text;
                }
            });
        }

        this.targetChipButtons.forEach((chip, name) => {
            const locName = i18n.getBodyName(name) || i18n.getStarName(name) || i18n.getSpacecraftName(name) || name;
            const span = chip.querySelector('.chip-name');
            if (span) span.textContent = locName;
        });

        const presetLabelMap: Record<string, string> = {
            realTime: 'controls.speedPresets.realTime',
            oneHour: 'controls.speedPresets.oneHourPerSec',
            oneDay: 'controls.speedPresets.oneDayPerSec',
            oneWeek: 'controls.speedPresets.oneWeekPerSec',
            oneMonth: 'controls.speedPresets.oneMonthPerSec',
            paused: 'controls.speedPresets.paused'
        };
        this.presetButtons.forEach((btn, key) => {
            const lk = presetLabelMap[key];
            if (lk) {
                const text = i18n.t(lk);
                if (text) btn.textContent = text;
            }
        });

        this.updatePauseButton();
        this.syncTimePanel();
        this.syncSwitches();
    }

    private initEventListeners() {
        this.onKeyDownBound = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        window.addEventListener('keydown', this.onKeyDownBound);

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.updateTranslations();
        });
    }

    public dispose() {
        if (this.unregisterI18n) {
            this.unregisterI18n();
            this.unregisterI18n = null;
        }
        if (this.onKeyDownBound) {
            window.removeEventListener('keydown', this.onKeyDownBound);
            this.onKeyDownBound = null;
        }
        if (this.drawerElement?.parentElement) {
            this.drawerElement.parentElement.removeChild(this.drawerElement);
        }
        if (this.backdropElement?.parentElement) {
            this.backdropElement.parentElement.removeChild(this.backdropElement);
        }
    }
}
