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

    private onChange: (date: Date) => void;
    private onOpen?: () => void;

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
        this.popupElement.style.zIndex = '1000';
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
        this.yearInput.type = 'number';
        this.yearInput.style.backgroundColor = '#333';
        this.yearInput.style.color = '#fff';
        this.yearInput.style.border = '1px solid #555';
        this.yearInput.style.borderRadius = '2px';
        this.yearInput.style.width = '60px';
        this.yearInput.style.padding = '2px';

        this.yearInput.addEventListener('change', () => {
            this.viewDate.setUTCDate(1);
            this.viewDate.setUTCFullYear(parseInt(this.yearInput.value));
            this.renderCalendar();
        });

        header.appendChild(this.monthSelect);
        header.appendChild(this.yearInput);
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

        this.domElement.appendChild(this.popupElement);

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.domElement.contains(e.target as Node)) {
                this.closePopup();
            }
        });

        this.updateDisplay();
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
    }

    private renderCalendar() {
        this.monthSelect.value = this.viewDate.getUTCMonth().toString();
        this.yearInput.value = this.viewDate.getUTCFullYear().toString();

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
        const yyyy = this.currentDate.getUTCFullYear();
        const mm = String(this.currentDate.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(this.currentDate.getUTCDate()).padStart(2, '0');
        this.displayElement.textContent = `${yyyy}-${mm}-${dd}`;
    }
}
