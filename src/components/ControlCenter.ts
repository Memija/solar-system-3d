import { SceneManager } from './SceneManager';
import { UIManager } from './UIManager';
import { i18n } from '../i18n';
import { EventBus } from './EventBus';
import { HeaderSlotsManager } from './HeaderSlotsManager';
import { getSettingOptionInfo } from './SettingOptionsData';
import { CustomDatePicker, HISTORICAL_SPACE_EVENTS, getLocalizedEventName, getLocalizedEventImpact } from './CustomDatePicker';
import { svgIcon, stripLeadingEmoji, SvgIconName } from './SvgIcons';

export type ControlCenterTab = 'target' | 'time' | 'layers' | 'camera' | 'optics' | 'system';

const TAB_ORDER: ControlCenterTab[] = ['target', 'time', 'layers', 'camera', 'optics', 'system'];

export class ControlCenter {
    uiManager: UIManager;
    sceneManager: SceneManager;
    uiContainer: HTMLElement;

    drawerElement: HTMLElement;
    backdropElement: HTMLElement;
    activeTab: ControlCenterTab = 'target';
    isOpen: boolean = false;
    public tooltipElement: HTMLElement | null = null;
    public activeInfoModal: HTMLElement | null = null;

    // References for reactive updates
    private tabButtons: Map<ControlCenterTab, HTMLElement> = new Map();
    private tabPanels: Map<ControlCenterTab, HTMLElement> = new Map();
    private switches: Map<string, HTMLInputElement> = new Map();
    private presetButtons: Map<string, HTMLElement> = new Map();
    private targetChipButtons: Map<string, HTMLElement> = new Map();
    private camModeButtons: Map<string, HTMLElement> = new Map();
    private tourSpeedDisplay: HTMLElement | null = null;
    private mainTitleEl: HTMLElement | null = null;
    private subTitleEl: HTMLElement | null = null;
    private closeBtnEl: HTMLElement | null = null;
    public customDatePicker: CustomDatePicker | null = null;
    private milestoneSelect: HTMLSelectElement | null = null;

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
        backdrop.onclick = () => {
            if (this.customDatePicker?.isYearModalActive()) {
                this.customDatePicker.dismissYearModal();
                return;
            }
            if (this.customDatePicker?.isOpen) {
                this.customDatePicker.closePopup();
                return;
            }
            this.close();
        };
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
        closeBtn.innerHTML = svgIcon('close');
        closeBtn.onclick = () => this.close();
        header.appendChild(closeBtn);
        this.closeBtnEl = closeBtn;

        drawer.appendChild(header);

        // Navigation Tabs Strip
        const tabsStrip = document.createElement('div');
        tabsStrip.className = 'drawer-tabs-strip';
        tabsStrip.setAttribute('role', 'tablist');

        const tabsConfig: { id: ControlCenterTab; icon: SvgIconName; key: string }[] = [
            { id: 'target', icon: 'target', key: 'categories.planet' },
            { id: 'time', icon: 'time', key: 'controls.simulationFolder' },
            { id: 'layers', icon: 'layers', key: 'controls.showOrbits' },
            { id: 'camera', icon: 'camera', key: 'controls.cameraFolder' },
            { id: 'optics', icon: 'optics', key: 'controls.environmentFolder' },
            { id: 'system', icon: 'system', key: 'controls.toolsFolder' }
        ];

        tabsConfig.forEach(cfg => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSelected = cfg.id === this.activeTab;
            btn.className = `drawer-tab ${isSelected ? 'active' : ''}`;
            btn.dataset.tab = cfg.id;
            btn.id = `ctrl-tab-${cfg.id}`;
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', String(isSelected));
            btn.setAttribute('aria-controls', `ctrl-panel-${cfg.id}`);
            btn.tabIndex = isSelected ? 0 : -1;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'tab-icon';
            iconSpan.innerHTML = svgIcon(cfg.icon);
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

        tabsStrip.addEventListener('keydown', (e: KeyboardEvent) => {
            const currIdx = TAB_ORDER.indexOf(this.activeTab);
            if (currIdx === -1) return;
            let nextIdx = -1;
            if (e.key === 'ArrowRight') nextIdx = (currIdx + 1) % TAB_ORDER.length;
            else if (e.key === 'ArrowLeft') nextIdx = (currIdx - 1 + TAB_ORDER.length) % TAB_ORDER.length;
            else if (e.key === 'Home') nextIdx = 0;
            else if (e.key === 'End') nextIdx = TAB_ORDER.length - 1;

            if (nextIdx !== -1) {
                e.preventDefault();
                const nextTab = TAB_ORDER[nextIdx];
                this.switchTab(nextTab);
                this.tabButtons.get(nextTab)?.focus();
            }
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

        drawer.addEventListener('scroll', () => {
            this.hideOptionTooltip();
            this.customDatePicker?.updatePopupPosition(true);
        }, { passive: true });
        body.addEventListener('scroll', () => {
            this.hideOptionTooltip();
            this.customDatePicker?.updatePopupPosition(true);
        }, { passive: true });

        drawer.appendChild(body);
        return drawer;
    }

    private configureTabPanel(panel: HTMLElement, tab: ControlCenterTab): void {
        panel.className = `drawer-panel ${this.activeTab === tab ? 'active' : ''}`;
        panel.dataset.panel = tab;
        panel.id = `ctrl-panel-${tab}`;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', `ctrl-tab-${tab}`);
        this.tabPanels.set(tab, panel);
    }

    public createInfoButton(optionId: string, label: string): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ctrl-info-btn';
        btn.dataset.optionId = optionId;
        btn.setAttribute('aria-label', `Information about ${label}`);
        btn.textContent = 'i';

        btn.addEventListener('mouseenter', () => {
            this.showOptionTooltip(optionId, btn);
        });
        btn.addEventListener('mouseleave', () => {
            this.hideOptionTooltip();
        });
        btn.addEventListener('focus', () => {
            this.showOptionTooltip(optionId, btn);
        });
        btn.addEventListener('blur', () => {
            this.hideOptionTooltip();
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showOptionTooltip(optionId, btn);
        });
        return btn;
    }

    public showOptionTooltip(optionId: string, targetEl: HTMLElement) {
        const info = getSettingOptionInfo(optionId);
        if (!info) return;

        if (!this.tooltipElement) {
            const tooltip = document.createElement('div');
            tooltip.className = 'ctrl-info-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            this.uiContainer.appendChild(tooltip);
            this.tooltipElement = tooltip;
            this.activeInfoModal = tooltip;
        }

        const tooltip = this.tooltipElement;
        const kbdHtml = info.kbd ? `<kbd class="ctrl-kbd-badge">${info.kbd}</kbd>` : '';
        const summaryText = info.summary;

        tooltip.innerHTML = `
            <div class="ctrl-info-tooltip-header">
                <div class="ctrl-info-tooltip-title-wrap">
                    <span class="ctrl-info-tooltip-icon">${info.icon}</span>
                    <span class="ctrl-info-tooltip-title">${info.title}</span>
                </div>
                ${kbdHtml}
            </div>
            <p class="ctrl-info-tooltip-desc">${summaryText}</p>
        `;

        if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
            const rect = targetEl.getBoundingClientRect();
            const tooltipWidth = 280;
            let left = rect.left - tooltipWidth - 12;

            if (left < 12) {
                if (rect.right + tooltipWidth + 12 < window.innerWidth) {
                    left = rect.right + 12;
                } else {
                    left = Math.max(12, Math.min(rect.left, window.innerWidth - tooltipWidth - 12));
                }
            }

            let top = rect.top + (rect.height / 2) - 24;
            const maxTop = window.innerHeight - 120;
            top = Math.max(12, Math.min(top, maxTop));

            tooltip.style.left = `${Math.round(left)}px`;
            tooltip.style.top = `${Math.round(top)}px`;
        }

        tooltip.classList.add('visible');
    }

    public hideOptionTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
        }
    }

    public openOptionInfoModal(optionId: string) {
        const btn = this.drawerElement?.querySelector(`.ctrl-info-btn[data-option-id="${optionId}"]`) as HTMLElement;
        this.showOptionTooltip(optionId, btn || this.drawerElement);
    }

    public closeOptionInfoModal() {
        this.hideOptionTooltip();
        if (this.tooltipElement && this.tooltipElement.parentElement) {
            this.tooltipElement.parentElement.removeChild(this.tooltipElement);
            this.tooltipElement = null;
            this.activeInfoModal = null;
        }
    }

    private getTabLabel(tab: ControlCenterTab): string {
        switch (tab) {
            case 'target': return stripLeadingEmoji(i18n.t('controls.tabs.target') || 'Target');
            case 'time': return stripLeadingEmoji(i18n.t('controls.tabs.time') || i18n.t('controls.simulationFolder') || 'Simulation');
            case 'layers': return stripLeadingEmoji(i18n.t('controls.tabs.layers') || 'Layers');
            case 'camera': return stripLeadingEmoji(i18n.t('controls.tabs.camera') || i18n.t('controls.cameraFolder') || 'Camera');
            case 'optics': return stripLeadingEmoji(i18n.t('controls.tabs.optics') || i18n.t('controls.environmentFolder') || 'Optics');
            case 'system': return stripLeadingEmoji(i18n.t('controls.tabs.system') || i18n.t('controls.toolsFolder') || 'System');
        }
    }

    private formatTourSpeedText(intervalSec: number): string {
        const translated = i18n.t('ui.secPerBody', { sec: String(intervalSec) });
        if (translated && translated !== 'ui.secPerBody') {
            return translated;
        }
        return `${intervalSec}s / body`;
    }

    // =========================================================================
    // TAB 1: TARGET PANEL
    // =========================================================================
    private createTargetPanel(): HTMLElement {
        const panel = document.createElement('div');
        this.configureTabPanel(panel, 'target');

        // Category & Body Selection Group
        const selectGroup = document.createElement('div');
        selectGroup.className = 'ctrl-group';

        const groupTitle = document.createElement('h4');
        groupTitle.className = 'ctrl-group-title';
        const leftWrap = document.createElement('span');
        leftWrap.style.display = 'inline-flex';
        leftWrap.style.alignItems = 'center';
        leftWrap.style.gap = '8px';
        const ephTag = i18n.t('ui.ephemerisTag');
        const ephText = ephTag && ephTag !== 'ui.ephemerisTag' ? ephTag : 'EPHEMERIS';
        leftWrap.innerHTML = `<span data-i18n-key="controls.sections.celestialNav">${i18n.t('controls.sections.celestialNav') || 'Celestial Navigation'}</span><span class="group-tag" data-i18n-key="ui.ephemerisTag">${ephText}</span>`;
        groupTitle.appendChild(leftWrap);
        groupTitle.appendChild(this.createInfoButton('celestialNav', 'Celestial Navigation'));
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

        const quickTargets: { name: string; icon: SvgIconName; type: string }[] = [
            { name: 'Sun', icon: 'sun', type: 'Star' },
            { name: 'Mercury', icon: 'planet', type: 'Planet' },
            { name: 'Venus', icon: 'planet', type: 'Planet' },
            { name: 'Earth', icon: 'earth', type: 'Planet' },
            { name: 'Moon', icon: 'moons', type: 'Moon' },
            { name: 'Mars', icon: 'planet', type: 'Planet' },
            { name: 'Jupiter', icon: 'planet', type: 'Planet' },
            { name: 'Saturn', icon: 'planet', type: 'Planet' },
            { name: 'Uranus', icon: 'planet', type: 'Planet' },
            { name: 'Neptune', icon: 'planet', type: 'Planet' },
            { name: 'Pluto', icon: 'planet', type: 'Planet' },
            { name: 'ISS', icon: 'spacecraft', type: 'Spacecraft' },
            { name: 'Voyager 1', icon: 'spacecraft', type: 'Spacecraft' }
        ];

        quickTargets.forEach(t => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `target-chip-btn ${this.uiManager?.cameraTarget === t.name ? 'active' : ''}`;
            const locName = i18n.getBodyName(t.name) || i18n.getStarName(t.name) || i18n.getSpacecraftName(t.name) || t.name;
            chip.innerHTML = `<span class="chip-icon">${svgIcon(t.icon)}</span> <span class="chip-name">${locName}</span>`;
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
        actionBtn1.innerHTML = `<span>${svgIcon('attach-camera')} <span data-i18n-key="controls.sections.focusAlign">${stripLeadingEmoji(i18n.t('controls.sections.focusAlign') || 'Focus & Align Camera')}</span></span>`;
        actionBtn1.onclick = () => {
            this.sceneManager.focusOnBody(this.uiManager.cameraTarget);
            this.syncSwitches();
        };
        actionsGroup.appendChild(actionBtn1);

        const actionBtn2 = document.createElement('button');
        actionBtn2.type = 'button';
        actionBtn2.className = 'master-action-btn surface-action-btn';
        actionBtn2.innerHTML = `<span>${svgIcon('surface-view')} <span data-i18n-key="controls.sections.viewSurface">${stripLeadingEmoji(i18n.t('controls.sections.viewSurface') || 'View From Surface')}</span></span>`;
        actionBtn2.onclick = () => {
            this.sceneManager.setSurfaceView(this.uiManager.cameraTarget);
            this.syncSwitches();
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
        this.configureTabPanel(panel, 'time');

        // Speed Presets Group
        const presetGroup = document.createElement('div');
        presetGroup.className = 'ctrl-group';

        const presetTitle = document.createElement('h4');
        presetTitle.className = 'ctrl-group-title';
        presetTitle.innerHTML = `<span data-i18n-key="controls.speedPreset">${i18n.t('controls.speedPreset') || 'Speed Presets'}</span>`;
        presetTitle.appendChild(this.createInfoButton('speedPresets', 'Speed Presets'));
        presetGroup.appendChild(presetTitle);

        const presetGrid = document.createElement('div');
        presetGrid.className = 'speed-presets-grid';

        const presets: { key: string; labelKey: string; fallback: string; speed: number }[] = [
            { key: 'realTime', labelKey: 'controls.speedPresets.realTime', fallback: '1:1 Real', speed: SceneManager.SPEED_PRESETS.realTime },
            { key: 'oneHour', labelKey: 'controls.speedPresets.oneHourPerSec', fallback: '1 hr / s', speed: SceneManager.SPEED_PRESETS.oneHour },
            { key: 'oneDay', labelKey: 'controls.speedPresets.oneDayPerSec', fallback: '1 day / s', speed: SceneManager.SPEED_PRESETS.oneDay },
            { key: 'oneWeek', labelKey: 'controls.speedPresets.oneWeekPerSec', fallback: '1 wk / s', speed: SceneManager.SPEED_PRESETS.oneWeek },
            { key: 'oneMonth', labelKey: 'controls.speedPresets.oneMonthPerSec', fallback: '1 mo / s', speed: SceneManager.SPEED_PRESETS.oneMonth }
        ];

        presets.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preset-btn';
            btn.dataset.presetKey = p.key;
            btn.textContent = i18n.t(p.labelKey) || p.fallback;
            btn.onclick = () => {
                this.sceneManager.timeScale = p.speed;
                if (this.sceneManager.onTimeScaleChange) this.sceneManager.onTimeScaleChange(p.speed);
                this.syncTimePanel();
            };
            presetGrid.appendChild(btn);
            this.presetButtons.set(p.key, btn);
        });

        presetGroup.appendChild(presetGrid);
        panel.appendChild(presetGroup);

        // Date Controls & Ephemeris
        const dateGroup = document.createElement('div');
        dateGroup.className = 'ctrl-group';

        const dateTitle = document.createElement('h4');
        dateTitle.className = 'ctrl-group-title';
        dateTitle.innerHTML = `<span data-i18n-key="ui.simDate">${stripLeadingEmoji(i18n.t('ui.simDate') || 'Observation Date')}</span>`;
        dateTitle.appendChild(this.createInfoButton('jumpToDate', 'Observation Date'));
        dateGroup.appendChild(dateTitle);

        // Premium Flight Chronometer Date Picker with Stepper Buttons
        const pickerWrap = document.createElement('div');
        pickerWrap.className = 'ctrl-date-picker-wrap';

        const prevDayBtn = document.createElement('button');
        prevDayBtn.type = 'button';
        prevDayBtn.className = 'date-stepper-btn';
        prevDayBtn.setAttribute('aria-label', 'Previous Day');
        prevDayBtn.title = 'Previous Day (-1d)';
        prevDayBtn.innerHTML = svgIcon('chevron-left');
        prevDayBtn.onclick = () => {
            const curr = this.sceneManager.simDate ? new Date(this.sceneManager.simDate.getTime()) : new Date();
            curr.setUTCDate(curr.getUTCDate() - 1);
            this.applySelectedDate(curr, true);
        };

        const initialDate = this.sceneManager?.simDate || new Date();
        this.customDatePicker = new CustomDatePicker(
            initialDate,
            (newDate: Date) => {
                this.applySelectedDate(newDate, true);
            },
            () => {
                this.uiManager?.customDatePicker?.closePopup?.();
                if (this.sceneManager) {
                    this.sceneManager.timeScale = 0;
                    this.sceneManager.onTimeScaleChange?.(0);
                }
                this.syncTimePanel();
            },
            {
                portalContainer: this.uiContainer,
                displayId: 'controlCenterDatePicker',
                ariaLabel: 'Select Simulation Date'
            }
        );

        const nextDayBtn = document.createElement('button');
        nextDayBtn.type = 'button';
        nextDayBtn.className = 'date-stepper-btn';
        nextDayBtn.setAttribute('aria-label', 'Next Day');
        nextDayBtn.title = 'Next Day (+1d)';
        nextDayBtn.innerHTML = svgIcon('chevron-right');
        nextDayBtn.onclick = () => {
            const curr = this.sceneManager.simDate ? new Date(this.sceneManager.simDate.getTime()) : new Date();
            curr.setUTCDate(curr.getUTCDate() + 1);
            this.applySelectedDate(curr, true);
        };

        pickerWrap.appendChild(prevDayBtn);
        pickerWrap.appendChild(this.customDatePicker.domElement);
        pickerWrap.appendChild(nextDayBtn);
        dateGroup.appendChild(pickerWrap);

        // Quick Jump Steppers
        const quickSteppers = document.createElement('div');
        quickSteppers.className = 'date-quick-steppers';

        const createStepBtn = (label: string, title: string, modifier: (d: Date) => void) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quick-step-btn';
            btn.textContent = label;
            btn.title = title;
            btn.onclick = () => {
                const curr = this.sceneManager.simDate ? new Date(this.sceneManager.simDate.getTime()) : new Date();
                modifier(curr);
                this.applySelectedDate(curr, true);
            };
            return btn;
        };

        quickSteppers.appendChild(createStepBtn('-1y', 'Step backward 1 year', (d) => d.setUTCFullYear(d.getUTCFullYear() - 1)));
        quickSteppers.appendChild(createStepBtn('-1m', 'Step backward 1 month', (d) => d.setUTCMonth(d.getUTCMonth() - 1)));
        quickSteppers.appendChild(createStepBtn('+1m', 'Step forward 1 month', (d) => d.setUTCMonth(d.getUTCMonth() + 1)));
        quickSteppers.appendChild(createStepBtn('+1y', 'Step forward 1 year', (d) => d.setUTCFullYear(d.getUTCFullYear() + 1)));

        dateGroup.appendChild(quickSteppers);

        // Historical Milestones Dropdown
        const milestoneWrap = document.createElement('div');
        milestoneWrap.className = 'ctrl-milestone-wrap';

        const milestoneSelect = document.createElement('select');
        milestoneSelect.className = 'ctrl-milestone-select';
        milestoneSelect.id = 'controlCenterMilestoneSelect';
        milestoneSelect.setAttribute('aria-label', 'Historical Space Milestones');

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = stripLeadingEmoji(i18n.t('datepicker.historicalEvents') || 'Historical Milestones...');
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        milestoneSelect.appendChild(defaultOpt);

        HISTORICAL_SPACE_EVENTS.forEach((evt, idx) => {
            const opt = document.createElement('option');
            opt.value = idx.toString();
            const year = evt.date.getUTCFullYear();
            opt.textContent = `${getLocalizedEventName(evt)} (${year})`;
            milestoneSelect.appendChild(opt);
        });

        milestoneSelect.onchange = () => {
            const idx = parseInt(milestoneSelect.value, 10);
            if (!isNaN(idx) && HISTORICAL_SPACE_EVENTS[idx]) {
                const evt = HISTORICAL_SPACE_EVENTS[idx];
                this.applySelectedDate(evt.date, true);
                if (evt.target) {
                    EventBus.emit('select-celestial-body', {
                        name: evt.target,
                        eventName: getLocalizedEventName(evt),
                        eventImpact: getLocalizedEventImpact(evt)
                    });
                }
                milestoneSelect.value = '';
            }
        };
        this.milestoneSelect = milestoneSelect;
        const milestoneChevron = document.createElement('span');
        milestoneChevron.className = 'ctrl-select-chevron';
        milestoneChevron.innerHTML = svgIcon('chevron-down');
        milestoneWrap.appendChild(milestoneSelect);
        milestoneWrap.appendChild(milestoneChevron);
        dateGroup.appendChild(milestoneWrap);

        // Actions Row: Jump to Today & Open Mission Calendar
        const actionsRow = document.createElement('div');
        actionsRow.className = 'ctrl-date-actions-row';

        const jumpBtn = document.createElement('button');
        jumpBtn.type = 'button';
        jumpBtn.className = 'master-action-btn jump-date-action-btn';
        jumpBtn.title = stripLeadingEmoji(i18n.t('ui.liveRealTime') || 'Snap to Real-Time Today');
        jumpBtn.innerHTML = `<span>${svgIcon('globe')} <span data-i18n-key="datepicker.todayShort">${stripLeadingEmoji(i18n.t('datepicker.todayShort') || 'TODAY')}</span></span>`;
        jumpBtn.onclick = () => {
            const now = new Date();
            this.applySelectedDate(now, false);
        };
        actionsRow.appendChild(jumpBtn);

        const openCalBtn = document.createElement('button');
        openCalBtn.type = 'button';
        openCalBtn.className = 'master-action-btn open-cal-action-btn';
        openCalBtn.innerHTML = `<span>${svgIcon('calendar')} <span data-i18n-key="datepicker.calendarTitle">${stripLeadingEmoji(i18n.t('datepicker.calendarTitle') || 'Mission Calendar')}</span></span>`;
        openCalBtn.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            this.customDatePicker?.togglePopup();
        };
        actionsRow.appendChild(openCalBtn);

        dateGroup.appendChild(actionsRow);
        panel.appendChild(dateGroup);
        return panel;
    }

    // =========================================================================
    // TAB 3: COSMIC LAYERS PANEL
    // =========================================================================
    private createLayersPanel(): HTMLElement {
        const panel = document.createElement('div');
        this.configureTabPanel(panel, 'layers');

        const group = document.createElement('div');
        group.className = 'ctrl-group';

        const title = document.createElement('h4');
        title.className = 'ctrl-group-title';
        title.innerHTML = `<span data-i18n-key="controls.sections.entitiesTrails">${i18n.t('controls.sections.entitiesTrails') || 'Cosmic Entities & Trails'}</span>`;
        group.appendChild(title);

        const layersConfig: { prop: string; key: string; icon: string; kbd?: string; initial: boolean; onChange: (v: boolean) => void }[] = [
            {
                prop: 'showOrbits',
                key: 'controls.showOrbits',
                icon: svgIcon('orbits'),
                kbd: 'O',
                initial: this.sceneManager.showOrbits ?? true,
                onChange: (v) => this.sceneManager.toggleOrbits(v)
            },
            {
                prop: 'showMoons',
                key: 'controls.showMoons',
                icon: svgIcon('moons'),
                kbd: 'N',
                initial: this.sceneManager.showMoons ?? true,
                onChange: (v) => this.sceneManager.toggleMoons(v)
            },
            {
                prop: 'showConstellations',
                key: 'controls.showConstellations',
                icon: svgIcon('constellations'),
                kbd: 'C',
                initial: this.sceneManager.showConstellations ?? this.sceneManager.constellationManager?.isVisible ?? true,
                onChange: (v) => {
                    if (typeof this.sceneManager.toggleConstellations === 'function') {
                        this.sceneManager.toggleConstellations(v);
                    } else {
                        this.sceneManager.constellationManager?.toggleVisibility(v);
                    }
                }
            },
            {
                prop: 'showAsteroids',
                key: 'controls.showAsteroids',
                icon: svgIcon('asteroids'),
                kbd: 'E',
                initial: this.sceneManager.showAsteroids ?? true,
                onChange: (v) => this.sceneManager.toggleAsteroids(v)
            },
            {
                prop: 'showKuiperBelt',
                key: 'controls.showKuiperBelt',
                icon: svgIcon('kuiper'),
                kbd: 'U',
                initial: this.sceneManager.showKuiperBelt ?? true,
                onChange: (v) => this.sceneManager.toggleKuiperBelt(v)
            },
            {
                prop: 'showDwarfPlanets',
                key: 'controls.showDwarfPlanets',
                icon: svgIcon('dwarf'),
                kbd: 'W',
                initial: this.sceneManager.showDwarfPlanets ?? true,
                onChange: (v) => this.sceneManager.toggleDwarfPlanets(v)
            },
            {
                prop: 'showComets',
                key: 'controls.showComets',
                icon: svgIcon('comets'),
                kbd: 'Q',
                initial: this.sceneManager.showComets ?? true,
                onChange: (v) => this.sceneManager.toggleComets(v)
            },
            {
                prop: 'showSpacecraft',
                key: 'controls.showSpacecraft',
                icon: svgIcon('spacecraft'),
                kbd: 'J',
                initial: this.sceneManager.showSpacecrafts ?? true,
                onChange: (v) => this.sceneManager.toggleSpacecrafts(v)
            },
            {
                prop: 'showMeteors',
                key: 'controls.showMeteors',
                icon: svgIcon('meteors'),
                kbd: 'Y',
                initial: this.sceneManager.showMeteors ?? false,
                onChange: (v) => {
                    this.sceneManager.toggleMeteors(v);
                    if (v) {
                        this.sceneManager.focusOnBody?.('Earth');
                        this.uiManager?.modal?.show?.({
                            titleKey: 'popups.meteorsTitle',
                            descKey: 'popups.meteorsDesc',
                            name: i18n.t('popups.meteorsTitle'),
                            description: i18n.t('popups.meteorsDesc')
                        });
                    } else if (
                        this.uiManager?.modal?.isOpen &&
                        (this.uiManager.modal.isShowingPopup?.('popups.meteorsTitle') ||
                            this.uiManager.modal.titleElement?.textContent === i18n.t('popups.meteorsTitle'))
                    ) {
                        this.uiManager.modal.hide();
                    }
                }
            },
            {
                prop: 'showTrails',
                key: 'controls.showTrails',
                icon: svgIcon('trails'),
                kbd: 'I',
                initial: this.sceneManager.showTrails ?? true,
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
            icon.innerHTML = cfg.icon;
            labelWrap.appendChild(icon);

            const labelText = document.createElement('span');
            labelText.dataset.i18nKey = cfg.key;
            labelText.textContent = stripLeadingEmoji(i18n.t(cfg.key));
            labelWrap.appendChild(labelText);

            if (cfg.kbd) {
                const kbdBadge = document.createElement('kbd');
                kbdBadge.className = 'ctrl-kbd-badge';
                kbdBadge.textContent = cfg.kbd;
                labelWrap.appendChild(kbdBadge);
            }

            labelWrap.appendChild(this.createInfoButton(cfg.prop, i18n.t(cfg.key) || cfg.prop));

            row.appendChild(labelWrap);

            const switchWrap = document.createElement('label');
            switchWrap.className = 'sci-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = cfg.initial;
            input.onchange = () => {
                cfg.onChange(input.checked);
                if (this.uiManager?.headerSlotsContainer) {
                    HeaderSlotsManager.updateSlotStates(this.uiManager.headerSlotsContainer, this.uiManager);
                }
            };
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
        this.configureTabPanel(panel, 'camera');

        // View Modes Segmented Control
        const modesGroup = document.createElement('div');
        modesGroup.className = 'ctrl-group';

        const modesTitle = document.createElement('h4');
        modesTitle.className = 'ctrl-group-title';
        modesTitle.innerHTML = `<span data-i18n-key="controls.sections.cameraPerspective">${i18n.t('controls.sections.cameraPerspective') || 'Camera Perspective'}</span>`;
        modesGroup.appendChild(modesTitle);

        const segmented = document.createElement('div');
        segmented.className = 'camera-modes-segmented';

        const modes: { key: string; optionId: string; icon: SvgIconName; labelKey: string; fallback: string; kbd: string; action: () => void }[] = [
            { key: 'orbit', optionId: 'orbitFocus', icon: 'attach-camera', labelKey: 'controls.sections.orbitFocus', fallback: 'Orbit Focus', kbd: 'A', action: () => this.sceneManager.focusOnBody(this.uiManager.cameraTarget) },
            { key: 'surface', optionId: 'surfaceView', icon: 'surface-view', labelKey: 'controls.sections.surfaceView', fallback: 'Surface View', kbd: 'V', action: () => this.sceneManager.setSurfaceView(this.uiManager.cameraTarget) },
            { key: 'detach', optionId: 'freeCamera', icon: 'free-camera', labelKey: 'controls.sections.freeCam', fallback: 'Free Camera', kbd: 'D', action: () => this.sceneManager.detachCamera() }
        ];

        modes.forEach(m => {
            const itemWrap = document.createElement('div');
            itemWrap.className = `cam-mode-item ${m.key === 'orbit' ? 'active' : ''}`;
            itemWrap.dataset.modeItem = m.key;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `cam-mode-btn ${m.key === 'orbit' ? 'active' : ''}`;
            btn.dataset.modeKey = m.key;
            btn.innerHTML = `${svgIcon(m.icon)} <span data-i18n-key="${m.labelKey}">${stripLeadingEmoji(i18n.t(m.labelKey) || m.fallback)}</span> <kbd class="ctrl-kbd-badge">${m.kbd}</kbd>`;
            btn.onclick = () => {
                m.action();
                this.syncSwitches();
            };

            itemWrap.appendChild(btn);
            itemWrap.appendChild(this.createInfoButton(m.optionId, m.fallback));
            segmented.appendChild(itemWrap);
            this.camModeButtons.set(m.key, btn);
        });

        modesGroup.appendChild(segmented);
        panel.appendChild(modesGroup);

        // Cinematic Tour Section
        const tourGroup = document.createElement('div');
        tourGroup.className = 'ctrl-group';

        const tourTitle = document.createElement('h4');
        tourTitle.className = 'ctrl-group-title';
        tourTitle.innerHTML = `<span data-i18n-key="controls.cinematicTour">${stripLeadingEmoji(i18n.t('controls.cinematicTour') || 'Cinematic Grand Tour')}</span>`;
        tourGroup.appendChild(tourTitle);

        const tourRow = document.createElement('div');
        tourRow.className = 'ctrl-row-toggle';

        const tourLabel = document.createElement('label');
        tourLabel.className = 'toggle-label-wrap';
        tourLabel.innerHTML = `<span class="toggle-icon">${svgIcon('cinematic-tour')}</span><span data-i18n-key="controls.sections.autonomousTour">${stripLeadingEmoji(i18n.t('controls.sections.autonomousTour') || 'Autonomous Grand Tour')}</span><kbd class="ctrl-kbd-badge">T</kbd>`;
        tourLabel.appendChild(this.createInfoButton('cinematicTour', 'Autonomous Grand Tour'));
        tourRow.appendChild(tourLabel);

        const tourSwitch = document.createElement('label');
        tourSwitch.className = 'sci-switch';

        const tourInput = document.createElement('input');
        tourInput.type = 'checkbox';
        tourInput.checked = this.sceneManager.tourMode;
        tourInput.onchange = () => {
            const val = tourInput.checked;
            if (typeof this.uiManager?.setTourMode === 'function') {
                this.uiManager.setTourMode(val);
            } else {
                this.sceneManager.tourMode = val;
                if (val) {
                    this.sceneManager.tourTimer = 0;
                    const targetName = this.sceneManager.tourTargets[this.sceneManager.tourIndex];
                    this.sceneManager.focusOnBody(targetName);
                    EventBus.emit('tour-focus', targetName);
                } else {
                    this.sceneManager.detachCamera();
                }
                if (this.uiManager?.headerSlotsContainer) {
                    HeaderSlotsManager.updateSlotStates(this.uiManager.headerSlotsContainer, this.uiManager);
                }
            }
        };
        tourSwitch.appendChild(tourInput);
        tourSwitch.appendChild(document.createElement('span')).className = 'sci-slider';
        tourRow.appendChild(tourSwitch);
        tourGroup.appendChild(tourRow);
        this.switches.set('tourMode', tourInput);

        // Tour Speed Slider
        const tourSpeedHeader = document.createElement('div');
        tourSpeedHeader.className = 'speed-slider-label-row';
        tourSpeedHeader.innerHTML = `<span class="slider-sublabel">${svgIcon('time')} <span data-i18n-key="controls.tourSpeed">${stripLeadingEmoji(i18n.t('controls.tourSpeed') || 'Tour Dwell Duration')}</span></span>`;
        tourSpeedHeader.appendChild(this.createInfoButton('tourSpeed', 'Tour Dwell Duration'));
        tourGroup.appendChild(tourSpeedHeader);

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
                this.tourSpeedDisplay.textContent = this.formatTourSpeedText(this.sceneManager.tourInterval);
            }
        };
        tourSpeedWrap.appendChild(tourSlider);

        const tourSpeedVal = document.createElement('span');
        tourSpeedVal.className = 'speed-val-display';
        const initialInterval = this.sceneManager.tourInterval || 12;
        tourSpeedVal.textContent = this.formatTourSpeedText(initialInterval);
        tourSpeedWrap.appendChild(tourSpeedVal);
        this.tourSpeedDisplay = tourSpeedVal;

        tourGroup.appendChild(tourSpeedWrap);
        panel.appendChild(tourGroup);

        return panel;
    }

    // =========================================================================
    // TAB 5: OPTICS & ENVIRONMENT PANEL
    // =========================================================================
    private createOpticsPanel(): HTMLElement {
        const panel = document.createElement('div');
        this.configureTabPanel(panel, 'optics');

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
                icon: svgIcon('scale'),
                kbd: 'R',
                initial: this.sceneManager.realisticDistances ?? false,
                onChange: (v: boolean) => {
                    if (typeof this.uiManager?.setRealisticDistances === 'function') {
                        this.uiManager.setRealisticDistances(v);
                    } else {
                        this.sceneManager.toggleRealisticDistances(v);
                        if (v) {
                            this.uiManager.modal?.show?.({
                                titleKey: 'popups.trueScaleTitle',
                                descKey: 'popups.trueScaleDesc',
                                name: i18n.t('popups.trueScaleTitle'),
                                description: i18n.t('popups.trueScaleDesc')
                            });
                        } else if (
                            this.uiManager.modal?.isOpen &&
                            (this.uiManager.modal.isShowingPopup?.('popups.trueScaleTitle') ||
                                (this.uiManager.modal.titleElement && this.uiManager.modal.titleElement.textContent === i18n.t('popups.trueScaleTitle')))
                        ) {
                            this.uiManager.modal.hide();
                        }
                    }
                }
            },
            {
                prop: 'showHabitableZone',
                key: 'controls.habitableZone',
                icon: svgIcon('habitable'),
                kbd: 'Z',
                initial: this.sceneManager.showHabitableZone ?? false,
                onChange: (v: boolean) => this.sceneManager.toggleHabitableZone(v)
            },
            {
                prop: 'showEclipticGrid',
                key: 'controls.eclipticGrid',
                icon: svgIcon('grid'),
                kbd: 'G',
                initial: this.sceneManager.showEclipticGrid ?? false,
                onChange: (v: boolean) => this.sceneManager.toggleEclipticGrid(v)
            },
            {
                prop: 'enableBloom',
                key: 'controls.enableBloom',
                icon: svgIcon('bloom'),
                kbd: 'B',
                initial: this.sceneManager.bloomPass ? this.sceneManager.bloomPass.enabled : true,
                onChange: (v: boolean) => this.sceneManager.toggleBloom(v)
            },
            {
                prop: 'realisticLighting',
                key: 'controls.realisticLighting',
                icon: svgIcon('lighting'),
                kbd: 'L',
                initial: this.sceneManager.realisticLighting,
                onChange: (v: boolean) => this.sceneManager.toggleRealisticLighting(v)
            },
            {
                prop: 'showAxes',
                key: 'controls.showAxes',
                icon: svgIcon('axes'),
                kbd: 'X',
                initial: this.sceneManager.showAxes ?? false,
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
            icon.innerHTML = cfg.icon;
            labelWrap.appendChild(icon);

            const labelText = document.createElement('span');
            labelText.dataset.i18nKey = cfg.key;
            labelText.textContent = stripLeadingEmoji(i18n.t(cfg.key));
            labelWrap.appendChild(labelText);

            if (cfg.kbd) {
                const kbdBadge = document.createElement('kbd');
                kbdBadge.className = 'ctrl-kbd-badge';
                kbdBadge.textContent = cfg.kbd;
                labelWrap.appendChild(kbdBadge);
            }

            labelWrap.appendChild(this.createInfoButton(cfg.prop, i18n.t(cfg.key) || cfg.prop));

            row.appendChild(labelWrap);

            const switchWrap = document.createElement('label');
            switchWrap.className = 'sci-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = cfg.initial;
            input.onchange = () => {
                cfg.onChange(input.checked);
                if (this.uiManager?.headerSlotsContainer) {
                    HeaderSlotsManager.updateSlotStates(this.uiManager.headerSlotsContainer, this.uiManager);
                }
            };
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
        this.configureTabPanel(panel, 'system');

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

        const radarLabel = document.createElement('label');
        radarLabel.className = 'toggle-label-wrap';
        radarLabel.innerHTML = `<span class="toggle-icon">${svgIcon('minimap')}</span><span data-i18n-key="controls.showMinimap">${stripLeadingEmoji(i18n.t('controls.showMinimap') || 'Tactical Radar Minimap')}</span><kbd class="ctrl-kbd-badge">M</kbd>`;
        radarLabel.appendChild(this.createInfoButton('minimap', 'Tactical Radar Minimap'));
        radarRow.appendChild(radarLabel);

        const radarSwitch = document.createElement('label');
        radarSwitch.className = 'sci-switch';
        const radarInput = document.createElement('input');
        radarInput.type = 'checkbox';
        radarInput.checked = this.uiManager?.minimap?.isVisible || false;
        radarInput.onchange = () => {
            this.uiManager.minimap.setVisible(radarInput.checked);
            const radarBtn = document.getElementById('hudRadarBtn');
            if (radarBtn) {
                radarBtn.classList.toggle('active', radarInput.checked);
                radarBtn.setAttribute('aria-pressed', String(radarInput.checked));
            }
            if (this.uiManager.audioManager) this.uiManager.audioManager.playTick?.();
        };
        radarSwitch.appendChild(radarInput);
        radarSwitch.appendChild(document.createElement('span')).className = 'sci-slider';
        radarRow.appendChild(radarSwitch);
        toolsGroup.appendChild(radarRow);
        this.switches.set('minimap', radarInput);

        // Performance Telemetry Toggle
        const perfRow = document.createElement('div');
        perfRow.className = 'ctrl-row-toggle';

        const perfLabel = document.createElement('label');
        perfLabel.className = 'toggle-label-wrap';
        perfLabel.innerHTML = `<span class="toggle-icon">${svgIcon('telemetry')}</span><span data-i18n-key="ui.telemetry">${stripLeadingEmoji(i18n.t('ui.telemetry') || 'Engine Performance Telemetry')}</span><kbd class="ctrl-kbd-badge">P</kbd>`;
        perfLabel.appendChild(this.createInfoButton('telemetry', 'Engine Performance Telemetry'));
        perfRow.appendChild(perfLabel);

        const perfSwitch = document.createElement('label');
        perfSwitch.className = 'sci-switch';
        const perfInput = document.createElement('input');
        perfInput.type = 'checkbox';
        perfInput.checked = this.uiManager?.performanceMonitor?.getVisible() ?? true;
        perfInput.onchange = () => {
            this.uiManager.performanceMonitor.setVisible(perfInput.checked);
            const perfBtn = document.getElementById('hudPerfBtn');
            if (perfBtn) {
                perfBtn.classList.toggle('active', perfInput.checked);
                perfBtn.setAttribute('aria-pressed', String(perfInput.checked));
            }
            if (this.uiManager.audioManager) this.uiManager.audioManager.playTick?.();
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
            this.customDatePicker?.closePopup();
            this.drawerElement.classList.add('closed');
            this.backdropElement.classList.remove('open');
        }

        const controlsBtn = document.getElementById('hudControlsBtn');
        if (controlsBtn) {
            controlsBtn.classList.toggle('active', this.isOpen);
            controlsBtn.setAttribute('aria-expanded', String(this.isOpen));
        }
    }

    public open(tab?: ControlCenterTab) {
        if (tab) this.switchTab(tab);
        this.toggle(true);
    }

    public close() {
        this.hideOptionTooltip();
        this.customDatePicker?.closePopup();
        this.toggle(false);
    }

    public switchTab(tab: ControlCenterTab) {
        if (tab !== 'time') {
            this.customDatePicker?.closePopup();
        }
        this.activeTab = tab;

        this.tabButtons.forEach((btn, id) => {
            const isSelected = id === tab;
            btn.classList.toggle('active', isSelected);
            btn.setAttribute('aria-selected', String(isSelected));
            btn.tabIndex = isSelected ? 0 : -1;
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

    public applySelectedDate(date: Date, pauseSim: boolean = true) {
        if (this.sceneManager?.setSimDate) {
            this.sceneManager.setSimDate(date);
        }
        this.customDatePicker?.setDate(date);
        if (this.uiManager?.customDatePicker) {
            this.uiManager.customDatePicker.setDate(date);
        }
        if (pauseSim && this.sceneManager) {
            this.sceneManager.timeScale = 0;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(0);
            }
        }
        this.syncTimePanel();
    }

    public syncTimePanel() {
        const currentSpeed = this.sceneManager?.timeScale || 0;
        const isPaused = this.sceneManager?.timeScale === 0;

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

        // Sync premium date picker with current simulation date when popup is closed
        if (this.customDatePicker && !this.customDatePicker.isOpen && this.sceneManager?.simDate) {
            this.customDatePicker.setDate(this.sceneManager.simDate);
        }
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
        setChecked('showConstellations', sm.showConstellations ?? sm.constellationManager?.isVisible ?? true);
        setChecked('showAsteroids', sm.showAsteroids);
        setChecked('showKuiperBelt', sm.showKuiperBelt);
        setChecked('showDwarfPlanets', sm.showDwarfPlanets);
        setChecked('showComets', sm.showComets);
        setChecked('showSpacecraft', sm.showSpacecrafts);
        setChecked('showMeteors', sm.showMeteors);
        setChecked('showTrails', sm.showTrails);
        setChecked('showHabitableZone', sm.showHabitableZone);
        setChecked('showEclipticGrid', sm.showEclipticGrid);
        setChecked('enableBloom', sm.bloomPass ? sm.bloomPass.enabled : true);
        setChecked('realisticLighting', sm.realisticLighting);
        setChecked('showAxes', sm.showAxes);
        setChecked('realisticDistances', sm.realisticDistances);
        setChecked('tourMode', sm.tourMode);
        setChecked('minimap', this.uiManager?.minimap?.isVisible || false);
        setChecked('telemetry', this.uiManager?.performanceMonitor?.getVisible() || false);

        // Sync camera mode segmented buttons
        const isSurface = !!sm.surfaceViewBody;
        const isFree = !sm.focusedBody && !sm.surfaceViewBody && !sm.focusedStar && !sm.focusedConstellation;
        const isOrbit = !isSurface && !isFree;

        this.camModeButtons.forEach((btn, key) => {
            const active = key === 'surface' ? isSurface : key === 'detach' ? isFree : isOrbit;
            btn.classList.toggle('active', active);
            btn.parentElement?.classList.toggle('active', active);
        });

        if (this.uiManager?.headerSlotsContainer) {
            HeaderSlotsManager.updateSlotStates(this.uiManager.headerSlotsContainer, this.uiManager);
        }
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
                    if (text && text !== key) {
                        if (el.classList.contains('toggle-info-hint')) {
                            el.title = stripLeadingEmoji(text);
                        } else {
                            el.textContent = stripLeadingEmoji(text);
                        }
                    }
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
            oneMonth: 'controls.speedPresets.oneMonthPerSec'
        };
        this.presetButtons.forEach((btn, key) => {
            const lk = presetLabelMap[key];
            if (lk) {
                const text = i18n.t(lk);
                if (text) btn.textContent = text;
            }
        });

        if (this.tourSpeedDisplay) {
            const interval = this.sceneManager?.tourInterval || 12;
            this.tourSpeedDisplay.textContent = this.formatTourSpeedText(interval);
        }

        if (this.milestoneSelect && this.milestoneSelect.options.length > 0) {
            this.milestoneSelect.options[0].textContent = stripLeadingEmoji(i18n.t('datepicker.historicalEvents') || 'Historical Milestones...');
            HISTORICAL_SPACE_EVENTS.forEach((evt, idx) => {
                const opt = this.milestoneSelect!.options[idx + 1];
                if (opt) {
                    opt.textContent = `${getLocalizedEventName(evt)} (${evt.date.getUTCFullYear()})`;
                }
            });
        }

        if (this.drawerElement) {
            this.drawerElement.querySelectorAll<HTMLButtonElement>('.ctrl-info-btn').forEach(btn => {
                const optionId = btn.dataset.optionId;
                if (optionId) {
                    const info = getSettingOptionInfo(optionId);
                    if (info) {
                        const infoWord = i18n.t('ui.help') || 'Information';
                        btn.setAttribute('aria-label', `${infoWord}: ${info.title}`);
                    }
                }
            });
        }

        this.hideOptionTooltip();
        this.syncTimePanel();
        this.syncSwitches();
    }

    private initEventListeners() {
        this.onKeyDownBound = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (this.tooltipElement?.classList.contains('visible')) {
                    this.hideOptionTooltip();
                    e.stopImmediatePropagation();
                    return;
                }
                if (this.customDatePicker?.isYearModalActive()) {
                    this.customDatePicker.dismissYearModal();
                    e.stopImmediatePropagation();
                    return;
                }
                if (this.customDatePicker?.isOpen) {
                    this.customDatePicker.closePopup();
                    e.stopImmediatePropagation();
                    return;
                }
                const ui = this.uiManager as any;
                const hasHigherOverlay =
                    ui?.customDatePicker?.isYearModalActive?.() ||
                    ui?.customDatePicker?.isOpen ||
                    (typeof document !== 'undefined' && !!document.querySelector('.lang-switcher-container.open')) ||
                    ui?.shortcutsModal?.isOpen ||
                    ui?.headerSlotsModal?.isOpen ||
                    ui?.eventModal?.isOpen ||
                    ui?.modal?.isOpen;
                if (hasHigherOverlay) {
                    return;
                }
                if (this.isOpen) {
                    this.close();
                }
            }
        };
        window.addEventListener('keydown', this.onKeyDownBound);

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.updateTranslations();
        });
    }

    public dispose() {
        this.closeOptionInfoModal();
        if (this.customDatePicker) {
            this.customDatePicker.dispose();
            this.customDatePicker = null;
        }
        if (this.tooltipElement?.parentElement) {
            this.tooltipElement.parentElement.removeChild(this.tooltipElement);
            this.tooltipElement = null;
            this.activeInfoModal = null;
        }
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
