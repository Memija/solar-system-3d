export class CustomDatePicker {
    public domElement: HTMLElement;
    private displayElement: HTMLElement;
    private popupElement: HTMLElement;
    private daysGridElement: HTMLElement;

    private monthSelect: HTMLSelectElement;
    private yearInput: HTMLInputElement;


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

    private formatYear(year: number): string {
        return year <= 0 ? `${Math.abs(year) + 1} BC` : year.toString();
    }

    private months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    constructor(initialDate: Date, onChange: (date: Date) => void, onOpen?: () => void) {
        this.currentDate = new Date(initialDate.getTime());
        this.viewDate = new Date(initialDate.getTime());
        this.onChange = onChange;
        this.onOpen = onOpen;

        this.domElement = document.createElement('div');
        this.domElement.style.position = 'relative';
        this.domElement.style.display = 'inline-block';
        this.domElement.style.fontFamily = 'inherit';

        this.displayElement = document.createElement('div');
        this.displayElement.style.cursor = 'pointer';
        this.displayElement.style.padding = '4px 8px';
        this.displayElement.style.border = '1px solid rgba(255,255,255,0.3)';
        this.displayElement.style.borderRadius = '4px';
        this.displayElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.displayElement.style.color = '#fff';
        this.displayElement.style.minWidth = '100px';
        this.displayElement.style.textAlign = 'center';

        this.displayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopup();
        });

        this.domElement.appendChild(this.displayElement);

        this.popupElement = document.createElement('div');
        this.popupElement.style.position = 'absolute';
        this.popupElement.style.bottom = '100%';
        this.popupElement.style.left = '0';
        this.popupElement.style.marginBottom = '4px';
        this.popupElement.style.padding = '8px';
        this.popupElement.style.backgroundColor = '#1a1a1a';
        this.popupElement.style.border = '1px solid rgba(255,255,255,0.2)';
        this.popupElement.style.borderRadius = '4px';
        this.popupElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        this.popupElement.style.zIndex = '1001';
        this.popupElement.style.display = 'none';
        this.popupElement.style.width = '220px';

        // Header (Month / Year)
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '8px';

        this.monthSelect = document.createElement('select');
        this.monthSelect.style.backgroundColor = '#333';
        this.monthSelect.style.color = '#fff';
        this.monthSelect.style.border = '1px solid #555';
        this.monthSelect.style.borderRadius = '2px';
        this.monthSelect.style.padding = '2px';

        this.months.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i.toString();
            opt.textContent = m;
            this.monthSelect.appendChild(opt);
        });

        this.monthSelect.addEventListener('change', () => {
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCMonth(parseInt(this.monthSelect.value));
            this.renderCalendar();
        });


        this.yearInput = document.createElement('input');
        this.yearInput.type = 'text';
        this.yearInput.readOnly = true;
        this.yearInput.style.backgroundColor = '#333';
        this.yearInput.style.color = '#fff';
        this.yearInput.style.border = '1px solid #555';
        this.yearInput.style.borderRadius = '2px';
        this.yearInput.style.width = '60px';
        this.yearInput.style.padding = '2px';
        this.yearInput.style.cursor = 'pointer';
        this.yearInput.style.textAlign = 'center';

        this.yearInput.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openYearModal();
        });


        const yearContainer = document.createElement('div');
        yearContainer.style.display = 'flex';
        yearContainer.style.alignItems = 'center';

        const decYearBtn = document.createElement('button');
        decYearBtn.innerHTML = '◀';
        decYearBtn.style.background = 'none';
        decYearBtn.style.border = 'none';
        decYearBtn.style.color = '#3b82f6';
        decYearBtn.style.cursor = 'pointer';
        decYearBtn.style.padding = '0 5px';
        decYearBtn.style.fontSize = '12px';
        decYearBtn.onclick = (e) => {
            e.stopPropagation();
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(this.viewDate.getUTCFullYear() - 1);
            this.renderCalendar();
        };

        const incYearBtn = document.createElement('button');
        incYearBtn.innerHTML = '▶';
        incYearBtn.style.background = 'none';
        incYearBtn.style.border = 'none';
        incYearBtn.style.color = '#3b82f6';
        incYearBtn.style.cursor = 'pointer';
        incYearBtn.style.padding = '0 5px';
        incYearBtn.style.fontSize = '12px';
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
        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysHeader.style.gap = '2px';
        daysHeader.style.marginBottom = '4px';

        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
            const el = document.createElement('div');
            el.textContent = d;
            el.style.textAlign = 'center';
            el.style.fontSize = '12px';
            el.style.color = '#aaa';
            daysHeader.appendChild(el);
        });
        this.popupElement.appendChild(daysHeader);

        // Days grid
        this.daysGridElement = document.createElement('div');
        this.daysGridElement.style.display = 'grid';
        this.daysGridElement.style.gridTemplateColumns = 'repeat(7, 1fr)';
        this.daysGridElement.style.gap = '2px';
        this.popupElement.appendChild(this.daysGridElement);

        // Historical Events
        const eventsContainer = document.createElement('div');
        eventsContainer.style.marginTop = '8px';
        eventsContainer.style.borderTop = '1px solid #444';
        eventsContainer.style.paddingTop = '8px';

        const eventsSelect = document.createElement('select');
        eventsSelect.style.width = '100%';
        eventsSelect.style.backgroundColor = '#333';
        eventsSelect.style.color = '#fff';
        eventsSelect.style.border = '1px solid #555';
        eventsSelect.style.borderRadius = '2px';
        eventsSelect.style.padding = '2px';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Historical Events...';
        defaultOpt.hidden = true;
        defaultOpt.selected = true;
        eventsSelect.appendChild(defaultOpt);

        const historicalEvents = [
            { name: 'Sputnik 1 Launch', date: new Date(Date.UTC(1957, 9, 4, 12, 0, 0)), target: 'Sputnik 1', impact: 'The launch of Sputnik 1 marked the beginning of the space age and the US-USSR space race, demonstrating the feasibility of artificial satellites.' },
            { name: 'Apollo 11 Moon Landing', date: new Date(Date.UTC(1969, 6, 20, 12, 0, 0)), target: 'Apollo 11', impact: 'First humans on the Moon, proving that crewed extraterrestrial travel was possible and achieving a major milestone in human history.' },
            { name: 'Voyager 1 Launch', date: new Date(Date.UTC(1977, 8, 5, 12, 0, 0)), target: 'Voyager 1', impact: 'Voyager 1 became the first human-made object to enter interstellar space, providing unprecedented images and data of the outer solar system.' },
            { name: 'Hubble Space Telescope Launch', date: new Date(Date.UTC(1990, 3, 24, 12, 0, 0)), target: 'Hubble Space Telescope', impact: 'Revolutionized astronomy by providing clear, deep images of the universe, leading to discoveries about the age of the universe, dark energy, and exoplanets.' },
            { name: 'ISS First Module Launch', date: new Date(Date.UTC(1998, 10, 20, 12, 0, 0)), target: 'ISS (International Space Station)', impact: 'Began the era of continuous human presence in space and international cooperation in scientific research in microgravity.' },
            { name: 'James Webb Telescope Launch', date: new Date(Date.UTC(2021, 11, 25, 12, 0, 0)), target: 'James Webb Space Telescope', impact: 'Designed to observe the first galaxies formed in the universe and look inside dust clouds where stars and planetary systems are forming today.' }
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
        this.yearModalElement.style.position = 'absolute';
        this.yearModalElement.style.backgroundColor = '#1a1a1a';
        this.yearModalElement.style.border = '1px solid rgba(255,255,255,0.2)';
        this.yearModalElement.style.borderRadius = '4px';
        this.yearModalElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        this.yearModalElement.style.zIndex = '1002'; // Above main popup
        this.yearModalElement.style.display = 'none';
        this.yearModalElement.style.width = '200px';
        this.yearModalElement.style.padding = '8px';
        document.body.appendChild(this.yearModalElement);

        this.domElement.appendChild(this.popupElement);

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.domElement.contains(e.target as Node) && !this.yearModalElement.contains(e.target as Node)) {
                this.closePopup();
            }
            if (this.isYearModalOpen && !this.yearModalElement.contains(e.target as Node) && e.target !== this.yearInput) {
                this.closeYearModal();
            }
        });

        this.updateDisplay();
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
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '8px';
        header.style.color = '#fff';

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '◀';
        prevBtn.style.background = 'none';
        prevBtn.style.border = 'none';
        prevBtn.style.color = '#3b82f6';
        prevBtn.style.cursor = 'pointer';

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '▶';
        nextBtn.style.background = 'none';
        nextBtn.style.border = 'none';
        nextBtn.style.color = '#3b82f6';
        nextBtn.style.cursor = 'pointer';

        const titleSpan = document.createElement('span');
        titleSpan.style.cursor = 'pointer';
        titleSpan.style.fontWeight = 'bold';

        header.appendChild(prevBtn);
        header.appendChild(titleSpan);
        header.appendChild(nextBtn);
        this.yearModalElement.appendChild(header);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '4px';
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
            el.style.textAlign = 'center';
            el.style.padding = '8px 4px';
            el.style.cursor = 'pointer';
            el.style.fontSize = '12px';
            el.style.borderRadius = '2px';
            el.style.backgroundColor = item.isOutOfRange ? '#1a1a1a' : '#2a2a2a';
            el.style.color = item.isOutOfRange ? '#777' : '#ccc';

            if (this.yearModalState === 'YEAR' && item.value === this.viewDate.getUTCFullYear()) {
                el.style.backgroundColor = '#4CAF50';
                el.style.color = '#fff';
            }

            el.addEventListener('mouseenter', () => {
                if (el.style.backgroundColor !== 'rgb(76, 175, 80)') { // #4CAF50
                    el.style.backgroundColor = '#444';
                }
            });
            el.addEventListener('mouseleave', () => {
                if (el.style.backgroundColor !== 'rgb(76, 175, 80)') {
                    el.style.backgroundColor = item.isOutOfRange ? '#1a1a1a' : '#2a2a2a';
                }
            });

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelect(item.value);
            });

            grid.appendChild(el);
        });
    }

    public setDate(date: Date) {
        this.currentDate = new Date(date.getTime());
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
        this.viewDate = new Date(this.currentDate.getTime());
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
            dayEl.style.textAlign = 'center';
            dayEl.style.padding = '4px 0';
            dayEl.style.cursor = 'pointer';
            dayEl.style.fontSize = '12px';
            dayEl.style.borderRadius = '2px';

            const isSelected =
                this.currentDate.getUTCFullYear() === year &&
                this.currentDate.getUTCMonth() === month &&
                this.currentDate.getUTCDate() === i;

            if (isSelected) {
                dayEl.style.backgroundColor = '#4CAF50';
                dayEl.style.color = '#fff';
            } else {
                dayEl.style.backgroundColor = '#2a2a2a';
                dayEl.style.color = '#ccc';
            }

            dayEl.addEventListener('mouseenter', () => {
                if (!isSelected) dayEl.style.backgroundColor = '#444';
            });
            dayEl.addEventListener('mouseleave', () => {
                if (!isSelected) dayEl.style.backgroundColor = '#2a2a2a';
            });

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
        this.displayElement.textContent = `${yyyy}-${mm}-${dd}`;
    }
}
