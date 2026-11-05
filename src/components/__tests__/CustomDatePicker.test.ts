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

        expect(heroDate.textContent).toBe('31 January 2026');
        expect(returnBtn.style.display).toBe('none');

        // Browse to February: hero banner must still show active date (not invalid "31 FEBRUARY 2026")
        nextMonthBtn.click();
        expect(heroDate.textContent).toBe('31 January 2026');
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

    it('localizes all date picker controls, step units, tooltips, milestone chips, and year matrix across all 6 languages', async () => {
        datePicker.dispose();
        const { i18n, AVAILABLE_LOCALES } = await import('../../i18n');
        await Promise.all(AVAILABLE_LOCALES.map(l => i18n.preloadLocale(l.code)));

        const picker = new CustomDatePicker(
            new Date(Date.UTC(2026, 0, 15, 12, 0, 0)), // Jan 15, 2026 (has trailing prev/next month slots)
            mockOnChange,
            mockOnOpen,
            { ariaLabelKey: 'datepicker.selectSimDateAria' }
        );
        document.body.appendChild(picker.domElement);
        picker.openPopup();

        const scrubBtns = picker.popupElement.querySelectorAll<HTMLButtonElement>('.scrub-step-btn');
        const hubbleLabel = picker.popupElement.querySelector('.milestone-chip[data-mission-id="hubble"] .chip-label') as HTMLElement;
        const issLabel = picker.popupElement.querySelector('.milestone-chip[data-mission-id="iss"] .chip-label') as HTMLElement;
        const jwstLabel = picker.popupElement.querySelector('.milestone-chip[data-mission-id="jwst"] .chip-label') as HTMLElement;
        const jdReadout = picker.popupElement.querySelector('.hero-jd-readout') as HTMLElement;
        const prevMonthBtn = picker.popupElement.querySelector('.prev-month') as HTMLButtonElement;
        const nextDecadeBtn = picker.popupElement.querySelector('.next-decade') as HTMLButtonElement;
        const closeBtn = picker.popupElement.querySelector('.datepicker-close-x-btn') as HTMLButtonElement;

        // Bosnian
        i18n.setLanguage('bs');
        expect(picker.displayElement.getAttribute('aria-label')).toBe('Odaberite datum simulacije');
        expect(scrubBtns[0].textContent).toBe('-100g');
        expect(scrubBtns[3].textContent).toBe('-1d');
        expect(scrubBtns[0].title).toBe('Pomjeri efemeride -100 godina');
        expect(prevMonthBtn.getAttribute('aria-label')).toBe('Prethodni mjesec');
        expect(prevMonthBtn.title).toBe('Prethodni mjesec (-1mj)');
        expect(nextDecadeBtn.title).toBe('Sljedećih 10 godina (+10g)');
        expect(closeBtn.getAttribute('aria-label')).toBe('Zatvori kalendar');
        expect(hubbleLabel.textContent).toBe('Hubble');
        expect(jwstLabel.textContent).toBe('James Webb');

        // German
        i18n.setLanguage('de');
        expect(picker.displayElement.getAttribute('aria-label')).toBe('Simulationsdatum auswählen');
        expect(scrubBtns[0].textContent).toBe('-100J');
        expect(scrubBtns[3].textContent).toBe('-1T');
        expect(scrubBtns[4].textContent).toBe('+1T');
        expect(scrubBtns[7].textContent).toBe('+100J');
        expect(prevMonthBtn.title).toBe('Vorheriger Monat (-1M)');
        expect(jdReadout.textContent).toContain(',');
        expect(jdReadout.textContent?.endsWith('T')).toBe(true);
        const trailingSlotsDe = picker.popupElement.querySelectorAll<HTMLElement>('.datepicker-day-slot.trailing');
        expect(trailingSlotsDe[0].title).toContain('Vorheriger Monat:');

        // Indonesian
        i18n.setLanguage('id');
        expect(picker.displayElement.getAttribute('aria-label')).toBe('Pilih Tanggal Simulasi');
        expect(scrubBtns[0].textContent).toBe('-100th');
        expect(scrubBtns[3].textContent).toBe('-1hr');
        expect(prevMonthBtn.title).toBe('Bulan Sebelumnya (-1bl)');
        expect(hubbleLabel.textContent).toBe('Hubble');

        // Polish
        i18n.setLanguage('pl');
        expect(picker.displayElement.getAttribute('aria-label')).toBe('Wybierz datę symulacji');
        expect(scrubBtns[0].textContent).toBe('-100r');
        expect(scrubBtns[3].textContent).toBe('-1d');
        expect(scrubBtns[2].title).toBe('Przesuń efemerydy o -1 rok');

        // Serbian (Cyrillic)
        i18n.setLanguage('sr');
        expect(picker.displayElement.getAttribute('aria-label')).toBe('Изаберите датум симулације');
        expect(scrubBtns[0].textContent).toBe('-100г');
        expect(scrubBtns[3].textContent).toBe('-1д');
        expect(jdReadout.textContent?.startsWith('ЈД ')).toBe(true);
        expect(jdReadout.textContent?.endsWith('д')).toBe(true);
        expect(hubbleLabel.textContent).toBe('Хабл');
        expect(issLabel.textContent).toBe('МСС');
        expect(jwstLabel.textContent).toBe('Џејмс Веб');

        // Open Year Matrix Modal and verify localized century cells + BC year handling
        const yearInput = picker.popupElement.querySelector('.custom-datepicker-input') as HTMLInputElement;
        yearInput.click();
        const yearModal = document.body.querySelector('.custom-datepicker-year-modal') as HTMLElement;
        expect(yearModal.getAttribute('aria-label')).toBe('Избор године епохе');
        let cells = Array.from(yearModal.querySelectorAll('.datepicker-modal-cell')).map(c => c.textContent);
        expect(cells).toContain('2000-те');

        i18n.setLanguage('pl');
        cells = Array.from(yearModal.querySelectorAll('.datepicker-modal-cell')).map(c => c.textContent);
        expect(cells).toContain('2000–99');

        i18n.setLanguage('de');
        cells = Array.from(yearModal.querySelectorAll('.datepicker-modal-cell')).map(c => c.textContent);
        expect(cells).toContain('2000er');

        // Navigate back to 0..999 range so cellYear <= 0 is tested (no broken "v. Chr.s" suffix)
        const modalPrevBtn = yearModal.querySelector('.custom-datepicker-nav-btn') as HTMLButtonElement;
        modalPrevBtn.click(); // 1000..1999
        modalPrevBtn.click(); // 0..999 (first out-of-range cell is -100 => 101 v. Chr., second is 0 => 1 v. Chr.)
        cells = Array.from(yearModal.querySelectorAll('.datepicker-modal-cell')).map(c => c.textContent);
        expect(cells).toContain('101 v. Chr.');
        expect(cells).toContain('1 v. Chr.');

        i18n.setLanguage('en');
        picker.dispose();
    });

    it('renders Ephemeris tag and JD/J2000 readout (without redundant info icons) and displays detailed localized explanations across all 6 languages', async () => {
        const { i18n, AVAILABLE_LOCALES } = await import('../../i18n');
        await Promise.all(AVAILABLE_LOCALES.map(l => i18n.preloadLocale(l.code)));

        datePicker.openPopup();

        const epochWrap = datePicker.popupElement.querySelector('.datepicker-epoch-wrap') as HTMLElement;
        const epochTag = datePicker.popupElement.querySelector('.datepicker-epoch-tag') as HTMLElement;
        const infoBtn = datePicker.popupElement.querySelector('.datepicker-ephemeris-info-btn');
        const jdInfoBtn = datePicker.popupElement.querySelector('.datepicker-jd-info-btn');
        const jdReadout = datePicker.popupElement.querySelector('.hero-jd-readout') as HTMLElement;

        expect(epochWrap).not.toBeNull();
        expect(epochTag).not.toBeNull();
        expect(jdReadout).not.toBeNull();
        expect(infoBtn).toBeNull();
        expect(jdInfoBtn).toBeNull();
        expect(epochTag.dataset.optionId).toBe('ephemeris');
        expect(jdReadout.dataset.optionId).toBe('ephemeris');

        // Hover / click on the Ephemeris tag shows the ephemeris & JD/J2000 explanation tooltip without closing the calendar popup
        epochTag.dispatchEvent(new MouseEvent('mouseenter'));
        expect(datePicker.isOpen).toBe(true);

        const tooltip = document.body.querySelector('.datepicker-ephemeris-tooltip') as HTMLElement;
        expect(tooltip).not.toBeNull();
        expect(tooltip.classList.contains('visible')).toBe(true);
        expect(tooltip.textContent).toContain('reference table of calculated celestial coordinates');
        expect(tooltip.textContent).toContain('Julian Date (JD)');
        expect(tooltip.textContent).toContain('4713 BC');
        expect(tooltip.textContent).toContain('J2000.0 Epoch Offset');
        expect(tooltip.textContent).toContain('2451545.0');

        // Verify localization across all 6 languages while tooltip is open
        i18n.setLanguage('bs');
        expect(tooltip.textContent).toContain('Referentna tabela izračunatih nebeskih koordinata');
        expect(tooltip.textContent).toContain('Julijanski datum (JD)');
        expect(tooltip.textContent).toContain('Pomak od epohe J2000.0');

        i18n.setLanguage('sr');
        expect(tooltip.textContent).toContain('Референтна табела израчунатих небеских координата');
        expect(tooltip.textContent).toContain('Јулијански датум (ЈД)');
        expect(tooltip.textContent).toContain('Помак од епохе J2000.0');

        i18n.setLanguage('de');
        expect(tooltip.textContent).toContain('Referenzkarte berechneter Himmelskoordinaten');
        expect(tooltip.textContent).toContain('Julianisches Datum (JD)');
        expect(tooltip.textContent).toContain('J2000.0-Epochenabstand');

        i18n.setLanguage('id');
        expect(tooltip.textContent).toContain('Tabel referensi koordinat benda langit');
        expect(tooltip.textContent).toContain('Tanggal Julian (JD)');
        expect(tooltip.textContent).toContain('Selisih Epos J2000.0');

        i18n.setLanguage('pl');
        expect(tooltip.textContent).toContain('Tabela referencyjna obliczonych współrzędnych niebieskich');
        expect(tooltip.textContent).toContain('Data Juliańska (JD)');
        expect(tooltip.textContent).toContain('Przesunięcie epoki J2000.0');

        // Mouseleave hides the tooltip, and hovering over the JD readout re-opens it
        epochTag.dispatchEvent(new MouseEvent('mouseleave'));
        expect(tooltip.classList.contains('visible')).toBe(false);

        jdReadout.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tooltip.classList.contains('visible')).toBe(true);

        i18n.setLanguage('en');
    });
});
