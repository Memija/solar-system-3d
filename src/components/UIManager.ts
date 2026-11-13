import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Modal } from './Modal';
import { Minimap } from './Minimap';
import {
    CustomDatePicker,
    HISTORICAL_SPACE_EVENTS,
    HistoricalSpaceEvent,
    getLocalizedEventName,
    getLocalizedEventImpact
} from './CustomDatePicker';
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
import { PreferencesManager } from './PreferencesManager';

export class UIManager {
    sceneManager: SceneManager;
    scenePicker: ScenePicker;
    shortcutController: ShortcutController;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    selectedBody: CelestialBodyData | MoonData | StarData | ConstellationData | CometData | SpacecraftData | null;
    uiContainer: HTMLElement;
    infoPanel: HTMLElement;
    private _modal: Modal | null = null;
    private _eventModal: Modal | null = null;
    private _shortcutsModal: Modal | null = null;
    private _headerSlotsModal: Modal | null = null;
    headerSlotsContainer: HTMLElement | null = null;
    audioManager: AudioManager;
    performanceMonitor: PerformanceMonitor;
    menuContainer: HTMLElement | null = null;
    controlCenter: ControlCenter | null = null;
    targetPill: HTMLElement | null = null;
    headerTypeSelect: HTMLSelectElement | null = null;
    headerBodySelect: HTMLSelectElement | null = null;
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
    slowDownBtn: HTMLButtonElement | null = null;
    speedUpBtn: HTMLButtonElement | null = null;
    transportDeck: HTMLElement | null = null;
    timeBadge: HTMLElement | null = null;
    private timeNumsEl: HTMLElement | null = null;
    liveIndicator: HTMLElement | null = null;
    private liveTextEl: HTMLElement | null = null;
    private activeHistoricalEventId: HistoricalSpaceEvent['id'] | null = null;
    telemetryTicker: HTMLElement | null = null;
    private tickerBodyEl: HTMLElement | null = null;
    private tickerSpeedEl: HTMLElement | null = null;
    private tickerDistEl: HTMLElement | null = null;
    private realtimeDistanceKm: number = 0;
    private lastRealtimeDateMs: number = 0;
    private lastFormattedTime: string = '';
    private lastUtcSecond: number = NaN;
    private lastSyncedTimeScale: number = NaN;
    private lastTickerTarget: string = '';
    private cachedTickerSpeedKmS: number = 29.8;
    private lastTickerDistStep: number = NaN;
    private lastTickerFormatMs: number = 0;

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
    private measureHudTextEl: HTMLElement | null = null;
    private measureHudClearBtn: HTMLElement | null = null;
    private measureHudCloseBtn: HTMLElement | null = null;
    private static readonly _measurePosA = new THREE.Vector3();
    private static readonly _measurePosB = new THREE.Vector3();

    public static readonly SPEED_TIERS: readonly number[] = [
        0,
        SceneManager.SPEED_PRESETS.realTime,
        SceneManager.SPEED_PRESETS.oneHour,
        SceneManager.SPEED_PRESETS.oneDay,
        SceneManager.SPEED_PRESETS.oneWeek,
        SceneManager.SPEED_PRESETS.oneMonth
    ];

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        if (this.sceneManager && this.sceneManager.measureMode === undefined) {
            this.sceneManager.measureMode = PreferencesManager.get('measureMode');
        }
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

        this.audioManager = new AudioManager();
        this.performanceMonitor = new PerformanceMonitor(this.sceneManager.renderer, this.uiContainer);

        this.datePanel = this.createDatePanel();
        this.minimap = new Minimap(sceneManager, this.uiContainer);

        this.createSelectionMenu();
        this.sceneManager.onTimeScaleChange = () => {
            this.controlCenter?.syncTimePanel();
            this.lastSyncedTimeScale = NaN;
            this.lastTickerTarget = '';
            this.lastTickerDistStep = NaN;
            this.syncTransportState();
        };

        this.initInteraction();
        this.shortcutController = new ShortcutController(this);

        this.createMeasureHudBar();
        this.updateMeasureHud();
        this.unsubscribeMeasureMode = EventBus.on('measure-mode-changed', () => {
            this.updateMeasureHud();
            this.controlCenter?.syncSwitches();
            if (this.headerSlotsContainer) {
                HeaderSlotsManager.updateSlotStates(this.headerSlotsContainer, this);
            }
        });
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

            if (this.sceneManager.measureMode && !eventName && !eventImpact && typeof this.sceneManager.setMeasureTarget === 'function') {
                this.sceneManager.setMeasureTarget(targetName);
                this.updateMeasureHud();
                return;
            }

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
                    this.activeHistoricalEventId = customEvent.detail?.eventId || null;
                    this.eventModal.show({
                        name: `${eventName}`,
                        description: `<div style="padding: 10px; background-color: rgba(255, 215, 0, 0.2); margin-bottom: 10px; color: white;">${eventImpact}</div>`
                    });
                } else {
                    this.activeHistoricalEventId = null;
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
                this.sceneManager.timeScale = 0;
                this.sceneManager.onTimeScaleChange?.(0);
                this.controlCenter?.syncTimePanel();
            },
            {
                onSnapToLive: () => {
                    this.sceneManager.timeScale = SceneManager.SPEED_PRESETS.realTime;
                    this.sceneManager.onTimeScaleChange?.(SceneManager.SPEED_PRESETS.realTime);
                    this.controlCenter?.syncTimePanel();
                }
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

        const transportDeck = document.createElement('div');
        transportDeck.className = 'sim-transport-deck';
        transportDeck.setAttribute('role', 'group');
        transportDeck.setAttribute('aria-label', i18n.t('controls.sections.simulationSpeed') || 'Simulation Speed');
        this.transportDeck = transportDeck;

        const slowDownBtn = document.createElement('button');
        slowDownBtn.type = 'button';
        slowDownBtn.id = 'simSlowDownBtn';
        slowDownBtn.className = 'sim-transport-btn sim-speed-down-btn';
        const slowDownTitle = i18n.t('ui.speedSlowDown') || 'Slow Down Simulation ([ / -)';
        slowDownBtn.title = slowDownTitle;
        slowDownBtn.setAttribute('aria-label', slowDownTitle);
        slowDownBtn.innerHTML = svgIcon('rewind', 'obs-svg-icon transport-svg-icon');
        slowDownBtn.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            this.slowDown();
        };
        this.slowDownBtn = slowDownBtn;
        transportDeck.appendChild(slowDownBtn);

        const speedBadge = document.createElement('button');
        speedBadge.type = 'button';
        speedBadge.className = 'sim-speed-badge';
        speedBadge.title = i18n.t('ui.speedPause');
        speedBadge.setAttribute('aria-label', i18n.t('ui.speedPause'));
        const isPaused = this.sceneManager?.timeScale === 0;
        const initialScale = this.sceneManager?.timeScale ?? SceneManager.DEFAULT_TIME_SCALE;
        const isInitialRealTime = !isPaused && initialScale <= SceneManager.SPEED_PRESETS.realTime * 1.5;
        const speedText = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
            ? this.sceneManager.getFormattedTimeSpeed()
            : SceneManager.prototype.getFormattedTimeSpeed.call(this.sceneManager, initialScale);
        const pausedLabel = i18n.t('controls.speedPresets.paused') || 'Paused';
        speedBadge.textContent = isPaused ? `⏸ ${pausedLabel}` : `▶ ${speedText}`;
        if (isPaused) speedBadge.classList.add('paused');
        speedBadge.onclick = () => {
            this.togglePause();
        };
        this.speedBadge = speedBadge;
        transportDeck.appendChild(speedBadge);

        const speedUpBtn = document.createElement('button');
        speedUpBtn.type = 'button';
        speedUpBtn.id = 'simSpeedUpBtn';
        speedUpBtn.className = 'sim-transport-btn sim-speed-up-btn';
        const speedUpTitle = i18n.t('ui.speedSpeedUp') || 'Speed Up Simulation (] / +)';
        speedUpBtn.title = speedUpTitle;
        speedUpBtn.setAttribute('aria-label', speedUpTitle);
        speedUpBtn.innerHTML = svgIcon('fast-forward', 'obs-svg-icon transport-svg-icon');
        speedUpBtn.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            this.speedUp();
        };
        this.speedUpBtn = speedUpBtn;
        transportDeck.appendChild(speedUpBtn);

        mainRow.appendChild(transportDeck);
        this.syncTransportState();

        const liveIndicator = document.createElement('div');
        liveIndicator.className = 'sim-live-indicator';
        liveIndicator.title = i18n.t('ui.liveRealTime');
        const liveDotEl = document.createElement('span');
        liveDotEl.className = 'live-pulse-dot';
        const liveTextEl = document.createElement('span');
        liveTextEl.className = 'live-text';
        const liveBadgeVal = i18n.t('ui.liveBadge');
        liveTextEl.textContent = liveBadgeVal && liveBadgeVal !== 'ui.liveBadge' ? liveBadgeVal : 'Live 1:1';
        liveIndicator.appendChild(liveDotEl);
        liveIndicator.appendChild(liveTextEl);
        liveIndicator.style.display = isInitialRealTime ? 'inline-flex' : 'none';
        mainRow.appendChild(liveIndicator);
        this.liveIndicator = liveIndicator;
        this.liveTextEl = liveTextEl;

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

    private static readonly ORBITAL_VELOCITIES: ReadonlyArray<readonly [string, number, string]> = [
        ['Mercury', 47.4, 'Mercury'],
        ['Venus', 35.0, 'Venus'],
        ['Earth', 29.8, 'Earth'],
        ['Mars', 24.1, 'Mars'],
        ['Jupiter', 13.1, 'Jupiter'],
        ['Saturn', 9.7, 'Saturn'],
        ['Uranus', 6.8, 'Uranus'],
        ['Neptune', 5.4, 'Neptune'],
        ['Pluto', 4.7, 'Pluto'],
        ['Moon', 1.0, 'Moon'],
        ['ISS', 7.7, 'ISS'],
        ['Hubble', 7.6, 'Hubble'],
        ['Voyager', 17.0, 'Voyager 1'],
        ['James Webb', 1.1, 'JWST'],
        ['Cassini', 18.0, 'Cassini'],
        ['Halley', 54.6, 'Halley']
    ];

    private getOrbitalVelocity(bodyName: string): { speedKmS: number; label: string } {
        if (bodyName === 'Sun') {
            const mwVal = i18n.t('ui.milkyWay');
            const mwText = mwVal && mwVal !== 'ui.milkyWay' ? mwVal : 'Milky Way';
            return { speedKmS: 220, label: `${i18n.getBodyName('Sun') || 'Sun'} (${mwText})` };
        }
        for (let i = 0; i < UIManager.ORBITAL_VELOCITIES.length; i++) {
            const [matchKey, speedKmS, locKey] = UIManager.ORBITAL_VELOCITIES[i];
            if (bodyName.includes(matchKey) || matchKey.includes(bodyName)) {
                const localized =
                    i18n.getBodyName(locKey) ||
                    i18n.getSpacecraftName(locKey) ||
                    i18n.getCometName(locKey) ||
                    locKey;
                return { speedKmS, label: localized };
            }
        }
        return { speedKmS: 29.8, label: i18n.getBodyName(bodyName) || bodyName || 'Earth' };
    }

    update(timestamp: number = performance.now()): void {
        if (this.sceneManager.simDate) {
            const d = this.sceneManager.simDate;
            const utcSec = Math.floor(d.getTime() / 1000);
            if (utcSec !== this.lastUtcSecond) {
                this.lastUtcSecond = utcSec;
                if (this.customDatePicker && !this.customDatePicker.isOpen) {
                    this.customDatePicker.setDate(d);
                }
                if (this.timeNumsEl) {
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
        }

        const isPaused = this.sceneManager?.timeScale === 0;
        const effectiveScale = this.sceneManager?.timeScale ?? SceneManager.DEFAULT_TIME_SCALE;
        const isRealTime = !isPaused && (effectiveScale <= SceneManager.SPEED_PRESETS.realTime * 1.5);

        if (effectiveScale !== this.lastSyncedTimeScale) {
            this.lastSyncedTimeScale = NaN;
            this.lastTickerTarget = '';
            this.lastTickerDistStep = NaN;
            this.syncTransportState();
        }

        if (this.telemetryTicker) {
            if (isRealTime && this.sceneManager.simDate) {
                if (this.telemetryTicker.style.display !== 'flex') {
                    this.telemetryTicker.style.display = 'flex';
                }
                const currentSimMs = this.sceneManager.simDate.getTime();
                const targetName = (this.sceneManager.focusedBody as any)?.data?.name || 'Earth';
                const targetChanged = targetName !== this.lastTickerTarget;
                if (targetChanged) {
                    const vel = this.getOrbitalVelocity(targetName);
                    this.lastTickerTarget = targetName;
                    this.cachedTickerSpeedKmS = vel.speedKmS;
                    if (this.tickerBodyEl) this.tickerBodyEl.textContent = vel.label;
                    if (this.tickerSpeedEl) this.tickerSpeedEl.textContent = `${i18n.formatNumber(vel.speedKmS, { maximumFractionDigits: 2 })} km/s`;
                }

                if (this.lastRealtimeDateMs > 0 && currentSimMs > this.lastRealtimeDateMs) {
                    const elapsedSec = (currentSimMs - this.lastRealtimeDateMs) / 1000;
                    if (elapsedSec > 0 && elapsedSec < 5) {
                        this.realtimeDistanceKm += elapsedSec * this.cachedTickerSpeedKmS;
                    }
                }
                this.lastRealtimeDateMs = currentSimMs;

                const distStep = this.realtimeDistanceKm >= 1000
                    ? Math.round(this.realtimeDistanceKm)
                    : Math.round(this.realtimeDistanceKm * 10) / 10;

                const needsInitialFormat = Number.isNaN(this.lastTickerDistStep) || (this.tickerDistEl && !this.tickerDistEl.textContent);
                if (targetChanged || needsInitialFormat || (distStep !== this.lastTickerDistStep && (timestamp - this.lastTickerFormatMs >= 100))) {
                    this.lastTickerDistStep = distStep;
                    this.lastTickerFormatMs = timestamp;
                    const distFormatted = this.realtimeDistanceKm >= 1000
                        ? `${i18n.formatNumber(distStep)} km`
                        : `${i18n.formatNumber(this.realtimeDistanceKm, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
                    if (this.tickerDistEl) {
                        const orbitVal = i18n.t('ui.orbitTelemetry', { dist: distFormatted });
                        this.tickerDistEl.textContent = orbitVal && orbitVal !== 'ui.orbitTelemetry'
                            ? orbitVal
                            : `Orbit: +${distFormatted}`;
                    }
                }
            } else {
                if (this.telemetryTicker.style.display !== 'none') {
                    this.telemetryTicker.style.display = 'none';
                }
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

    public syncTransportState(): void {
        const isPaused = this.sceneManager?.timeScale === 0;
        const effectiveScale = this.sceneManager?.timeScale ?? SceneManager.DEFAULT_TIME_SCALE;
        this.lastSyncedTimeScale = effectiveScale;
        const isRealTime = !isPaused && (effectiveScale <= SceneManager.SPEED_PRESETS.realTime * 1.5);

        if (this.speedBadge) {
            const speedText = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
                ? this.sceneManager.getFormattedTimeSpeed()
                : SceneManager.prototype.getFormattedTimeSpeed.call(this.sceneManager, effectiveScale);
            const pausedLabel = i18n.t('controls.speedPresets.paused') || 'Paused';
            const text = isPaused ? `⏸ ${pausedLabel}` : `▶ ${speedText}`;
            if (this.speedBadge.textContent !== text) {
                this.speedBadge.textContent = text;
            }
            this.speedBadge.classList.toggle('paused', isPaused);
        }

        if (this.slowDownBtn) {
            const atMin = isPaused;
            this.slowDownBtn.disabled = atMin;
            this.slowDownBtn.classList.toggle('is-limit', atMin);
        }

        if (this.speedUpBtn) {
            const maxSpeed = UIManager.SPEED_TIERS[UIManager.SPEED_TIERS.length - 1];
            const atMax = !isPaused && effectiveScale >= maxSpeed * 0.95;
            this.speedUpBtn.disabled = atMax;
            this.speedUpBtn.classList.toggle('is-limit', atMax);
        }

        if (this.liveIndicator) {
            this.liveIndicator.style.display = isRealTime ? 'inline-flex' : 'none';
        }
    }

    public slowDown(): void {
        if (!this.sceneManager) return;
        const current = this.sceneManager.timeScale ?? SceneManager.DEFAULT_TIME_SCALE;
        const tiers = UIManager.SPEED_TIERS;
        let nextSpeed = 0;
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (tiers[i] < current * 0.95) {
                nextSpeed = tiers[i];
                break;
            }
        }
        this.applyTimeSpeed(nextSpeed);
    }

    public speedUp(): void {
        if (!this.sceneManager) return;
        const current = this.sceneManager.timeScale ?? SceneManager.DEFAULT_TIME_SCALE;
        const tiers = UIManager.SPEED_TIERS;
        let nextSpeed = tiers[tiers.length - 1];
        for (let i = 1; i < tiers.length; i++) {
            if (current <= 0 || tiers[i] > current * 1.05) {
                nextSpeed = tiers[i];
                break;
            }
        }
        this.applyTimeSpeed(nextSpeed);
    }

    private applyTimeSpeed(nextSpeed: number): void {
        if (!this.sceneManager) return;
        if (nextSpeed === 0 && (this.sceneManager.timeScale ?? 0) > 0) {
            this.previousTimeSpeed = this.sceneManager.timeScale;
        } else if (nextSpeed > 0) {
            this.previousTimeSpeed = nextSpeed;
        }
        this.sceneManager.timeScale = nextSpeed;
        this.sceneManager.onTimeScaleChange?.(nextSpeed);
        this.controlCenter?.syncTimePanel();
        this.audioManager?.playTick?.();
        this.syncTransportState();
    }

    public togglePause(): void {
        if (!this.sceneManager) return;
        if (this.sceneManager.timeScale === 0) {
            const restored = (this.previousTimeSpeed && this.previousTimeSpeed > 0)
                ? this.previousTimeSpeed
                : (SceneManager.DEFAULT_TIME_SCALE || SceneManager.SPEED_PRESETS?.realTime || 3.9817e-7);
            this.sceneManager.timeScale = restored;
            this.sceneManager.onTimeScaleChange?.(restored);
        } else {
            this.previousTimeSpeed = this.sceneManager.timeScale;
            this.sceneManager.timeScale = 0;
            this.sceneManager.onTimeScaleChange?.(0);
        }
        this.controlCenter?.syncTimePanel();
        this.syncTransportState();
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
        // No tick here: callers (header slot click, M shortcut) play the UI cue once
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
        typeSelect.className = 'obs-header-select obs-type-select';
        typeSelect.title = i18n.t('controls.sections.celestialNav') || 'Celestial Navigation';
        typeSelect.setAttribute('aria-label', typeSelect.title);
        this.headerTypeSelect = typeSelect;

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
                const cleanLabel = stripLeadingEmoji(t.label);
                const option = document.createElement('option');
                option.value = t.value;
                option.textContent = cleanLabel;
                typeSelect.appendChild(option);
            });
            typeSelect.value = currentVal;
        };

        const bodySelect = document.createElement('select');
        bodySelect.id = 'bodySelect';
        bodySelect.className = 'obs-header-select obs-body-select';
        bodySelect.title = i18n.t('ui.targetPillTitle') || 'Focused Celestial Object';
        bodySelect.setAttribute('aria-label', bodySelect.title);
        this.headerBodySelect = bodySelect;

        const updateBodyOptions = () => {
            const currentVal = bodySelect.value;
            bodySelect.innerHTML = '';
            const selectedType = typeSelect.value || 'Planet';

            const addOption = (val: string, text: string) => {
                const option = document.createElement('option');
                option.value = val;
                option.textContent = text;
                bodySelect.appendChild(option);
            };

            if (selectedType === 'Star') {
                const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                if (sun) {
                    addOption('Sun', i18n.getBodyName('Sun'));
                }
                this.sceneManager.starMeshes.forEach(mesh => {
                    if (mesh.userData?.name) {
                        addOption(mesh.userData.name, i18n.getStarName(mesh.userData.name));
                    }
                });
            } else if (selectedType === 'Planet') {
                this.sceneManager.planets.forEach(planet => {
                    if (planet.data.name !== 'Sun') {
                        addOption(planet.data.name, i18n.getBodyName(planet.data.name));
                    }
                });
            } else if (selectedType === 'Moon') {
                this.sceneManager.planets.forEach(planet => {
                    if (planet.moons && planet.moons.length > 0) {
                        planet.moons.forEach(moon => {
                            const moonName = i18n.getBodyName(moon.data.name);
                            const planetName = i18n.getBodyName(planet.data.name);
                            addOption(moon.data.name, `${moonName} ${i18n.t('ui.orbiting', { planet: planetName })}`);
                        });
                    }
                });
            } else if (selectedType === 'Constellation') {
                if (this.sceneManager.constellationManager) {
                    this.sceneManager.constellationManager.constellationMeshes.forEach(group => {
                        if (group.userData?.name) {
                            addOption(group.userData.name, i18n.getConstellationName(group.userData.name));
                        }
                    });
                }
            } else if (selectedType === 'Comet') {
                this.sceneManager.comets.forEach(comet => {
                    addOption(comet.data.name, i18n.getCometName(comet.data.name));
                });
            } else if (selectedType === 'Spacecraft') {
                this.sceneManager.spacecrafts.forEach(sc => {
                    addOption(sc.data.name, i18n.getSpacecraftName(sc.data.name));
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

            if (this.sceneManager.measureMode && typeof this.sceneManager.setMeasureTarget === 'function') {
                this.sceneManager.setMeasureTarget(selectedName);
                this.updateMeasureHud();
                return;
            }

            this.hideInfo();

            this.updateTargetPillDisplay(selectedName, selectedType);
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

        // Center Island: Inline Target Type + Body Navigator & Mission Clock
        const centerIsland = document.createElement('div');
        centerIsland.className = 'obs-header-center';

        const targetPill = document.createElement('div');
        targetPill.className = 'obs-target-pill obs-header-target-nav';
        targetPill.id = 'obsTargetPill';
        const initialTargetName = this.cameraTarget || 'Earth';
        const initialLocalizedName =
            i18n.getBodyName(initialTargetName) ||
            i18n.getStarName(initialTargetName) ||
            i18n.getCometName(initialTargetName) ||
            i18n.getSpacecraftName(initialTargetName) ||
            initialTargetName;
        const initialIcon = this.getTargetIcon(initialTargetName);
        targetPill.title = i18n.t('ui.targetPillTitle') || 'Focused Celestial Object';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'target-icon';
        iconSpan.innerHTML = initialIcon;
        targetPill.appendChild(iconSpan);

        const srNameSpan = document.createElement('span');
        srNameSpan.className = 'target-name';
        srNameSpan.style.display = 'none';
        srNameSpan.textContent = initialLocalizedName;
        targetPill.appendChild(srNameSpan);

        const typeSelectWrap = document.createElement('div');
        typeSelectWrap.className = 'obs-header-select-wrap obs-type-select-wrap';
        const typeChevron = document.createElement('span');
        typeChevron.className = 'obs-select-chevron';
        typeChevron.innerHTML = svgIcon('chevron-down');
        typeSelectWrap.appendChild(typeSelect);
        typeSelectWrap.appendChild(typeChevron);
        targetPill.appendChild(typeSelectWrap);

        const targetSep = document.createElement('span');
        targetSep.className = 'obs-target-sep';
        targetSep.setAttribute('aria-hidden', 'true');
        targetSep.textContent = '/';
        targetPill.appendChild(targetSep);

        const bodySelectWrap = document.createElement('div');
        bodySelectWrap.className = 'obs-header-select-wrap obs-body-select-wrap';
        const bodyChevron = document.createElement('span');
        bodyChevron.className = 'obs-select-chevron';
        bodyChevron.innerHTML = svgIcon('chevron-down');
        bodySelectWrap.appendChild(bodySelect);
        bodySelectWrap.appendChild(bodyChevron);
        targetPill.appendChild(bodySelectWrap);

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
        controlsBtn.innerHTML = `<span class="ctrl-icon">${svgIcon('controls-sliders')}</span> <span class="ctrl-label">${i18n.t('ui.controls') || 'Controls'}</span>`;
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
            if (ctrlLabel) ctrlLabel.textContent = i18n.t('ui.controls') || 'Controls';

            if (this.targetPill) {
                this.targetPill.title = i18n.t('ui.targetPillTitle') || 'Focused Celestial Object';
                const curTarget = this.cameraTarget || 'Earth';
                this.updateTargetPillDisplay(curTarget);
            }
            if (this.headerTypeSelect) {
                this.headerTypeSelect.title = i18n.t('controls.sections.celestialNav') || 'Celestial Navigation';
                this.headerTypeSelect.setAttribute('aria-label', this.headerTypeSelect.title);
            }
            if (this.headerBodySelect) {
                this.headerBodySelect.title = i18n.t('ui.targetPillTitle') || 'Focused Celestial Object';
                this.headerBodySelect.setAttribute('aria-label', this.headerBodySelect.title);
            }

            if (this.headerSlotsModal?.isOpen) {
                this.openHeaderSlotsCustomizer();
            }

            if (this.transportDeck) {
                this.transportDeck.setAttribute('aria-label', i18n.t('controls.sections.simulationSpeed') || 'Simulation Speed');
            }
            if (this.slowDownBtn) {
                const slowDownTitle = i18n.t('ui.speedSlowDown') || 'Slow Down Simulation ([ / -)';
                this.slowDownBtn.title = slowDownTitle;
                this.slowDownBtn.setAttribute('aria-label', slowDownTitle);
            }
            if (this.speedUpBtn) {
                const speedUpTitle = i18n.t('ui.speedSpeedUp') || 'Speed Up Simulation (] / +)';
                this.speedUpBtn.title = speedUpTitle;
                this.speedUpBtn.setAttribute('aria-label', speedUpTitle);
            }
            if (this.speedBadge) {
                this.speedBadge.title = i18n.t('ui.speedPause');
                this.speedBadge.setAttribute('aria-label', i18n.t('ui.speedPause'));
            }
            this.lastSyncedTimeScale = NaN;
            this.lastTickerTarget = '';
            this.lastTickerDistStep = NaN;
            this.syncTransportState();
            if (this.timeBadge) {
                this.timeBadge.title = i18n.t('ui.utcTime');
            }
            if (this.liveIndicator) {
                this.liveIndicator.title = i18n.t('ui.liveRealTime');
            }
            if (this.liveTextEl) {
                const liveBadgeVal = i18n.t('ui.liveBadge');
                this.liveTextEl.textContent = liveBadgeVal && liveBadgeVal !== 'ui.liveBadge' ? liveBadgeVal : 'Live 1:1';
            }
            if (this.telemetryTicker && this.telemetryTicker.style.display !== 'none') {
                const targetName = (this.sceneManager.focusedBody as any)?.data?.name || 'Earth';
                const vel = this.getOrbitalVelocity(targetName);
                const distFormatted = this.realtimeDistanceKm >= 1000
                    ? `${i18n.formatNumber(Math.round(this.realtimeDistanceKm))} km`
                    : `${i18n.formatNumber(this.realtimeDistanceKm, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
                if (this.tickerBodyEl) this.tickerBodyEl.textContent = vel.label;
                if (this.tickerSpeedEl) this.tickerSpeedEl.textContent = `${i18n.formatNumber(vel.speedKmS, { maximumFractionDigits: 2 })} km/s`;
                if (this.tickerDistEl) {
                    const orbitVal = i18n.t('ui.orbitTelemetry', { dist: distFormatted });
                    this.tickerDistEl.textContent = orbitVal && orbitVal !== 'ui.orbitTelemetry'
                        ? orbitVal
                        : `Orbit: +${distFormatted}`;
                }
            }
            if (this.eventModal?.isOpen && this.activeHistoricalEventId) {
                const evt = HISTORICAL_SPACE_EVENTS.find(e => e.id === this.activeHistoricalEventId);
                if (evt) {
                    this.eventModal.show({
                        name: getLocalizedEventName(evt),
                        description: `<div style="padding: 10px; background-color: rgba(255, 215, 0, 0.2); margin-bottom: 10px; color: white;">${getLocalizedEventImpact(evt)}</div>`
                    });
                }
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
                PreferencesManager.set('measureMode', false);
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
        this.measureHudTextEl = content;
        this.measureHudClearBtn = clearBtn;
        this.measureHudCloseBtn = closeBtn;
        this.uiContainer.appendChild(hud);
        return hud;
    }

    public updateMeasureHud(): void {
        if (!this.measureHudBar) return;

        if (!this.sceneManager.measureMode) {
            if (this.measureHudBar.style.display !== 'none') {
                this.measureHudBar.style.display = 'none';
            }
            return;
        }

        if (this.measureHudBar.style.display !== 'flex') {
            this.measureHudBar.style.display = 'flex';
        }

        const content = this.measureHudTextEl ?? this.measureHudBar.querySelector<HTMLElement>('.measure-hud-text');
        const clearBtn = this.measureHudClearBtn ?? this.measureHudBar.querySelector<HTMLElement>('.measure-action-btn.clear-btn');
        const closeBtn = this.measureHudCloseBtn ?? this.measureHudBar.querySelector<HTMLElement>('.measure-action-btn.close-btn');

        const clearText = i18n.t('measurement.clear') || 'Clear';
        if (clearBtn && clearBtn.textContent !== clearText) clearBtn.textContent = clearText;
        if (closeBtn) {
            if (closeBtn.style.display !== 'inline-flex') closeBtn.style.display = 'inline-flex';
            const closeTitle = i18n.t('measurement.close') || 'Exit Measurement';
            if (closeBtn.title !== closeTitle) {
                closeBtn.title = closeTitle;
                closeBtn.setAttribute('aria-label', closeTitle);
            }
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

                const auPrecision = distanceAUVal < 0.001 ? 6 : distanceAUVal < 0.01 ? 5 : distanceAUVal < 0.1 ? 4 : 3;
                const mkmPrecision = distanceAUVal < 0.001 ? 4 : distanceAUVal < 0.01 ? 3 : 2;
                const roundedAU = Number(distanceAUVal.toFixed(auPrecision));
                const distanceMkmVal = roundedAU * 149.6;
                distanceAU = i18n.formatNumber(distanceAUVal, { minimumFractionDigits: auPrecision, maximumFractionDigits: auPrecision });
                distanceMkm = i18n.formatNumber(distanceMkmVal, { minimumFractionDigits: mkmPrecision, maximumFractionDigits: mkmPrecision });
            }

            const valEl = content.querySelector<HTMLElement>('.measure-val');
            const mkmEl = content.querySelector<HTMLElement>('.measure-mkm');
            const resultEl = content.querySelector<HTMLElement>('.measure-hud-result');

            if (valEl && mkmEl && resultEl && resultEl.dataset.targetA === nameA && resultEl.dataset.targetB === nameB) {
                const nextVal = `${distanceAU} ${unitAU}`;
                const nextMkm = `(${distanceMkm} ${unitMkm})`;
                if (valEl.textContent !== nextVal) valEl.textContent = nextVal;
                if (mkmEl.textContent !== nextMkm) mkmEl.textContent = nextMkm;
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

    private updateTargetPillDisplay(targetName: string, targetType?: string): void {
        if (!this.targetPill) return;
        const icon = this.getTargetIcon(targetName, targetType);
        const localizedName =
            i18n.getBodyName(targetName) ||
            i18n.getStarName(targetName) ||
            i18n.getConstellationName(targetName) ||
            i18n.getCometName(targetName) ||
            i18n.getSpacecraftName(targetName) ||
            targetName;
        const iconEl = this.targetPill.querySelector('.target-icon');
        if (iconEl) iconEl.innerHTML = icon;
        const nameEl = this.targetPill.querySelector('.target-name');
        if (nameEl) nameEl.textContent = localizedName;
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

        this.updateTargetPillDisplay(targetName, determinedType);
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

    public get modal(): Modal {
        if (!this._modal) {
            this._modal = new Modal(this.uiContainer);
        }
        return this._modal;
    }

    public set modal(val: Modal) {
        this._modal = val;
    }

    public get eventModal(): Modal {
        if (!this._eventModal) {
            const m = new Modal(this.uiContainer);
            m.modalElement.style.top = '50%';
            m.modalElement.style.left = '50%';
            m.modalElement.style.right = 'auto';
            m.modalElement.style.transform = 'translate(-50%, -50%)';
            m.modalElement.style.borderTop = '4px solid gold';
            this._eventModal = m;
        }
        return this._eventModal;
    }

    public set eventModal(val: Modal) {
        this._eventModal = val;
    }

    public get shortcutsModal(): Modal {
        if (!this._shortcutsModal) {
            const m = new Modal(this.uiContainer);
            m.modalElement.style.top = '50%';
            m.modalElement.style.left = '50%';
            m.modalElement.style.right = 'auto';
            m.modalElement.style.transform = 'translate(-50%, -50%)';
            m.modalElement.style.maxWidth = '580px';
            m.modalElement.style.width = '92vw';
            m.modalElement.style.borderTop = '3px solid #38bdf8';
            this._shortcutsModal = m;
        }
        return this._shortcutsModal;
    }

    public set shortcutsModal(val: Modal) {
        this._shortcutsModal = val;
    }

    public get headerSlotsModal(): Modal {
        if (!this._headerSlotsModal) {
            const m = new Modal(this.uiContainer, { enableAudioGuide: false });
            m.modalElement.style.top = '50%';
            m.modalElement.style.left = '50%';
            m.modalElement.style.right = 'auto';
            m.modalElement.style.transform = 'translate(-50%, -50%)';
            m.modalElement.style.maxWidth = '760px';
            m.modalElement.style.width = '94vw';
            m.modalElement.style.maxHeight = '85vh';
            m.modalElement.style.overflowY = 'auto';
            m.modalElement.style.borderTop = '3px solid #38bdf8';
            m.modalElement.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)';
            this._headerSlotsModal = m;
        }
        return this._headerSlotsModal;
    }

    public set headerSlotsModal(val: Modal) {
        this._headerSlotsModal = val;
    }

    showModal(data: any): void {
        if (this._eventModal) this._eventModal.hide();
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

        this._shortcutsModal?.dispose();
        this._headerSlotsModal?.dispose();
        this.audioManager?.dispose();
        this.performanceMonitor?.dispose();
        this._modal?.dispose();
        this._eventModal?.dispose();

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
