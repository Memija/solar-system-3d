import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomDatePicker } from '../CustomDatePicker';

describe('CustomDatePicker', () => {
    let datePicker: CustomDatePicker;
    let mockOnChange: (date: Date) => void;
    let mockOnOpen: () => void;
    const initialDate = new Date(Date.UTC(2025, 5, 15)); // June 15, 2025

    beforeEach(() => {
        document.body.innerHTML = '';
        mockOnChange = vi.fn();
        mockOnOpen = vi.fn();
        datePicker = new CustomDatePicker(initialDate, mockOnChange, mockOnOpen);
        document.body.appendChild(datePicker.domElement);
    });

    it('initializes with correct DOM structure and classes', () => {
        expect(datePicker.domElement.classList.contains('custom-datepicker-container')).toBe(true);
        const display = datePicker.domElement.querySelector('.custom-datepicker-display');
        expect(display).not.toBeNull();
        expect(display?.textContent).toBe('2025-06-15');
    });

    it('toggles popup on display click', () => {
        const display = datePicker.domElement.querySelector('.custom-datepicker-display') as HTMLElement;
        display.click();
        expect(datePicker.isOpen).toBe(true);
        expect(mockOnOpen).toHaveBeenCalled();

        // Clicking outside closes the popup
        document.body.click();
        expect(datePicker.isOpen).toBe(false);
    });

    it('sets date programmatically and updates display without mutation glitches', () => {
        const newDate = new Date(Date.UTC(2030, 11, 25)); // Dec 25, 2030
        datePicker.setDate(newDate);
        const display = datePicker.domElement.querySelector('.custom-datepicker-display');
        expect(display?.textContent).toBe('2030-12-25');
    });

    it('selecting a day cell invokes onChange callback', () => {
        const display = datePicker.domElement.querySelector('.custom-datepicker-display') as HTMLElement;
        display.click();

        const dayCells = datePicker.domElement.querySelectorAll('.datepicker-day-cell');
        expect(dayCells.length).toBeGreaterThan(27);

        // Click day 1
        const firstDay = dayCells[0] as HTMLElement;
        firstDay.click();

        expect(mockOnChange).toHaveBeenCalled();
        const selectedDate = (mockOnChange as unknown as { mock: { calls: [Date][] } }).mock.calls[0][0];
        expect(selectedDate.getUTCDate()).toBe(1);
        expect(datePicker.isOpen).toBe(false);
    });

    it('opens and closes year modal', () => {
        const display = datePicker.domElement.querySelector('.custom-datepicker-display') as HTMLElement;
        display.click();

        const yearInput = datePicker.domElement.querySelector('.custom-datepicker-input') as HTMLInputElement;
        yearInput.click();

        const yearModal = document.body.querySelector('.custom-datepicker-year-modal') as HTMLElement;
        expect(yearModal).not.toBeNull();
        expect(yearModal.style.display).toBe('block');
    });

    it('disposes cleanly removing elements and listeners', () => {
        datePicker.dispose();
        expect(document.body.querySelector('.custom-datepicker-container')).toBeNull();
        expect(document.body.querySelector('.custom-datepicker-year-modal')).toBeNull();
    });

    it('updates month names, weekdays, and BC label when language changes', async () => {
        const { i18n } = await import('../../i18n');
        i18n.setLanguage('de');

        const monthSelect = datePicker.domElement.querySelector('.custom-datepicker-select') as HTMLSelectElement;
        expect(monthSelect.options[0].textContent).toBe('Januar');
        expect(monthSelect.options[9].textContent).toBe('Oktober');

        const weekdayCells = datePicker.domElement.querySelectorAll('.datepicker-weekday-cell');
        expect(weekdayCells[0].textContent).toBe('So');
        expect(weekdayCells[1].textContent).toBe('Mo');

        // Test BC date formatting
        const bcDate = new Date(Date.UTC(-44, 2, 15)); // 45 BC
        datePicker.setDate(bcDate);
        const display = datePicker.domElement.querySelector('.custom-datepicker-display');
        expect(display?.textContent).toContain('v. Chr.');

        // Switch to Bosnian
        i18n.setLanguage('bs');
        expect(display?.textContent).toContain('p.n.e.');
        const updatedWeekdayCells = datePicker.domElement.querySelectorAll('.datepicker-weekday-cell');
        expect(updatedWeekdayCells[0].textContent).toBe('Ned');

        // Switch back to English
        i18n.setLanguage('en');
        expect(display?.textContent).toContain('BC');
    });
});
