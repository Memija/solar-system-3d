import { PreferencesManager, DEFAULT_HEADER_SLOTS } from './PreferencesManager';
import { i18n } from '../i18n';

export type HeaderSlotCategory = 'optics' | 'layers' | 'tools';

export function stripShortcutFromLabel(label: string): string {
    return label.replace(/\s*\([A-Z0-9?/\s-]+\)\s*$/i, '').trim();
}

export interface HeaderSlotDefinition {
    id: string;
    category: HeaderSlotCategory;
    labelKey: string;
    icon: string | ((ui: any) => string);
    shortcut?: string;
    domId?: string;
    getState?: (ui: any) => boolean;
    action: (ui: any, btn?: HTMLElement) => void;
}

export const AVAILABLE_HEADER_SLOTS: HeaderSlotDefinition[] = [
    // -------------------------------------------------------------------------
    // OPTICS & PHYSICAL SCALE
    // -------------------------------------------------------------------------
    {
        id: 'enableBloom',
        category: 'optics',
        labelKey: 'controls.enableBloom',
        icon: '✨',
        shortcut: 'B',
        domId: 'hudSlot_enableBloom',
        getState: (ui) => (ui.sceneManager?.bloomPass ? ui.sceneManager.bloomPass.enabled : PreferencesManager.get('enableBloom')),
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleBloom === 'function') {
                ui.sceneManager.toggleBloom();
            } else if (ui.sceneManager?.bloomPass) {
                const next = !ui.sceneManager.bloomPass.enabled;
                ui.sceneManager.bloomPass.enabled = next;
                PreferencesManager.set('enableBloom', next);
            }
        }
    },
    {
        id: 'realisticLighting',
        category: 'optics',
        labelKey: 'controls.realisticLighting',
        icon: '💡',
        shortcut: 'L',
        domId: 'hudSlot_realisticLighting',
        getState: (ui) => !!ui.sceneManager?.realisticLighting,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleRealisticLighting === 'function') {
                ui.sceneManager.toggleRealisticLighting(!ui.sceneManager.realisticLighting);
            }
        }
    },
    {
        id: 'showEclipticGrid',
        category: 'optics',
        labelKey: 'controls.eclipticGrid',
        icon: '🌐',
        shortcut: 'G',
        domId: 'hudSlot_showEclipticGrid',
        getState: (ui) => !!ui.sceneManager?.showEclipticGrid,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleEclipticGrid === 'function') {
                ui.sceneManager.toggleEclipticGrid(!ui.sceneManager.showEclipticGrid);
            }
        }
    },
    {
        id: 'showHabitableZone',
        category: 'optics',
        labelKey: 'controls.habitableZone',
        icon: '🌱',
        shortcut: 'Z',
        domId: 'hudSlot_showHabitableZone',
        getState: (ui) => !!ui.sceneManager?.showHabitableZone,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleHabitableZone === 'function') {
                ui.sceneManager.toggleHabitableZone(!ui.sceneManager.showHabitableZone);
            }
        }
    },
    {
        id: 'showAxes',
        category: 'optics',
        labelKey: 'controls.showAxes',
        icon: '🧭',
        shortcut: 'X',
        domId: 'hudSlot_showAxes',
        getState: (ui) => !!ui.sceneManager?.showAxes,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleAxes === 'function') {
                ui.sceneManager.toggleAxes(!ui.sceneManager.showAxes);
            }
        }
    },
    {
        id: 'realisticDistances',
        category: 'optics',
        labelKey: 'controls.realisticScale',
        icon: '📏',
        shortcut: 'R',
        domId: 'hudSlot_realisticDistances',
        getState: (ui) => !!ui.sceneManager?.realisticDistances,
        action: (ui) => {
            if (ui.realisticDistController) {
                ui.realisticDistController.setValue(!ui.sceneManager.realisticDistances);
            } else if (typeof ui.sceneManager?.toggleRealisticDistances === 'function') {
                const next = !ui.sceneManager.realisticDistances;
                ui.sceneManager.toggleRealisticDistances(next);
                if (next) {
                    ui.modal?.show({
                        titleKey: 'popups.trueScaleTitle',
                        descKey: 'popups.trueScaleDesc',
                        name: i18n.t('popups.trueScaleTitle'),
                        description: i18n.t('popups.trueScaleDesc')
                    });
                } else if (ui.modal?.isOpen && (ui.modal.isShowingPopup('popups.trueScaleTitle') || (ui.modal.titleElement && ui.modal.titleElement.textContent === i18n.t('popups.trueScaleTitle')))) {
                    ui.modal.hide();
                }
            }
        }
    },

    // -------------------------------------------------------------------------
    // CELESTIAL LAYERS
    // -------------------------------------------------------------------------
    {
        id: 'showOrbits',
        category: 'layers',
        labelKey: 'controls.showOrbits',
        icon: '🪐',
        shortcut: 'O',
        domId: 'hudSlot_showOrbits',
        getState: (ui) => !!ui.sceneManager?.showOrbits,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleOrbits === 'function') {
                ui.sceneManager.toggleOrbits(!ui.sceneManager.showOrbits);
            }
        }
    },
    {
        id: 'showMoons',
        category: 'layers',
        labelKey: 'controls.showMoons',
        icon: '🌙',
        domId: 'hudSlot_showMoons',
        getState: (ui) => !!ui.sceneManager?.showMoons,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleMoons === 'function') {
                ui.sceneManager.toggleMoons(!ui.sceneManager.showMoons);
            }
        }
    },
    {
        id: 'constellations',
        category: 'layers',
        labelKey: 'controls.showConstellations',
        icon: '🌌',
        shortcut: 'C',
        domId: 'hudSlot_constellations',
        getState: (ui) => ui.sceneManager?.constellationManager?.isVisible ?? true,
        action: (ui) => {
            if (ui.sceneManager?.constellationManager) {
                const cur = ui.sceneManager.constellationManager.isVisible;
                ui.sceneManager.constellationManager.toggleVisibility(!cur);
            }
        }
    },
    {
        id: 'showAsteroids',
        category: 'layers',
        labelKey: 'controls.showAsteroids',
        icon: '🪨',
        domId: 'hudSlot_showAsteroids',
        getState: (ui) => !!ui.sceneManager?.showAsteroids,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleAsteroids === 'function') {
                ui.sceneManager.toggleAsteroids(!ui.sceneManager.showAsteroids);
            }
        }
    },
    {
        id: 'showKuiperBelt',
        category: 'layers',
        labelKey: 'controls.showKuiperBelt',
        icon: '❄️',
        domId: 'hudSlot_showKuiperBelt',
        getState: (ui) => !!ui.sceneManager?.showKuiperBelt,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleKuiperBelt === 'function') {
                ui.sceneManager.toggleKuiperBelt(!ui.sceneManager.showKuiperBelt);
            }
        }
    },
    {
        id: 'showDwarfPlanets',
        category: 'layers',
        labelKey: 'controls.showDwarfPlanets',
        icon: '⚪',
        domId: 'hudSlot_showDwarfPlanets',
        getState: (ui) => !!ui.sceneManager?.showDwarfPlanets,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleDwarfPlanets === 'function') {
                ui.sceneManager.toggleDwarfPlanets(!ui.sceneManager.showDwarfPlanets);
            }
        }
    },
    {
        id: 'showComets',
        category: 'layers',
        labelKey: 'controls.showComets',
        icon: '☄️',
        domId: 'hudSlot_showComets',
        getState: (ui) => !!ui.sceneManager?.showComets,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleComets === 'function') {
                ui.sceneManager.toggleComets(!ui.sceneManager.showComets);
            }
        }
    },
    {
        id: 'showSpacecraft',
        category: 'layers',
        labelKey: 'controls.showSpacecraft',
        icon: '🚀',
        domId: 'hudSlot_showSpacecraft',
        getState: (ui) => !!ui.sceneManager?.showSpacecrafts,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleSpacecrafts === 'function') {
                ui.sceneManager.toggleSpacecrafts(!ui.sceneManager.showSpacecrafts);
            }
        }
    },
    {
        id: 'showMeteors',
        category: 'layers',
        labelKey: 'controls.showMeteors',
        icon: '🌠',
        domId: 'hudSlot_showMeteors',
        getState: (ui) => !!ui.sceneManager?.showMeteors,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleMeteors === 'function') {
                ui.sceneManager.toggleMeteors(!ui.sceneManager.showMeteors);
            }
        }
    },
    {
        id: 'showTrails',
        category: 'layers',
        labelKey: 'controls.showTrails',
        icon: '💫',
        domId: 'hudSlot_showTrails',
        getState: (ui) => !!ui.sceneManager?.showTrails,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleTrails === 'function') {
                ui.sceneManager.toggleTrails(!ui.sceneManager.showTrails);
            }
        }
    },

    // -------------------------------------------------------------------------
    // OBSERVATORY TOOLS & ACTIONS
    // -------------------------------------------------------------------------
    {
        id: 'minimap',
        category: 'tools',
        labelKey: 'ui.radarToggle',
        icon: '🛰️',
        shortcut: 'M',
        domId: 'hudRadarBtn',
        getState: (ui) => ui.minimap?.isVisible ?? false,
        action: (ui) => {
            ui.toggleMinimap?.();
        }
    },
    {
        id: 'snapshot',
        category: 'tools',
        labelKey: 'ui.astrophotography',
        icon: '📸',
        shortcut: 'K',
        domId: 'hudSnapshotBtn',
        action: (ui) => {
            ui.audioManager?.playShutter?.();
            ui.sceneManager?.captureScreenshot?.(ui.cameraTarget);
        }
    },
    {
        id: 'audio',
        category: 'tools',
        labelKey: 'ui.audioAmbience',
        icon: (ui) => (ui.audioManager?.getAudioEnabled?.() ? '🔊' : '🔇'),
        shortcut: 'S',
        domId: 'hudSoundBtn',
        getState: (ui) => ui.audioManager?.getAudioEnabled?.() ?? false,
        action: (ui) => {
            ui.audioManager?.toggle?.();
        }
    },
    {
        id: 'telemetry',
        category: 'tools',
        labelKey: 'ui.telemetry',
        icon: '⚡',
        shortcut: 'P',
        domId: 'hudPerfBtn',
        getState: (ui) => ui.performanceMonitor?.getVisible?.() ?? false,
        action: (ui) => {
            ui.performanceMonitor?.toggle?.();
        }
    },
    {
        id: 'shortcuts',
        category: 'tools',
        labelKey: 'ui.keyboardShortcuts',
        icon: '⌨️',
        shortcut: '?',
        domId: 'hudHelpBtn',
        getState: (ui) => ui.shortcutsModal?.isOpen ?? false,
        action: (ui) => {
            ui.toggleShortcutsModal?.();
        }
    },
    {
        id: 'cinematicTour',
        category: 'tools',
        labelKey: 'controls.cinematicTour',
        icon: '🎬',
        shortcut: 'T',
        domId: 'hudSlot_cinematicTour',
        getState: (ui) => !!ui.sceneManager?.tourMode,
        action: (ui) => {
            if (ui.tourController) {
                ui.tourController.setValue(!ui.sceneManager.tourMode);
            }
        }
    },
    {
        id: 'measureMode',
        category: 'tools',
        labelKey: 'controls.measureTool',
        icon: '📐',
        domId: 'hudSlot_measureMode',
        getState: (ui) => !!ui.sceneManager?.measureMode,
        action: (ui) => {
            if (typeof ui.sceneManager?.toggleMeasureMode === 'function') {
                ui.sceneManager.toggleMeasureMode(!ui.sceneManager.measureMode);
            }
        }
    },
    {
        id: 'fullscreen',
        category: 'tools',
        labelKey: 'shortcuts.fullscreen',
        icon: '⛶',
        shortcut: 'F',
        domId: 'hudSlot_fullscreen',
        getState: () => (typeof document !== 'undefined' ? !!document.fullscreenElement : false),
        action: () => {
            if (typeof document === 'undefined') return;
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        }
    }
];

export class HeaderSlotsManagerClass {
    private slotMap: Map<string, HeaderSlotDefinition> = new Map();

    constructor() {
        AVAILABLE_HEADER_SLOTS.forEach(slot => {
            this.slotMap.set(slot.id, slot);
        });
    }

    public getAvailableSlots(): HeaderSlotDefinition[] {
        return AVAILABLE_HEADER_SLOTS;
    }

    public getSlot(id: string): HeaderSlotDefinition | undefined {
        return this.slotMap.get(id);
    }

    public getActiveSlotIds(): string[] {
        const slots = PreferencesManager.get('headerSlots');
        if (Array.isArray(slots) && slots.length > 0) {
            return slots;
        }
        return [...DEFAULT_HEADER_SLOTS];
    }

    public isSlotActive(id: string): boolean {
        return this.getActiveSlotIds().includes(id);
    }

    public addSlot(id: string): boolean {
        const current = this.getActiveSlotIds();
        if (!current.includes(id)) {
            const next = [...current, id];
            PreferencesManager.set('headerSlots', next);
            return true;
        }
        return false;
    }

    public removeSlot(id: string): boolean {
        const current = this.getActiveSlotIds();
        if (current.includes(id)) {
            const next = current.filter(s => s !== id);
            PreferencesManager.set('headerSlots', next);
            return true;
        }
        return false;
    }

    public toggleSlot(id: string): boolean {
        if (this.isSlotActive(id)) {
            this.removeSlot(id);
            return false;
        } else {
            this.addSlot(id);
            return true;
        }
    }

    public resetDefaults(): void {
        PreferencesManager.set('headerSlots', [...DEFAULT_HEADER_SLOTS]);
    }

    public renderSlots(container: HTMLElement, ui: any): void {
        container.innerHTML = '';
        const activeIds = this.getActiveSlotIds();

        activeIds.forEach(slotId => {
            const def = this.slotMap.get(slotId);
            if (!def) return;

            const btn = document.createElement('button');
            btn.className = 'hud-icon-btn obs-header-slot-btn';
            if (def.domId) {
                btn.id = def.domId;
            } else {
                btn.id = `hudSlot_${def.id}`;
            }

            const rawLabel = i18n.t(def.labelKey) || def.id;
            const cleanLabel = stripShortcutFromLabel(rawLabel);
            const titleWithShortcut = def.shortcut ? `${cleanLabel} (${def.shortcut})` : cleanLabel;
            btn.title = titleWithShortcut;
            btn.setAttribute('aria-label', titleWithShortcut);
            btn.dataset.slotId = def.id;

            const iconVal = typeof def.icon === 'function' ? def.icon(ui) : def.icon;
            btn.innerHTML = iconVal;

            if (def.getState && def.getState(ui)) {
                btn.classList.add('active');
            }

            btn.onclick = (e) => {
                e.stopPropagation();
                def.action(ui, btn);
                if (ui.controlCenter) ui.controlCenter.syncSwitches();
                if (ui.audioManager) ui.audioManager.playTick();
                this.updateSlotStates(container, ui);
            };

            container.appendChild(btn);
        });
    }

    public updateSlotStates(container: HTMLElement, ui: any): void {
        const buttons = container.querySelectorAll<HTMLButtonElement>('.obs-header-slot-btn');
        buttons.forEach(btn => {
            const slotId = btn.dataset.slotId;
            if (!slotId) return;
            const def = this.slotMap.get(slotId);
            if (!def) return;

            // Update dynamic icon
            if (typeof def.icon === 'function') {
                btn.innerHTML = def.icon(ui);
            }

            // Update active state
            if (def.getState) {
                const isActive = def.getState(ui);
                btn.classList.toggle('active', isActive);
            }

            // Update localized tooltip
            const rawLabel = i18n.t(def.labelKey) || def.id;
            const cleanLabel = stripShortcutFromLabel(rawLabel);
            const titleWithShortcut = def.shortcut ? `${cleanLabel} (${def.shortcut})` : cleanLabel;
            btn.title = titleWithShortcut;
            btn.setAttribute('aria-label', titleWithShortcut);
        });
    }
}

export const HeaderSlotsManager = new HeaderSlotsManagerClass();
