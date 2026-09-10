import { i18n } from '../i18n';

export class CustomDatePicker {
    public domElement: HTMLElement;
    private displayElement: HTMLElement;
    private popupElement: HTMLElement;
    private daysGridElement: HTMLElement;
    private daysHeader: HTMLElement;

    private monthSelect: HTMLSelectElement;
    private yearInput: HTMLInputElement;
    private eventsDefaultOpt: HTMLOptionElement | null = null;

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

    private updateHistoricalEventsLabel(): void {
        if (this.eventsDefaultOpt) {
            this.eventsDefaultOpt.textContent = i18n.t('datepicker.historicalEvents') || 'Historical Events...';
        }
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

        this.displayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopup();
        });

        this.domElement.appendChild(this.displayElement);

        this.popupElement = document.createElement('div');
        this.popupElement.className = 'custom-datepicker-popup';
        this.popupElement.style.display = 'none';

        // Header (Month / Year)
        const header = document.createElement('div');
        header.className = 'custom-datepicker-header';

        this.monthSelect = document.createElement('select');
        this.monthSelect.className = 'custom-datepicker-select';
        this.populateMonths();

        this.monthSelect.addEventListener('change', () => {
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCMonth(parseInt(this.monthSelect.value));
            this.renderCalendar();
        });

        this.yearInput = document.createElement('input');
        this.yearInput.type = 'text';
        this.yearInput.readOnly = true;
        this.yearInput.className = 'custom-datepicker-input';

        this.yearInput.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openYearModal();
        });

        const yearContainer = document.createElement('div');
        yearContainer.className = 'custom-datepicker-year-container';

        const decYearBtn = document.createElement('button');
        decYearBtn.innerHTML = '◀';
        decYearBtn.className = 'custom-datepicker-nav-btn';
        decYearBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() - 1);
            this.renderCalendar();
        };

        const incYearBtn = document.createElement('button');
        incYearBtn.innerHTML = '▶';
        incYearBtn.className = 'custom-datepicker-nav-btn';
        incYearBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() + 1);
            this.renderCalendar();
        };

        yearContainer.appendChild(decYearBtn);
        yearContainer.appendChild(this.yearInput);
        yearContainer.appendChild(incYearBtn);

        header.appendChild(this.monthSelect);
        header.appendChild(yearContainer);
        this.popupElement.appendChild(header);

        // Days of week
        this.daysHeader = document.createElement('div');
        this.daysHeader.className = 'custom-datepicker-days-header';
        this.populateWeekdays();
        this.popupElement.appendChild(this.daysHeader);

        // Days grid
        this.daysGridElement = document.createElement('div');
        this.daysGridElement.className = 'custom-datepicker-days-grid';
        this.popupElement.appendChild(this.daysGridElement);

        // Historical Events
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'custom-datepicker-events-container';

        const eventsSelect = document.createElement('select');
        eventsSelect.className = 'custom-datepicker-events-select';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = i18n.t('datepicker.historicalEvents') || 'Historical Events...';
        defaultOpt.hidden = true;
        defaultOpt.selected = true;
        eventsSelect.appendChild(defaultOpt);
        this.eventsDefaultOpt = defaultOpt;

        const historicalEvents = [
            { name: 'Sputnik 1 Launch', date: new Date("1957-10-04T19:28:35Z"), target: 'Sputnik 1', impact: 'The launch of Sputnik 1 marked the beginning of the space age and the US-USSR space race, demonstrating the feasibility of artificial satellites.' },
            { name: 'Apollo 11 Moon Landing', date: new Date("1969-07-20T12:00:00Z"), target: 'Apollo 11', impact: 'First humans on the Moon, proving that crewed extraterrestrial travel was possible and achieving a major milestone in human history.' },
            { name: 'Voyager 1 Launch', date: new Date("1977-09-05T12:56:01Z"), target: 'Voyager 1', impact: 'Voyager 1 became the first human-made object to enter interstellar space, providing unprecedented images and data of the outer solar system.' },
            { name: 'Hubble Space Telescope Launch', date: new Date("1990-04-24T12:33:52Z"), target: 'Hubble Space Telescope', impact: 'Revolutionized astronomy by providing clear, deep images of the universe, leading to discoveries about the age of the universe, dark energy, and exoplanets.' },
            { name: 'ISS First Module Launch', date: new Date("1998-11-20T06:40:01Z"), target: 'ISS (International Space Station)', impact: 'Began the era of continuous human presence in space and international cooperation in scientific research in microgravity.' },
            { name: 'James Webb Telescope Launch', date: new Date("2021-12-25T12:20:01Z"), target: 'James Webb Space Telescope', impact: 'Designed to observe the first galaxies formed in the universe and look inside dust clouds where stars and planetary systems are forming today.' }
        ];

        historicalEvents.forEach((evt, i) => {
            const opt = document.createElement('option');
            opt.value = i.toString();
            opt.textContent = evt.name;
            eventsSelect.appendChild(opt);
        });

        eventsSelect.addEventListener('change', () => {
            const idx = parseInt(eventsSelect.value);
            if (!isNaN(idx) && historicalEvents[idx]) {
                const evt = historicalEvents[idx];
                const evtDate = evt.date;
                this.setDate(evtDate);
                this.onChange(evtDate);
                this.closePopup();
                eventsSelect.value = ''; // Reset select

                if (evt.target) {
                    window.dispatchEvent(new CustomEvent('select-celestial-body', {
                        detail: { name: evt.target, eventName: evt.name, eventImpact: evt.impact }
                    }));
                }
            }
        });

        eventsContainer.appendChild(eventsSelect);
        this.popupElement.appendChild(eventsContainer);

        // Create Year Modal
        this.yearModalElement = document.createElement('div');
        this.yearModalElement.className = 'custom-datepicker-year-modal';
        this.yearModalElement.style.display = 'none';
        document.body.appendChild(this.yearModalElement);

        this.domElement.appendChild(this.popupElement);

        // Close on click outside
        this.onClickOutsideBound = (e: MouseEvent) => {
            if (this.isOpen && !this.domElement.contains(e.target as Node) && !this.yearModalElement.contains(e.target as Node)) {
                this.closePopup();
            }
            if (this.isYearModalOpen && !this.yearModalElement.contains(e.target as Node) && e.target !== this.yearInput) {
                this.closeYearModal();
            }
        };
        document.addEventListener('click', this.onClickOutsideBound);

        this.updateDisplay();

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.populateMonths();
            this.populateWeekdays();
            this.updateHistoricalEventsLabel();
            this.renderCalendar();
            this.updateDisplay();
            if (this.isYearModalOpen) {
                this.renderYearModal();
            }
        });
    }

    private openYearModal() {
        this.isYearModalOpen = true;
        this.yearModalElement.style.display = 'block';
        this.yearModalState = 'CENTURY';
        this.yearModalBaseYear = this.viewDate.getUTCFullYear();

        // Position relative to year input
        const rect = this.yearInput.getBoundingClientRect();
        this.yearModalElement.style.top = (rect.bottom + window.scrollY) + 'px';
        this.yearModalElement.style.left = (rect.left + window.scrollX - 70) + 'px'; // Center roughly

        this.renderYearModal();
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
        prevBtn.innerHTML = '◀';
        prevBtn.className = 'custom-datepicker-nav-btn';

        const nextBtn = document.createElement('button');
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

        let items: { label: string, value: number, isOutOfRange?: boolean }[] = [];
        let onSelect: (val: number) => void;

        if (this.yearModalState === 'CENTURY') {
            const startYear = Math.floor(this.yearModalBaseYear / 1000) * 1000;
            titleSpan.textContent = `${this.formatYear(startYear)} - ${this.formatYear(startYear + 999)}`;

            // Allow going up to a higher range if clicked (Millennium) - for simplicity, we just stay at century and page by 1000s
            titleSpan.onclick = () => {}; // Highest level

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

        } else { // YEAR
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

            grid.appendChild(el);
        });
    }

    public setDate(date: Date) {
        this.currentDate.setTime(date.getTime());
        this.updateDisplay();
    }

    private togglePopup() {
        if (this.isOpen) {
            this.closePopup();
        } else {
            this.openPopup();
        }
    }

    private openPopup() {
        this.isOpen = true;
        this.popupElement.style.display = 'block';
        this.viewDate.setTime(this.currentDate.getTime());
        this.renderCalendar();
        if (this.onOpen) {
            this.onOpen();
        }
    }

    private closePopup() {
        this.isOpen = false;
        this.popupElement.style.display = 'none';
        this.closeYearModal();
    }

    private renderCalendar() {
        this.monthSelect.value = this.viewDate.getUTCMonth().toString();
        this.yearInput.value = this.formatYear(this.viewDate.getUTCFullYear());

        this.daysGridElement.innerHTML = '';

        const year = this.viewDate.getUTCFullYear();
        const month = this.viewDate.getUTCMonth();

        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const startDayOfWeek = firstDayOfMonth.getUTCDay();

        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

        // Empty slots for previous month
        for (let i = 0; i < startDayOfWeek; i++) {
            const empty = document.createElement('div');
            this.daysGridElement.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = i.toString();
            dayEl.className = 'datepicker-day-cell';

            const isSelected =
                this.currentDate.getUTCFullYear() === year &&
                this.currentDate.getUTCMonth() === month &&
                this.currentDate.getUTCDate() === i;

            if (isSelected) {
                dayEl.classList.add('active');
            }

            dayEl.addEventListener('click', (e) => {
                e.stopPropagation();
                // Set the new date using UTC noon to prevent timezone shifts
                const newDate = new Date(Date.UTC(year, month, i, 12, 0, 0));
                this.setDate(newDate);
                this.onChange(newDate);
                this.closePopup();
            });

            this.daysGridElement.appendChild(dayEl);
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

