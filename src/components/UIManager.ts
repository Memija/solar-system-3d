import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Modal } from './Modal';
import { Minimap } from './Minimap';
import { CustomDatePicker } from './CustomDatePicker';
import { EventBus } from './EventBus';
import { CelestialBodyData, MoonData, StarData, ConstellationData, CometData, SpacecraftData } from './SolarSystemData';
import { i18n, AVAILABLE_LOCALES, getLocaleFlagUrl } from '../i18n/index';
import { AudioManager } from './AudioManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ControlCenter } from './ControlCenter';
import { HeaderSlotsManager } from './HeaderSlotsManager';
import { ScenePicker } from './ScenePicker';
import { ShortcutController } from './ShortcutController';
import { toggleShortcutsModal, openHeaderSlotsCustomizer } from './SecondaryModals';
import { svgIcon, stripLeadingEmoji } from './SvgIcons';

export class UIManager {
    sceneManager: SceneManager;
    scenePicker: ScenePicker;
    shortcutController: ShortcutController;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    selectedBody: CelestialBodyData | MoonData | StarData | ConstellationData | CometData | SpacecraftData | null;
    uiContainer: HTMLElement;
    infoPanel: HTMLElement;
    modal: Modal;
    eventModal: Modal;
    shortcutsModal: Modal;
    headerSlotsModal: Modal;
    headerSlotsContainer: HTMLElement | null = null;
    audioManager: AudioManager;
    performanceMonitor: PerformanceMonitor;
    menuContainer: HTMLElement | null = null;
    controlCenter: ControlCenter | null = null;
    targetPill: HTMLElement | null = null;
    mouseDownPos: THREE.Vector2;
    mouseUpPos: THREE.Vector2;
    datePanel: HTMLElement;
    customDatePicker: CustomDatePicker | null = null;
    minimap: Minimap;
    previousTimeSpeed: number | null = null;
    cameraTarget: string = 'Earth';
    ignoreNextBodyChange: boolean = false;
    dateLabel: HTMLElement | null = null;
    speedBadge: HTMLElement | null = null;
    timeBadge: HTMLElement | null = null;
    private timeNumsEl: HTMLElement | null = null;
    liveIndicator: HTMLElement | null = null;
    telemetryTicker: HTMLElement | null = null;
    private tickerBodyEl: HTMLElement | null = null;
    private tickerSpeedEl: HTMLElement | null = null;
    private tickerDistEl: HTMLElement | null = null;
    private realtimeDistanceKm: number = 0;
    private lastRealtimeDateMs: number = 0;
    private lastFormattedTime: string = '';

    private onTourFocusBound: ((e: Event) => void) | null = null;
    private onJumpToDateBound: ((e: Event) => void) | null = null;
    private onSelectCelestialBodyBound: ((e: Event) => void) | null = null;
    private onPointerDownBound: ((e: PointerEvent) => void) | null = null;
    private onPointerUpBound: ((e: PointerEvent) => void) | null = null;
    private onDocClickLangBound: (() => void) | null = null;
    private unsubscribeI18n: (() => void) | null = null;
    private unsubscribeMeasureMode: (() => void) | null = null;
    private unsubscribeMeasureTargets: (() => void) | null = null;
    closeLangDropdown: (() => void) | null = null;
    private measureHudBar: HTMLElement | null = null;
    private static readonly _measurePosA = new THREE.Vector3();
    private static readonly _measurePosB = new THREE.Vector3();

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.scenePicker = new ScenePicker(this);
        this.raycaster = this.scenePicker.raycaster;
        this.mouse = this.scenePicker.mouse;
        this.selectedBody = null;
        this.mouseDownPos = new THREE.Vector2();
        this.mouseUpPos = new THREE.Vector2();

        const container = document.getElementById('ui-container');
        if (!container) throw new Error('UI Container not found');
        this.uiContainer = container;

        this.infoPanel = this.createInfoPanel();
        this.modal = new Modal(this.uiContainer);
        this.eventModal = new Modal(this.uiContainer);
        this.eventModal.modalElement.style.top = '50%';
        this.eventModal.modalElement.style.left = '50%';
        this.eventModal.modalElement.style.right = 'auto';
        this.eventModal.modalElement.style.transform = 'translate(-50%, -50%)';
        this.eventModal.modalElement.style.borderTop = '4px solid gold';

        this.shortcutsModal = new Modal(this.uiContainer);
        this.shortcutsModal.modalElement.style.top = '50%';
        this.shortcutsModal.modalElement.style.left = '50%';
        this.shortcutsModal.modalElement.style.right = 'auto';
        this.shortcutsModal.modalElement.style.transform = 'translate(-50%, -50%)';
        this.shortcutsModal.modalElement.style.maxWidth = '580px';
        this.shortcutsModal.modalElement.style.width = '92vw';
        this.shortcutsModal.modalElement.style.borderTop = '3px solid #38bdf8';

        this.headerSlotsModal = new Modal(this.uiContainer);
        this.headerSlotsModal.modalElement.style.top = '50%';
        this.headerSlotsModal.modalElement.style.left = '50%';
        this.headerSlotsModal.modalElement.style.right = 'auto';
        this.headerSlotsModal.modalElement.style.transform = 'translate(-50%, -50%)';
        this.headerSlotsModal.modalElement.style.maxWidth = '760px';
        this.headerSlotsModal.modalElement.style.width = '94vw';
        this.headerSlotsModal.modalElement.style.maxHeight = '85vh';
        this.headerSlotsModal.modalElement.style.overflowY = 'auto';
        this.headerSlotsModal.modalElement.style.borderTop = '3px solid #38bdf8';
        this.headerSlotsModal.modalElement.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)';

        this.audioManager = new AudioManager();
        this.performanceMonitor = new PerformanceMonitor(this.sceneManager.renderer, this.uiContainer);

        this.datePanel = this.createDatePanel();
        this.minimap = new Minimap(sceneManager, this.uiContainer);

        this.createSelectionMenu();
        this.sceneManager.onTimeScaleChange = () => {
            this.controlCenter?.syncTimePanel();
        };

        this.initInteraction();
        this.shortcutController = new ShortcutController(this);

        this.createMeasureHudBar();
        this.updateMeasureHud();
        this.unsubscribeMeasureMode = EventBus.on('measure-mode-changed', () => this.updateMeasureHud());
        this.unsubscribeMeasureTargets = EventBus.on('measure-targets-changed', () => this.updateMeasureHud());

        this.onTourFocusBound = (e: Event) => {
            const customEvent = e as CustomEvent;
            const targetName = customEvent.detail;

            let foundData: any = null;
            const findTarget = (body: any) => {
                if (body.data.name === targetName) {
                    foundData = body.data;
                }
                if (body.moons) body.moons.forEach(findTarget);
            };
            this.sceneManager.planets.forEach(findTarget);
            if (!foundData) {
                const comet = this.sceneManager.comets.find(c => c.data.name === targetName);
                if (comet) foundData = comet.data;
            }
            if (!foundData) {
                const sc = this.sceneManager.spacecrafts.find(s => s.data.name === targetName);
                if (sc) foundData = sc.data;
            }
            if (foundData) {
                this.syncDropdownSelection(targetName);
                this.audioManager.playWarp();
                this.showModal(foundData);
            }
        };
        window.addEventListener('tour-focus', this.onTourFocusBound);

        this.onJumpToDateBound = (e: Event) => {
            const customEvent = e as CustomEvent;
            const dateStr = customEvent.detail;
            if (dateStr && this.sceneManager.setSimDate) {
                const newDate = new Date(dateStr);
                this.sceneManager.setSimDate(newDate);
                if (this.customDatePicker) {
                    this.customDatePicker.setDate(newDate);
                }

                this.sceneManager.timeScale = 0;
                if (this.sceneManager.onTimeScaleChange) {
                    this.sceneManager.onTimeScaleChange(0);
                }
                this.controlCenter?.syncTimePanel();
            }
        };
        window.addEventListener('jump-to-date', this.onJumpToDateBound);

        this.onSelectCelestialBodyBound = (e: Event) => {
            this.audioManager.playSelect();
            const customEvent = e as CustomEvent;
            const targetName = customEvent.detail?.name || customEvent.detail;
            const eventName = customEvent.detail?.eventName;
            const eventImpact = customEvent.detail?.eventImpact;

            this.cameraTarget = targetName;
            this.focusOrSurfaceTarget(targetName);
            this.syncDropdownSelection(targetName);

            let foundData: any = null;
            const findTarget = (body: any) => {
                if (body.data.name === targetName) foundData = { ...body.data };
                if (body.moons) body.moons.forEach(findTarget);
            };
            this.sceneManager.planets.forEach(findTarget);
            if (!foundData) {
                const comet = this.sceneManager.comets.find(c => c.data.name === targetName);
                if (comet) foundData = { ...comet.data };
            }
            if (!foundData) {
                const sc = this.sceneManager.spacecrafts.find(s => s.data.name === targetName);
                if (sc) foundData = { ...sc.data };
            }
            if (foundData) {
                this.showModal(foundData);
                if (eventName && eventImpact) {
                    this.eventModal.show({
                        name: `${eventName}`,
                        description: `<div style="padding: 10px; background-color: rgba(255, 215, 0, 0.2); margin-bottom: 10px; color: white;">${eventImpact}</div>`
                    });
                }
            }
        };
        window.addEventListener('select-celestial-body', this.onSelectCelestialBodyBound);
    }

    public setTourMode(enabled: boolean, detachOnExit: boolean = true): void {
        if (!this.sceneManager) return;
        this.sceneManager.tourMode = enabled;
        if (enabled) {
            this.sceneManager.tourTimer = 0;
            const targetName = this.sceneManager.tourTargets
                ? this.sceneManager.tourTargets[this.sceneManager.tourIndex || 0]
                : 'Mercury';
            if (typeof this.sceneManager.focusOnBody === 'function') {
                this.sceneManager.focusOnBody(targetName);
            }
            EventBus.emit('tour-focus', targetName);
        } else if (detachOnExit && typeof this.sceneManager.detachCamera === 'function') {
            this.sceneManager.detachCamera();
        }
        this.controlCenter?.syncSwitches();
        if (this.headerSlotsContainer) {
            HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
        }
    }

    public setRealisticDistances(enabled: boolean): void {
        if (!this.sceneManager) return;
        if (typeof this.sceneManager.toggleRealisticDistances === 'function') {
            this.sceneManager.toggleRealisticDistances(enabled);
        } else {
            this.sceneManager.realisticDistances = enabled;
        }
        if (enabled) {
            this.modal?.show({
                titleKey: 'popups.trueScaleTitle',
                descKey: 'popups.trueScaleDesc',
                name: i18n.t('popups.trueScaleTitle'),
                description: i18n.t('popups.trueScaleDesc')
            });
        } else if (
            this.modal?.isOpen &&
            (this.modal.isShowingPopup('popups.trueScaleTitle') ||
                this.modal.titleElement?.textContent === i18n.t('popups.trueScaleTitle'))
        ) {
            this.modal.hide();
        }
        this.controlCenter?.syncSwitches();
        if (this.headerSlotsContainer) {
            HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
        }
    }

    createInfoPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'hud-info-panel';
        this.uiContainer.appendChild(panel);
        return panel;
    }

    createDatePanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'date-panel-hud obs-mission-clock';
        panel.style.zIndex = '1000';
        panel.style.pointerEvents = 'auto';

        const mainRow = document.createElement('div');
        mainRow.className = 'date-panel-main-row';

        const label = document.createElement('button');
        label.type = 'button';
        label.className = 'sim-date-label';
        label.title = i18n.t('datepicker.calendarTitle') || 'Open Mission Calendar';
        const simDateText = stripLeadingEmoji(i18n.t('ui.simDate') || '');
        label.innerHTML = `<span class="date-clock-icon">${svgIcon('clock')}</span> <span class="date-label-text">${simDateText}</span>`;
        label.onclick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            this.customDatePicker?.togglePopup();
        };
        this.dateLabel = label;
        mainRow.appendChild(label);

        const initialDate = this.sceneManager.simDate || new Date();
        this.customDatePicker = new CustomDatePicker(
            initialDate,
            (newDate: Date) => {
                if (this.sceneManager.setSimDate) {
                    this.sceneManager.setSimDate(newDate);
                    this.sceneManager.timeScale = 0;
                    this.sceneManager.onTimeScaleChange?.(0);
                }
                this.controlCenter?.syncTimePanel();
            },
            () => {
                this.controlCenter?.customDatePicker?.closePopup();
                this.sceneManager.timeScale = 0;
                this.sceneManager.onTimeScaleChange?.(0);
                this.controlCenter?.syncTimePanel();
            }
        );

        mainRow.appendChild(this.customDatePicker.domElement);

        const timeBadge = document.createElement('div');
        timeBadge.className = 'sim-time-badge';
        timeBadge.title = i18n.t('ui.utcTime');
        const timeNumsEl = document.createElement('span');
        timeNumsEl.className = 'time-nums';
        const timeTzEl = document.createElement('span');
        timeTzEl.className = 'time-tz';
        timeTzEl.textContent = 'UTC';
        timeBadge.appendChild(timeNumsEl);
        timeBadge.appendChild(document.createTextNode(' '));
        timeBadge.appendChild(timeTzEl);
        mainRow.appendChild(timeBadge);
        this.timeBadge = timeBadge;
        this.timeNumsEl = timeNumsEl;

        const speedBadge = document.createElement('button');
        speedBadge.type = 'button';
        speedBadge.className = 'sim-speed-badge';
        speedBadge.title = i18n.t('ui.speedPause');
        const isPaused = this.sceneManager?.timeScale === 0;
        const speedText = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
            ? this.sceneManager.getFormattedTimeSpeed()
            : '1.0 day/s';
        const pausedLabel = i18n.t('controls.speedPresets.paused') || 'Paused';
        speedBadge.textContent = isPaused ? `⏸ ${pausedLabel}` : `▶ ${speedText}`;
        if (isPaused) speedBadge.classList.add('paused');
        speedBadge.onclick = () => {
            this.togglePause();
        };
        this.speedBadge = speedBadge;
        mainRow.appendChild(speedBadge);

        const liveIndicator = document.createElement('div');
        liveIndicator.className = 'sim-live-indicator';
        liveIndicator.title = i18n.t('ui.liveRealTime');
        liveIndicator.innerHTML = '<span class="live-pulse-dot"></span><span class="live-text">LIVE 1:1</span>';
        liveIndicator.style.display = 'none';
        mainRow.appendChild(liveIndicator);
        this.liveIndicator = liveIndicator;

        panel.appendChild(mainRow);

        const telemetryTicker = document.createElement('div');
        telemetryTicker.className = 'sim-telemetry-ticker';
        telemetryTicker.style.display = 'none';
        const tickerBodyEl = document.createElement('span');
        tickerBodyEl.className = 'ticker-body';
        const tickerSpeedEl = document.createElement('span');
        tickerSpeedEl.className = 'ticker-speed';
        const tickerDividerEl = document.createElement('span');
        tickerDividerEl.className = 'ticker-divider';
        tickerDividerEl.textContent = '•';
        const tickerDistEl = document.createElement('span');
        tickerDistEl.className = 'ticker-dist';
        telemetryTicker.appendChild(tickerBodyEl);
        telemetryTicker.appendChild(document.createTextNode(' '));
        telemetryTicker.appendChild(tickerSpeedEl);
        telemetryTicker.appendChild(document.createTextNode(' '));
        telemetryTicker.appendChild(tickerDividerEl);
        telemetryTicker.appendChild(document.createTextNode(' '));
        telemetryTicker.appendChild(tickerDistEl);
        panel.appendChild(telemetryTicker);
        this.telemetryTicker = telemetryTicker;
        this.tickerBodyEl = tickerBodyEl;
        this.tickerSpeedEl = tickerSpeedEl;
        this.tickerDistEl = tickerDistEl;

        this.uiContainer.appendChild(panel);
        return panel;
    }

    private getOrbitalVelocity(bodyName: string): { speedKmS: number; label: string } {
        if (bodyName === 'Sun') {
            return { speedKmS: 220, label: `${i18n.getBodyName('Sun') || 'Sun'} (Milky Way)` };
        }
        const velocities: Record<string, { speedKmS: number; key: string }> = {
            Mercury: { speedKmS: 47.4, key: 'Mercury' },
            Venus: { speedKmS: 35.0, key: 'Venus' },
            Earth: { speedKmS: 29.8, key: 'Earth' },
            Mars: { speedKmS: 24.1, key: 'Mars' },
            Jupiter: { speedKmS: 13.1, key: 'Jupiter' },
            Saturn: { speedKmS: 9.7, key: 'Saturn' },
            Uranus: { speedKmS: 6.8, key: 'Uranus' },
            Neptune: { speedKmS: 5.4, key: 'Neptune' },
            Pluto: { speedKmS: 4.7, key: 'Pluto' },
            Moon: { speedKmS: 1.0, key: 'Moon' },
            ISS: { speedKmS: 7.7, key: 'ISS' },
            Hubble: { speedKmS: 7.6, key: 'Hubble' },
            Voyager: { speedKmS: 17.0, key: 'Voyager 1' },
            'James Webb': { speedKmS: 1.1, key: 'JWST' },
            Cassini: { speedKmS: 18.0, key: 'Cassini' },
            Halley: { speedKmS: 54.6, key: 'Halley' }
        };
        for (const [key, val] of Object.entries(velocities)) {
            if (bodyName.includes(key) || key.includes(bodyName)) {
                const localized =
                    i18n.getBodyName(val.key) ||
                    i18n.getSpacecraftName(val.key) ||
                    i18n.getCometName(val.key) ||
                    val.key;
                return { speedKmS: val.speedKmS, label: localized };
            }
        }
        return { speedKmS: 29.8, label: i18n.getBodyName(bodyName) || bodyName || 'Earth' };
    }

    update(timestamp: number = performance.now()): void {
        if (this.sceneManager.simDate) {
            if (this.customDatePicker && !this.customDatePicker.isOpen) {
                this.customDatePicker.setDate(this.sceneManager.simDate);
            }

            if (this.timeNumsEl) {
                const d = this.sceneManager.simDate;
                const hh = String(d.getUTCHours()).padStart(2, '0');
                const mm = String(d.getUTCMinutes()).padStart(2, '0');
                const ss = String(d.getUTCSeconds()).padStart(2, '0');
                const timeStr = `${hh}:${mm}:${ss}`;
                if (timeStr !== this.lastFormattedTime) {
                    this.lastFormattedTime = timeStr;
                    this.timeNumsEl.textContent = timeStr;
                }
            }
        }

        const isPaused = this.sceneManager?.timeScale === 0;
        const isRealTime = !isPaused && (this.sceneManager?.timeScale <= SceneManager.SPEED_PRESETS.realTime * 1.5);

        if (this.speedBadge) {
            const speedText = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
                ? this.sceneManager.getFormattedTimeSpeed()
                : '1.0 day/s';
            const pausedLabel = i18n.t('controls.speedPresets.paused') || 'Paused';
            const text = isPaused ? `⏸ ${pausedLabel}` : `▶ ${speedText}`;
            if (this.speedBadge.textContent !== text) {
                this.speedBadge.textContent = text;
                this.speedBadge.classList.toggle('paused', isPaused);
            }
        }

        if (this.liveIndicator) {
            this.liveIndicator.style.display = isRealTime ? 'inline-flex' : 'none';
        }

        if (this.telemetryTicker) {
            if (isRealTime && this.sceneManager.simDate) {
                this.telemetryTicker.style.display = 'flex';
                const currentSimMs = this.sceneManager.simDate.getTime();
                if (this.lastRealtimeDateMs > 0 && currentSimMs > this.lastRealtimeDateMs) {
                    const elapsedSec = (currentSimMs - this.lastRealtimeDateMs) / 1000;
                    if (elapsedSec > 0 && elapsedSec < 5) {
                        const targetName = (this.sceneManager.focusedBody as any)?.data?.name || 'Earth';
                        const vel = this.getOrbitalVelocity(targetName);
                        this.realtimeDistanceKm += elapsedSec * vel.speedKmS;
                    }
                }
                this.lastRealtimeDateMs = currentSimMs;

                const targetName = (this.sceneManager.focusedBody as any)?.data?.name || 'Earth';
                const vel = this.getOrbitalVelocity(targetName);
                const distFormatted = this.realtimeDistanceKm >= 1000
                    ? `${i18n.formatNumber(Math.round(this.realtimeDistanceKm))} km`
                    : `${i18n.formatNumber(this.realtimeDistanceKm, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;

                if (this.tickerBodyEl) this.tickerBodyEl.textContent = vel.label;
                if (this.tickerSpeedEl) this.tickerSpeedEl.textContent = `${i18n.formatNumber(vel.speedKmS, { maximumFractionDigits: 2 })} km/s`;
                if (this.tickerDistEl) this.tickerDistEl.textContent = `Orbit: +${distFormatted}`;
            } else {
                this.telemetryTicker.style.display = 'none';
                if (this.sceneManager.simDate) {
                    this.lastRealtimeDateMs = this.sceneManager.simDate.getTime();
                }
            }
        }

        this.minimap?.update();
        this.performanceMonitor?.update(timestamp);

        if (this.controlCenter?.isOpen) {
            this.controlCenter.syncTimePanel();
        }
        if (this.sceneManager.measureMode && this.sceneManager.measureTargetA && this.sceneManager.measureTargetB) {
            this.updateMeasureHud();
        }
    }

    public togglePause(): void {
        if (!this.sceneManager) return;
        if (this.sceneManager.timeScale === 0) {
            const restored = (this.previousTimeSpeed && this.previousTimeSpeed > 0)
                ? this.previousTimeSpeed
                : (SceneManager.REALISTIC_TIME_SCALE || 0.00273785);
            this.sceneManager.timeScale = restored;
            this.sceneManager.onTimeScaleChange?.(restored);
        } else {
            this.previousTimeSpeed = this.sceneManager.timeScale;
            this.sceneManager.timeScale = 0;
            this.sceneManager.onTimeScaleChange?.(0);
        }
        this.controlCenter?.syncTimePanel();
    }

    public toggleMinimap(): boolean {
        if (!this.minimap) return false;
        const next = !this.minimap.isVisible;
        this.minimap.setVisible(next);
        const radarBtn = document.getElementById('hudRadarBtn');
        if (radarBtn) {
            radarBtn.classList.toggle('active', next);
            radarBtn.setAttribute('aria-pressed', String(next));
        }
        this.controlCenter?.syncSwitches();
        this.audioManager?.playTick?.();
        if (this.headerSlotsContainer) {
            HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
        }
        return next;
    }

    createSelectionMenu(): void {
        const menuContainer = document.createElement('div');
        this.menuContainer = menuContainer;
        menuContainer.className = 'selection-menu-container observatory-header-bar';
        menuContainer.style.zIndex = '1600';

        const typeSelect = document.createElement('select');
        typeSelect.id = 'typeSelect';
        const getTypes = () => [
            { value: 'Star', label: i18n.t('categories.star') },
            { value: 'Planet', label: i18n.t('categories.planet') },
            { value: 'Moon', label: i18n.t('categories.moon') },
            { value: 'Constellation', label: i18n.t('categories.constellation') },
            { value: 'Comet', label: i18n.t('categories.comet') },
            { value: 'Spacecraft', label: i18n.t('categories.spacecraft') }
        ];

        const populateTypeOptions = () => {
            const currentVal = typeSelect.value || 'Planet';
            typeSelect.innerHTML = '';
            getTypes().forEach(t => {
                const option = document.createElement('option');
                option.value = t.value;
                option.textContent = stripLeadingEmoji(t.label);
                typeSelect.appendChild(option);
            });
            typeSelect.value = currentVal;
        };

        const bodySelect = document.createElement('select');
        bodySelect.id = 'bodySelect';

        const updateBodyOptions = () => {
            const currentVal = bodySelect.value;
            bodySelect.innerHTML = '';
            const selectedType = typeSelect.value;

            if (selectedType === 'Star') {
                const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                if (sun) {
                    const option = document.createElement('option');
                    option.value = 'Sun';
                    option.textContent = i18n.getBodyName('Sun');
                    bodySelect.appendChild(option);
                }
                this.sceneManager.starMeshes.forEach(mesh => {
                    if (mesh.userData?.name) {
                        const option = document.createElement('option');
                        option.value = mesh.userData.name;
                        option.textContent = i18n.getStarName(mesh.userData.name);
                        bodySelect.appendChild(option);
                    }
                });
            } else if (selectedType === 'Planet') {
                this.sceneManager.planets.forEach(planet => {
                    if (planet.data.name !== 'Sun') {
                        const option = document.createElement('option');
                        option.value = planet.data.name;
                        option.textContent = i18n.getBodyName(planet.data.name);
                        bodySelect.appendChild(option);
                    }
                });
            } else if (selectedType === 'Moon') {
                this.sceneManager.planets.forEach(planet => {
                    if (planet.moons && planet.moons.length > 0) {
                        planet.moons.forEach(moon => {
                            const option = document.createElement('option');
                            option.value = moon.data.name;
                            const moonName = i18n.getBodyName(moon.data.name);
                            const planetName = i18n.getBodyName(planet.data.name);
                            option.textContent = `${moonName} ${i18n.t('ui.orbiting', { planet: planetName })}`;
                            bodySelect.appendChild(option);
                        });
                    }
                });
            } else if (selectedType === 'Constellation') {
                if (this.sceneManager.constellationManager) {
                    this.sceneManager.constellationManager.constellationMeshes.forEach(group => {
                        if (group.userData?.name) {
                            const option = document.createElement('option');
                            option.value = group.userData.name;
                            option.textContent = i18n.getConstellationName(group.userData.name);
                            bodySelect.appendChild(option);
                        }
                    });
                }
            } else if (selectedType === 'Comet') {
                this.sceneManager.comets.forEach(comet => {
                    const option = document.createElement('option');
                    option.value = comet.data.name;
                    option.textContent = i18n.getCometName(comet.data.name);
                    bodySelect.appendChild(option);
                });
            } else if (selectedType === 'Spacecraft') {
                this.sceneManager.spacecrafts.forEach(sc => {
                    const option = document.createElement('option');
                    option.value = sc.data.name;
                    option.textContent = i18n.getSpacecraftName(sc.data.name);
                    bodySelect.appendChild(option);
                });
            }

            if (currentVal && Array.from(bodySelect.options).some(opt => opt.value === currentVal)) {
                bodySelect.value = currentVal;
            }
        };

        populateTypeOptions();
        typeSelect.value = 'Planet';
        updateBodyOptions();
        if (Array.from(bodySelect.options).some(opt => opt.value === this.cameraTarget)) {
            bodySelect.value = this.cameraTarget;
        }

        typeSelect.addEventListener('change', () => {
            updateBodyOptions();
            if (bodySelect.options.length > 0) {
                bodySelect.selectedIndex = 0;
                bodySelect.dispatchEvent(new Event('change'));
            }
        });

        bodySelect.addEventListener('change', () => {
            if (this.ignoreNextBodyChange) return;
            const selectedName = bodySelect.value;
            this.cameraTarget = selectedName;
            const selectedType = typeSelect.value;

            if (this.sceneManager.tourMode) {
                this.setTourMode(false, false);
            }

            if (this.sceneManager.measureMode) {
                this.sceneManager.setMeasureTarget(selectedName);
                return;
            }

            this.hideInfo();

            if (this.targetPill) {
                const icon = this.getTargetIcon(selectedName, selectedType);
                const localizedName =
                    i18n.getBodyName(selectedName) ||
                    i18n.getStarName(selectedName) ||
                    i18n.getConstellationName(selectedName) ||
                    i18n.getCometName(selectedName) ||
                    i18n.getSpacecraftName(selectedName) ||
                    selectedName;
                this.targetPill.innerHTML = `<span class="target-icon">${icon}</span><span class="target-name">${localizedName}</span>`;
            }
            this.controlCenter?.updateActiveTargetChips(selectedName);

            if (selectedType === 'Star') {
                if (selectedName === 'Sun') {
                    const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                    if (sun) {
                        this.showModal(sun.data);
                    }
                    this.focusOrSurfaceTarget('Sun');
                } else {
                    const star = this.sceneManager.starMeshes.find(m => m.userData.name === selectedName);
                    if (star?.userData) {
                        this.showModal(star.userData);
                    }
                    if (star) {
                        this.sceneManager.focusOnStar(star);
                    }
                    this.controlCenter?.syncSwitches();
                    if (this.headerSlotsContainer) HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
                }
            } else if (selectedType === 'Constellation') {
                const center = this.sceneManager.constellationManager?.getConstellationCenter(selectedName);
                if (center) {
                    const group = this.sceneManager.constellationManager?.constellationMeshes.find(g => g.userData.name === selectedName);
                    if (group?.userData) {
                        this.showModal(group.userData);
                    }
                }
                this.sceneManager.focusOnConstellation(selectedName);
                this.controlCenter?.syncSwitches();
                if (this.headerSlotsContainer) HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
            } else {
                let foundData: any = null;
                const findTarget = (body: any) => {
                    if (body.data?.name === selectedName) {
                        foundData = body.data;
                    }
                    if (body.moons) {
                        body.moons.forEach(findTarget);
                    }
                };
                this.sceneManager.planets.forEach(findTarget);
                if (!foundData) {
                    const comet = this.sceneManager.comets.find(c => c.data.name === selectedName);
                    if (comet) foundData = comet.data;
                }
                if (!foundData) {
                    const sc = this.sceneManager.spacecrafts.find(s => s.data.name === selectedName);
                    if (sc) foundData = sc.data;
                }

                if (foundData) {
                    this.showModal(foundData);
                }
                this.focusOrSurfaceTarget(selectedName);
            }
        });

        // Initialize the Unified Control Center
        this.controlCenter = new ControlCenter(this, this.sceneManager, this.uiContainer);
        this.controlCenter.updateActiveTargetChips(this.cameraTarget);

        const targetSelectRow = this.controlCenter.drawerElement.querySelector('#unifiedTargetSelectRow');
        if (targetSelectRow) {
            targetSelectRow.appendChild(typeSelect);
            targetSelectRow.appendChild(bodySelect);
        } else {
            menuContainer.appendChild(typeSelect);
            menuContainer.appendChild(bodySelect);
        }

        // Left Brand element
        const brand = document.createElement('div');
        brand.className = 'obs-brand';
        brand.title = 'Solar System 3D — Deep Space Astronomical Observatory';
        brand.innerHTML = '<span class="brand-sparkle">✦</span><span>Solar System 3D</span><span class="brand-live-dot"></span>';
        brand.onclick = () => {
            if (typeof this.sceneManager?.detachCamera === 'function') {
                this.sceneManager.detachCamera();
            }
        };
        menuContainer.appendChild(brand);

        // Center Island: Current Target Pill
        const centerIsland = document.createElement('div');
        centerIsland.className = 'obs-header-center';

        const targetPill = document.createElement('button');
        targetPill.type = 'button';
        targetPill.className = 'obs-target-pill';
        targetPill.id = 'obsTargetPill';
        const initialTargetName = this.cameraTarget || 'Earth';
        const initialLocalizedName =
            i18n.getBodyName(initialTargetName) ||
            i18n.getStarName(initialTargetName) ||
            i18n.getCometName(initialTargetName) ||
            i18n.getSpacecraftName(initialTargetName) ||
            initialTargetName;
        const initialIcon = this.getTargetIcon(initialTargetName);
        targetPill.title = i18n.t('ui.targetPillTitle') || 'Focused Celestial Object — Click to Open Navigator';
        targetPill.innerHTML = `<span class="target-icon">${initialIcon}</span><span class="target-name">${initialLocalizedName}</span>`;
        targetPill.onclick = () => {
            this.controlCenter?.open('target');
        };
        centerIsland.appendChild(targetPill);
        this.targetPill = targetPill;

        const divider = document.createElement('div');
        divider.className = 'obs-header-divider';
        centerIsland.appendChild(divider);

        if (this.datePanel) {
            centerIsland.appendChild(this.datePanel);
        }

        menuContainer.appendChild(centerIsland);

        // Quick Action Buttons (Header Slots & Controls)
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'top-actions-container obs-header-actions';

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'obs-header-slots';
        this.headerSlotsContainer = slotsContainer;
        HeaderSlotsManager.renderSlots(slotsContainer, this);
        actionsContainer.appendChild(slotsContainer);

        const slotAddBtn = document.createElement('button');
        slotAddBtn.type = 'button';
        slotAddBtn.className = 'hud-icon-btn obs-slot-add-btn';
        slotAddBtn.id = 'hudSlotAddBtn';
        slotAddBtn.title = i18n.t('ui.customizeSlots') || 'Customize Quick Access Slots';
        slotAddBtn.setAttribute('aria-label', slotAddBtn.title);
        slotAddBtn.innerHTML = `<span class="slot-add-glyph">${svgIcon('plus')}</span>`;
        slotAddBtn.onclick = (e) => {
            e.stopPropagation();
            this.openHeaderSlotsCustomizer();
        };
        actionsContainer.appendChild(slotAddBtn);

        const controlsBtn = document.createElement('button');
        controlsBtn.type = 'button';
        controlsBtn.className = 'hud-icon-btn obs-controls-btn';
        controlsBtn.id = 'hudControlsBtn';
        controlsBtn.title = i18n.t('ui.controlsToggle');
        controlsBtn.setAttribute('aria-label', i18n.t('ui.controlsToggle'));
        controlsBtn.setAttribute('aria-expanded', 'false');
        controlsBtn.setAttribute('aria-controls', 'unifiedControlCenter');
        controlsBtn.innerHTML = `<span class="ctrl-icon">${svgIcon('controls-sliders')}</span> <span class="ctrl-label">${(i18n.t('ui.controls') || 'CONTROLS').toUpperCase()}</span>`;
        controlsBtn.onclick = (e) => {
            e.stopPropagation();
            this.controlCenter?.toggle();
        };

        // Language Switcher Widget
        const langContainer = document.createElement('div');
        langContainer.className = 'lang-switcher-container';

        const langBtn = document.createElement('button');
        langBtn.type = 'button';
        langBtn.className = 'hud-icon-btn lang-btn';
        langBtn.id = 'hudLanguageBtn';
        langBtn.title = i18n.t('ui.languageToggle');
        langBtn.setAttribute('aria-label', i18n.t('ui.languageToggle'));
        langBtn.setAttribute('aria-haspopup', 'listbox');
        langBtn.setAttribute('aria-expanded', 'false');
        langBtn.innerHTML = `<span class="lang-flag-current"><img class="lang-btn-flag" src="${getLocaleFlagUrl(i18n.currentLanguage)}" alt="${i18n.getLocaleInfo().label}" /></span> <span class="lang-code">${i18n.currentLanguage.toUpperCase()}</span>`;

        const langDropdown = document.createElement('div');
        langDropdown.className = 'lang-dropdown-menu';
        langDropdown.setAttribute('role', 'listbox');
        langDropdown.style.display = 'none';

        const closeLangDropdown = () => {
            langDropdown.style.display = 'none';
            langBtn.classList.remove('active');
            langBtn.setAttribute('aria-expanded', 'false');
            langContainer.classList.remove('open');
            menuContainer.classList.remove('has-lang-open');
        };

        const openLangDropdown = () => {
            langDropdown.style.display = 'block';
            langBtn.classList.add('active');
            langBtn.setAttribute('aria-expanded', 'true');
            langContainer.classList.add('open');
            menuContainer.classList.add('has-lang-open');
        };

        this.closeLangDropdown = closeLangDropdown;

        const renderLangDropdown = () => {
            langDropdown.innerHTML = '';
            AVAILABLE_LOCALES.forEach(loc => {
                const item = document.createElement('div');
                item.className = `lang-dropdown-item ${loc.code === i18n.currentLanguage ? 'active' : ''}`;
                item.dataset.lang = loc.code;
                item.setAttribute('role', 'option');
                item.setAttribute('tabindex', '0');
                item.setAttribute('aria-selected', String(loc.code === i18n.currentLanguage));
                item.innerHTML = `
                    <span class="lang-flag">
                        <img class="lang-flag-img" src="${getLocaleFlagUrl(loc)}" alt="${loc.label}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline';" />
                        <span class="lang-flag-fallback" style="display:none;">${loc.flag}</span>
                    </span>
                    <span class="lang-label">${loc.nativeName}</span>
                `;
                const selectLang = (e: Event) => {
                    e.stopPropagation();
                    i18n.setLanguage(loc.code);
                    closeLangDropdown();
                };
                item.addEventListener('click', selectLang);
                item.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectLang(e);
                    }
                });
                langDropdown.appendChild(item);
            });
        };
        renderLangDropdown();

        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langDropdown.style.display === 'block';
            if (isOpen) {
                closeLangDropdown();
            } else {
                openLangDropdown();
            }
        });

        this.onDocClickLangBound = () => {
            closeLangDropdown();
        };
        document.addEventListener('click', this.onDocClickLangBound);

        langContainer.appendChild(langBtn);
        langContainer.appendChild(langDropdown);

        actionsContainer.appendChild(controlsBtn);
        actionsContainer.appendChild(langContainer);
        menuContainer.appendChild(actionsContainer);

        this.unsubscribeI18n = i18n.onLanguageChange(() => {
            const flagImg = langBtn.querySelector<HTMLImageElement>('.lang-btn-flag');
            if (flagImg) {
                flagImg.src = getLocaleFlagUrl(i18n.currentLanguage);
                flagImg.alt = i18n.getLocaleInfo().label;
            }
            const codeSpan = langBtn.querySelector('.lang-code');
            if (codeSpan) codeSpan.textContent = i18n.currentLanguage.toUpperCase();
            langBtn.title = i18n.t('ui.languageToggle');
            langBtn.setAttribute('aria-label', i18n.t('ui.languageToggle'));

            if (this.headerSlotsContainer) {
                HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
            }
            slotAddBtn.title = i18n.t('ui.customizeSlots') || 'Customize Quick Access Slots';
            slotAddBtn.setAttribute('aria-label', slotAddBtn.title);

            controlsBtn.title = i18n.t('ui.controlsToggle');
            controlsBtn.setAttribute('aria-label', i18n.t('ui.controlsToggle'));
            const ctrlLabel = controlsBtn.querySelector('.ctrl-label');
            if (ctrlLabel) ctrlLabel.textContent = (i18n.t('ui.controls') || 'CONTROLS').toUpperCase();

            if (this.targetPill) {
                this.targetPill.title = i18n.t('ui.targetPillTitle') || 'Focused Celestial Object — Click to Open Navigator';
                const curTarget = this.cameraTarget || 'Earth';
                const localizedTarget =
                    i18n.getBodyName(curTarget) ||
                    i18n.getStarName(curTarget) ||
                    i18n.getConstellationName(curTarget) ||
                    i18n.getCometName(curTarget) ||
                    i18n.getSpacecraftName(curTarget) ||
                    curTarget;
                const curIcon = this.getTargetIcon(curTarget);
                this.targetPill.innerHTML = `<span class="target-icon">${curIcon}</span><span class="target-name">${localizedTarget}</span>`;
            }

            if (this.headerSlotsModal?.isOpen) {
                this.openHeaderSlotsCustomizer();
            }

            if (this.speedBadge) {
                this.speedBadge.title = i18n.t('ui.speedPause');
                const isPaused = this.sceneManager?.timeScale === 0;
                const speedText = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
                    ? this.sceneManager.getFormattedTimeSpeed()
                    : '1.0 day/s';
                const pausedLabel = i18n.t('controls.speedPresets.paused') || 'Paused';
                this.speedBadge.textContent = isPaused ? `⏸ ${pausedLabel}` : `▶ ${speedText}`;
            }
            if (this.timeBadge) {
                this.timeBadge.title = i18n.t('ui.utcTime');
            }
            if (this.liveIndicator) {
                this.liveIndicator.title = i18n.t('ui.liveRealTime');
            }

            renderLangDropdown();
            populateTypeOptions();
            updateBodyOptions();

            if (this.dateLabel) {
                this.dateLabel.title = i18n.t('datepicker.calendarTitle') || 'Open Mission Calendar';
                const simDateText = stripLeadingEmoji(i18n.t('ui.simDate') || '');
                this.dateLabel.innerHTML = `<span class="date-clock-icon">${svgIcon('clock')}</span> <span class="date-label-text">${simDateText}</span>`;
            }

            this.controlCenter?.updateTranslations();

            if (this.shortcutsModal?.isOpen) {
                this.toggleShortcutsModal();
                this.toggleShortcutsModal();
            }

            this.updateMeasureHud();
        });

        this.uiContainer.appendChild(menuContainer);
    }

    private createMeasureHudBar(): HTMLElement {
        if (this.measureHudBar) return this.measureHudBar;

        const hud = document.createElement('div');
        hud.className = 'measure-hud-bar';
        hud.id = 'measureHudBar';
        hud.style.display = 'none';

        const icon = document.createElement('span');
        icon.className = 'measure-hud-icon';
        icon.innerHTML = svgIcon('measure');
        hud.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'measure-hud-text';
        hud.appendChild(content);

        const actions = document.createElement('div');
        actions.className = 'measure-hud-actions';

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'measure-action-btn clear-btn';
        clearBtn.textContent = i18n.t('measurement.clear') || 'Clear';
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof this.sceneManager.clearMeasureTargets === 'function') {
                this.sceneManager.clearMeasureTargets();
            }
        };
        actions.appendChild(clearBtn);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'measure-action-btn close-btn';
        closeBtn.title = i18n.t('measurement.close') || 'Exit Measurement';
        closeBtn.setAttribute('aria-label', i18n.t('measurement.close') || 'Exit Measurement');
        closeBtn.innerHTML = svgIcon('close');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof this.sceneManager.toggleMeasureMode === 'function') {
                this.sceneManager.toggleMeasureMode(false);
            } else {
                this.sceneManager.measureMode = false;
            }
            this.controlCenter?.syncSwitches();
            if (this.headerSlotsContainer) {
                HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
            }
            this.updateMeasureHud();
        };
        actions.appendChild(closeBtn);

        hud.appendChild(actions);

        this.measureHudBar = hud;
        this.uiContainer.appendChild(hud);
        return hud;
    }

    public updateMeasureHud(): void {
        if (!this.measureHudBar) return;

        if (!this.sceneManager.measureMode) {
            this.measureHudBar.style.display = 'none';
            return;
        }

        this.measureHudBar.style.display = 'flex';

        const content = this.measureHudBar.querySelector<HTMLElement>('.measure-hud-text');
        const clearBtn = this.measureHudBar.querySelector<HTMLElement>('.measure-action-btn.clear-btn');
        const closeBtn = this.measureHudBar.querySelector<HTMLElement>('.measure-action-btn.close-btn');

        if (clearBtn) clearBtn.textContent = i18n.t('measurement.clear') || 'Clear';
        if (closeBtn) {
            closeBtn.style.display = 'inline-flex';
            closeBtn.title = i18n.t('measurement.close') || 'Exit Measurement';
            closeBtn.setAttribute('aria-label', i18n.t('measurement.close') || 'Exit Measurement');
        }

        if (!content) return;

        const targetA = this.sceneManager.measureTargetA;
        const targetB = this.sceneManager.measureTargetB;

        const getLocalizedName = (target: any) => {
            if (!target) return '';
            const rawName = target.data?.name || target.name || '';
            return (
                i18n.getBodyName(rawName) ||
                i18n.getStarName(rawName) ||
                i18n.getCometName(rawName) ||
                i18n.getSpacecraftName(rawName) ||
                rawName
            );
        };

        if (targetA && targetB) {
            const nameA = getLocalizedName(targetA);
            const nameB = getLocalizedName(targetB);

            let distanceAU = '';
            let distanceMkm = '';
            let unitAU = i18n.t('measurement.unitAU') || 'AU';
            let unitMkm = i18n.t('measurement.unitMkm') || 'Mkm';

            if (!this.sceneManager.currentMeasureDistance && typeof this.sceneManager.updateMeasurement === 'function') {
                this.sceneManager.updateMeasurement();
            }

            if (this.sceneManager.currentMeasureDistance) {
                distanceAU = this.sceneManager.currentMeasureDistance.distanceAU;
                distanceMkm = this.sceneManager.currentMeasureDistance.distanceMkm;
                unitAU = this.sceneManager.currentMeasureDistance.unitAU || unitAU;
                unitMkm = this.sceneManager.currentMeasureDistance.unitMkm || unitMkm;
            } else {
                let distanceAUVal = 0;
                if (typeof this.sceneManager.getAstronomicalPositionAU === 'function') {
                    this.sceneManager.getAstronomicalPositionAU(targetA, UIManager._measurePosA);
                    this.sceneManager.getAstronomicalPositionAU(targetB, UIManager._measurePosB);
                    distanceAUVal = UIManager._measurePosA.distanceTo(UIManager._measurePosB);
                } else {
                    const anyA = targetA as any;
                    const anyB = targetB as any;
                    if (anyA.mesh) anyA.mesh.getWorldPosition(UIManager._measurePosA);
                    else if (anyA.orbitGroup) anyA.orbitGroup.getWorldPosition(UIManager._measurePosA);
                    if (anyB.mesh) anyB.mesh.getWorldPosition(UIManager._measurePosB);
                    else if (anyB.orbitGroup) anyB.orbitGroup.getWorldPosition(UIManager._measurePosB);
                    const distScale = UIManager._measurePosA.distanceTo(UIManager._measurePosB);
                    distanceAUVal = distScale / 130;
                }

                const auPrecision = distanceAUVal < 0.1 ? 4 : 3;
                const mkmPrecision = 2;
                const roundedAU = Number(distanceAUVal.toFixed(auPrecision));
                const distanceMkmVal = roundedAU * 149.6;
                distanceAU = i18n.formatNumber(distanceAUVal, { minimumFractionDigits: auPrecision, maximumFractionDigits: auPrecision });
                distanceMkm = i18n.formatNumber(distanceMkmVal, { minimumFractionDigits: mkmPrecision, maximumFractionDigits: mkmPrecision });
            }

            const valEl = content.querySelector<HTMLElement>('.measure-val');
            const mkmEl = content.querySelector<HTMLElement>('.measure-mkm');
            const resultEl = content.querySelector<HTMLElement>('.measure-hud-result');

            if (valEl && mkmEl && resultEl && resultEl.dataset.targetA === nameA && resultEl.dataset.targetB === nameB) {
                valEl.textContent = `${distanceAU} ${unitAU}`;
                mkmEl.textContent = `(${distanceMkm} ${unitMkm})`;
            } else {
                content.innerHTML = `<span class="measure-hud-result" data-target-a="${nameA}" data-target-b="${nameB}"><span class="measure-body">${nameA}</span> ↔ <span class="measure-body">${nameB}</span>: <strong class="measure-val">${distanceAU} ${unitAU}</strong> <span class="measure-mkm">(${distanceMkm} ${unitMkm})</span></span>`;
            }
            if (clearBtn) clearBtn.style.display = 'inline-block';
        } else if (targetA) {
            const nameA = getLocalizedName(targetA);
            const prompt = i18n.t('measurement.selectSecondPrompt', { name: nameA }) || `Selected: ${nameA}. Click a second body`;
            content.innerHTML = `<span class="measure-hud-hint">${prompt}</span>`;
            if (clearBtn) clearBtn.style.display = 'inline-block';
        } else {
            const prompt = i18n.t('measurement.selectFirstPrompt') || 'Click a celestial body to begin measuring';
            content.innerHTML = `<span class="measure-hud-hint">${prompt}</span>`;
            if (clearBtn) clearBtn.style.display = 'none';
        }
    }

    public getTargetIcon(name: string, type?: string): string {
        if (name === 'Sun' || type === 'Star') return svgIcon('sun');
        if (type === 'Moon' || name.includes('Moon')) return svgIcon('moons');
        if (type === 'Constellation') return svgIcon('constellations');
        if (type === 'Comet') return svgIcon('comets');
        if (
            type === 'Spacecraft' ||
            name.includes('ISS') ||
            name.includes('Voyager') ||
            name.includes('Hubble') ||
            name.includes('Webb') ||
            name === 'JWST' ||
            name === 'Sputnik 1' ||
            name === 'Apollo 11'
        ) {
            return svgIcon('spacecraft');
        }
        if (name === 'Earth') return svgIcon('earth');
        return svgIcon('planet');
    }

    syncDropdownSelection(targetName: string, targetType?: string): void {
        this.cameraTarget = targetName;
        const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
        const bodySelect = document.getElementById('bodySelect') as HTMLSelectElement;

        let determinedType = targetType;
        if (!determinedType) {
            if (targetName === 'Sun' || this.sceneManager.starMeshes.some(m => m.userData?.name === targetName)) {
                determinedType = 'Star';
            } else if (this.sceneManager.planets.find(p => p.data.name === targetName)) {
                determinedType = 'Planet';
            } else if (this.sceneManager.planets.some(p => p.moons.find(m => m.data.name === targetName))) {
                determinedType = 'Moon';
            } else if (this.sceneManager.constellationManager?.constellationMeshes.some(g => g.userData?.name === targetName)) {
                determinedType = 'Constellation';
            } else if (this.sceneManager.comets.find(c => c.data.name === targetName)) {
                determinedType = 'Comet';
            } else if (this.sceneManager.spacecrafts.find(s => s.data.name === targetName)) {
                determinedType = 'Spacecraft';
            } else {
                determinedType = 'Planet';
            }
        }

        if (typeSelect && bodySelect) {
            this.ignoreNextBodyChange = true;
            setTimeout(() => {
                this.ignoreNextBodyChange = false;
            }, 100);

            if (typeSelect.value !== determinedType) {
                typeSelect.value = determinedType;
                typeSelect.dispatchEvent(new Event('change'));
            }
            bodySelect.value = targetName;
        }

        if (this.targetPill) {
            const icon = this.getTargetIcon(targetName, determinedType);
            const localizedName =
                i18n.getBodyName(targetName) ||
                i18n.getStarName(targetName) ||
                i18n.getConstellationName(targetName) ||
                i18n.getCometName(targetName) ||
                i18n.getSpacecraftName(targetName) ||
                targetName;
            this.targetPill.innerHTML = `<span class="target-icon">${icon}</span><span class="target-name">${localizedName}</span>`;
        }
        this.controlCenter?.updateActiveTargetChips(targetName);
    }

    focusOrSurfaceTarget(targetName: string): void {
        if (!targetName) return;
        this.cameraTarget = targetName;

        if (this.sceneManager?.surfaceViewBody) {
            let surfaceSuccess = false;
            if (typeof this.sceneManager.setSurfaceView === 'function') {
                const res = this.sceneManager.setSurfaceView(targetName);
                surfaceSuccess = res === true || (res === undefined && !!this.sceneManager.surfaceViewBody);
            }
            if (!surfaceSuccess && typeof this.sceneManager?.focusOnBody === 'function') {
                this.sceneManager.focusOnBody(targetName);
            }
        } else if (typeof this.sceneManager?.focusOnBody === 'function') {
            this.sceneManager.focusOnBody(targetName);
        }

        this.controlCenter?.syncSwitches();
        if (this.headerSlotsContainer) HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
    }

    initInteraction(): void {
        const canvas = this.sceneManager.renderer.domElement;
        this.onPointerDownBound = (event: PointerEvent) => this.onPointerDown(event);
        this.onPointerUpBound = (event: PointerEvent) => this.onPointerUp(event);
        canvas.addEventListener('pointerdown', this.onPointerDownBound);
        canvas.addEventListener('pointerup', this.onPointerUpBound);
    }

    onPointerDown(event: PointerEvent): void {
        if (event.isPrimary === false) return;
        this.mouseDownPos.set(event.clientX, event.clientY);
    }

    onPointerUp(event: PointerEvent): void {
        if (event.isPrimary === false) return;
        this.mouseUpPos.set(event.clientX, event.clientY);

        const dragDistance = this.mouseDownPos.distanceTo(this.mouseUpPos);
        const threshold = event.pointerType === 'touch' ? 22 : 10;
        if (dragDistance < threshold) {
            this.onClick(event.clientX, event.clientY);
        }
    }

    onClick(clientX: number, clientY: number): void {
        this.scenePicker.pick(clientX, clientY);
    }

    showModal(data: any): void {
        if (this.eventModal) this.eventModal.hide();
        this.modal.show(data);
        this.infoPanel.style.display = 'none';

        if ('targetBody' in data && data.targetBody === 'Earth' && 'distance' in data && data.distance < 10) {
            if (this.previousTimeSpeed === null) {
                this.previousTimeSpeed = this.sceneManager.timeScale;
            }
            const slowSpeed = 0.01;
            if (this.sceneManager.timeScale > slowSpeed) {
                this.sceneManager.timeScale = slowSpeed;
                this.sceneManager.onTimeScaleChange?.(slowSpeed);
            }
        } else if (this.previousTimeSpeed !== null) {
            this.sceneManager.timeScale = this.previousTimeSpeed;
            this.sceneManager.onTimeScaleChange?.(this.previousTimeSpeed);
            this.previousTimeSpeed = null;
        }
    }

    hideInfo(): void {
        this.selectedBody = null;
        this.infoPanel.style.display = 'none';

        if (this.previousTimeSpeed !== null) {
            this.sceneManager.timeScale = this.previousTimeSpeed;
            this.sceneManager.onTimeScaleChange?.(this.previousTimeSpeed);
            this.previousTimeSpeed = null;
        }
    }

    toggleShortcutsModal(): void {
        toggleShortcutsModal(this);
    }

    openHeaderSlotsCustomizer(): void {
        openHeaderSlotsCustomizer(this);
    }

    dispose(): void {
        if (this.unsubscribeI18n) {
            this.unsubscribeI18n();
            this.unsubscribeI18n = null;
        }
        if (this.unsubscribeMeasureMode) {
            this.unsubscribeMeasureMode();
            this.unsubscribeMeasureMode = null;
        }
        if (this.unsubscribeMeasureTargets) {
            this.unsubscribeMeasureTargets();
            this.unsubscribeMeasureTargets = null;
        }

        this.shortcutController?.dispose();

        if (typeof window !== 'undefined') {
            if (this.onTourFocusBound) window.removeEventListener('tour-focus', this.onTourFocusBound);
            if (this.onJumpToDateBound) window.removeEventListener('jump-to-date', this.onJumpToDateBound);
            if (this.onSelectCelestialBodyBound) window.removeEventListener('select-celestial-body', this.onSelectCelestialBodyBound);
        }

        if (typeof document !== 'undefined') {
            if (this.onDocClickLangBound) {
                document.removeEventListener('click', this.onDocClickLangBound);
            }
            this.closeLangDropdown = null;
        }

        const canvas = this.sceneManager?.renderer?.domElement;
        if (canvas) {
            if (this.onPointerDownBound) canvas.removeEventListener('pointerdown', this.onPointerDownBound);
            if (this.onPointerUpBound) canvas.removeEventListener('pointerup', this.onPointerUpBound);
        }

        if (this.controlCenter) {
            this.controlCenter.dispose();
            this.controlCenter = null;
        }

        this.shortcutsModal?.dispose();
        this.headerSlotsModal?.dispose();
        this.audioManager?.dispose();
        this.performanceMonitor?.dispose();
        this.modal?.dispose();
        this.eventModal?.dispose();

        if (this.customDatePicker) {
            this.customDatePicker.dispose();
            this.customDatePicker = null;
        }

        if (this.minimap && typeof this.minimap.dispose === 'function') {
            this.minimap.dispose();
        }

        if (this.measureHudBar?.parentElement) {
            this.measureHudBar.parentElement.removeChild(this.measureHudBar);
            this.measureHudBar = null;
        }

        if (this.menuContainer?.parentElement) {
            this.menuContainer.parentElement.removeChild(this.menuContainer);
            this.menuContainer = null;
        }

        if (this.infoPanel?.parentElement) {
            this.infoPanel.parentElement.removeChild(this.infoPanel);
        }

        if (this.datePanel?.parentElement) {
            this.datePanel.parentElement.removeChild(this.datePanel);
        }
    }
}
