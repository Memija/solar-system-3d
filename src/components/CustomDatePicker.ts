import { i18n } from '../i18n';
import { EventBus } from './EventBus';
import { svgIcon, stripLeadingEmoji, SvgIconName } from './SvgIcons';

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

export class CustomDatePicker {
    public domElement: HTMLElement;
    private displayElement: HTMLElement;
    private popupElement: HTMLElement;
    private daysGridElement: HTMLElement;
    private daysHeader: HTMLElement;

    private monthSelect: HTMLSelectElement;
    private yearInput: HTMLInputElement;
    private eventsSelect: HTMLSelectElement;
    private eventsDefaultOpt: HTMLOptionElement | null = null;
    private ephemerisBannerDate: HTMLElement | null = null;
    private ephemerisBannerJd: HTMLElement | null = null;
    private hudStatusTitleEl: HTMLElement | null = null;
    private livePillLabelEl: HTMLElement | null = null;
    private milestoneHeaderTitleEl: HTMLElement | null = null;
    private todayBtnLabelEl: HTMLElement | null = null;
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
    private onClickOutsideBound: (e: MouseEvent) => void;
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

    private getShortChipLabel(evt: HistoricalSpaceEvent): string {
        const locName = getLocalizedEventName(evt);
        return locName
            .replace(/ Launch| Moon Landing| First Module/gi, '')
            .trim();
    }

    private updateLocalizedLabels(): void {
        if (this.hudStatusTitleEl) {
            const title = i18n.t('datepicker.chronometerTitle');
            this.hudStatusTitleEl.textContent = title && title !== 'datepicker.chronometerTitle'
                ? title
                : 'ASTRONAVIGATION CHRONOMETER';
        }
        if (this.livePillLabelEl) {
            const todayShort = i18n.t('datepicker.todayShort');
            this.livePillLabelEl.textContent = todayShort && todayShort !== 'datepicker.todayShort'
                ? todayShort
                : 'TODAY';
        }
        if (this.milestoneHeaderTitleEl) {
            const milestonesTitle = i18n.t('datepicker.spaceMilestones');
            this.milestoneHeaderTitleEl.textContent = milestonesTitle && milestonesTitle !== 'datepicker.spaceMilestones'
                ? milestonesTitle
                : 'SPACE FLIGHT MILESTONES';
        }
        if (this.todayBtnLabelEl) {
            this.todayBtnLabelEl.textContent = stripLeadingEmoji(i18n.t('ui.liveRealTime') || 'Jump to Real-Time Today');
        }
        if (this.eventsDefaultOpt) {
            this.eventsDefaultOpt.textContent = stripLeadingEmoji(i18n.t('datepicker.historicalEvents') || 'Historical Events...');
        }
        if (this.eventsSelect) {
            HISTORICAL_SPACE_EVENTS.forEach((evt, i) => {
                const opt = this.eventsSelect.options[i + 1];
                if (opt) {
                    opt.textContent = `${getLocalizedEventName(evt)} (${evt.date.getUTCFullYear()})`;
                }
            });
        }
        this.milestoneChipEls.forEach(({ evt, chip, labelEl }) => {
            const locName = getLocalizedEventName(evt);
            const locImpact = getLocalizedEventImpact(evt);
            chip.title = `${locName} (${evt.date.getUTCFullYear()}): ${locImpact}`;
            labelEl.textContent = this.getShortChipLabel(evt);
        });
    }

    constructor(initialDate: Date, onChange: (date: Date) => void, onOpen?: () => void) {
        this.currentDate = new Date(initialDate.getTime());
        this.viewDate = new Date(initialDate.getTime());
        this.onChange = onChange;
        this.onOpen = onOpen;

        this.domElement = document.createElement('div');
        this.domElement.className = 'custom-datepicker-container';

        this.displayElement = document.createElement('div');
        this.displayElement.className = 'custom-datepicker-display';
        this.displayElement.title = 'Click to open Flight Chronometer & Ephemeris Calendar';
        this.displayElement.setAttribute('role', 'button');
        this.displayElement.setAttribute('tabindex', '0');
        this.displayElement.setAttribute('aria-label', 'Flight Chronometer Date');

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

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'datepicker-close-x-btn';
        closeBtn.setAttribute('aria-label', 'Close Calendar');
        closeBtn.innerHTML = svgIcon('close');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.closePopup();
        };
        hudBar.appendChild(closeBtn);
        this.popupElement.appendChild(hudBar);

        // 2. Ephemeris Hero Readout Banner
        const heroBanner = document.createElement('div');
        heroBanner.className = 'datepicker-hero-banner';

        const heroLeft = document.createElement('div');
        heroLeft.className = 'hero-left-wrap';

        this.ephemerisBannerDate = document.createElement('div');
        this.ephemerisBannerDate.className = 'hero-date-readout';

        this.ephemerisBannerJd = document.createElement('div');
        this.ephemerisBannerJd.className = 'hero-jd-readout';

        heroLeft.appendChild(this.ephemerisBannerDate);
        heroLeft.appendChild(this.ephemerisBannerJd);
        heroBanner.appendChild(heroLeft);

        const livePill = document.createElement('button');
        livePill.type = 'button';
        livePill.className = 'hero-live-pill';
        const liveDot = document.createElement('span');
        liveDot.className = 'live-dot';
        const livePillLabel = document.createElement('span');
        livePill.appendChild(liveDot);
        livePill.appendChild(livePillLabel);
        this.livePillLabelEl = livePillLabel;
        livePill.title = 'Snap to Real-Time Today';
        livePill.onclick = (e) => {
            e.stopPropagation();
            const now = new Date();
            this.setDate(now);
            this.onChange(now);
            this.closePopup();
        };
        heroBanner.appendChild(livePill);

        this.popupElement.appendChild(heroBanner);

        // 3. Navigation Controls (Month & Year)
        const header = document.createElement('div');
        header.className = 'custom-datepicker-header';

        // Month Container
        const monthContainer = document.createElement('div');
        monthContainer.className = 'custom-datepicker-month-container';

        const decMonthBtn = document.createElement('button');
        decMonthBtn.type = 'button';
        decMonthBtn.innerHTML = '◀';
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

        this.monthSelect = document.createElement('select');
        this.monthSelect.className = 'custom-datepicker-select';
        this.monthSelect.setAttribute('aria-label', 'Select Month');
        this.populateMonths();

        this.monthSelect.addEventListener('change', () => {
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCMonth(parseInt(this.monthSelect.value));
            this.renderCalendar();
        });

        const incMonthBtn = document.createElement('button');
        incMonthBtn.type = 'button';
        incMonthBtn.innerHTML = '▶';
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

        monthContainer.appendChild(decMonthBtn);
        monthContainer.appendChild(this.monthSelect);
        monthContainer.appendChild(incMonthBtn);

        // Year Container
        const yearContainer = document.createElement('div');
        yearContainer.className = 'custom-datepicker-year-container';

        const decDecadeBtn = document.createElement('button');
        decDecadeBtn.type = 'button';
        decDecadeBtn.innerHTML = '«';
        decDecadeBtn.className = 'custom-datepicker-nav-btn prev-decade';
        decDecadeBtn.title = 'Previous 10 Years (-10y)';
        decDecadeBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() - 10);
            this.renderCalendar();
        };

        const decYearBtn = document.createElement('button');
        decYearBtn.type = 'button';
        decYearBtn.innerHTML = '‹';
        decYearBtn.className = 'custom-datepicker-nav-btn prev-year';
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
            const isBC = /bc/i.test(raw);
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
        incYearBtn.innerHTML = '›';
        incYearBtn.className = 'custom-datepicker-nav-btn next-year';
        incYearBtn.title = 'Next Year (+1y)';
        incYearBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() + 1);
            this.renderCalendar();
        };

        const incDecadeBtn = document.createElement('button');
        incDecadeBtn.type = 'button';
        incDecadeBtn.innerHTML = '»';
        incDecadeBtn.className = 'custom-datepicker-nav-btn next-decade';
        incDecadeBtn.title = 'Next 10 Years (+10y)';
        incDecadeBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() + 10);
            this.renderCalendar();
        };

        yearContainer.appendChild(decDecadeBtn);
        yearContainer.appendChild(decYearBtn);
        yearContainer.appendChild(this.yearInput);
        yearContainer.appendChild(incYearBtn);
        yearContainer.appendChild(incDecadeBtn);

        header.appendChild(monthContainer);
        header.appendChild(yearContainer);
        this.popupElement.appendChild(header);

        // 4. Temporal Fast Scrub Toolbar
        const scrubBar = document.createElement('div');
        scrubBar.className = 'datepicker-scrub-bar';

        const addScrubBtn = (label: string, title: string, modifier: (d: Date) => void) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'scrub-step-btn';
            btn.textContent = label;
            btn.title = title;
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
        };

        addScrubBtn('-10y', 'Jump -10 years', d => d.setUTCFullYear(d.getUTCFullYear() - 10));
        addScrubBtn('-1y', 'Jump -1 year', d => d.setUTCFullYear(d.getUTCFullYear() - 1));
        addScrubBtn('-1m', 'Jump -1 month', d => d.setUTCMonth(d.getUTCMonth() - 1));
        addScrubBtn('-1d', 'Jump -1 day', d => d.setUTCDate(d.getUTCDate() - 1));
        addScrubBtn('+1d', 'Jump +1 day', d => d.setUTCDate(d.getUTCDate() + 1));
        addScrubBtn('+1m', 'Jump +1 month', d => d.setUTCMonth(d.getUTCMonth() + 1));
        addScrubBtn('+1y', 'Jump +1 year', d => d.setUTCFullYear(d.getUTCFullYear() + 1));
        addScrubBtn('+10y', 'Jump +10 years', d => d.setUTCFullYear(d.getUTCFullYear() + 10));

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

        // 7. Space Milestones Interactive Shelf
        const milestonesWrap = document.createElement('div');
        milestonesWrap.className = 'datepicker-milestones-section';

        const milestoneHeader = document.createElement('div');
        milestoneHeader.className = 'milestone-section-title';
        const milestoneIconSpan = document.createElement('span');
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
            const iconSpan = document.createElement('span');
            iconSpan.className = 'chip-icon';
            iconSpan.innerHTML = svgIcon(evt.iconName);
            const labelEl = document.createElement('span');
            labelEl.className = 'chip-label';
            const yearEl = document.createElement('span');
            yearEl.className = 'chip-year';
            yearEl.textContent = `'${String(evt.date.getUTCFullYear()).slice(-2)}`;
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
                        eventName: getLocalizedEventName(evt),
                        eventImpact: getLocalizedEventImpact(evt)
                    });
                }
            };
            chipsContainer.appendChild(chip);
            this.milestoneChipEls.push({ evt, chip, labelEl });
        });
        milestonesWrap.appendChild(chipsContainer);

        // Compatible select element for existing tests & accessibility
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'custom-datepicker-events-container';

        this.eventsSelect = document.createElement('select');
        this.eventsSelect.className = 'custom-datepicker-events-select';
        this.eventsSelect.setAttribute('aria-label', 'Select Historical Space Event');

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = stripLeadingEmoji(i18n.t('datepicker.historicalEvents') || 'Historical Events...');
        defaultOpt.hidden = true;
        defaultOpt.selected = true;
        this.eventsSelect.appendChild(defaultOpt);
        this.eventsDefaultOpt = defaultOpt;

        HISTORICAL_SPACE_EVENTS.forEach((evt, i) => {
            const opt = document.createElement('option');
            opt.value = i.toString();
            opt.textContent = `${getLocalizedEventName(evt)} (${evt.date.getUTCFullYear()})`;
            this.eventsSelect.appendChild(opt);
        });

        this.eventsSelect.addEventListener('change', () => {
            const idx = parseInt(this.eventsSelect.value);
            if (!isNaN(idx) && HISTORICAL_SPACE_EVENTS[idx]) {
                const evt = HISTORICAL_SPACE_EVENTS[idx];
                const evtDate = evt.date;
                this.setDate(evtDate);
                this.onChange(evtDate);
                this.closePopup();
                this.eventsSelect.value = ''; // Reset select

                if (evt.target) {
                    EventBus.emit('select-celestial-body', {
                        name: evt.target,
                        eventName: getLocalizedEventName(evt),
                        eventImpact: getLocalizedEventImpact(evt)
                    });
                }
            }
        });

        eventsContainer.appendChild(this.eventsSelect);
        milestonesWrap.appendChild(eventsContainer);
        this.popupElement.appendChild(milestonesWrap);

        // 8. Footer Action: Jump to Today Button
        const todayBtn = document.createElement('button');
        todayBtn.type = 'button';
        todayBtn.className = 'custom-datepicker-today-btn';
        const todayIconSpan = document.createElement('span');
        todayIconSpan.innerHTML = svgIcon('globe');
        const todayBtnLabel = document.createElement('span');
        todayBtn.appendChild(todayIconSpan);
        todayBtn.appendChild(todayBtnLabel);
        this.todayBtnLabelEl = todayBtnLabel;
        todayBtn.onclick = (e) => {
            e.stopPropagation();
            const now = new Date();
            this.setDate(now);
            this.onChange(now);
            this.closePopup();
        };
        this.popupElement.appendChild(todayBtn);

        // 9. Year Selection Modal
        this.yearModalElement = document.createElement('div');
        this.yearModalElement.className = 'custom-datepicker-year-modal';
        this.yearModalElement.style.display = 'none';
        document.body.appendChild(this.yearModalElement);

        this.domElement.appendChild(this.popupElement);

        // Close on click outside
        this.onClickOutsideBound = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // If user clicked any trigger element, ignore outside-click handler
            if (target.closest('.sim-date-label') || target.closest('.open-cal-action-btn')) {
                return;
            }

            if (this.isOpen && !this.domElement.contains(target) && !this.yearModalElement.contains(target)) {
                this.closePopup();
            }
            if (this.isYearModalOpen && !this.yearModalElement.contains(target) && target !== this.yearInput) {
                this.closeYearModal();
            }
        };
        document.addEventListener('click', this.onClickOutsideBound);

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

    private openYearModal() {
        this.isYearModalOpen = true;
        this.yearModalElement.style.display = 'block';
        this.yearModalElement.style.zIndex = '3000';
        this.yearModalState = 'CENTURY';
        this.yearModalBaseYear = this.viewDate.getUTCFullYear();

        this.renderYearModal();

        // Position relative to year input while clamping inside viewport
        const rect = this.yearInput.getBoundingClientRect();
        const modalWidth = this.yearModalElement.offsetWidth || 250;
        const modalHeight = this.yearModalElement.offsetHeight || 220;
        const maxLeft = Math.max(10, window.innerWidth - modalWidth - 10);
        const maxTop = Math.max(10, window.innerHeight - modalHeight - 10);
        const desiredLeft = rect.left + window.scrollX - 70;
        const desiredTop = rect.bottom + window.scrollY + 6;

        this.yearModalElement.style.left = `${Math.max(10, Math.min(desiredLeft, maxLeft))}px`;
        this.yearModalElement.style.top = `${Math.max(10, Math.min(desiredTop, maxTop))}px`;
    }

    private closeYearModal() {
        this.isYearModalOpen = false;
        this.yearModalElement.style.display = 'none';
    }

    private renderYearModal() {
        this.yearModalElement.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'datepicker-modal-header';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.innerHTML = '◀';
        prevBtn.className = 'custom-datepicker-nav-btn';

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.innerHTML = '▶';
        nextBtn.className = 'custom-datepicker-nav-btn';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'datepicker-modal-title';

        header.appendChild(prevBtn);
        header.appendChild(titleSpan);
        header.appendChild(nextBtn);
        this.yearModalElement.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'datepicker-modal-grid';
        this.yearModalElement.appendChild(grid);

        const items: { label: string; value: number; isOutOfRange?: boolean }[] = [];
        let onSelect: (val: number) => void;

        if (this.yearModalState === 'CENTURY') {
            const startYear = Math.floor(this.yearModalBaseYear / 1000) * 1000;
            titleSpan.textContent = `${this.formatYear(startYear)} - ${this.formatYear(startYear + 999)}`;
            titleSpan.onclick = () => {};

            prevBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear -= 1000; this.renderYearModal(); };
            nextBtn.onclick = (e) => { e.stopPropagation(); this.yearModalBaseYear += 1000; this.renderYearModal(); };

            for (let i = -1; i <= 10; i++) {
                items.push({
                    label: `${this.formatYear(startYear + i * 100)}s`,
                    value: startYear + i * 100,
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
            titleSpan.textContent = `${this.formatYear(startYear)} - ${this.formatYear(startYear + 99)}`;

            titleSpan.onclick = (e) => { e.stopPropagation(); this.yearModalState = 'CENTURY'; this.renderYearModal(); };

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
            titleSpan.textContent = `${this.formatYear(startYear)} - ${this.formatYear(startYear + 9)}`;

            titleSpan.onclick = (e) => { e.stopPropagation(); this.yearModalState = 'DECADE'; this.renderYearModal(); };

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

            if (this.yearModalState === 'YEAR' && item.value === this.viewDate.getUTCFullYear()) {
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

    public openPopup() {
        this.isOpen = true;
        this.popupElement.style.display = 'block';
        this.viewDate.setTime(this.currentDate.getTime());
        this.renderCalendar();
        if (this.onOpen) {
            this.onOpen();
        }
    }

    public closePopup() {
        this.isOpen = false;
        this.popupElement.style.display = 'none';
        this.closeYearModal();
    }

    private renderCalendar() {
        this.monthSelect.value = this.viewDate.getUTCMonth().toString();
        this.yearInput.value = this.formatYear(this.viewDate.getUTCFullYear());

        // Update Ephemeris Hero banner
        if (this.ephemerisBannerDate) {
            const months = i18n.getMonths();
            const mName = months[this.viewDate.getUTCMonth()] || '';
            const yName = this.formatYear(this.viewDate.getUTCFullYear());
            const dNum = this.currentDate.getUTCDate();
            this.ephemerisBannerDate.textContent = `${dNum} ${mName.toUpperCase()} ${yName}`;
        }

        if (this.ephemerisBannerJd) {
            const jd = getJulianDate(this.viewDate);
            const j2000d = jd - 2451545.0;
            const sign = j2000d >= 0 ? '+' : '';
            this.ephemerisBannerJd.textContent = `JD ${jd.toFixed(1)} • J2000 ${sign}${j2000d.toFixed(1)}d`;
        }

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
            slot.setAttribute('tabindex', '0');
            slot.title = `Previous month: day ${prevDayNum}`;
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
                dayEl.title = 'Real-Time Today';
            }

            const isSelected =
                this.currentDate.getUTCFullYear() === year &&
                this.currentDate.getUTCMonth() === month &&
                this.currentDate.getUTCDate() === i;

            if (isSelected) {
                dayEl.classList.add('active');
            }

            const activateDay = (e: Event) => {
                e.stopPropagation();
                // Set the new date using UTC noon to prevent timezone shifts
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
            slot.setAttribute('tabindex', '0');
            slot.title = `Next month: day ${nextDay}`;
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
        if (this.yearModalElement && this.yearModalElement.parentElement) {
            this.yearModalElement.parentElement.removeChild(this.yearModalElement);
        }
        if (this.domElement && this.domElement.parentElement) {
            this.domElement.parentElement.removeChild(this.domElement);
        }
    }
}
