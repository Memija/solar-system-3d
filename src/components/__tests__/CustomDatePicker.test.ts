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

    it('toggles popup on display click and syncs is-open / aria-expanded state', () => {
        const display = datePicker.domElement.querySelector('.custom-datepicker-display') as HTMLElement;
        expect(display.getAttribute('aria-expanded')).toBe('false');
        expect(datePicker.domElement.classList.contains('is-open')).toBe(false);

        display.click();
        expect(datePicker.isOpen).toBe(true);
        expect(datePicker.domElement.classList.contains('is-open')).toBe(true);
        expect(display.getAttribute('aria-expanded')).toBe('true');
        expect(mockOnOpen).toHaveBeenCalled();

        // Clicking outside closes the popup
        document.body.click();
        expect(datePicker.isOpen).toBe(false);
        expect(datePicker.domElement.classList.contains('is-open')).toBe(false);
        expect(display.getAttribute('aria-expanded')).toBe('false');
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

    it('keeps hero ephemeris readout locked to active simulation date when browsing shorter months', () => {
        datePicker.setDate(new Date(Date.UTC(2026, 0, 31, 12, 0, 0))); // Jan 31, 2026
        datePicker.openPopup();

        const heroDate = datePicker.domElement.querySelector('.hero-date-readout') as HTMLElement;
        const returnBtn = datePicker.domElement.querySelector('.hero-return-btn') as HTMLButtonElement;
        const nextMonthBtn = datePicker.domElement.querySelector('.next-month') as HTMLButtonElement;

        expect(heroDate.textContent).toBe('31 JANUARY 2026');
        expect(returnBtn.style.display).toBe('none');

        // Browse to February: hero banner must still show active date (not invalid "31 FEBRUARY 2026")
        nextMonthBtn.click();
        expect(heroDate.textContent).toBe('31 JANUARY 2026');
        expect(returnBtn.style.display).toBe('inline-flex');

        // Return button snaps view back to active month
        returnBtn.click();
        const monthSelect = datePicker.domElement.querySelector('.custom-datepicker-select') as HTMLSelectElement;
        expect(monthSelect.value).toBe('0');
        expect(returnBtn.style.display).toBe('none');
    });

    it('renders monochrome SVG chevrons and activates historical mission bento cards cleanly', () => {
        datePicker.openPopup();

        expect(datePicker.domElement.querySelector('svg[data-icon="chevron-left"]')).not.toBeNull();
        expect(datePicker.domElement.querySelector('svg[data-icon="chevrons-left"]')).not.toBeNull();
        expect(datePicker.domElement.querySelector('svg[data-icon="chevron-down"]')).not.toBeNull();

        const apolloChip = datePicker.domElement.querySelector('.milestone-chip[data-mission-id="apollo11"]') as HTMLButtonElement;
        expect(apolloChip).not.toBeNull();
        apolloChip.click();

        expect(mockOnChange).toHaveBeenCalled();
        expect(datePicker.currentDate.getUTCFullYear()).toBe(1969);
        expect(datePicker.currentDate.getUTCMonth()).toBe(6);
        expect(datePicker.currentDate.getUTCDate()).toBe(20);

        datePicker.openPopup();
        expect(apolloChip.classList.contains('active')).toBe(true);
    });

    it('supports portalContainer option without premature click-outside dismissal and cleans up on dispose', () => {
        const portalHost = document.createElement('div');
        document.body.appendChild(portalHost);

        const portaledPicker = new CustomDatePicker(initialDate, mockOnChange, mockOnOpen, {
            portalContainer: portalHost,
            displayId: 'portaledDateTrigger',
            ariaLabel: 'Portaled Simulation Date'
        });
        document.body.appendChild(portaledPicker.domElement);

        expect(portaledPicker.displayElement.id).toBe('portaledDateTrigger');
        expect(portaledPicker.displayElement.getAttribute('aria-label')).toBe('Portaled Simulation Date');
        expect(portaledPicker.popupElement.parentElement).toBe(portalHost);
        expect(portaledPicker.popupElement.classList.contains('is-portaled')).toBe(true);

        portaledPicker.openPopup();
        expect(portaledPicker.isOpen).toBe(true);

        // Clicking inside portaled popup (outside domElement) must NOT close the popup
        const hudBar = portaledPicker.popupElement.querySelector('.datepicker-hud-bar') as HTMLElement;
        hudBar.click();
        expect(portaledPicker.isOpen).toBe(true);

        // Clicking outside both domElement and popupElement closes the popup
        document.body.click();
        expect(portaledPicker.isOpen).toBe(false);

        portaledPicker.dispose();
        expect(portalHost.querySelector('.custom-datepicker-popup')).toBeNull();
    });
});
