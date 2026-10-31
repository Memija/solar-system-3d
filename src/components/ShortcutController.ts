import { EventBus } from './EventBus';
import { PreferencesManager } from './PreferencesManager';
import { HeaderSlotsManager } from './HeaderSlotsManager';
import { i18n } from '../i18n/index';
import { svgIcon } from './SvgIcons';
import type { UIManager } from './UIManager';

/**
 * ShortcutController
 * Manages global keyboard shortcuts and layered Escape dismissal across all
 * observatory overlays, drawers, dropdowns, and modals.
 */
export class ShortcutController {
    private readonly ui: UIManager;
    private readonly onKeyDownBound: (event: KeyboardEvent) => void;

    constructor(ui: UIManager) {
        this.ui = ui;
        this.onKeyDownBound = (event: KeyboardEvent) => this.handleKeyDown(event);
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.onKeyDownBound);
        }
    }

    private isFormInputTarget(target: HTMLElement | null): boolean {
        if (!target) return false;
        const tag = target.tagName?.toLowerCase();
        const inputType = (target as HTMLInputElement)?.type?.toLowerCase();
        return (
            tag === 'textarea' ||
            tag === 'select' ||
            (tag === 'input' && inputType !== 'checkbox' && inputType !== 'radio' && inputType !== 'range') ||
            !!target.isContentEditable
        );
    }

    /**
     * Dismisses only the topmost open UI overlay on Escape, falling back to
     * detaching the camera only when no UI overlay was open.
     */
    private handleLayeredEscape(inFormInput: boolean): void {
        const ui = this.ui;

        if (ui.controlCenter?.tooltipElement?.classList.contains('visible')) {
            ui.controlCenter.hideOptionTooltip();
            return;
        }
        if (ui.controlCenter?.customDatePicker?.isYearModalActive?.()) {
            ui.controlCenter.customDatePicker.dismissYearModal();
            return;
        }
        if (ui.customDatePicker?.isYearModalActive?.()) {
            ui.customDatePicker.dismissYearModal();
            return;
        }
        if (ui.controlCenter?.customDatePicker?.isOpen) {
            ui.controlCenter.customDatePicker.closePopup();
            return;
        }
        if (ui.customDatePicker?.isOpen) {
            ui.customDatePicker.closePopup();
            return;
        }
        if (typeof document !== 'undefined' && document.querySelector('.lang-switcher-container.open') && ui.closeLangDropdown) {
            ui.closeLangDropdown();
            return;
        }
        if (ui.shortcutsModal?.isOpen) {
            ui.shortcutsModal.hide();
            return;
        }
        if (ui.headerSlotsModal?.isOpen) {
            ui.headerSlotsModal.hide();
            return;
        }
        if (ui.eventModal?.isOpen) {
            ui.eventModal.hide();
            return;
        }
        if (ui.modal?.isOpen) {
            ui.modal.hide();
            ui.hideInfo();
            return;
        }
        if (ui.controlCenter?.isOpen) {
            ui.controlCenter.close();
            return;
        }
        if (ui.sceneManager?.measureMode && typeof ui.sceneManager.toggleMeasureMode === 'function') {
            ui.sceneManager.toggleMeasureMode(false);
            ui.controlCenter?.syncSwitches();
            ui.updateMeasureHud();
            if (ui.headerSlotsContainer) {
                HeaderSlotsManager.updateSlotStates(ui.headerSlotsContainer, ui);
            }
            return;
        }
        if (!inFormInput && typeof ui.sceneManager?.detachCamera === 'function') {
            ui.sceneManager.detachCamera();
            ui.controlCenter?.syncSwitches();
            if (ui.headerSlotsContainer) {
                HeaderSlotsManager.updateSlotStates(ui.headerSlotsContainer, ui);
            }
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        const inFormInput = this.isFormInputTarget(target);

        if (event.key === 'Escape') {
            this.handleLayeredEscape(inFormInput);
            return;
        }

        if (inFormInput) {
            return;
        }

        const ui = this.ui;
        const sm = ui.sceneManager;

        if (event.code === 'Space') {
            event.preventDefault();
            ui.togglePause();
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
            const targetBody = planetMap[event.key];
            if (targetBody) {
                EventBus.emit('select-celestial-body', { name: targetBody });
            }
        } else if (event.key === '[' || event.key === '-') {
            const current = sm.timeScale;
            const next = Math.max(0, Math.round((current - 0.005) * 10000) / 10000);
            sm.timeScale = next;
            sm.onTimeScaleChange?.(next);
            ui.controlCenter?.syncTimePanel();
            ui.audioManager?.playTick?.();
        } else if (event.key === ']' || event.key === '=' || event.key === '+') {
            const current = sm.timeScale;
            const next = Math.round((current + 0.005) * 10000) / 10000;
            sm.timeScale = next;
            sm.onTimeScaleChange?.(next);
            ui.controlCenter?.syncTimePanel();
            ui.audioManager?.playTick?.();
        } else if (event.key === 's' || event.key === 'S') {
            const enabled = ui.audioManager.toggle();
            const soundBtn = document.getElementById('hudSoundBtn');
            if (soundBtn) {
                soundBtn.innerHTML = svgIcon(enabled ? 'audio-on' : 'audio-off');
                soundBtn.classList.toggle('active', enabled);
                soundBtn.setAttribute('aria-pressed', String(enabled));
            }
        } else if (event.key === 'p' || event.key === 'P') {
            event.preventDefault();
            const visible = ui.performanceMonitor.toggle();
            const perfBtn = document.getElementById('hudPerfBtn');
            if (perfBtn) {
                perfBtn.classList.toggle('active', visible);
                perfBtn.setAttribute('aria-pressed', String(visible));
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'c' || event.key === 'C') {
            const current = sm.showConstellations ?? sm.constellationManager?.isVisible ?? true;
            const next = !current;
            if (typeof sm.toggleConstellations === 'function') {
                sm.toggleConstellations(next);
            } else if (sm.constellationManager) {
                sm.constellationManager.toggleVisibility(next);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'k' || event.key === 'K') {
            ui.audioManager?.playShutter?.();
            sm.captureScreenshot?.(ui.cameraTarget);
        } else if (event.key === 'f' || event.key === 'F') {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
                document.exitFullscreen?.().catch(() => {});
            }
        } else if (event.key === '?' || event.key === '/' || event.key === 'h' || event.key === 'H') {
            ui.toggleShortcutsModal();
        } else if (event.key === 't' || event.key === 'T') {
            ui.setTourMode(!sm.tourMode);
            ui.audioManager?.playTick?.();
        } else if (event.key === 'a' || event.key === 'A') {
            if (ui.cameraTarget) {
                const targetName = ui.cameraTarget;
                const star = sm?.starMeshes?.find(m => m.userData?.name === targetName);
                if (star) {
                    sm?.focusOnStar(star);
                } else if (typeof sm?.focusOnBody === 'function') {
                    sm.focusOnBody(targetName);
                }
                ui.controlCenter?.syncSwitches();
                ui.audioManager?.playTick?.();
            }
        } else if (event.key === 'v' || event.key === 'V') {
            if (ui.cameraTarget && typeof sm?.setSurfaceView === 'function') {
                sm.setSurfaceView(ui.cameraTarget);
                ui.controlCenter?.syncSwitches();
                ui.audioManager?.playTick?.();
            }
        } else if (event.key === 'd' || event.key === 'D') {
            if (typeof sm?.detachCamera === 'function') {
                sm.detachCamera();
                ui.controlCenter?.syncSwitches();
                ui.audioManager?.playTick?.();
            }
        } else if (event.key === 'm' || event.key === 'M') {
            event.preventDefault();
            ui.toggleMinimap();
        } else if (event.key === 'o' || event.key === 'O') {
            if (typeof sm?.toggleOrbits === 'function') {
                sm.toggleOrbits(!sm.showOrbits);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'n' || event.key === 'N') {
            if (typeof sm?.toggleMoons === 'function') {
                sm.toggleMoons(!sm.showMoons);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'e' || event.key === 'E') {
            if (typeof sm?.toggleAsteroids === 'function') {
                sm.toggleAsteroids(!sm.showAsteroids);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'u' || event.key === 'U') {
            if (typeof sm?.toggleKuiperBelt === 'function') {
                sm.toggleKuiperBelt(!sm.showKuiperBelt);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'w' || event.key === 'W') {
            if (typeof sm?.toggleDwarfPlanets === 'function') {
                sm.toggleDwarfPlanets(!sm.showDwarfPlanets);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'q' || event.key === 'Q') {
            if (typeof sm?.toggleComets === 'function') {
                sm.toggleComets(!sm.showComets);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'j' || event.key === 'J') {
            if (typeof sm?.toggleSpacecrafts === 'function') {
                sm.toggleSpacecrafts(!sm.showSpacecrafts);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'y' || event.key === 'Y') {
            if (typeof sm?.toggleMeteors === 'function') {
                const next = !sm.showMeteors;
                sm.toggleMeteors(next);
                if (next) {
                    sm.focusOnBody?.('Earth');
                    ui.modal.show({
                        titleKey: 'popups.meteorsTitle',
                        descKey: 'popups.meteorsDesc',
                        name: i18n.t('popups.meteorsTitle'),
                        description: i18n.t('popups.meteorsDesc')
                    });
                } else if (
                    ui.modal.isOpen &&
                    (ui.modal.isShowingPopup('popups.meteorsTitle') ||
                        ui.modal.titleElement?.textContent === i18n.t('popups.meteorsTitle'))
                ) {
                    ui.modal.hide();
                }
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'i' || event.key === 'I') {
            if (typeof sm?.toggleTrails === 'function') {
                sm.toggleTrails(!sm.showTrails);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'r' || event.key === 'R') {
            ui.setRealisticDistances(!sm.realisticDistances);
            ui.audioManager?.playTick?.();
        } else if (event.key === 'b' || event.key === 'B') {
            if (typeof sm?.toggleBloom === 'function') {
                sm.toggleBloom();
            } else if (sm?.bloomPass) {
                sm.bloomPass.enabled = !sm.bloomPass.enabled;
                PreferencesManager.set('enableBloom', sm.bloomPass.enabled);
            } else {
                PreferencesManager.set('enableBloom', !PreferencesManager.get('enableBloom'));
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'l' || event.key === 'L') {
            if (typeof sm?.toggleRealisticLighting === 'function') {
                sm.toggleRealisticLighting(!sm.realisticLighting);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'g' || event.key === 'G') {
            if (typeof sm?.toggleEclipticGrid === 'function') {
                sm.toggleEclipticGrid(!sm.showEclipticGrid);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'z' || event.key === 'Z') {
            if (typeof sm?.toggleHabitableZone === 'function') {
                sm.toggleHabitableZone(!sm.showHabitableZone);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        } else if (event.key === 'x' || event.key === 'X') {
            if (typeof sm?.toggleAxes === 'function') {
                sm.toggleAxes(!sm.showAxes);
            }
            ui.controlCenter?.syncSwitches();
            ui.audioManager?.playTick?.();
        }

        if (ui.headerSlotsContainer) {
            HeaderSlotsManager.updateSlotStates(ui.headerSlotsContainer, ui);
        }
    }

    dispose(): void {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.onKeyDownBound);
        }
    }
}

