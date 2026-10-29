import { i18n } from '../i18n/index';
import { HeaderSlotsManager, HeaderSlotCategory, stripShortcutFromLabel } from './HeaderSlotsManager';
import { svgIcon, stripLeadingEmoji, SvgIconName } from './SvgIcons';
import type { UIManager } from './UIManager';

/**
 * SecondaryModals
 * Renders and wires the Keyboard Shortcuts Cheatsheet modal and the
 * Header Quick-Access Slots Customizer modal using monochrome telemetry icons.
 */
export function toggleShortcutsModal(ui: UIManager): void {
    if (ui.shortcutsModal.isOpen) {
        ui.shortcutsModal.hide();
        return;
    }

    const s = (key: string) => i18n.t(`shortcuts.${key}`);
    const clean = (val: string) => stripLeadingEmoji(val);

    const shortcutsContent = `
        <div class="shortcuts-guide-modal">
            <div class="shortcuts-section">
                <h4 class="shortcuts-group-title">${svgIcon('target')} <span>${clean(s('navTitle'))}</span></h4>
                <div class="shortcuts-grid">
                    <div class="shortcut-item"><kbd>1</kbd>–<kbd>8</kbd><span>${s('mercuryToNeptune')}</span></div>
                    <div class="shortcut-item"><kbd>9</kbd><span>${s('pluto')}</span></div>
                    <div class="shortcut-item"><kbd>0</kbd><span>${s('sun')}</span></div>
                </div>
            </div>

            <div class="shortcuts-section">
                <h4 class="shortcuts-group-title">${svgIcon('camera')} <span>${clean(s('cameraTitle') || 'Camera & Perspective')}</span></h4>
                <div class="shortcuts-grid">
                    <div class="shortcut-item"><kbd>A</kbd><span>${s('attachCamera') || 'Focus / Attach Camera'}</span></div>
                    <div class="shortcut-item"><kbd>V</kbd><span>${s('surfaceView') || 'View from Surface'}</span></div>
                    <div class="shortcut-item"><kbd>D</kbd><span>${s('freeCamera') || 'Free Camera / Detach'}</span></div>
                    <div class="shortcut-item"><kbd>T</kbd><span>${s('cinematicTour')}</span></div>
                </div>
            </div>

            <div class="shortcuts-section">
                <h4 class="shortcuts-group-title">${svgIcon('time')} <span>${clean(s('timeTitle'))}</span></h4>
                <div class="shortcuts-grid">
                    <div class="shortcut-item"><kbd>Space</kbd><span>${s('pauseResume')}</span></div>
                    <div class="shortcut-item"><kbd>[</kbd> / <kbd>]</kbd><span>${s('warpSpeed')}</span></div>
                </div>
            </div>

            <div class="shortcuts-section">
                <h4 class="shortcuts-group-title">${svgIcon('optics')} <span>${clean(s('opticsTitle') || 'Optics & Scale')}</span></h4>
                <div class="shortcuts-grid">
                    <div class="shortcut-item"><kbd>B</kbd><span>${s('bloom') || 'Toggle Bloom Glow'}</span></div>
                    <div class="shortcut-item"><kbd>L</kbd><span>${s('lighting') || 'Toggle Realistic Lighting'}</span></div>
                    <div class="shortcut-item"><kbd>G</kbd><span>${s('eclipticGrid') || 'Toggle Ecliptic Grid'}</span></div>
                    <div class="shortcut-item"><kbd>Z</kbd><span>${s('habitableZone') || 'Toggle Habitable Zone'}</span></div>
                    <div class="shortcut-item"><kbd>X</kbd><span>${s('axes') || 'Toggle Coordinate Axes'}</span></div>
                    <div class="shortcut-item"><kbd>R</kbd><span>${s('resetView')}</span></div>
                </div>
            </div>

            <div class="shortcuts-section">
                <h4 class="shortcuts-group-title">${svgIcon('layers')} <span>${clean(i18n.t('ui.layersCategory') || 'Celestial Layers')}</span></h4>
                <div class="shortcuts-grid">
                    <div class="shortcut-item"><kbd>O</kbd><span>${s('orbits') || i18n.t('controls.showOrbits')}</span></div>
                    <div class="shortcut-item"><kbd>N</kbd><span>${i18n.t('controls.showMoons')}</span></div>
                    <div class="shortcut-item"><kbd>C</kbd><span>${s('constellations') || i18n.t('controls.showConstellations')}</span></div>
                    <div class="shortcut-item"><kbd>E</kbd><span>${i18n.t('controls.showAsteroids')}</span></div>
                    <div class="shortcut-item"><kbd>U</kbd><span>${i18n.t('controls.showKuiperBelt')}</span></div>
                    <div class="shortcut-item"><kbd>W</kbd><span>${i18n.t('controls.showDwarfPlanets')}</span></div>
                    <div class="shortcut-item"><kbd>Q</kbd><span>${i18n.t('controls.showComets')}</span></div>
                    <div class="shortcut-item"><kbd>J</kbd><span>${i18n.t('controls.showSpacecraft')}</span></div>
                    <div class="shortcut-item"><kbd>Y</kbd><span>${i18n.t('controls.showMeteors')}</span></div>
                    <div class="shortcut-item"><kbd>I</kbd><span>${i18n.t('controls.showTrails')}</span></div>
                </div>
            </div>

            <div class="shortcuts-section">
                <h4 class="shortcuts-group-title">${svgIcon('system')} <span>${clean(s('toolsTitle'))}</span></h4>
                <div class="shortcuts-grid">
                    <div class="shortcut-item"><kbd>M</kbd><span>${s('minimap')}</span></div>
                    <div class="shortcut-item"><kbd>S</kbd><span>${s('audio')}</span></div>
                    <div class="shortcut-item"><kbd>P</kbd><span>${s('telemetry')}</span></div>
                    <div class="shortcut-item"><kbd>K</kbd><span>${s('snapshot')}</span></div>
                    <div class="shortcut-item"><kbd>F</kbd><span>${s('fullscreen')}</span></div>
                    <div class="shortcut-item"><kbd>?</kbd> / <kbd>H</kbd><span>${s('help')}</span></div>
                    <div class="shortcut-item"><kbd>Esc</kbd><span>${s('esc')}</span></div>
                </div>
            </div>
        </div>
    `;

    ui.shortcutsModal.show({
        name: clean(s('title')),
        titleIcon: 'shortcuts',
        description: shortcutsContent
    });
}

export function openHeaderSlotsCustomizer(ui: UIManager): void {
    const availableSlots = HeaderSlotsManager.getAvailableSlots();
    const currentActive = HeaderSlotsManager.getActiveSlotIds();

    const categories: { id: HeaderSlotCategory; icon: SvgIconName; titleKey: string; defaultTitle: string }[] = [
        { id: 'camera', icon: 'camera', titleKey: 'ui.cameraCategory', defaultTitle: 'Camera Controls' },
        { id: 'optics', icon: 'optics', titleKey: 'ui.opticsCategory', defaultTitle: 'Optics & Scale' },
        { id: 'layers', icon: 'layers', titleKey: 'ui.layersCategory', defaultTitle: 'Celestial Layers' },
        { id: 'tools', icon: 'system', titleKey: 'ui.toolsCategory', defaultTitle: 'Observatory Instruments' }
    ];

    const activeText = i18n.t('ui.slotsActive', { count: currentActive.length.toString() }) || `${currentActive.length} active slots`;

    let html = `
        <div class="header-slots-customizer-modal">
            <div class="slots-modal-header-desc">
                <p class="slots-desc-text">${i18n.t('ui.slotsDescription') || 'Pin and organize your favorite tools, optics settings, and celestial layers directly to the observatory header bar for instant 1-click access.'}</p>
                <div class="slots-active-counter" id="slotsCounterBadge">
                    <span class="slots-live-dot">●</span>
                    <span class="counter-text">${activeText}</span>
                </div>
            </div>
    `;

    categories.forEach(cat => {
        const slotsInCat = availableSlots.filter(s => s.category === cat.id);
        if (slotsInCat.length === 0) return;

        const activeInCat = slotsInCat.filter(s => currentActive.includes(s.id)).length;
        const catTitle = stripLeadingEmoji(i18n.t(cat.titleKey) || cat.defaultTitle);
        html += `
            <div class="slots-category-section" data-cat-id="${cat.id}">
                <div class="slots-category-header">
                    <h4 class="slots-category-title">${svgIcon(cat.icon)} <span>${catTitle}</span></h4>
                    <span class="category-pinned-pill" data-cat-counter="${cat.id}">${activeInCat} / ${slotsInCat.length}</span>
                </div>
                <div class="slots-grid">
        `;

        slotsInCat.forEach(slot => {
            const isActive = currentActive.includes(slot.id);
            const rawLabel = i18n.t(slot.labelKey) || slot.id;
            const label = stripLeadingEmoji(stripShortcutFromLabel(rawLabel));
            const icon = typeof slot.icon === 'function' ? slot.icon(ui) : slot.icon;
            const isLocked = !HeaderSlotsManager.isSlotRemovable(slot.id);

            const switchTitle = isLocked
                ? (i18n.t('ui.permanentSlotDesc') || 'Permanently pinned to header (cannot be removed)')
                : (isActive ? 'Remove from header' : 'Add to header');

            html += `
                <div class="slot-config-card ${isActive ? 'is-active' : ''} ${isLocked ? 'is-locked' : ''}" data-slot-id="${slot.id}" ${isLocked ? 'data-locked="true"' : ''}>
                    <div class="slot-card-left">
                        <span class="slot-card-icon">${icon}</span>
                        <div class="slot-card-details">
                            <span class="slot-card-name" title="${label}">${label}</span>
                            ${slot.shortcut ? `<kbd class="ctrl-kbd-badge">${slot.shortcut}</kbd>` : ''}
                            ${isLocked ? `<span class="slot-locked-badge" title="${switchTitle}">${svgIcon('lock')}</span>` : ''}
                        </div>
                    </div>
                    <label class="sci-switch ${isLocked ? 'is-disabled' : ''}" title="${switchTitle}">
                        <input type="checkbox" class="slot-toggle-input" data-slot-id="${slot.id}" ${isActive ? 'checked' : ''} ${isLocked ? 'disabled aria-disabled="true"' : ''} />
                        <span class="sci-slider"></span>
                    </label>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
            <div class="slots-modal-footer">
                <button type="button" class="slot-footer-btn reset-btn" id="slotsResetBtn">
                    ${svgIcon('reset')} <span>${i18n.t('ui.resetSlots') || 'Reset to Defaults'}</span>
                </button>
                <button type="button" class="slot-footer-btn done-btn" id="slotsDoneBtn">
                    ${svgIcon('check')} <span>${i18n.t('ui.close') || 'Done'}</span>
                </button>
            </div>
        </div>
    `;

    ui.headerSlotsModal.show({
        name: stripLeadingEmoji(i18n.t('ui.headerSlots') || 'Header Quick Access'),
        titleIcon: 'system',
        description: html
    });

    wireHeaderSlotsModalEvents(ui);
}

function wireHeaderSlotsModalEvents(ui: UIManager): void {
    const modalContent = ui.headerSlotsModal.contentElement;
    if (!modalContent) return;

    const checkboxes = modalContent.querySelectorAll<HTMLInputElement>('.slot-toggle-input');
    checkboxes.forEach(input => {
        input.onchange = () => {
            const slotId = input.dataset.slotId;
            if (!slotId) return;

            if (!HeaderSlotsManager.isSlotRemovable(slotId)) {
                input.checked = true;
                return;
            }

            const willBeActive = input.checked;
            if (willBeActive) {
                HeaderSlotsManager.addSlot(slotId);
            } else {
                HeaderSlotsManager.removeSlot(slotId);
            }

            const card = modalContent.querySelector(`.slot-config-card[data-slot-id="${slotId}"]`);
            if (card) card.classList.toggle('is-active', willBeActive);

            const currentCount = HeaderSlotsManager.getActiveSlotIds().length;
            const counterBadge = modalContent.querySelector('#slotsCounterBadge');
            if (counterBadge) {
                const text = i18n.t('ui.slotsActive', { count: currentCount.toString() }) || `${currentCount} active slots`;
                counterBadge.innerHTML = `<span class="slots-live-dot">●</span> <span class="counter-text">${text}</span>`;
            }

            const catSection = card?.closest('.slots-category-section');
            if (catSection) {
                const catCounter = catSection.querySelector<HTMLElement>('.category-pinned-pill');
                if (catCounter) {
                    const catActiveCount = catSection.querySelectorAll('.slot-config-card.is-active').length;
                    const catTotal = catSection.querySelectorAll('.slot-config-card').length;
                    catCounter.textContent = `${catActiveCount} / ${catTotal}`;
                }
            }

            if (ui.headerSlotsContainer) {
                HeaderSlotsManager.renderSlots(ui.headerSlotsContainer, ui);
            }

            ui.audioManager?.playTick?.();
        };
    });

    const cards = modalContent.querySelectorAll<HTMLElement>('.slot-config-card');
    cards.forEach(card => {
        card.onclick = (e) => {
            if ((e.target as HTMLElement).closest('.sci-switch')) return;
            const slotId = card.dataset.slotId;
            if (slotId && !HeaderSlotsManager.isSlotRemovable(slotId)) return;
            const input = card.querySelector<HTMLInputElement>('.slot-toggle-input');
            if (input && !input.disabled) {
                input.checked = !input.checked;
                if (input.onchange) {
                    input.onchange(new Event('change'));
                } else {
                    input.dispatchEvent(new Event('change'));
                }
            }
        };
    });

    const resetBtn = modalContent.querySelector<HTMLButtonElement>('#slotsResetBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            HeaderSlotsManager.resetDefaults();
            if (ui.headerSlotsContainer) {
                HeaderSlotsManager.renderSlots(ui.headerSlotsContainer, ui);
            }
            ui.audioManager?.playTick?.();
            openHeaderSlotsCustomizer(ui);
        };
    }

    const doneBtn = modalContent.querySelector<HTMLButtonElement>('#slotsDoneBtn');
    if (doneBtn) {
        doneBtn.onclick = () => {
            ui.headerSlotsModal.hide();
            ui.audioManager?.playTick?.();
        };
    }
}

