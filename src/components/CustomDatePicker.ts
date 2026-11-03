import { i18n } from '../i18n';
import { EventBus } from './EventBus';
import { svgIcon, SvgIconName } from './SvgIcons';
import { getSettingOptionInfo, getEphemerisTimeDetails } from './SettingOptionsData';

export interface HistoricalSpaceEvent {
    id: 'sputnik1' | 'apollo11' | 'voyager1' | 'hubble' | 'iss' | 'jwst';
    name: string;
    date: Date;
    target?: string;
    impact?: string;
    iconName: SvgIconName;
}

export const HISTORICAL_SPACE_EVENTS: HistoricalSpaceEvent[] = [
    {
        id: 'sputnik1',
        name: 'Sputnik 1 Launch',
        date: new Date('1957-10-04T19:28:35Z'),
        target: 'Sputnik 1',
        impact: 'The launch of Sputnik 1 marked the beginning of the space age and the US-USSR space race, demonstrating the feasibility of artificial satellites.',
        iconName: 'spacecraft'
    },
    {
        id: 'apollo11',
        name: 'Apollo 11 Moon Landing',
        date: new Date('1969-07-20T12:00:00Z'),
        target: 'Apollo 11',
        impact: 'First humans on the Moon, proving that crewed extraterrestrial travel was possible and achieving a major milestone in human history.',
        iconName: 'moons'
    },
    {
        id: 'voyager1',
        name: 'Voyager 1 Launch',
        date: new Date('1977-09-05T12:56:01Z'),
        target: 'Voyager 1',
        impact: 'Voyager 1 became the first human-made object to enter interstellar space, providing unprecedented images and data of the outer solar system.',
        iconName: 'rocket'
    },
    {
        id: 'hubble',
        name: 'Hubble Space Telescope Launch',
        date: new Date('1990-04-24T12:33:52Z'),
        target: 'Hubble Space Telescope',
        impact: 'Revolutionized astronomy by providing clear, deep images of the universe, leading to discoveries about the age of the universe, dark energy, and exoplanets.',
        iconName: 'camera'
    },
    {
        id: 'iss',
        name: 'ISS First Module Launch',
        date: new Date('1998-11-20T06:40:01Z'),
        target: 'ISS (International Space Station)',
        impact: 'Began the era of continuous human presence in space and international cooperation in scientific research in microgravity.',
        iconName: 'spacecraft'
    },
    {
        id: 'jwst',
        name: 'James Webb Telescope Launch',
        date: new Date('2021-12-25T12:20:01Z'),
        target: 'James Webb Space Telescope',
        impact: 'Designed to observe the first galaxies formed in the universe and look inside dust clouds where stars and planetary systems are forming today.',
        iconName: 'constellations'
    }
];

export function getLocalizedEventName(evt: HistoricalSpaceEvent): string {
    const key = `datepicker.milestones.${evt.id}.name`;
    const val = i18n.t(key);
    return val && val !== key ? val : evt.name;
}

export function getLocalizedEventImpact(evt: HistoricalSpaceEvent): string {
    const key = `datepicker.milestones.${evt.id}.impact`;
    const val = i18n.t(key);
    return val && val !== key ? val : (evt.impact || '');
}

function getJulianDate(d: Date): number {
    return (d.getTime() / 86400000) + 2440587.5;
}

export interface CustomDatePickerOptions {
    portalContainer?: HTMLElement;
    displayId?: string;
    ariaLabel?: string;
    ariaLabelKey?: string;
    onSnapToLive?: (date: Date) => void;
}

export class CustomDatePicker {
    public domElement: HTMLElement;
    public displayElement: HTMLElement;
    public popupElement: HTMLElement;
    private readonly isPortaled: boolean = false;
    private readonly customAriaLabel?: string;
    private readonly ariaLabelKey?: string;
    private daysGridElement: HTMLElement;
    private daysHeader: HTMLElement;

    private monthSelect: HTMLSelectElement;
    private yearInput: HTMLInputElement;
    private ephemerisBannerDate: HTMLElement | null = null;
    private ephemerisBannerJd: HTMLElement | null = null;
    private heroReturnBtn: HTMLButtonElement | null = null;
    private hudStatusTitleEl: HTMLElement | null = null;
    private hudEpochTagEl: HTMLElement | null = null;
    private jdInfoBtn: HTMLButtonElement | null = null;
    private activeInfoTargetEl: HTMLElement | null = null;
    private ephemerisTooltipEl: HTMLElement | null = null;
    private portalContainer: HTMLElement | null = null;
    private closeBtn: HTMLButtonElement | null = null;
    private livePill: HTMLButtonElement | null = null;
    private livePillLabelEl: HTMLElement | null = null;
    private decMonthBtn: HTMLButtonElement | null = null;
    private incMonthBtn: HTMLButtonElement | null = null;
    private decDecadeBtn: HTMLButtonElement | null = null;
    private decYearBtn: HTMLButtonElement | null = null;
    private incYearBtn: HTMLButtonElement | null = null;
    private incDecadeBtn: HTMLButtonElement | null = null;
    private scrubBtnItems: {
        btn: HTMLButtonElement;
        sign: '-' | '+';
        amount: number;
        unitKey: 'day' | 'year';
        tooltipKey: string;
        fallbackTooltip: string;
    }[] = [];
    private milestoneHeaderTitleEl: HTMLElement | null = null;
    private milestoneChipEls: { evt: HistoricalSpaceEvent; chip: HTMLButtonElement; labelEl: HTMLElement }[] = [];

    public currentDate: Date;
    private viewDate: Date;
    public isOpen: boolean = false;

    // Year selection modal state
    private yearModalElement: HTMLElement;
    private yearModalState: 'CENTURY' | 'DECADE' | 'YEAR' = 'YEAR';
    private yearModalBaseYear: number = new Date().getUTCFullYear();
    private isYearModalOpen: boolean = false;

    private onChange: (date: Date) => void;
    private onOpen?: () => void;
    private onSnapToLive?: (date: Date) => void;
    private onClickOutsideBound: (e: MouseEvent) => void;
    private onResizeBound: () => void;
    private unregisterI18n: (() => void) | null = null;
    private lastFormattedDate: string = '';

    private formatYear(year: number): string {
        const bc = i18n.t('datepicker.bc') || 'BC';
        return year <= 0 ? `${Math.abs(year) + 1} ${bc}` : year.toString();
    }

    private populateMonths(): void {
        const currentVal = this.monthSelect ? this.monthSelect.value : this.viewDate.getUTCMonth().toString();
        this.monthSelect.innerHTML = '';
        const months = i18n.getMonths();
        months.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i.toString();
            opt.textContent = m;
            this.monthSelect.appendChild(opt);
        });
        this.monthSelect.value = currentVal;
    }

    private populateWeekdays(): void {
        this.daysHeader.innerHTML = '';
        const weekdays = i18n.getWeekdays();
        weekdays.forEach(d => {
            const el = document.createElement('div');
            el.textContent = d;
            el.className = 'datepicker-weekday-cell';
            this.daysHeader.appendChild(el);
        });
    }

    private tr(key: string, fallback: string, params?: Record<string, string | number>): string {
        const val = i18n.t(key, params);
        return val && val !== key ? val : fallback;
    }

    private getShortChipLabel(evt: HistoricalSpaceEvent): string {
        const shortKey = `datepicker.milestones.${evt.id}.shortName`;
        const shortVal = i18n.t(shortKey);
        if (shortVal && shortVal !== shortKey) {
            return shortVal;
        }
        const locName = getLocalizedEventName(evt);
        return locName
            .replace(/ Launch| Moon Landing| First Module/gi, '')
            .replace(/\s*Space Telescope|\s*Telescope/gi, '')
            .trim();
    }

    private updateLocalizedLabels(): void {
        if (this.displayElement) {
            this.displayElement.title = this.tr(
                'datepicker.openCalendarTooltip',
                'Click to open Flight Chronometer & Ephemeris Calendar'
            );
            const displayAria = this.ariaLabelKey
                ? this.tr(this.ariaLabelKey, this.customAriaLabel || 'Flight Chronometer Date')
                : (this.customAriaLabel || this.tr('datepicker.chronometerDateAria', 'Flight Chronometer Date'));
            this.displayElement.setAttribute('aria-label', displayAria);
        }
        if (this.popupElement) {
            this.popupElement.setAttribute(
                'aria-label',
                this.tr('datepicker.calendarDialogAria', 'Flight Chronometer Calendar')
            );
        }
        if (this.hudStatusTitleEl) {
            this.hudStatusTitleEl.textContent = this.tr('datepicker.chronometerTitle', 'Astronavigation Chronometer');
        }
        if (this.hudEpochTagEl) {
            this.hudEpochTagEl.textContent = this.tr('ui.ephemerisTag', 'Ephemeris');
            const info = getSettingOptionInfo('ephemeris');
            const infoWord = this.tr('ui.help', 'Information');
            const titleText = info?.title || this.tr('ui.ephemerisTag', 'Ephemeris');
            this.hudEpochTagEl.setAttribute('aria-label', `${infoWord}: ${titleText}`);
            if (this.ephemerisTooltipEl?.classList.contains('visible')) {
                this.showEphemerisTooltip(this.activeInfoTargetEl || this.hudEpochTagEl);
            }
        }
        if (this.jdInfoBtn) {
            const details = getEphemerisTimeDetails();
            const infoWord = this.tr('ui.help', 'Information');
            this.jdInfoBtn.setAttribute('aria-label', `${infoWord}: ${details.jdTitle} & ${details.j2000Title}`);
        }
        if (this.closeBtn) {
            this.closeBtn.setAttribute('aria-label', this.tr('datepicker.closeCalendarAria', 'Close Calendar'));
            this.closeBtn.title = this.tr('ui.close', 'Close');
        }
        if (this.heroReturnBtn) {
            this.heroReturnBtn.setAttribute(
                'aria-label',
                this.tr('datepicker.returnToActiveMonthAria', 'Return to Active Simulation Month')
            );
            this.heroReturnBtn.title = this.tr(
                'datepicker.returnToActiveDateTitle',
                'Return calendar view to active simulation date'
            );
        }
        if (this.livePill) {
            this.livePill.title = this.tr('datepicker.snapToToday', 'Snap to Real-Time Today');
        }
        if (this.livePillLabelEl) {
            this.livePillLabelEl.textContent = this.tr('datepicker.todayShort', 'Today');
        }

        const uDay = this.tr('datepicker.stepUnits.day', 'd');
        const uMonth = this.tr('datepicker.stepUnits.month', 'm');
        const uYear = this.tr('datepicker.stepUnits.year', 'y');

        if (this.decMonthBtn) {
            const prevMonth = this.tr('datepicker.prevMonth', 'Previous Month');
            this.decMonthBtn.setAttribute('aria-label', prevMonth);
            this.decMonthBtn.title = `${prevMonth} (-1${uMonth})`;
        }
        if (this.monthSelect) {
            this.monthSelect.setAttribute('aria-label', this.tr('datepicker.selectMonth', 'Select Month'));
        }
        if (this.incMonthBtn) {
            const nextMonth = this.tr('datepicker.nextMonth', 'Next Month');
            this.incMonthBtn.setAttribute('aria-label', nextMonth);
            this.incMonthBtn.title = `${nextMonth} (+1${uMonth})`;
        }
        if (this.decDecadeBtn) {
            const prevDecade = this.tr('datepicker.prevDecade', 'Previous Decade');
            const prev10 = this.tr('datepicker.prev10Years', 'Previous 10 Years');
            this.decDecadeBtn.setAttribute('aria-label', prevDecade);
            this.decDecadeBtn.title = `${prev10} (-10${uYear})`;
        }
        if (this.decYearBtn) {
            const prevYear = this.tr('datepicker.prevYear', 'Previous Year');
            this.decYearBtn.setAttribute('aria-label', prevYear);
            this.decYearBtn.title = `${prevYear} (-1${uYear})`;
        }
        if (this.yearInput) {
            this.yearInput.setAttribute('aria-label', this.tr('datepicker.observationYear', 'Observation Year'));
            this.yearInput.title = this.tr(
                'datepicker.yearInputTooltip',
                'Click to browse centuries, or type year & press Enter'
            );
        }
        if (this.incYearBtn) {
            const nextYear = this.tr('datepicker.nextYear', 'Next Year');
            this.incYearBtn.setAttribute('aria-label', nextYear);
            this.incYearBtn.title = `${nextYear} (+1${uYear})`;
        }
        if (this.incDecadeBtn) {
            const nextDecade = this.tr('datepicker.nextDecade', 'Next Decade');
            const next10 = this.tr('datepicker.next10Years', 'Next 10 Years');
            this.incDecadeBtn.setAttribute('aria-label', nextDecade);
            this.incDecadeBtn.title = `${next10} (+10${uYear})`;
        }

        this.scrubBtnItems.forEach(({ btn, sign, amount, unitKey, tooltipKey, fallbackTooltip }) => {
            const unit = unitKey === 'day' ? uDay : uYear;
            btn.textContent = `${sign}${amount}${unit}`;
            btn.title = this.tr(tooltipKey, fallbackTooltip);
        });

        if (this.milestoneHeaderTitleEl) {
            this.milestoneHeaderTitleEl.textContent = this.tr('datepicker.spaceMilestones', 'Space Flight Milestones');
        }
        this.milestoneChipEls.forEach(({ evt, chip, labelEl }) => {
            const locName = getLocalizedEventName(evt);
            const locImpact = getLocalizedEventImpact(evt);
            chip.title = `${locName} (${evt.date.getUTCFullYear()}): ${locImpact}`;
            labelEl.textContent = this.getShortChipLabel(evt);
        });

        if (this.yearModalElement) {
            this.yearModalElement.setAttribute(
                'aria-label',
                this.tr('datepicker.yearSelectorAria', 'Epoch Year Selector')
            );
        }
    }

    constructor(
        initialDate: Date,
        onChange: (date: Date) => void,
        onOpen?: () => void,
        options?: CustomDatePickerOptions
    ) {
        this.currentDate = new Date(initialDate.getTime());
        this.viewDate = new Date(initialDate.getTime());
        this.onChange = onChange;
        this.onOpen = onOpen;
        this.onSnapToLive = options?.onSnapToLive;
        this.portalContainer = options?.portalContainer || null;
        this.isPortaled = Boolean(options?.portalContainer);
        this.customAriaLabel = options?.ariaLabel;
        this.ariaLabelKey = options?.ariaLabelKey;

        this.domElement = document.createElement('div');
        this.domElement.className = 'custom-datepicker-container';

        this.displayElement = document.createElement('div');
        this.displayElement.className = 'custom-datepicker-display';
        if (options?.displayId) {
            this.displayElement.id = options.displayId;
        }
        this.displayElement.title = 'Click to open Flight Chronometer & Ephemeris Calendar';
        this.displayElement.setAttribute('role', 'button');
        this.displayElement.setAttribute('tabindex', '0');
        this.displayElement.setAttribute('aria-haspopup', 'dialog');
        this.displayElement.setAttribute('aria-expanded', 'false');
        this.displayElement.setAttribute('aria-label', options?.ariaLabel || 'Flight Chronometer Date');

        this.displayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopup();
        });

        this.displayElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                this.togglePopup();
            }
        });

        this.domElement.appendChild(this.displayElement);

        this.popupElement = document.createElement('div');
        this.popupElement.className = 'custom-datepicker-popup';
        this.popupElement.setAttribute('role', 'dialog');
        this.popupElement.setAttribute('aria-label', 'Flight Chronometer Calendar');
        this.popupElement.style.display = 'none';

        // 1. HUD Telemetry Title Bar
        const hudBar = document.createElement('div');
        hudBar.className = 'datepicker-hud-bar';

        const hudStatus = document.createElement('div');
        hudStatus.className = 'datepicker-status-badge';
        const beacon = document.createElement('span');
        beacon.className = 'datepicker-pulse-beacon';
        const hudStatusTitle = document.createElement('span');
        hudStatusTitle.className = 'hud-status-title';
        hudStatus.appendChild(beacon);
        hudStatus.appendChild(hudStatusTitle);
        this.hudStatusTitleEl = hudStatusTitle;
        hudBar.appendChild(hudStatus);

        const hudRight = document.createElement('div');
        hudRight.className = 'datepicker-hud-right';

        const epochWrap = document.createElement('div');
        epochWrap.className = 'datepicker-epoch-wrap';

        const epochTag = document.createElement('span');
        epochTag.className = 'datepicker-epoch-tag';
        epochTag.dataset.optionId = 'ephemeris';
        epochTag.addEventListener('mouseenter', () => {
            this.showEphemerisTooltip(epochTag);
        });
        epochTag.addEventListener('mouseleave', () => {
            this.hideEphemerisTooltip();
        });
        epochTag.addEventListener('focus', () => {
            this.showEphemerisTooltip(epochTag);
        });
        epochTag.addEventListener('blur', () => {
            this.hideEphemerisTooltip();
        });
        epochTag.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showEphemerisTooltip(epochTag);
        });
        this.hudEpochTagEl = epochTag;
        epochWrap.appendChild(epochTag);

        hudRight.appendChild(epochWrap);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'datepicker-close-x-btn';
        closeBtn.setAttribute('aria-label', 'Close Calendar');
        closeBtn.innerHTML = svgIcon('close');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.closePopup();
        };
        this.closeBtn = closeBtn;
        hudRight.appendChild(closeBtn);
        hudBar.appendChild(hudRight);
        this.popupElement.appendChild(hudBar);

        // 2. Ephemeris Hero Readout Banner
        const heroBanner = document.createElement('div');
        heroBanner.className = 'datepicker-hero-banner';

        const heroLeft = document.createElement('div');
        heroLeft.className = 'hero-left-wrap';

        this.ephemerisBannerDate = document.createElement('div');
        this.ephemerisBannerDate.className = 'hero-date-readout';

        const jdRow = document.createElement('div');
        jdRow.className = 'hero-jd-row';

        this.ephemerisBannerJd = document.createElement('div');
        this.ephemerisBannerJd.className = 'hero-jd-readout';

        const jdInfoBtn = document.createElement('button');
        jdInfoBtn.type = 'button';
        jdInfoBtn.className = 'ctrl-info-btn datepicker-jd-info-btn';
        jdInfoBtn.dataset.optionId = 'ephemeris';
        jdInfoBtn.textContent = 'i';
        jdInfoBtn.addEventListener('mouseenter', () => {
            this.showEphemerisTooltip(jdInfoBtn);
        });
        jdInfoBtn.addEventListener('mouseleave', () => {
            this.hideEphemerisTooltip();
        });
        jdInfoBtn.addEventListener('focus', () => {
            this.showEphemerisTooltip(jdInfoBtn);
        });
        jdInfoBtn.addEventListener('blur', () => {
            this.hideEphemerisTooltip();
        });
        jdInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showEphemerisTooltip(jdInfoBtn);
        });
        this.ephemerisBannerJd.addEventListener('mouseenter', () => {
            this.showEphemerisTooltip(jdInfoBtn);
        });
        this.ephemerisBannerJd.addEventListener('mouseleave', () => {
            this.hideEphemerisTooltip();
        });
        this.jdInfoBtn = jdInfoBtn;

        jdRow.appendChild(this.ephemerisBannerJd);
        jdRow.appendChild(jdInfoBtn);

        heroLeft.appendChild(this.ephemerisBannerDate);
        heroLeft.appendChild(jdRow);
        heroBanner.appendChild(heroLeft);

        const heroActions = document.createElement('div');
        heroActions.className = 'hero-actions-wrap';

        const returnBtn = document.createElement('button');
        returnBtn.type = 'button';
        returnBtn.className = 'hero-return-btn';
        returnBtn.setAttribute('aria-label', 'Return to Active Simulation Month');
        returnBtn.title = 'Return calendar view to active simulation date';
        returnBtn.innerHTML = svgIcon('reset');
        returnBtn.style.display = 'none';
        returnBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setTime(this.currentDate.getTime());
            this.renderCalendar();
        };
        this.heroReturnBtn = returnBtn;
        heroActions.appendChild(returnBtn);

        const livePill = document.createElement('button');
        livePill.type = 'button';
        livePill.className = 'hero-live-pill';
        const liveDot = document.createElement('span');
        liveDot.className = 'live-dot';
        const livePillLabel = document.createElement('span');
        livePill.appendChild(liveDot);
        livePill.appendChild(livePillLabel);
        this.livePill = livePill;
        this.livePillLabelEl = livePillLabel;
        livePill.title = 'Snap to Real-Time Today';
        livePill.onclick = (e) => {
            e.stopPropagation();
            const now = new Date();
            this.setDate(now);
            this.onChange(now);
            this.onSnapToLive?.(now);
            this.closePopup();
        };
        heroActions.appendChild(livePill);
        heroBanner.appendChild(heroActions);

        this.popupElement.appendChild(heroBanner);

        // 3. Navigation Controls (Month & Year Capsules)
        const header = document.createElement('div');
        header.className = 'custom-datepicker-header';

        // Month Capsule
        const monthContainer = document.createElement('div');
        monthContainer.className = 'custom-datepicker-month-container';

        const decMonthBtn = document.createElement('button');
        decMonthBtn.type = 'button';
        decMonthBtn.innerHTML = svgIcon('chevron-left');
        decMonthBtn.className = 'custom-datepicker-nav-btn prev-month';
        decMonthBtn.setAttribute('aria-label', 'Previous Month');
        decMonthBtn.title = 'Previous Month (-1m)';
        decMonthBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCMonth(this.viewDate.getUTCMonth() - 1);
            this.monthSelect.value = this.viewDate.getUTCMonth().toString();
            this.renderCalendar();
        };

        const selectWrap = document.createElement('div');
        selectWrap.className = 'datepicker-select-wrap';

        this.monthSelect = document.createElement('select');
        this.monthSelect.className = 'custom-datepicker-select';
        this.monthSelect.setAttribute('aria-label', 'Select Month');
        this.populateMonths();

        this.monthSelect.addEventListener('change', () => {
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCMonth(parseInt(this.monthSelect.value, 10));
            this.renderCalendar();
        });

        const selectChevron = document.createElement('span');
        selectChevron.className = 'select-chevron';
        selectChevron.innerHTML = svgIcon('chevron-down');

        selectWrap.appendChild(this.monthSelect);
        selectWrap.appendChild(selectChevron);

        const incMonthBtn = document.createElement('button');
        incMonthBtn.type = 'button';
        incMonthBtn.innerHTML = svgIcon('chevron-right');
        incMonthBtn.className = 'custom-datepicker-nav-btn next-month';
        incMonthBtn.setAttribute('aria-label', 'Next Month');
        incMonthBtn.title = 'Next Month (+1m)';
        incMonthBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCMonth(this.viewDate.getUTCMonth() + 1);
            this.monthSelect.value = this.viewDate.getUTCMonth().toString();
            this.renderCalendar();
        };

        this.decMonthBtn = decMonthBtn;
        this.incMonthBtn = incMonthBtn;
        monthContainer.appendChild(decMonthBtn);
        monthContainer.appendChild(selectWrap);
        monthContainer.appendChild(incMonthBtn);

        // Year Capsule
        const yearContainer = document.createElement('div');
        yearContainer.className = 'custom-datepicker-year-container';

        const decDecadeBtn = document.createElement('button');
        decDecadeBtn.type = 'button';
        decDecadeBtn.innerHTML = svgIcon('chevrons-left');
        decDecadeBtn.className = 'custom-datepicker-nav-btn prev-decade';
        decDecadeBtn.setAttribute('aria-label', 'Previous Decade');
        decDecadeBtn.title = 'Previous 10 Years (-10y)';
        decDecadeBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() - 10);
            this.renderCalendar();
        };

        const decYearBtn = document.createElement('button');
        decYearBtn.type = 'button';
        decYearBtn.innerHTML = svgIcon('chevron-left');
        decYearBtn.className = 'custom-datepicker-nav-btn prev-year';
        decYearBtn.setAttribute('aria-label', 'Previous Year');
        decYearBtn.title = 'Previous Year (-1y)';
        decYearBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() - 1);
            this.renderCalendar();
        };

        this.yearInput = document.createElement('input');
        this.yearInput.type = 'text';
        this.yearInput.className = 'custom-datepicker-input';
        this.yearInput.setAttribute('aria-label', 'Observation Year');
        this.yearInput.title = 'Click to browse centuries, or type year & press Enter';

        const commitYearInput = () => {
            const raw = this.yearInput.value.trim();
            const bcToken = (i18n.t('datepicker.bc') || 'BC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const isBC = new RegExp(`(bc|${bcToken})`, 'i').test(raw);
            const num = parseInt(raw.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) {
                const finalYear = isBC ? -num + 1 : num;
                this.viewDate.setUTCDate(1);
                this.viewDate.setUTCFullYear(finalYear);
                this.renderCalendar();
                this.closeYearModal();
            } else {
                this.yearInput.value = this.formatYear(this.viewDate.getUTCFullYear());
            }
        };

        this.yearInput.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openYearModal();
        });

        this.yearInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                commitYearInput();
                this.yearInput.blur();
            }
        });

        this.yearInput.addEventListener('change', () => {
            commitYearInput();
        });

        this.yearInput.addEventListener('focus', () => {
            this.yearInput.select();
        });

        const incYearBtn = document.createElement('button');
        incYearBtn.type = 'button';
        incYearBtn.innerHTML = svgIcon('chevron-right');
        incYearBtn.className = 'custom-datepicker-nav-btn next-year';
        incYearBtn.setAttribute('aria-label', 'Next Year');
        incYearBtn.title = 'Next Year (+1y)';
        incYearBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() + 1);
            this.renderCalendar();
        };

        const incDecadeBtn = document.createElement('button');
        incDecadeBtn.type = 'button';
        incDecadeBtn.innerHTML = svgIcon('chevrons-right');
        incDecadeBtn.className = 'custom-datepicker-nav-btn next-decade';
        incDecadeBtn.setAttribute('aria-label', 'Next Decade');
        incDecadeBtn.title = 'Next 10 Years (+10y)';
        incDecadeBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() + 10);
            this.renderCalendar();
        };

        this.decDecadeBtn = decDecadeBtn;
        this.decYearBtn = decYearBtn;
        this.incYearBtn = incYearBtn;
        this.incDecadeBtn = incDecadeBtn;
        yearContainer.appendChild(decDecadeBtn);
        yearContainer.appendChild(decYearBtn);
        yearContainer.appendChild(this.yearInput);
        yearContainer.appendChild(incYearBtn);
        yearContainer.appendChild(incDecadeBtn);

        header.appendChild(monthContainer);
        header.appendChild(yearContainer);
        this.popupElement.appendChild(header);

        // 4. Precision Astronomical Step Strip (non-redundant symmetric epoch steps)
        const scrubBar = document.createElement('div');
        scrubBar.className = 'datepicker-scrub-bar';

        const addScrubBtn = (
            sign: '-' | '+',
            amount: number,
            unitKey: 'day' | 'year',
            tooltipKey: string,
            fallbackTooltip: string,
            modifier: (d: Date) => void
        ) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'scrub-step-btn';
            btn.textContent = `${sign}${amount}${unitKey === 'day' ? 'd' : 'y'}`;
            btn.title = fallbackTooltip;
            btn.onclick = (e) => {
                e.stopPropagation();
                const newD = new Date(this.currentDate.getTime());
                modifier(newD);
                this.setDate(newD);
                this.viewDate.setTime(newD.getTime());
                this.onChange(newD);
                this.renderCalendar();
            };
            scrubBar.appendChild(btn);
            this.scrubBtnItems.push({ btn, sign, amount, unitKey, tooltipKey, fallbackTooltip });
        };

        addScrubBtn('-', 100, 'year', 'datepicker.scrubTooltips.minus100y', 'Step ephemeris -100 years', d => d.setUTCFullYear(d.getUTCFullYear() - 100));
        addScrubBtn('-', 10, 'year', 'datepicker.scrubTooltips.minus10y', 'Step ephemeris -10 years', d => d.setUTCFullYear(d.getUTCFullYear() - 10));
        addScrubBtn('-', 1, 'year', 'datepicker.scrubTooltips.minus1y', 'Step ephemeris -1 year', d => d.setUTCFullYear(d.getUTCFullYear() - 1));
        addScrubBtn('-', 1, 'day', 'datepicker.scrubTooltips.minus1d', 'Step ephemeris -1 day', d => d.setUTCDate(d.getUTCDate() - 1));

        const scrubDivider = document.createElement('span');
        scrubDivider.className = 'scrub-divider';
        scrubDivider.setAttribute('aria-hidden', 'true');
        scrubBar.appendChild(scrubDivider);

        addScrubBtn('+', 1, 'day', 'datepicker.scrubTooltips.plus1d', 'Step ephemeris +1 day', d => d.setUTCDate(d.getUTCDate() + 1));
        addScrubBtn('+', 1, 'year', 'datepicker.scrubTooltips.plus1y', 'Step ephemeris +1 year', d => d.setUTCFullYear(d.getUTCFullYear() + 1));
        addScrubBtn('+', 10, 'year', 'datepicker.scrubTooltips.plus10y', 'Step ephemeris +10 years', d => d.setUTCFullYear(d.getUTCFullYear() + 10));
        addScrubBtn('+', 100, 'year', 'datepicker.scrubTooltips.plus100y', 'Step ephemeris +100 years', d => d.setUTCFullYear(d.getUTCFullYear() + 100));

        this.popupElement.appendChild(scrubBar);

        // 5. Weekdays Row
        this.daysHeader = document.createElement('div');
        this.daysHeader.className = 'custom-datepicker-days-header';
        this.populateWeekdays();
        this.popupElement.appendChild(this.daysHeader);

        // 6. Days Matrix Grid
        this.daysGridElement = document.createElement('div');
        this.daysGridElement.className = 'custom-datepicker-days-grid';
        this.popupElement.appendChild(this.daysGridElement);

        // 7. Historical Space Missions Bento Grid (2x3 telemetry cards)
        const milestonesWrap = document.createElement('div');
        milestonesWrap.className = 'datepicker-milestones-section';

        const milestoneHeader = document.createElement('div');
        milestoneHeader.className = 'milestone-section-title';
        const milestoneIconSpan = document.createElement('span');
        milestoneIconSpan.className = 'milestone-title-icon';
        milestoneIconSpan.innerHTML = svgIcon('rocket');
        const milestoneHeaderTitle = document.createElement('span');
        milestoneHeader.appendChild(milestoneIconSpan);
        milestoneHeader.appendChild(milestoneHeaderTitle);
        this.milestoneHeaderTitleEl = milestoneHeaderTitle;
        milestonesWrap.appendChild(milestoneHeader);

        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'datepicker-milestone-chips';

        HISTORICAL_SPACE_EVENTS.forEach((evt) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'milestone-chip';
            chip.dataset.missionId = evt.id;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'chip-icon';
            iconSpan.innerHTML = svgIcon(evt.iconName);

            const labelEl = document.createElement('span');
            labelEl.className = 'chip-label';

            const yearEl = document.createElement('span');
            yearEl.className = 'chip-year';
            yearEl.textContent = String(evt.date.getUTCFullYear());

            chip.appendChild(iconSpan);
            chip.appendChild(labelEl);
            chip.appendChild(yearEl);

            chip.onclick = (e) => {
                e.stopPropagation();
                this.setDate(evt.date);
                this.onChange(evt.date);
                this.closePopup();
                if (evt.target) {
                    EventBus.emit('select-celestial-body', {
                        name: evt.target,
                        eventId: evt.id,
                        eventName: getLocalizedEventName(evt),
                        eventImpact: getLocalizedEventImpact(evt)
                    });
                }
            };
            chipsContainer.appendChild(chip);
            this.milestoneChipEls.push({ evt, chip, labelEl });
        });
        milestonesWrap.appendChild(chipsContainer);
        this.popupElement.appendChild(milestonesWrap);

        // 8. Year Selection Matrix Modal (Century / Decade / Year)
        this.yearModalElement = document.createElement('div');
        this.yearModalElement.className = 'custom-datepicker-year-modal';
        this.yearModalElement.setAttribute('role', 'dialog');
        this.yearModalElement.setAttribute('aria-label', 'Epoch Year Selector');
        this.yearModalElement.style.display = 'none';
        document.body.appendChild(this.yearModalElement);

        if (options?.portalContainer) {
            this.popupElement.classList.add('is-portaled');
            options.portalContainer.appendChild(this.popupElement);
        } else {
            this.domElement.appendChild(this.popupElement);
        }

        // Close on click outside
        this.onClickOutsideBound = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Ignore clicks on external trigger buttons
            if (target.closest('.sim-date-label')) {
                return;
            }

            if (
                this.isOpen &&
                !this.domElement.contains(target) &&
                !this.popupElement.contains(target) &&
                !this.yearModalElement.contains(target)
            ) {
                this.closePopup();
            }
            if (this.isYearModalOpen && !this.yearModalElement.contains(target) && target !== this.yearInput) {
                this.closeYearModal();
            }
        };
        document.addEventListener('click', this.onClickOutsideBound);

        this.onResizeBound = () => {
            if (this.isOpen && this.isPortaled) {
                this.updatePopupPosition(true);
            }
            if (this.isYearModalOpen) {
                this.positionYearModal();
            }
        };
        window.addEventListener('resize', this.onResizeBound);

        this.updateLocalizedLabels();
        this.updateDisplay();

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.populateMonths();
            this.populateWeekdays();
            this.updateLocalizedLabels();
            this.renderCalendar();
            this.updateDisplay();
            if (this.isYearModalOpen) {
                this.renderYearModal();
            }
        });
    }

    public isYearModalActive(): boolean {
        return this.isYearModalOpen;
    }

    public dismissYearModal(): void {
        this.closeYearModal();
    }

    private positionYearModal(): void {
        const rect = this.yearInput.getBoundingClientRect();
        const modalWidth = this.yearModalElement.offsetWidth || 268;
        const modalHeight = this.yearModalElement.offsetHeight || 248;
        const margin = 12;

        const maxLeft = Math.max(margin, window.innerWidth - modalWidth - margin);
        const centeredLeft = rect.left + (rect.width / 2) - (modalWidth / 2);
        const finalLeft = Math.max(margin, Math.min(centeredLeft, maxLeft));

        let finalTop = rect.bottom + 8;
        if (finalTop + modalHeight > window.innerHeight - margin && rect.top - modalHeight - 8 >= margin) {
            finalTop = rect.top - modalHeight - 8;
        } else {
            finalTop = Math.max(margin, Math.min(finalTop, Math.max(margin, window.innerHeight - modalHeight - margin)));
        }

        this.yearModalElement.style.left = `${Math.round(finalLeft)}px`;
        this.yearModalElement.style.top = `${Math.round(finalTop)}px`;
    }

    private openYearModal() {
        this.isYearModalOpen = true;
        this.yearModalElement.style.display = 'block';
        this.yearModalElement.style.zIndex = '3000';
        this.yearModalState = 'CENTURY';
        this.yearModalBaseYear = this.viewDate.getUTCFullYear();

        this.renderYearModal();
        this.positionYearModal();
    }

    private closeYearModal() {
        this.isYearModalOpen = false;
        this.yearModalElement.style.display = 'none';
    }

    private renderYearModal() {
        this.yearModalElement.innerHTML = '';
        this.yearModalElement.setAttribute(
            'aria-label',
            this.tr('datepicker.yearSelectorAria', 'Epoch Year Selector')
        );

        const header = document.createElement('div');
        header.className = 'datepicker-modal-header';

        const prevRangeLabel = this.tr('datepicker.prevRangeAria', 'Previous Range');
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.innerHTML = svgIcon('chevron-left');
        prevBtn.className = 'custom-datepicker-nav-btn';
        prevBtn.setAttribute('aria-label', prevRangeLabel);
        prevBtn.title = prevRangeLabel;

        const titleBtn = document.createElement('button');
        titleBtn.type = 'button';
        titleBtn.className = 'datepicker-modal-title-group';

        const levelSpan = document.createElement('span');
        levelSpan.className = 'datepicker-modal-level';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'datepicker-modal-title';

        titleBtn.appendChild(levelSpan);
        titleBtn.appendChild(titleSpan);

        const rightControls = document.createElement('div');
        rightControls.className = 'datepicker-modal-right-controls';

        const nextRangeLabel = this.tr('datepicker.nextRangeAria', 'Next Range');
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.innerHTML = svgIcon('chevron-right');
        nextBtn.className = 'custom-datepicker-nav-btn';
        nextBtn.setAttribute('aria-label', nextRangeLabel);
        nextBtn.title = nextRangeLabel;

        const closeModalBtn = document.createElement('button');
        closeModalBtn.type = 'button';
        closeModalBtn.innerHTML = svgIcon('close');
        closeModalBtn.className = 'datepicker-modal-close';
        closeModalBtn.setAttribute('aria-label', this.tr('datepicker.closeYearModalAria', 'Close Year Matrix'));
        closeModalBtn.title = this.tr('ui.close', 'Close');
        closeModalBtn.onclick = (e) => {
            e.stopPropagation();
            this.closeYearModal();
        };

        rightControls.appendChild(nextBtn);
        rightControls.appendChild(closeModalBtn);

        header.appendChild(prevBtn);
        header.appendChild(titleBtn);
        header.appendChild(rightControls);
        this.yearModalElement.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'datepicker-modal-grid';
        this.yearModalElement.appendChild(grid);

        const items: { label: string; value: number; isOutOfRange?: boolean }[] = [];
        let onSelect: (val: number) => void;
        const activeViewYear = this.viewDate.getUTCFullYear();

        if (this.yearModalState === 'CENTURY') {
            const startYear = Math.floor(this.yearModalBaseYear / 1000) * 1000;
            levelSpan.textContent = this.tr('datepicker.century', 'Century');
            titleSpan.textContent = `${this.formatYear(startYear)} – ${this.formatYear(startYear + 999)}`;
            titleBtn.disabled = true;

            prevBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear -= 1000; this.renderYearModal(); };
            nextBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear += 1000; this.renderYearModal(); };

            for (let i = -1; i <= 10; i++) {
                const cellYear = startYear + i * 100;
                let cellLabel: string;
                if (cellYear <= 0) {
                    cellLabel = this.formatYear(cellYear);
                } else {
                    const endShort = String((cellYear + 99) % 100).padStart(2, '0');
                    cellLabel = this.tr('datepicker.centuryFormat', '{year}s', {
                        year: String(cellYear),
                        endShort
                    });
                }
                items.push({
                    label: cellLabel,
                    value: cellYear,
                    isOutOfRange: i < 0 || i === 10
                });
            }

            onSelect = (val) => {
                this.yearModalBaseYear = val;
                this.yearModalState = 'DECADE';
                this.renderYearModal();
            };
        } else if (this.yearModalState === 'DECADE') {
            const startYear = Math.floor(this.yearModalBaseYear / 100) * 100;
            levelSpan.textContent = this.tr('datepicker.decade', 'Decade');
            titleSpan.textContent = `${this.formatYear(startYear)} – ${this.formatYear(startYear + 99)}`;
            titleBtn.title = this.tr('datepicker.zoomOutToCenturies', 'Zoom out to centuries');
            titleBtn.onclick = (e) => { e.stopPropagation(); this.yearModalState = 'CENTURY'; this.renderYearModal(); };

            prevBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear -= 100; this.renderYearModal(); };
            nextBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear += 100; this.renderYearModal(); };

            for (let i = -1; i <= 10; i++) {
                items.push({
                    label: `${this.formatYear(startYear + i * 10)}`,
                    value: startYear + i * 10,
                    isOutOfRange: i < 0 || i === 10
                });
            }

            onSelect = (val) => {
                this.yearModalBaseYear = val;
                this.yearModalState = 'YEAR';
                this.renderYearModal();
            };
        } else {
            const startYear = Math.floor(this.yearModalBaseYear / 10) * 10;
            levelSpan.textContent = this.tr('datepicker.year', 'Year');
            titleSpan.textContent = `${this.formatYear(startYear)} – ${this.formatYear(startYear + 9)}`;
            titleBtn.title = this.tr('datepicker.zoomOutToDecades', 'Zoom out to decades');
            titleBtn.onclick = (e) => { e.stopPropagation(); this.yearModalState = 'DECADE'; this.renderYearModal(); };

            prevBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear -= 10; this.renderYearModal(); };
            nextBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear += 10; this.renderYearModal(); };

            for (let i = -1; i <= 10; i++) {
                items.push({
                    label: `${this.formatYear(startYear + i)}`,
                    value: startYear + i,
                    isOutOfRange: i < 0 || i === 10
                });
            }

            onSelect = (val) => {
                this.viewDate.setUTCDate(1);
                this.viewDate.setUTCFullYear(val);
                this.renderCalendar();
                this.closeYearModal();
            };
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.textContent = item.label;
            el.className = 'datepicker-modal-cell';
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');

            if (item.isOutOfRange) {
                el.classList.add('out-of-range');
            }

            const isMatch =
                (this.yearModalState === 'YEAR' && item.value === activeViewYear) ||
                (this.yearModalState === 'DECADE' && activeViewYear >= item.value && activeViewYear < item.value + 10) ||
                (this.yearModalState === 'CENTURY' && activeViewYear >= item.value && activeViewYear < item.value + 100);

            if (isMatch && !item.isOutOfRange) {
                el.classList.add('active');
            }

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelect(item.value);
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(item.value);
                }
            });

            grid.appendChild(el);
        });
    }

    public setDate(date: Date) {
        this.currentDate.setTime(date.getTime());
        this.updateDisplay();
    }

    public togglePopup() {
        if (this.isOpen) {
            this.closePopup();
        } else {
            this.openPopup();
        }
    }

    public updatePopupPosition(reanchor: boolean = true): void {
        if (!this.isPortaled || !this.isOpen || typeof window === 'undefined') {
            return;
        }

        if (window.innerWidth <= 520) {
            this.popupElement.style.left = '';
            this.popupElement.style.top = '';
            return;
        }

        const rect = this.displayElement.getBoundingClientRect();
        const popupWidth = this.popupElement.offsetWidth || 368;
        const popupHeight = this.popupElement.offsetHeight || 540;
        const margin = 12;

        const maxLeft = Math.max(margin, window.innerWidth - popupWidth - margin);
        const centeredLeft = rect.left + (rect.width / 2) - (popupWidth / 2);
        const finalLeft = Math.max(margin, Math.min(centeredLeft, maxLeft));

        let finalTop: number;
        const existingTop = parseFloat(this.popupElement.style.top);
        if (!reanchor && !Number.isNaN(existingTop)) {
            if (existingTop + popupHeight > window.innerHeight - margin) {
                finalTop = Math.max(margin, window.innerHeight - popupHeight - margin);
            } else {
                finalTop = existingTop;
            }
        } else {
            finalTop = rect.bottom + 8;
            if (finalTop + popupHeight > window.innerHeight - margin) {
                if (rect.top - popupHeight - 8 >= margin) {
                    finalTop = rect.top - popupHeight - 8;
                } else {
                    finalTop = Math.max(margin, window.innerHeight - popupHeight - margin);
                }
            }
        }

        this.popupElement.style.left = `${Math.round(finalLeft)}px`;
        this.popupElement.style.top = `${Math.round(finalTop)}px`;
    }

    public openPopup() {
        this.isOpen = true;
        this.domElement.classList.add('is-open');
        this.displayElement.setAttribute('aria-expanded', 'true');
        this.domElement.closest('.date-panel-hud')?.classList.add('is-datepicker-open');
        this.domElement.closest('.observatory-header-bar, .selection-menu-container')?.classList.add('has-datepicker-open');
        this.popupElement.style.display = 'block';
        this.viewDate.setTime(this.currentDate.getTime());
        this.renderCalendar();
        if (this.isPortaled) {
            this.updatePopupPosition(true);
        }
        if (this.onOpen) {
            this.onOpen();
        }
    }

    public showEphemerisTooltip(targetEl: HTMLElement): void {
        const info = getSettingOptionInfo('ephemeris');
        if (!info) return;
        const details = getEphemerisTimeDetails();
        this.activeInfoTargetEl = targetEl;

        if (!this.ephemerisTooltipEl) {
            const tooltip = document.createElement('div');
            tooltip.className = 'ctrl-info-tooltip datepicker-ephemeris-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            const host = this.portalContainer || document.getElementById('ui-container') || document.body;
            host.appendChild(tooltip);
            this.ephemerisTooltipEl = tooltip;
        }

        const tooltip = this.ephemerisTooltipEl;
        tooltip.innerHTML = `
            <div class="ctrl-info-tooltip-header">
                <div class="ctrl-info-tooltip-title-wrap">
                    <span class="ctrl-info-tooltip-icon">${info.icon}</span>
                    <span class="ctrl-info-tooltip-title">${info.title}</span>
                </div>
            </div>
            <p class="ctrl-info-tooltip-desc">${info.summary}</p>
            <div class="ephemeris-detail-list">
                <div class="ephemeris-detail-item">
                    <div class="ephemeris-detail-head">
                        <span class="ephemeris-detail-badge">${details.jdBadge}</span>
                        <span class="ephemeris-detail-title">${details.jdTitle}</span>
                    </div>
                    <p class="ephemeris-detail-desc">${details.jdDesc}</p>
                </div>
                <div class="ephemeris-detail-item">
                    <div class="ephemeris-detail-head">
                        <span class="ephemeris-detail-badge">${details.j2000Badge}</span>
                        <span class="ephemeris-detail-title">${details.j2000Title}</span>
                    </div>
                    <p class="ephemeris-detail-desc">${details.j2000Desc}</p>
                </div>
            </div>
        `;

        if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
            const rect = targetEl.getBoundingClientRect();
            const tooltipWidth = 330;
            const left = Math.max(12, Math.min(rect.right - tooltipWidth, window.innerWidth - tooltipWidth - 12));
            const top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 240));
            tooltip.style.left = `${Math.round(left)}px`;
            tooltip.style.top = `${Math.round(top)}px`;
        }

        tooltip.classList.add('visible');
    }

    public hideEphemerisTooltip(): void {
        if (this.ephemerisTooltipEl) {
            this.ephemerisTooltipEl.classList.remove('visible');
        }
    }

    public closePopup() {
        this.isOpen = false;
        this.domElement.classList.remove('is-open');
        this.displayElement.setAttribute('aria-expanded', 'false');
        this.domElement.closest('.date-panel-hud')?.classList.remove('is-datepicker-open');
        this.domElement.closest('.observatory-header-bar, .selection-menu-container')?.classList.remove('has-datepicker-open');
        this.popupElement.style.display = 'none';
        this.hideEphemerisTooltip();
        this.closeYearModal();
    }

    private focusDayCell(dayNumber: number): void {
        const cells = this.daysGridElement.querySelectorAll<HTMLElement>('.datepicker-day-cell');
        const targetCell = cells[dayNumber - 1];
        targetCell?.focus();
    }

    private navigateFocusByDays(currentDay: number, deltaDays: number): void {
        const target = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), currentDay + deltaDays, 12, 0, 0));
        const targetMonthChanged =
            target.getUTCFullYear() !== this.viewDate.getUTCFullYear() ||
            target.getUTCMonth() !== this.viewDate.getUTCMonth();

        if (targetMonthChanged) {
            this.viewDate.setTime(target.getTime());
            this.viewDate.setUTCDate(1);
            this.renderCalendar();
        }
        this.focusDayCell(target.getUTCDate());
    }

    private renderCalendar() {
        this.monthSelect.value = this.viewDate.getUTCMonth().toString();
        this.yearInput.value = this.formatYear(this.viewDate.getUTCFullYear());

        // Update Ephemeris Hero Banner strictly from active currentDate (never mixes currentDate day with viewDate month)
        if (this.ephemerisBannerDate) {
            const months = i18n.getMonths();
            const mName = months[this.currentDate.getUTCMonth()] || '';
            const yName = this.formatYear(this.currentDate.getUTCFullYear());
            const dNum = this.currentDate.getUTCDate();
            this.ephemerisBannerDate.textContent = `${dNum} ${mName} ${yName}`;
        }

        if (this.ephemerisBannerJd) {
            const jd = getJulianDate(this.currentDate);
            const j2000d = jd - 2451545.0;
            const sign = j2000d >= 0 ? '+' : '';
            const jdAbbrev = this.tr('datepicker.julianDayAbbrev', 'JD');
            const dayUnit = this.tr('datepicker.stepUnits.day', 'd');
            const isEn = i18n.currentLanguage === 'en';
            const jdStr = isEn
                ? jd.toFixed(1)
                : i18n.formatNumber(jd, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
            const j2000Str = isEn
                ? j2000d.toFixed(1)
                : i18n.formatNumber(j2000d, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
            this.ephemerisBannerJd.textContent = `${jdAbbrev} ${jdStr}  •  J2000 ${sign}${j2000Str}${dayUnit}`;
        }

        if (this.heroReturnBtn) {
            const isBrowsingAway =
                this.viewDate.getUTCFullYear() !== this.currentDate.getUTCFullYear() ||
                this.viewDate.getUTCMonth() !== this.currentDate.getUTCMonth();
            this.heroReturnBtn.style.display = isBrowsingAway ? 'inline-flex' : 'none';
        }

        // Sync active mission chip state
        const curY = this.currentDate.getUTCFullYear();
        const curM = this.currentDate.getUTCMonth();
        const curD = this.currentDate.getUTCDate();
        this.milestoneChipEls.forEach(({ evt, chip }) => {
            const isActiveMission =
                evt.date.getUTCFullYear() === curY &&
                evt.date.getUTCMonth() === curM &&
                evt.date.getUTCDate() === curD;
            chip.classList.toggle('active', isActiveMission);
        });

        this.daysGridElement.innerHTML = '';

        const year = this.viewDate.getUTCFullYear();
        const month = this.viewDate.getUTCMonth();

        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const startDayOfWeek = firstDayOfMonth.getUTCDay();

        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const prevMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

        // 1. Previous month trailing days
        // NOTE: Uses 'datepicker-day-slot trailing' (NOT datepicker-day-cell) so dayCells[0] in tests is Day 1 of the active month!
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const prevDayNum = prevMonthLastDay - i;
            const slot = document.createElement('div');
            slot.textContent = prevDayNum.toString();
            slot.className = 'datepicker-day-slot trailing';
            slot.setAttribute('role', 'button');
            slot.setAttribute('tabindex', '-1');
            slot.title = this.tr('datepicker.prevMonthDay', `Previous month: day ${prevDayNum}`, { day: prevDayNum });
            const activatePrev = (e: Event) => {
                e.stopPropagation();
                const newD = new Date(Date.UTC(year, month - 1, prevDayNum, 12, 0, 0));
                this.setDate(newD);
                this.viewDate.setTime(newD.getTime());
                this.onChange(newD);
                this.closePopup();
            };
            slot.onclick = activatePrev;
            slot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activatePrev(e);
                }
            });
            this.daysGridElement.appendChild(slot);
        }

        const now = new Date();
        const isCurrentRealMonth = now.getUTCFullYear() === year && now.getUTCMonth() === month;
        const realTodayDate = now.getUTCDate();

        // 2. Current Month Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = i.toString();
            dayEl.className = 'datepicker-day-cell';
            dayEl.setAttribute('role', 'button');
            dayEl.setAttribute('tabindex', '0');

            if (isCurrentRealMonth && i === realTodayDate) {
                dayEl.classList.add('is-today');
                dayEl.title = this.tr('datepicker.realTimeToday', 'Real-Time Today');
            }

            const isSelected = curY === year && curM === month && curD === i;
            if (isSelected) {
                dayEl.classList.add('active');
                dayEl.setAttribute('aria-current', 'date');
            }

            const activateDay = (e: Event) => {
                e.stopPropagation();
                const newDate = new Date(Date.UTC(year, month, i, 12, 0, 0));
                this.setDate(newDate);
                this.onChange(newDate);
                this.closePopup();
            };
            dayEl.addEventListener('click', activateDay);
            dayEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activateDay(e);
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.navigateFocusByDays(i, -1);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.navigateFocusByDays(i, 1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateFocusByDays(i, -7);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateFocusByDays(i, 7);
                }
            });

            this.daysGridElement.appendChild(dayEl);
        }

        // 3. Next month trailing days to complete a clean grid
        const totalSlotsFilled = startDayOfWeek + daysInMonth;
        const remainingSlots = (7 - (totalSlotsFilled % 7)) % 7;
        for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
            const slot = document.createElement('div');
            slot.textContent = nextDay.toString();
            slot.className = 'datepicker-day-slot trailing';
            slot.setAttribute('role', 'button');
            slot.setAttribute('tabindex', '-1');
            slot.title = this.tr('datepicker.nextMonthDay', `Next month: day ${nextDay}`, { day: nextDay });
            const activateNext = (e: Event) => {
                e.stopPropagation();
                const newD = new Date(Date.UTC(year, month + 1, nextDay, 12, 0, 0));
                this.setDate(newD);
                this.viewDate.setTime(newD.getTime());
                this.onChange(newD);
                this.closePopup();
            };
            slot.onclick = activateNext;
            slot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activateNext(e);
                }
            });
            this.daysGridElement.appendChild(slot);
        }

        if (this.isOpen && this.isPortaled) {
            this.updatePopupPosition(false);
        }
    }

    private updateDisplay() {
        const yyyy = this.formatYear(this.currentDate.getUTCFullYear());
        const mm = String(this.currentDate.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(this.currentDate.getUTCDate()).padStart(2, '0');
        const formatted = `${yyyy}-${mm}-${dd}`;
        if (formatted !== this.lastFormattedDate) {
            this.lastFormattedDate = formatted;
            this.displayElement.textContent = formatted;
        }
    }

    public dispose() {
        this.closePopup();
        this.closeYearModal();
        if (this.unregisterI18n) {
            this.unregisterI18n();
            this.unregisterI18n = null;
        }
        if (this.onClickOutsideBound) {
            document.removeEventListener('click', this.onClickOutsideBound);
        }
        if (this.onResizeBound) {
            window.removeEventListener('resize', this.onResizeBound);
        }
        if (this.ephemerisTooltipEl && this.ephemerisTooltipEl.parentElement) {
            this.ephemerisTooltipEl.parentElement.removeChild(this.ephemerisTooltipEl);
            this.ephemerisTooltipEl = null;
        }
        if (this.yearModalElement && this.yearModalElement.parentElement) {
            this.yearModalElement.parentElement.removeChild(this.yearModalElement);
        }
        if (this.popupElement && this.popupElement.parentElement) {
            this.popupElement.parentElement.removeChild(this.popupElement);
        }
        if (this.domElement && this.domElement.parentElement) {
            this.domElement.parentElement.removeChild(this.domElement);
        }
    }
}
