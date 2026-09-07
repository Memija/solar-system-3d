import * as THREE from 'three';
import * as dat from 'dat.gui';
import { SceneManager } from './SceneManager';
import { Modal } from './Modal';
import { Minimap } from './Minimap';
import { CustomDatePicker } from './CustomDatePicker';
import { CelestialBody } from './CelestialBody';
import { EventBus } from './EventBus';
import { CelestialBodyData, MoonData, StarData, ConstellationData, CometData, SpacecraftData } from './SolarSystemData';
import { i18n, AVAILABLE_LOCALES } from '../i18n/index';
import { AudioManager } from './AudioManager';
import { PerformanceMonitor } from './PerformanceMonitor';

export class UIManager {
    sceneManager: SceneManager;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    selectedBody: CelestialBodyData | MoonData | StarData | ConstellationData | CometData | SpacecraftData | null;
    uiContainer: HTMLElement;
    infoPanel: HTMLElement;
    modal: Modal;
    eventModal: Modal;
    shortcutsModal: Modal;
    audioManager: AudioManager;
    performanceMonitor: PerformanceMonitor;
    menuContainer: HTMLElement | null = null;
    gui: dat.GUI | null;
    mouseDownPos: THREE.Vector2;
    mouseUpPos: THREE.Vector2;
    datePanel: HTMLElement;
    customDatePicker: CustomDatePicker | null = null;
    tourController: dat.GUIController | null = null;
    minimap: Minimap;
    previousTimeSpeed: number | null = null;
    cameraTarget: string = 'Earth';
    ignoreNextBodyChange: boolean = false;
    dateLabel: HTMLElement | null = null;
    speedBadge: HTMLElement | null = null;
    timeBadge: HTMLElement | null = null;
    liveIndicator: HTMLElement | null = null;
    telemetryTicker: HTMLElement | null = null;
    private realtimeDistanceKm: number = 0;
    private lastRealtimeDateMs: number = 0;
    private lastFormattedTime: string = '';
    private updatePauseCtrl: (() => void) | null = null;
    private guiControllers: { controller: any; nameKey: string }[] = [];
    private guiFolders: { folder: any; nameKey: string }[] = [];

    private onTourFocusBound: ((e: Event) => void) | null = null;
    private onJumpToDateBound: ((e: Event) => void) | null = null;
    private onSelectCelestialBodyBound: ((e: Event) => void) | null = null;
    private onPointerDownBound: ((e: PointerEvent) => void) | null = null;
    private onPointerUpBound: ((e: PointerEvent) => void) | null = null;
    private onKeyDownBound: ((e: KeyboardEvent) => void) | null = null;
    private onDocClickLangBound: (() => void) | null = null;
    private guiTooltipElement: HTMLElement | null = null;
    private onDocClickGuiTooltipBound: ((e: MouseEvent) => void) | null = null;
    private unsubscribeI18n: (() => void) | null = null;
    closeLangDropdown: (() => void) | null = null;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedBody = null;
        this.gui = null;
        this.mouseDownPos = new THREE.Vector2();
        this.mouseUpPos = new THREE.Vector2();

        const container = document.getElementById('ui-container');
        if (!container) throw new Error("UI Container not found");
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

        this.audioManager = new AudioManager();
        this.performanceMonitor = new PerformanceMonitor(this.sceneManager.renderer, this.uiContainer);

        this.datePanel = this.createDatePanel();

        this.minimap = new Minimap(sceneManager, this.uiContainer);

        this.createSelectionMenu();
        this.initControls();
        this.initInteraction();

        this.onTourFocusBound = (e: Event) => {
            const customEvent = e as CustomEvent;
            const targetName = customEvent.detail;

            // Find data for this body
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

                // Stop simulation when jumping to active date
                this.sceneManager.timeScale = 0;
                if (this.sceneManager.onTimeScaleChange) {
                    this.sceneManager.onTimeScaleChange(0);
                }
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
            this.sceneManager.focusOnBody(targetName);

            const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
            const bodySelect = document.getElementById('bodySelect') as HTMLSelectElement;

            this.ignoreNextBodyChange = true;
                // If bodySelect isn't updated by the dispatch, revert the flag
                setTimeout(() => { this.ignoreNextBodyChange = false; }, 100);

            if (typeSelect && bodySelect) {
                let determinedType = 'Planet';
                if (this.sceneManager.planets.find(p => p.data.name === targetName) || targetName === 'Sun') {
                    determinedType = 'Planet';
                    if (targetName === 'Sun') determinedType = 'Star';
                } else if (this.sceneManager.planets.some(p => p.moons.find(m => m.data.name === targetName))) {
                    determinedType = 'Moon';
                } else if (this.sceneManager.comets.find(c => c.data.name === targetName)) {
                    determinedType = 'Comet';
                } else if (this.sceneManager.spacecrafts.find(s => s.data.name === targetName)) {
                    determinedType = 'Spacecraft';
                }

                typeSelect.value = determinedType;
                typeSelect.dispatchEvent(new Event('change'));
                bodySelect.value = targetName;
            }

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

    createInfoPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'hud-info-panel';
        this.uiContainer.appendChild(panel);
        return panel;
    }

    createDatePanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'date-panel-hud';
        panel.style.position = 'absolute';
        panel.style.bottom = '20px';
        panel.style.left = '20px';
        panel.style.zIndex = "1000";
        panel.style.pointerEvents = 'auto';

        const mainRow = document.createElement('div');
        mainRow.className = 'date-panel-main-row';

        const label = document.createElement('label');
        label.textContent = i18n.t('ui.simDate');
        this.dateLabel = label;
        mainRow.appendChild(label);

        const speedBadge = document.createElement('button');
        speedBadge.type = 'button';
        speedBadge.className = 'sim-speed-badge';
        speedBadge.title = 'Click to Pause / Resume (Space)';
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

        const initialDate = this.sceneManager.simDate || new Date();
        this.customDatePicker = new CustomDatePicker(initialDate, (newDate: Date) => {
            if (this.sceneManager.setSimDate) {
                this.sceneManager.setSimDate(newDate);
                // Stop simulation in place
                this.sceneManager.timeScale = 0;
                if (this.sceneManager.onTimeScaleChange) {
                    this.sceneManager.onTimeScaleChange(0);
                }
            }
        }, () => {
            this.sceneManager.timeScale = 0;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(0);
            }
        });

        mainRow.appendChild(this.customDatePicker.domElement);

        const timeBadge = document.createElement('div');
        timeBadge.className = 'sim-time-badge';
        timeBadge.title = 'Universal Time (UTC)';
        mainRow.appendChild(timeBadge);
        this.timeBadge = timeBadge;

        const liveIndicator = document.createElement('div');
        liveIndicator.className = 'sim-live-indicator';
        liveIndicator.title = 'Physical Real-Time Active (1:1)';
        liveIndicator.innerHTML = '<span class="live-pulse-dot"></span><span class="live-text">LIVE 1:1</span>';
        liveIndicator.style.display = 'none';
        mainRow.appendChild(liveIndicator);
        this.liveIndicator = liveIndicator;

        panel.appendChild(mainRow);

        const telemetryTicker = document.createElement('div');
        telemetryTicker.className = 'sim-telemetry-ticker';
        telemetryTicker.style.display = 'none';
        panel.appendChild(telemetryTicker);
        this.telemetryTicker = telemetryTicker;

        this.uiContainer.appendChild(panel);
        return panel;
    }

    private getOrbitalVelocity(bodyName: string): { speedKmS: number, label: string } {
        if (bodyName === 'Sun') {
            return { speedKmS: 220, label: '☀️ Sun (Milky Way)' };
        }
        const velocities: Record<string, { speedKmS: number, label: string }> = {
            'Mercury': { speedKmS: 47.4, label: '☿ Mercury' },
            'Venus': { speedKmS: 35.0, label: '♀ Venus' },
            'Earth': { speedKmS: 29.8, label: '🌍 Earth' },
            'Mars': { speedKmS: 24.1, label: '♂ Mars' },
            'Jupiter': { speedKmS: 13.1, label: '♃ Jupiter' },
            'Saturn': { speedKmS: 9.7, label: '♄ Saturn' },
            'Uranus': { speedKmS: 6.8, label: '⛢ Uranus' },
            'Neptune': { speedKmS: 5.4, label: '♆ Neptune' },
            'Pluto': { speedKmS: 4.7, label: '♇ Pluto' },
            'Moon': { speedKmS: 1.0, label: '🌙 Moon' },
            'ISS': { speedKmS: 7.7, label: '🛰️ ISS' },
            'Hubble': { speedKmS: 7.6, label: '🛰️ Hubble' },
            'Voyager': { speedKmS: 17.0, label: '🛰️ Voyager 1' },
            'James Webb': { speedKmS: 1.1, label: '🛰️ JWST' },
            'Cassini': { speedKmS: 18.0, label: '🛰️ Cassini' },
            'Halley': { speedKmS: 54.6, label: '☄️ Halley' },
        };
        for (const [key, val] of Object.entries(velocities)) {
            if (bodyName.includes(key) || key.includes(bodyName)) {
                return val;
            }
        }
        return { speedKmS: 29.8, label: `🌍 ${bodyName || 'Earth'}` };
    }

    update(timestamp: number = performance.now()) {
        if (this.sceneManager.simDate) {
            if (this.customDatePicker && !this.customDatePicker.isOpen) {
                this.customDatePicker.setDate(this.sceneManager.simDate);
            }

            if (this.timeBadge) {
                const d = this.sceneManager.simDate;
                const hh = String(d.getUTCHours()).padStart(2, '0');
                const mm = String(d.getUTCMinutes()).padStart(2, '0');
                const ss = String(d.getUTCSeconds()).padStart(2, '0');
                const timeStr = `${hh}:${mm}:${ss}`;
                if (timeStr !== this.lastFormattedTime) {
                    this.lastFormattedTime = timeStr;
                    this.timeBadge.innerHTML = `<span class="time-nums">${timeStr}</span> <span class="time-tz">UTC</span>`;
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
                    ? `${Math.round(this.realtimeDistanceKm).toLocaleString('en-US')} km`
                    : `${this.realtimeDistanceKm.toFixed(1)} km`;

                this.telemetryTicker.innerHTML = `
                    <span class="ticker-body">${vel.label}</span>
                    <span class="ticker-speed">${vel.speedKmS} km/s</span>
                    <span class="ticker-divider">•</span>
                    <span class="ticker-dist">Orbit: +${distFormatted}</span>
                `;
            } else {
                this.telemetryTicker.style.display = 'none';
                if (this.sceneManager.simDate) {
                    this.lastRealtimeDateMs = this.sceneManager.simDate.getTime();
                }
            }
        }

        if (this.minimap) {
            this.minimap.update();
        }
        if (this.performanceMonitor) {
            this.performanceMonitor.update(timestamp);
        }
    }

    initControls() {
        const gui = new dat.GUI({ autoPlace: false, width: 320 });
        this.gui = gui;
        this.uiContainer.appendChild(gui.domElement);
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '20px';
        gui.domElement.style.left = '20px';

        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            gui.domElement.classList.add('mobile-hidden');
            gui.close();
        }

        const initialSpeed = Math.round(this.sceneManager.timeScale * 10000) / 10000;
        const params = {
            togglePause: () => {
                this.togglePause();
            },
            speedPreset: 'oneDay',
            timeSpeed: initialSpeed,
            showOrbits: true,
            showMoons: true,
            measureMode: false,
            showAsteroids: true,
            showKuiperBelt: true,
            showDwarfPlanets: true,
            showComets: true,
            showSpacecrafts: true,
            showMeteors: false,
            showTrails: true,
            showMinimap: true,
            enableBloom: true,
            showHabitableZone: false,
            showEclipticGrid: false,
            realisticLighting: false,
            showAxes: false,
            realisticDistances: false,
            realSizeRatio: 1.0
        };

        // Setup custom tooltip for GUI
        const existingTooltip = document.getElementById('gui-custom-tooltip');
        if (existingTooltip && existingTooltip.parentElement) {
            existingTooltip.parentElement.removeChild(existingTooltip);
        }
        const tooltip = document.createElement('div');
        tooltip.id = 'gui-custom-tooltip';
        tooltip.className = 'gui-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        this.guiTooltipElement = tooltip;

        // Hide tooltip globally if clicking elsewhere
        this.onDocClickGuiTooltipBound = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.gui-info-icon')) {
                tooltip.style.display = 'none';
            }
        };
        document.addEventListener('click', this.onDocClickGuiTooltipBound);

        // Helper to add arrows to numeric input controllers
        const addNumericArrows = (controller: dat.GUIController | undefined, obj: any, prop: string, step: number, min?: number, max?: number) => {
            setTimeout(() => {
                if (controller && controller.domElement) {
                    const inputElement = controller.domElement.querySelector('input');
                    if (inputElement) {
                        inputElement.type = 'number';
                        inputElement.step = 'any';
                        inputElement.min = '0';
                        inputElement.style.textAlign = 'center';
                        inputElement.style.width = '64px';

                        const parent = inputElement.parentNode as HTMLElement;
                        if (parent) {
                            parent.style.display = 'flex';
                            parent.style.alignItems = 'center';
                            parent.style.justifyContent = 'center';

                            const decBtn = document.createElement('button');
                            decBtn.type = 'button';
                            decBtn.innerHTML = '◀';
                            decBtn.style.background = 'none';
                            decBtn.style.border = 'none';
                            decBtn.style.color = '#38bdf8';
                            decBtn.style.cursor = 'pointer';
                            decBtn.style.padding = '0 6px';
                            decBtn.style.fontSize = '11px';
                            decBtn.style.userSelect = 'none';
                            decBtn.onclick = () => {
                                let newVal = obj[prop] - step;
                                if (min !== undefined) newVal = Math.max(min, newVal);
                                newVal = Math.round(newVal * 10000) / 10000;
                                controller.setValue(newVal);
                            };
                            parent.insertBefore(decBtn, inputElement);

                            const incBtn = document.createElement('button');
                            incBtn.type = 'button';
                            incBtn.innerHTML = '▶';
                            incBtn.style.background = 'none';
                            incBtn.style.border = 'none';
                            incBtn.style.color = '#38bdf8';
                            incBtn.style.cursor = 'pointer';
                            incBtn.style.padding = '0 6px';
                            incBtn.style.fontSize = '11px';
                            incBtn.style.userSelect = 'none';
                            incBtn.onclick = () => {
                                let newVal = obj[prop] + step;
                                if (max !== undefined) newVal = Math.min(max, newVal);
                                newVal = Math.round(newVal * 10000) / 10000;
                                controller.setValue(newVal);
                            };
                            parent.appendChild(incBtn);
                        }
                    }
                }
            }, 100);
        };

        // Helper to add info icons to dat.gui items
        const addInfoIcon = (controller: dat.GUIController | undefined, tooltipKeyOrText: string) => {
            // Check if controller exists, helpful when testing where dat.gui might be mocked
            if (!controller) return;

            // dat.gui manipulates DOM somewhat asynchronously, we use setTimeout to ensure element is there
            setTimeout(() => {
                if (controller && controller.domElement && controller.domElement.closest) {
                    const li = controller.domElement.closest('li');
                    if (li) {
                        const nameNode = li.querySelector('.property-name');
                        if (nameNode) {
                            const icon = document.createElement('span');
                            icon.innerHTML = 'i';
                            icon.className = 'gui-info-icon';
                            icon.style.display = 'inline-block';
                            icon.style.width = '14px';
                            icon.style.height = '14px';
                            icon.style.lineHeight = '14px';
                            icon.style.textAlign = 'center';
                            icon.style.borderRadius = '50%';
                            icon.style.backgroundColor = '#444';
                            icon.style.color = '#fff';
                            icon.style.fontSize = '10px';
                            icon.style.marginLeft = '5px';
                            icon.style.cursor = 'help';
                            icon.style.position = 'relative';

                            // Show custom tooltip on hover (dynamically resolved)
                            icon.addEventListener('mouseenter', () => {
                                tooltip.innerHTML = tooltipKeyOrText.startsWith('controls.') ? i18n.t(tooltipKeyOrText) : tooltipKeyOrText;
                                tooltip.style.display = 'block';
                                const rect = icon.getBoundingClientRect();
                                let top = rect.top - tooltip.offsetHeight - 10;
                                let left = rect.left - (tooltip.offsetWidth / 2) + (rect.width / 2);

                                if (top < 0) {
                                    top = rect.bottom + 10;
                                }
                                if (left + tooltip.offsetWidth > window.innerWidth) {
                                    left = window.innerWidth - tooltip.offsetWidth - 10;
                                }
                                if (left < 0) {
                                    left = 10;
                                }

                                tooltip.style.top = `${top}px`;
                                tooltip.style.left = `${left}px`;
                            });

                            icon.addEventListener('mouseleave', () => {
                                tooltip.style.display = 'none';
                            });

                            nameNode.appendChild(icon);
                        }
                    }
                }
            }, 100);
        };

        // Simulation Controls
        const simFolder = gui.addFolder(i18n.t('controls.simulationFolder'));
        this.registerGuiFolder(simFolder, 'controls.simulationFolder');

        const pauseCtrl = simFolder.add(params, 'togglePause').name(
            this.sceneManager.timeScale === 0 ? `▶ ${i18n.t('controls.resume')}` : `⏸ ${i18n.t('controls.pause')}`
        );
        this.updatePauseCtrl = () => {
            if (pauseCtrl && typeof pauseCtrl.name === 'function') {
                const isPaused = this.sceneManager.timeScale === 0;
                const label = isPaused ? `▶ ${i18n.t('controls.resume')}` : `⏸ ${i18n.t('controls.pause')}`;
                pauseCtrl.name(label);
            }
        };

        const distCtrl = simFolder.add(params, 'realisticDistances').name(i18n.t('controls.realisticScale')).onChange(val => {
            this.sceneManager.toggleRealisticDistances(val);
            if (val) {
                this.modal.show({
                    name: i18n.t('popups.trueScaleTitle'),
                    description: i18n.t('popups.trueScaleDesc')
                });
            } else {
                if (this.modal.contentElement && this.modal.contentElement.innerHTML.includes(i18n.t('popups.trueScaleTitle'))) {
                    this.modal.hide();
                }
            }
        });
        this.registerGuiController(distCtrl, 'controls.realisticScale');
        addInfoIcon(distCtrl, "controls.tooltips.realisticScale");

        const minimapCtrl = simFolder.add(params, 'showMinimap').name(i18n.t('controls.showMinimap')).onChange(val => {
            this.minimap.setVisible(val);
        });
        this.registerGuiController(minimapCtrl, 'controls.showMinimap');

        const presetOptions: Record<string, string> = {
            [i18n.t('controls.speedPresets.oneDayPerSec')]: 'oneDay',
            [i18n.t('controls.speedPresets.realTime')]: 'realTime',
            [i18n.t('controls.speedPresets.oneHourPerSec')]: 'oneHour',
            [i18n.t('controls.speedPresets.oneWeekPerSec')]: 'oneWeek',
            [i18n.t('controls.speedPresets.oneMonthPerSec')]: 'oneMonth',
            [i18n.t('controls.speedPresets.paused')]: 'paused',
            [i18n.t('controls.speedPresets.custom')]: 'custom'
        };

        let isSyncingSpeed = false;

        const presetCtrl = simFolder.add(params, 'speedPreset', presetOptions).name(i18n.t('controls.speedPreset')).onChange(val => {
            if (isSyncingSpeed) return;
            if (val === 'custom') return;
            isSyncingSpeed = true;
            try {
                if (val === 'paused') {
                    if (this.sceneManager.timeScale !== 0) {
                        this.previousTimeSpeed = this.sceneManager.timeScale;
                        this.sceneManager.timeScale = 0;
                        if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(0);
                    }
                    return;
                }
                const targetSpeed = SceneManager.SPEED_PRESETS[val as keyof typeof SceneManager.SPEED_PRESETS];
                if (targetSpeed !== undefined) {
                    this.sceneManager.timeScale = targetSpeed;
                    timeSpeedController.setValue(targetSpeed);
                }
            } finally {
                isSyncingSpeed = false;
            }
        });
        this.registerGuiController(presetCtrl, 'controls.speedPreset');
        addInfoIcon(presetCtrl, "controls.tooltips.speedPreset");

        const syncPresetFromSpeed = (speed: number) => {
            if (speed === 0) {
                params.speedPreset = 'paused';
                if (presetCtrl && typeof presetCtrl.setValue === 'function') {
                    presetCtrl.setValue('paused');
                }
                return;
            }
            const presets = SceneManager.SPEED_PRESETS;
            let matched: string = 'custom';
            if (speed > 0 && speed <= presets.realTime * 1.5) matched = 'realTime';
            else if (Math.abs(speed - presets.oneHour) < 0.0002) matched = 'oneHour';
            else if (Math.abs(speed - presets.oneDay) < 0.002) matched = 'oneDay';
            else if (Math.abs(speed - presets.oneWeek) < 0.01) matched = 'oneWeek';
            else if (Math.abs(speed - presets.oneMonth) < 0.05) matched = 'oneMonth';
            params.speedPreset = matched;
            if (presetCtrl && typeof presetCtrl.setValue === 'function') {
                presetCtrl.setValue(matched);
            }
        };

        const timeSpeedController = simFolder.add(params, 'timeSpeed').min(0).name(i18n.t('controls.timeSpeed')).onChange(val => {
            if (isSyncingSpeed) return;
            isSyncingSpeed = true;
            try {
                this.sceneManager.timeScale = val;
                if (this.previousTimeSpeed !== null && val > 0) {
                    // User changed speed manually while something was selected
                    this.previousTimeSpeed = val;
                }
                syncPresetFromSpeed(val);
                if (this.updatePauseCtrl) {
                    this.updatePauseCtrl();
                }
            } finally {
                isSyncingSpeed = false;
            }
        });
        this.registerGuiController(timeSpeedController, 'controls.timeSpeed');
        addInfoIcon(timeSpeedController, "controls.tooltips.timeSpeed");

        if (timeSpeedController && typeof timeSpeedController.updateDisplay === 'function') {
            const originalUpdateDisplay = timeSpeedController.updateDisplay.bind(timeSpeedController);
            timeSpeedController.updateDisplay = () => {
                const val = typeof timeSpeedController.getValue === 'function' ? timeSpeedController.getValue() : params.timeSpeed;
                if (val > 0 && val < 0.001 && timeSpeedController.domElement) {
                    const input = timeSpeedController.domElement.querySelector('input');
                    if (input && document.activeElement !== input) {
                        input.value = val < 0.00001 ? val.toExponential(2) : val.toFixed(4);
                    }
                    return timeSpeedController;
                }
                return originalUpdateDisplay();
            };
        }

        // Make time speed input better looking and add arrows with fine step (0.005)
        addNumericArrows(timeSpeedController, params, 'timeSpeed', 0.005, 0);

        // Listen for internal speed changes
        this.sceneManager.onTimeScaleChange = (newSpeed: number) => {
            timeSpeedController.setValue(newSpeed);
            syncPresetFromSpeed(newSpeed);
            if (this.updatePauseCtrl) {
                this.updatePauseCtrl();
            }
        };
        const orbitsCtrl = simFolder.add(params, 'showOrbits').name(i18n.t('controls.showOrbits')).onChange(val => {
            this.sceneManager.toggleOrbits(val);
        });
        this.registerGuiController(orbitsCtrl, 'controls.showOrbits');

        const moonsCtrl = simFolder.add(params, 'showMoons').name(i18n.t('controls.showMoons')).onChange(val => {
            this.sceneManager.toggleMoons(val);
        });
        this.registerGuiController(moonsCtrl, 'controls.showMoons');

        const asteroidsCtrl = simFolder.add(params, 'showAsteroids').name(i18n.t('controls.showAsteroids')).onChange(val => {
            this.sceneManager.toggleAsteroids(val);
        });
        this.registerGuiController(asteroidsCtrl, 'controls.showAsteroids');

        const kuiperCtrl = simFolder.add(params, 'showKuiperBelt').name(i18n.t('controls.showKuiperBelt')).onChange(val => {
            this.sceneManager.toggleKuiperBelt(val);
        });
        this.registerGuiController(kuiperCtrl, 'controls.showKuiperBelt');

        const dwarfCtrl = simFolder.add(params, 'showDwarfPlanets').name(i18n.t('controls.showDwarfPlanets')).onChange(val => {
            this.sceneManager.toggleDwarfPlanets(val);
        });
        this.registerGuiController(dwarfCtrl, 'controls.showDwarfPlanets');

        const cometsCtrl = simFolder.add(params, 'showComets').name(i18n.t('controls.showComets')).onChange(val => {
            this.sceneManager.toggleComets(val);
        });
        this.registerGuiController(cometsCtrl, 'controls.showComets');

        const spacecraftsCtrl = simFolder.add(params, 'showSpacecrafts').name(i18n.t('controls.showSpacecraft')).onChange(val => {
            this.sceneManager.toggleSpacecrafts(val);
        });
        this.registerGuiController(spacecraftsCtrl, 'controls.showSpacecraft');

        const meteorsCtrl = simFolder.add(params, 'showMeteors').name(i18n.t('controls.showMeteors')).onChange(val => {
            this.sceneManager.toggleMeteors(val);
            if (val) {
                this.sceneManager.focusOnBody('Earth');
                this.modal.show({
                    name: i18n.t('popups.meteorsTitle'),
                    description: i18n.t('popups.meteorsDesc')
                });
            } else {
                if (this.modal.contentElement && this.modal.contentElement.innerHTML.includes(i18n.t('popups.meteorsTitle'))) {
                    this.modal.hide();
                }
            }
        });
        this.registerGuiController(meteorsCtrl, 'controls.showMeteors');

        const trailsCtrl = simFolder.add(params, 'showTrails').name(i18n.t('controls.showTrails')).onChange(val => {
            this.sceneManager.toggleTrails(val);
        });
        this.registerGuiController(trailsCtrl, 'controls.showTrails');
        addInfoIcon(trailsCtrl, "controls.tooltips.showTrails");
        simFolder.open();

        // Environment Enhancements
        const envFolder = gui.addFolder(i18n.t('controls.environmentFolder'));
        this.registerGuiFolder(envFolder, 'controls.environmentFolder');

        const habZoneCtrl = envFolder.add(params, 'showHabitableZone').name(i18n.t('controls.habitableZone')).onChange(val => {
            this.sceneManager.toggleHabitableZone(val);
        });
        this.registerGuiController(habZoneCtrl, 'controls.habitableZone');
        addInfoIcon(habZoneCtrl, "controls.tooltips.habitableZone");

        const eclipticCtrl = envFolder.add(params, 'showEclipticGrid').name(i18n.t('controls.eclipticGrid')).onChange(val => {
            this.sceneManager.toggleEclipticGrid(val);
        });
        this.registerGuiController(eclipticCtrl, 'controls.eclipticGrid');
        addInfoIcon(eclipticCtrl, "controls.tooltips.eclipticGrid");

        const bloomCtrl = envFolder.add(params, 'enableBloom').name(i18n.t('controls.enableBloom')).onChange(val => {
            if (this.sceneManager.bloomPass) {
                this.sceneManager.bloomPass.enabled = val;
            }
        });
        this.registerGuiController(bloomCtrl, 'controls.enableBloom');
        addInfoIcon(bloomCtrl, "controls.tooltips.enableBloom");

        const lightingCtrl = envFolder.add(params, 'realisticLighting').name(i18n.t('controls.realisticLighting')).onChange(val => {
            this.sceneManager.toggleRealisticLighting(val);
        });
        this.registerGuiController(lightingCtrl, 'controls.realisticLighting');
        addInfoIcon(lightingCtrl, "controls.tooltips.realisticLighting");

        const axesCtrl = envFolder.add(params, 'showAxes').name(i18n.t('controls.showAxes')).onChange(val => {
            this.sceneManager.toggleAxes(val);
        });
        this.registerGuiController(axesCtrl, 'controls.showAxes');
        addInfoIcon(axesCtrl, "controls.tooltips.showAxes");

        envFolder.open();

        // Camera Controls
        const cameraFolder = gui.addFolder(i18n.t('controls.cameraFolder'));
        this.registerGuiFolder(cameraFolder, 'controls.cameraFolder');

        const cameraControls = {
            focus: () => {
                const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
                if (typeSelect?.value === 'Star') {
                    const star = this.sceneManager.starMeshes.find(m => m.userData.name === this.cameraTarget);
                    if (star) this.sceneManager.focusOnStar(star);
                } else if (typeSelect?.value === 'Constellation') {
                    this.sceneManager.focusOnConstellation(this.cameraTarget);
                } else {
                    this.sceneManager.focusOnBody(this.cameraTarget);
                }
            },
            surfaceView: () => this.sceneManager.setSurfaceView(this.cameraTarget),
            detach: () => this.sceneManager.detachCamera()
        };

        const attachCtrl = cameraFolder.add(cameraControls, 'focus').name(i18n.t('controls.attachCamera'));
        this.registerGuiController(attachCtrl, 'controls.attachCamera');

        const surfaceCtrl = cameraFolder.add(cameraControls, 'surfaceView').name(i18n.t('controls.viewFromSurface'));
        this.registerGuiController(surfaceCtrl, 'controls.viewFromSurface');

        const detachCtrl = cameraFolder.add(cameraControls, 'detach').name(i18n.t('controls.freeCamera'));
        this.registerGuiController(detachCtrl, 'controls.freeCamera');

        const toolsFolder = gui.addFolder(i18n.t('controls.toolsFolder'));
        this.registerGuiFolder(toolsFolder, 'controls.toolsFolder');

        const measureCtrl = toolsFolder.add(params, 'measureMode').name(i18n.t('controls.measureDistance')).onChange(val => {
            this.sceneManager.toggleMeasureMode(val);
            if (!val && params.realisticDistances) {
                distCtrl.setValue(false);
            }
        });
        this.registerGuiController(measureCtrl, 'controls.measureDistance');

        this.sceneManager.onMeasureTargetsSet = () => {
            if (!params.realisticDistances) {
                distCtrl.setValue(true);
            }
        };

        addInfoIcon(measureCtrl, "controls.tooltips.measureDistance");
        toolsFolder.open();

        const tourParams = {
            tourMode: false,
            tourSpeed: 5 // Default speed maps to a moderate interval
        };

        this.tourController = cameraFolder.add(tourParams, 'tourMode').name(i18n.t('controls.cinematicTour')).onChange(val => {
            this.sceneManager.tourMode = val;
            if (val) {
                this.sceneManager.tourTimer = 0;
                // Start with the first body
                const targetName = this.sceneManager.tourTargets[this.sceneManager.tourIndex];
                this.sceneManager.focusOnBody(targetName);
                EventBus.emit('tour-focus', targetName);
            } else {
                this.sceneManager.detachCamera();
            }
        });
        this.registerGuiController(this.tourController, 'controls.cinematicTour');

        // 1 to 10 range. Speed 1 -> 20s interval. Speed 10 -> 2s interval.
        // Formula: interval = 22 - (speed * 2)
        const tourSpeedController = cameraFolder.add(tourParams, 'tourSpeed', 1, 10).name(i18n.t('controls.tourSpeed')).onChange(val => {
            this.sceneManager.tourInterval = 22 - (val * 2);
        });
        this.registerGuiController(tourSpeedController, 'controls.tourSpeed');

        addNumericArrows(tourSpeedController, tourParams, 'tourSpeed', 1, 1, 10);

        cameraFolder.open();
    }

    public registerGuiController(controller: any, nameKey: string) {
        this.guiControllers.push({ controller, nameKey });
    }

    public registerGuiFolder(folder: any, nameKey: string) {
        this.guiFolders.push({ folder, nameKey });
    }

    public updateGuiTranslations() {
        this.guiFolders.forEach(({ folder, nameKey }) => {
            if (folder && folder.domElement) {
                const titleNode = folder.domElement.querySelector('.title');
                if (titleNode) {
                    titleNode.textContent = i18n.t(nameKey);
                }
            }
        });

        this.guiControllers.forEach(({ controller, nameKey }) => {
            if (controller && controller.domElement && controller.domElement.closest) {
                const li = controller.domElement.closest('li');
                if (li) {
                    const nameNode = li.querySelector('.property-name');
                    if (nameNode) {
                        const icon = nameNode.querySelector('.gui-info-icon');
                        nameNode.childNodes[0].nodeValue = i18n.t(nameKey);
                        if (icon && !nameNode.contains(icon)) {
                            nameNode.appendChild(icon);
                        }
                    }
                }
            }
        });

        if (this.updatePauseCtrl) {
            this.updatePauseCtrl();
        }

        if (this.speedBadge) {
            const isPaused = this.sceneManager?.timeScale === 0;
            const speedText = typeof this.sceneManager?.getFormattedTimeSpeed === 'function'
                ? this.sceneManager.getFormattedTimeSpeed()
                : '1.0 day/s';
            const pausedLabel = i18n.t('controls.speedPresets.paused') || 'Paused';
            this.speedBadge.textContent = isPaused ? `⏸ ${pausedLabel}` : `▶ ${speedText}`;
        }
    }

    public togglePause() {
        if (!this.sceneManager) return;
        if (this.sceneManager.timeScale === 0) {
            const restored = (this.previousTimeSpeed && this.previousTimeSpeed > 0)
                ? this.previousTimeSpeed
                : (SceneManager.REALISTIC_TIME_SCALE || 0.00273785);
            this.sceneManager.timeScale = restored;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(restored);
            }
        } else {
            this.previousTimeSpeed = this.sceneManager.timeScale;
            this.sceneManager.timeScale = 0;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(0);
            }
        }
    }

    createSelectionMenu() {
        const menuContainer = document.createElement('div');
        this.menuContainer = menuContainer;
        menuContainer.className = 'selection-menu-container';
        menuContainer.style.position = 'absolute';
        menuContainer.style.top = '20px';
        menuContainer.style.right = '20px';
        menuContainer.style.zIndex = '1600';

        // Type Selector
        const typeSelect = document.createElement('select');
        typeSelect.id = 'typeSelect';        const getTypes = () => [
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
                option.textContent = t.label;
                typeSelect.appendChild(option);
            });
            typeSelect.value = currentVal;
        };

        // Populate Body Selector based on Type
        const bodySelect = document.createElement('select');
        bodySelect.id = 'bodySelect';

        const updateBodyOptions = () => {
            const currentVal = bodySelect.value;
            bodySelect.innerHTML = '';
            const selectedType = typeSelect.value;

            if (selectedType === 'Star') {
                // Add Sun (if it's in planets but we want it here)
                const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                if (sun) {
                    const option = document.createElement('option');
                    option.value = 'Sun';
                    option.textContent = i18n.getBodyName('Sun');
                    bodySelect.appendChild(option);
                }

                // Add other stars
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

        // Initial population
        populateTypeOptions();
        typeSelect.value = 'Planet'; // Default
        updateBodyOptions();

        // Event Listeners
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

            if (this.sceneManager.tourMode && this.tourController) {
                this.tourController.setValue(false);
            }

            if (this.sceneManager.measureMode) {
                this.sceneManager.setMeasureTarget(selectedName);
                return; // Don't show modal or focus when measuring
            }

            // Automatically hide any previous UI panels
            this.hideInfo();

            if (selectedType === 'Star') {
                if (selectedName === 'Sun') {
                    const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                    if (sun) {
                        this.showModal(sun.data);
                    }
                    this.sceneManager.focusOnBody('Sun');
                } else {
                    const star = this.sceneManager.starMeshes.find(m => m.userData.name === selectedName);
                    if (star && star.userData) {
                        this.showModal(star.userData);
                    }
                    if (star) {
                        this.sceneManager.focusOnStar(star);
                    }
                }
            } else if (selectedType === 'Constellation') {
                const center = this.sceneManager.constellationManager?.getConstellationCenter(selectedName);
                if (center) {
                    // Try to find the constellation data
                    const group = this.sceneManager.constellationManager?.constellationMeshes.find(g => g.userData.name === selectedName);
                    if (group && group.userData) {
                        this.showModal(group.userData);
                    }
                }
                this.sceneManager.focusOnConstellation(selectedName);
            } else {
                // Find planet, comet, spacecraft or moon
                let foundData: any = null;
                const findTarget = (body: any) => {
                    if (body.data && body.data.name === selectedName) {
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
                this.sceneManager.focusOnBody(selectedName);
            }
        });

        menuContainer.appendChild(typeSelect);
        menuContainer.appendChild(bodySelect);

        // Quick Action Buttons (Radar & Controls) for Mobile & Desktop
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'top-actions-container';

        const radarBtn = document.createElement('button');
        radarBtn.className = 'hud-icon-btn';
        radarBtn.id = 'hudRadarBtn';
        radarBtn.title = i18n.t('ui.radarToggle');
        radarBtn.innerHTML = '🛰️';
        radarBtn.setAttribute('aria-label', i18n.t('ui.radarToggle'));
        radarBtn.onclick = (e) => {
            e.stopPropagation();
            const next = !this.minimap.isVisible;
            this.minimap.setVisible(next);
            radarBtn.classList.toggle('active', next);
        };
        if (this.minimap.isVisible) radarBtn.classList.add('active');

        const controlsBtn = document.createElement('button');
        controlsBtn.className = 'hud-icon-btn';
        controlsBtn.id = 'hudControlsBtn';
        controlsBtn.title = i18n.t('ui.controlsToggle');
        controlsBtn.innerHTML = '⚙️';
        controlsBtn.setAttribute('aria-label', i18n.t('ui.controlsToggle'));
        controlsBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.gui) {
                const isHidden = this.gui.domElement.classList.toggle('mobile-hidden');
                controlsBtn.classList.toggle('active', !isHidden);
                if (!isHidden && this.gui.closed) {
                    this.gui.open();
                }
            }
        };

        // Language Switcher Widget
        const langContainer = document.createElement('div');
        langContainer.className = 'lang-switcher-container';

        const langBtn = document.createElement('button');
        langBtn.className = 'hud-icon-btn lang-btn';
        langBtn.id = 'hudLanguageBtn';
        langBtn.title = i18n.t('ui.languageToggle');
        langBtn.setAttribute('aria-label', i18n.t('ui.languageToggle'));
        langBtn.innerHTML = `<span class="lang-globe">🌐</span> <span class="lang-code">${i18n.currentLanguage.toUpperCase()}</span>`;

        const langDropdown = document.createElement('div');
        langDropdown.className = 'lang-dropdown-menu';
        langDropdown.style.display = 'none';

        const closeLangDropdown = () => {
            langDropdown.style.display = 'none';
            langBtn.classList.remove('active');
            langContainer.classList.remove('open');
            menuContainer.classList.remove('has-lang-open');
        };

        const openLangDropdown = () => {
            langDropdown.style.display = 'block';
            langBtn.classList.add('active');
            langContainer.classList.add('open');
            menuContainer.classList.add('has-lang-open');
        };

        this.closeLangDropdown = closeLangDropdown;

        const renderLangDropdown = () => {
            langDropdown.innerHTML = '';
            AVAILABLE_LOCALES.forEach(loc => {
                const item = document.createElement('div');
                item.className = `lang-dropdown-item ${loc.code === i18n.currentLanguage ? 'active' : ''}`;
                item.innerHTML = `<span class="lang-flag">${loc.flag}</span> <span class="lang-label">${loc.nativeName}</span>`;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    i18n.setLanguage(loc.code);
                    closeLangDropdown();
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

        // Cosmic Audio Ambience Toggle
        const soundBtn = document.createElement('button');
        soundBtn.className = 'hud-icon-btn';
        soundBtn.id = 'hudSoundBtn';
        soundBtn.title = 'Cosmic Audio Ambience (S)';
        soundBtn.setAttribute('aria-label', 'Toggle cosmic audio');
        soundBtn.innerHTML = this.audioManager.getAudioEnabled() ? '🔊' : '🔇';
        if (this.audioManager.getAudioEnabled()) soundBtn.classList.add('active');
        soundBtn.onclick = (e) => {
            e.stopPropagation();
            const enabled = this.audioManager.toggle();
            soundBtn.innerHTML = enabled ? '🔊' : '🔇';
            soundBtn.classList.toggle('active', enabled);
        };

        // Engine Performance Telemetry Toggle
        const perfBtn = document.createElement('button');
        perfBtn.className = 'hud-icon-btn';
        perfBtn.id = 'hudPerfBtn';
        perfBtn.title = 'Performance Telemetry (P)';
        perfBtn.setAttribute('aria-label', 'Toggle engine telemetry');
        perfBtn.innerHTML = '⚡';
        perfBtn.onclick = (e) => {
            e.stopPropagation();
            const visible = this.performanceMonitor.toggle();
            perfBtn.classList.toggle('active', visible);
        };

        // Keyboard Shortcuts Cheatsheet Guide
        const helpBtn = document.createElement('button');
        helpBtn.className = 'hud-icon-btn';
        helpBtn.id = 'hudHelpBtn';
        helpBtn.title = 'Keyboard Shortcuts (? / H)';
        helpBtn.setAttribute('aria-label', 'View keyboard shortcuts');
        helpBtn.innerHTML = '⌨️';
        helpBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleShortcutsModal();
        };

        // Astrophotography Snapshot Tool
        const snapshotBtn = document.createElement('button');
        snapshotBtn.className = 'hud-icon-btn';
        snapshotBtn.id = 'hudSnapshotBtn';
        snapshotBtn.title = 'Astrophotography Snapshot (K)';
        snapshotBtn.setAttribute('aria-label', 'Capture high-resolution screenshot');
        snapshotBtn.innerHTML = '📸';
        snapshotBtn.onclick = (e) => {
            e.stopPropagation();
            this.audioManager.playShutter();
            this.sceneManager.captureScreenshot(this.cameraTarget);
        };

        actionsContainer.appendChild(radarBtn);
        actionsContainer.appendChild(snapshotBtn);
        actionsContainer.appendChild(soundBtn);
        actionsContainer.appendChild(perfBtn);
        actionsContainer.appendChild(helpBtn);
        actionsContainer.appendChild(controlsBtn);
        actionsContainer.appendChild(langContainer);
        menuContainer.appendChild(actionsContainer);

        // Language change reactive listener
        this.unsubscribeI18n = i18n.onLanguageChange(() => {
            const codeSpan = langBtn.querySelector('.lang-code');
            if (codeSpan) codeSpan.textContent = i18n.currentLanguage.toUpperCase();
            langBtn.title = i18n.t('ui.languageToggle');
            radarBtn.title = i18n.t('ui.radarToggle');
            controlsBtn.title = i18n.t('ui.controlsToggle');

            renderLangDropdown();
            populateTypeOptions();
            updateBodyOptions();

            if (this.dateLabel) {
                this.dateLabel.textContent = i18n.t('ui.simDate');
            }

            this.updateGuiTranslations();
        });

        this.uiContainer.appendChild(menuContainer);
    }

    syncDropdownSelection(targetName: string, targetType?: string) {
        this.cameraTarget = targetName;
        const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
        const bodySelect = document.getElementById('bodySelect') as HTMLSelectElement;

        if (typeSelect && bodySelect) {
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

            this.ignoreNextBodyChange = true;
            setTimeout(() => { this.ignoreNextBodyChange = false; }, 100);

            if (typeSelect.value !== determinedType) {
                typeSelect.value = determinedType;
                typeSelect.dispatchEvent(new Event('change'));
            }
            bodySelect.value = targetName;
        }
    }

    initInteraction() {
        const canvas = this.sceneManager.renderer.domElement;
        // Use pointer events for better compatibility and to match OrbitControls
        this.onPointerDownBound = (event: PointerEvent) => this.onPointerDown(event);
        this.onPointerUpBound = (event: PointerEvent) => this.onPointerUp(event);
        canvas.addEventListener('pointerdown', this.onPointerDownBound);
        canvas.addEventListener('pointerup', this.onPointerUpBound);

        // Keyboard navigation & shortcuts
        this.onKeyDownBound = (event: KeyboardEvent) => {
            const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

            if (event.code === 'Space') {
                event.preventDefault();
                this.togglePause();
            } else if (event.key === 'Escape') {
                if (this.closeLangDropdown) this.closeLangDropdown();
                this.modal.hide();
                if (this.eventModal) this.eventModal.hide();
                if (this.shortcutsModal) this.shortcutsModal.hide();
                if (typeof this.sceneManager?.detachCamera === 'function') {
                    this.sceneManager.detachCamera();
                }
            } else if (event.key >= '0' && event.key <= '9') {
                const planetMap: Record<string, string> = {
                    '0': 'Sun',
                    '1': 'Mercury',
                    '2': 'Venus',
                    '3': 'Earth',
                    '4': 'Mars',
                    '5': 'Jupiter',
                    '6': 'Saturn',
                    '7': 'Uranus',
                    '8': 'Neptune',
                    '9': 'Pluto'
                };
                const target = planetMap[event.key];
                if (target) {
                    EventBus.emit('select-celestial-body', { name: target });
                }
            } else if (event.key === '[' || event.key === '-') {
                const current = this.sceneManager.timeScale;
                const next = Math.max(0, Math.round((current - 0.005) * 10000) / 10000);
                this.sceneManager.timeScale = next;
                if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(next);
                this.audioManager.playTick();
            } else if (event.key === ']' || event.key === '=' || event.key === '+') {
                const current = this.sceneManager.timeScale;
                const next = Math.round((current + 0.005) * 10000) / 10000;
                this.sceneManager.timeScale = next;
                if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(next);
                this.audioManager.playTick();
            } else if (event.key === 's' || event.key === 'S') {
                const enabled = this.audioManager.toggle();
                const soundBtn = document.getElementById('hudSoundBtn');
                if (soundBtn) {
                    soundBtn.innerHTML = enabled ? '🔊' : '🔇';
                    soundBtn.classList.toggle('active', enabled);
                }
            } else if (event.key === 'p' || event.key === 'P') {
                const visible = this.performanceMonitor.toggle();
                const perfBtn = document.getElementById('hudPerfBtn');
                if (perfBtn) perfBtn.classList.toggle('active', visible);
            } else if (event.key === 'c' || event.key === 'C') {
                if (this.sceneManager.constellationManager) {
                    const next = !this.sceneManager.constellationManager.isVisible;
                    this.sceneManager.constellationManager.toggleVisibility(next);
                }
            } else if (event.key === 'k' || event.key === 'K') {
                this.audioManager.playShutter();
                this.sceneManager.captureScreenshot(this.cameraTarget);
            } else if (event.key === 'f' || event.key === 'F') {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            } else if (event.key === '?' || event.key === '/' || event.key === 'h' || event.key === 'H') {
                this.toggleShortcutsModal();
            } else if (event.key === 't' || event.key === 'T') {
                if (this.tourController) {
                    this.tourController.setValue(!this.sceneManager.tourMode);
                }
            } else if (event.key === 'm' || event.key === 'M') {
                this.minimap.setVisible(!this.minimap.isVisible);
                const radarBtn = document.getElementById('hudRadarBtn');
                if (radarBtn) radarBtn.classList.toggle('active', this.minimap.isVisible);
            } else if (event.key === 'o' || event.key === 'O') {
                this.sceneManager.toggleOrbits(!this.sceneManager.showOrbits);
            } else if (event.key === 'r' || event.key === 'R') {
                this.sceneManager.toggleRealisticDistances(!this.sceneManager.realisticDistances);
            }
        };
        window.addEventListener('keydown', this.onKeyDownBound);
    }

    onPointerDown(event: PointerEvent) {
        if (event.isPrimary === false) return;
        this.mouseDownPos.set(event.clientX, event.clientY);
    }

    onPointerUp(event: PointerEvent) {
        if (event.isPrimary === false) return;
        this.mouseUpPos.set(event.clientX, event.clientY);

        // Only process click if mouse hasn't moved much (not a drag)
        const dragDistance = this.mouseDownPos.distanceTo(this.mouseUpPos);
        const threshold = event.pointerType === 'touch' ? 22 : 10;
        if (dragDistance < threshold) { // Threshold for click vs drag
            this.onClick(event.clientX, event.clientY);
        }
    }

    private handlePlanetsAndMoonsIntersection(): boolean {
        const interactableObjects: THREE.Object3D[] = [];
        const bodyMap = new Map<THREE.Object3D, CelestialBodyData | MoonData | CometData | SpacecraftData>();

        const addBodyToInteractables = (body: CelestialBody) => {
            if (body.mesh) {
                interactableObjects.push(body.mesh);
                bodyMap.set(body.mesh, body.data);
            }
            if (body.cloudMesh) {
                interactableObjects.push(body.cloudMesh);
                bodyMap.set(body.cloudMesh, body.data);
            }
            if (body.atmosphereMesh) {
                interactableObjects.push(body.atmosphereMesh);
                bodyMap.set(body.atmosphereMesh, body.data);
            }
            body.moons.forEach(moon => addBodyToInteractables(moon));
        };

        this.sceneManager.planets.forEach(p => addBodyToInteractables(p));

        this.sceneManager.comets.forEach(comet => {
            if (comet.mesh?.visible) {
                interactableObjects.push(comet.mesh);
                bodyMap.set(comet.mesh, comet.data);
            }
        });

        this.sceneManager.spacecrafts.forEach(sc => {
            if (sc.mesh?.visible) {
                interactableObjects.push(sc.mesh);
                bodyMap.set(sc.mesh, sc.data);
            }
        });

        const intersects = this.raycaster.intersectObjects(interactableObjects, true); // true for recursive (since spacecraft is a Group)

        if (intersects.length > 0) {
            for (const intersect of intersects) {
                // Because we use recursive intersection (true), intersect.object might be a child mesh of the Spacecraft group
                // We need to trace up to see if it's in our bodyMap
                let currentObj: THREE.Object3D | null = intersect.object;
                let foundData = null;

                while (currentObj && currentObj !== this.sceneManager.scene) {
                    foundData = bodyMap.get(currentObj);
                    if (foundData) break;
                    currentObj = currentObj.parent;
                }

                if (foundData) {
                    if (this.sceneManager.tourMode && this.tourController) {
                        this.tourController.setValue(false);
                    }

                    if (this.sceneManager.measureMode) {
                        this.sceneManager.setMeasureTarget(foundData.name);
                        return true; // Don't show modal or focus when measuring
                    }

                    this.syncDropdownSelection(foundData.name);
                    this.showModal(foundData);
                    this.sceneManager.focusOnBody(foundData.name);
                    return true;
                }
            }
        }
        return false;
    }

    private handleStarsIntersection(): boolean {
        if (!this.sceneManager.starMeshes) return false;

        const starIntersects = this.raycaster.intersectObjects(this.sceneManager.starMeshes);
        if (starIntersects.length > 0) {
            if (this.sceneManager.tourMode && this.tourController) {
                this.tourController.setValue(false);
            }
            const selectedStar = starIntersects[0].object;
            if (selectedStar.userData?.name) {
                this.syncDropdownSelection(selectedStar.userData.name, 'Star');
                this.showModal(selectedStar.userData);
                this.sceneManager.focusOnStar(selectedStar);
            }
            return true;
        }
        return false;
    }

    private handleConstellationsIntersection(): boolean {
        if (!this.sceneManager.constellationManager) return false;

        const constellationObjects = this.sceneManager.constellationManager.getInteractableObjects();
        const constellationIntersects = this.raycaster.intersectObjects(constellationObjects);

        if (constellationIntersects.length > 0) {
            const selectedObj = constellationIntersects[0].object;
            if (selectedObj.userData?.type === 'ConstellationStar' || selectedObj.userData?.type === 'ConstellationLine') {
                if (this.sceneManager.tourMode && this.tourController) {
                    this.tourController.setValue(false);
                }
                this.syncDropdownSelection(selectedObj.userData.name, 'Constellation');
                this.showModal(selectedObj.userData);
                return true;
            }
        }
        return false;
    }

    onClick(clientX: number, clientY: number) {
        try {
            // Calculate NDC from click coordinates
            const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            // Raycast
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

            if (this.handlePlanetsAndMoonsIntersection()) return;
            if (this.handleStarsIntersection()) return;
            if (this.handleConstellationsIntersection()) return;

            // On touch or small screens, assist with proximity detection within generous radius
            if (this.handleProximityTouchIntersection(clientX, clientY)) return;

            // Nothing clicked
            this.hideInfo();
        } catch (error) {
            console.error("Error in onClick:", error);
        }
    }

    private handleProximityTouchIntersection(clientX: number, clientY: number): boolean {
        if (typeof window !== 'undefined' && window.innerWidth > 768 && !('ontouchstart' in window)) {
            return false;
        }

        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        const camera = this.sceneManager.camera;
        if (!camera) return false;

        let closestBody: any = null;
        let minDistanceSq = 32 * 32; // 32px touch target radius squared

        const tempVec = new THREE.Vector3();

        const checkBody = (data: any, obj: THREE.Object3D | null) => {
            if (!obj || !obj.visible) return;
            obj.getWorldPosition(tempVec);
            tempVec.project(camera);

            // If behind camera, skip
            if (tempVec.z > 1 || tempVec.z < -1) return;

            const screenX = ((tempVec.x + 1) * 0.5) * rect.width + rect.left;
            const screenY = ((-tempVec.y + 1) * 0.5) * rect.height + rect.top;

            const dx = clientX - screenX;
            const dy = clientY - screenY;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closestBody = data;
            }
        };

        this.sceneManager.planets.forEach(p => {
            if (p.mesh) checkBody(p.data, p.mesh);
            p.moons.forEach(m => {
                if (m.mesh) checkBody(m.data, m.mesh);
            });
        });

        this.sceneManager.comets.forEach(c => {
            if (c.mesh) checkBody(c.data, c.mesh);
        });

        this.sceneManager.spacecrafts.forEach(sc => {
            if (sc.mesh) checkBody(sc.data, sc.mesh);
        });

        if (closestBody) {
            if (this.sceneManager.tourMode && this.tourController) {
                this.tourController.setValue(false);
            }
            if (this.sceneManager.measureMode) {
                this.sceneManager.setMeasureTarget(closestBody.name);
                return true;
            }
            this.syncDropdownSelection(closestBody.name);
            this.showModal(closestBody);
            this.sceneManager.focusOnBody(closestBody.name);
            return true;
        }

        return false;
    }

    showModal(data: any) {
        if (this.eventModal) this.eventModal.hide();
        this.modal.show(data);
        this.infoPanel.style.display = 'none'; // Ensure simple info is hidden

        // Slow down time for low Earth orbit spacecraft
        if ('targetBody' in data && data.targetBody === 'Earth' && 'distance' in data && data.distance < 10) {
            if (this.previousTimeSpeed === null) {
                this.previousTimeSpeed = this.sceneManager.timeScale;
            }
            const slowSpeed = 0.01; // Slow down
            if (this.sceneManager.timeScale > slowSpeed) {
                this.sceneManager.timeScale = slowSpeed;
                if (this.sceneManager.onTimeScaleChange) {
                    this.sceneManager.onTimeScaleChange(slowSpeed);
                }
            }
        } else if (this.previousTimeSpeed !== null) {
            // Restore speed if switching to something else
            this.sceneManager.timeScale = this.previousTimeSpeed;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(this.previousTimeSpeed);
            }
            this.previousTimeSpeed = null;
        }
    }

    hideInfo() {
        this.selectedBody = null;
        this.infoPanel.style.display = 'none';

        if (this.previousTimeSpeed !== null) {
            this.sceneManager.timeScale = this.previousTimeSpeed;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(this.previousTimeSpeed);
            }
            this.previousTimeSpeed = null;
        }
    }

    toggleShortcutsModal() {
        if (this.shortcutsModal.isOpen) {
            this.shortcutsModal.hide();
            return;
        }

        const shortcutsContent = `
            <div class="shortcuts-guide-modal">
                <div class="shortcuts-section">
                    <h4 class="shortcuts-group-title">🎯 Navigation & Quick Focus</h4>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item"><kbd>1</kbd>–<kbd>8</kbd><span>Mercury to Neptune</span></div>
                        <div class="shortcut-item"><kbd>9</kbd><span>Pluto (Dwarf Planet)</span></div>
                        <div class="shortcut-item"><kbd>0</kbd><span>The Sun (Solar Core)</span></div>
                        <div class="shortcut-item"><kbd>R</kbd><span>Realistic Scale / Reset View</span></div>
                    </div>
                </div>

                <div class="shortcuts-section">
                    <h4 class="shortcuts-group-title">⏳ Time & Simulation</h4>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item"><kbd>Space</kbd><span>Pause / Resume Simulation</span></div>
                        <div class="shortcut-item"><kbd>[</kbd> / <kbd>]</kbd><span>Decrease / Increase Warp Speed</span></div>
                        <div class="shortcut-item"><kbd>T</kbd><span>Toggle Guided Cinematic Tour</span></div>
                    </div>
                </div>

                <div class="shortcuts-section">
                    <h4 class="shortcuts-group-title">🔭 Celestial Layers & Tools</h4>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item"><kbd>O</kbd><span>Toggle Planetary Orbits</span></div>
                        <div class="shortcut-item"><kbd>M</kbd><span>Toggle Radar Minimap</span></div>
                        <div class="shortcut-item"><kbd>C</kbd><span>Toggle Constellations</span></div>
                        <div class="shortcut-item"><kbd>S</kbd><span>Toggle Cosmic Audio Ambience</span></div>
                        <div class="shortcut-item"><kbd>P</kbd><span>Toggle Engine Telemetry HUD</span></div>
                        <div class="shortcut-item"><kbd>K</kbd><span>Astrophotography Snapshot</span></div>
                        <div class="shortcut-item"><kbd>F</kbd><span>Toggle Fullscreen Display</span></div>
                        <div class="shortcut-item"><kbd>?</kbd> / <kbd>H</kbd><span>Open This Shortcuts Guide</span></div>
                        <div class="shortcut-item"><kbd>Esc</kbd><span>Close Dialogs / Detach Target</span></div>
                    </div>
                </div>
            </div>
        `;

        this.shortcutsModal.show({
            name: '⌨️ Observatory Keyboard Shortcuts',
            description: shortcutsContent
        });
    }

    dispose() {
        if (this.unsubscribeI18n) {
            this.unsubscribeI18n();
            this.unsubscribeI18n = null;
        }

        if (typeof window !== 'undefined') {
            if (this.onTourFocusBound) window.removeEventListener('tour-focus', this.onTourFocusBound);
            if (this.onJumpToDateBound) window.removeEventListener('jump-to-date', this.onJumpToDateBound);
            if (this.onSelectCelestialBodyBound) window.removeEventListener('select-celestial-body', this.onSelectCelestialBodyBound);
            if (this.onKeyDownBound) window.removeEventListener('keydown', this.onKeyDownBound);
        }

        if (typeof document !== 'undefined') {
            if (this.onDocClickLangBound) {
                document.removeEventListener('click', this.onDocClickLangBound);
            }
            this.closeLangDropdown = null;
            if (this.onDocClickGuiTooltipBound) {
                document.removeEventListener('click', this.onDocClickGuiTooltipBound);
            }
        }

        if (this.guiTooltipElement && this.guiTooltipElement.parentElement) {
            this.guiTooltipElement.parentElement.removeChild(this.guiTooltipElement);
            this.guiTooltipElement = null;
        }

        const canvas = this.sceneManager?.renderer?.domElement;
        if (canvas) {
            if (this.onPointerDownBound) canvas.removeEventListener('pointerdown', this.onPointerDownBound);
            if (this.onPointerUpBound) canvas.removeEventListener('pointerup', this.onPointerUpBound);
        }

        if (this.gui) {
            this.gui.destroy();
            this.gui = null;
        }

        if (this.shortcutsModal) {
            this.shortcutsModal.dispose();
        }

        if (this.audioManager) {
            this.audioManager.dispose();
        }

        if (this.performanceMonitor) {
            this.performanceMonitor.dispose();
        }

        if (this.modal) {
            this.modal.dispose();
        }

        if (this.eventModal) {
            this.eventModal.dispose();
        }

        if (this.customDatePicker) {
            this.customDatePicker.dispose();
            this.customDatePicker = null;
        }

        if (this.minimap && typeof this.minimap.dispose === 'function') {
            this.minimap.dispose();
        }

        if (this.menuContainer && this.menuContainer.parentElement) {
            this.menuContainer.parentElement.removeChild(this.menuContainer);
            this.menuContainer = null;
        }

        if (this.infoPanel && this.infoPanel.parentElement) {
            this.infoPanel.parentElement.removeChild(this.infoPanel);
        }

        if (this.datePanel && this.datePanel.parentElement) {
            this.datePanel.parentElement.removeChild(this.datePanel);
        }
    }
}
