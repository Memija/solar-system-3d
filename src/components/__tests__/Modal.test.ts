import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '../Modal';
import { SpacecraftDataList } from '../SolarSystemData';
import { EventBus } from '../EventBus';
import { i18n } from '../../i18n';

describe('Modal Localization & Audio Guide', () => {
    let container: HTMLElement;
    let modal: Modal;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        i18n.setLanguage('en');
        modal = new Modal(container);
    });

    afterEach(() => {
        modal.dispose();
        if (container.parentElement) {
            container.parentElement.removeChild(container);
        }
        i18n.setLanguage('en');
    });

    it('initializes audio guide button and close button with localized labels and tooltips', () => {
        const audioBtn = modal.modalElement.querySelector('.modal-audio-guide-btn') as HTMLButtonElement;
        const closeBtn = modal.modalElement.querySelector('.modal-close-btn') as HTMLButtonElement;

        expect(audioBtn).not.toBeNull();
        expect(closeBtn).not.toBeNull();

        expect(audioBtn.title).toBe('Audio Guide Narration');
        expect(audioBtn.getAttribute('aria-label')).toBe('Listen to celestial audio guide');
        expect(audioBtn.textContent).toContain('Listen');

        expect(closeBtn.getAttribute('aria-label')).toBe('Close');
    });

    it('updates audio guide button and close button when language changes', () => {
        const audioBtn = modal.modalElement.querySelector('.modal-audio-guide-btn') as HTMLButtonElement;
        const closeBtn = modal.modalElement.querySelector('.modal-close-btn') as HTMLButtonElement;

        // Switch to Bosnian
        i18n.setLanguage('bs');
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideTitle'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuideAria'));
        expect(audioBtn.textContent).toContain(i18n.t('modal.audioGuide'));
        expect(closeBtn.getAttribute('aria-label')).toBe(i18n.t('ui.close'));

        // Switch to German
        i18n.setLanguage('de');
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideTitle'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuideAria'));
        expect(audioBtn.textContent).toContain(i18n.t('modal.audioGuide'));
        expect(closeBtn.getAttribute('aria-label')).toBe(i18n.t('ui.close'));

        // Switch to Indonesian
        i18n.setLanguage('id');
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideTitle'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuideAria'));
        expect(audioBtn.textContent).toContain(i18n.t('modal.audioGuide'));
        expect(closeBtn.getAttribute('aria-label')).toBe(i18n.t('ui.close'));

        // Switch to Polish
        i18n.setLanguage('pl');
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideTitle'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuideAria'));
        expect(audioBtn.textContent).toContain(i18n.t('modal.audioGuide'));
        expect(closeBtn.getAttribute('aria-label')).toBe(i18n.t('ui.close'));

        // Switch to Serbian
        i18n.setLanguage('sr');
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideTitle'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuideAria'));
        expect(audioBtn.textContent).toContain(i18n.t('modal.audioGuide'));
        expect(closeBtn.getAttribute('aria-label')).toBe(i18n.t('ui.close'));
    });

    it('updates audio guide button attributes while speaking and stopped', () => {
        const audioBtn = modal.modalElement.querySelector('.modal-audio-guide-btn') as HTMLButtonElement;

        // Spy on audioNarrator.toggle
        vi.spyOn(modal.audioNarrator, 'toggle').mockReturnValue(true);
        vi.spyOn(modal.audioNarrator, 'isSpeaking').mockReturnValue(true);

        modal.show({
            name: 'Mars',
            description: 'The red planet'
        });

        audioBtn.click();

        expect(audioBtn.classList.contains('speaking')).toBe(true);
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideStop'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuidePlayingAria'));
        expect(audioBtn.textContent).toContain(i18n.t('modal.audioPlaying'));

        // When switching language while speaking
        i18n.setLanguage('de');
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideStop'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuidePlayingAria'));

        // Stop speaking
        vi.spyOn(modal.audioNarrator, 'toggle').mockReturnValue(false);
        vi.spyOn(modal.audioNarrator, 'isSpeaking').mockReturnValue(false);
        audioBtn.click();

        expect(audioBtn.classList.contains('speaking')).toBe(false);
        expect(audioBtn.title).toBe(i18n.t('modal.audioGuideTitle'));
        expect(audioBtn.getAttribute('aria-label')).toBe(i18n.t('modal.audioGuideAria'));
    });

    it('narrates with localized text and correct target body name when audio guide is triggered', () => {
        const audioBtn = modal.modalElement.querySelector('.modal-audio-guide-btn') as HTMLButtonElement;
        const speakSpy = vi.spyOn(modal.audioNarrator, 'speak').mockReturnValue(true);

        // Show spacecraft with alias name
        i18n.setLanguage('bs');
        modal.show({
            name: 'ISS (International Space Station)',
            targetBody: 'Earth',
            description: 'Modular research facility'
        });

        audioBtn.click();

        expect(speakSpy).toHaveBeenCalled();
        const calledText = speakSpy.mock.calls[0][0];
        const calledLang = speakSpy.mock.calls[0][1];

        expect(calledLang).toBe('bs');
        expect(calledText).toContain('Međunarodna svemirska stanica');
    });

    it('does not render modal-header-badge when modal is shown', () => {
        modal.show({
            name: 'Mars',
            description: 'The red planet'
        });
        const badge = modal.modalElement.querySelector('.modal-header-badge');
        expect(badge).toBeNull();
    });

    it('aligns object name with Listen and Close buttons inside modal-header', () => {
        modal.show({
            name: 'Mars',
            description: 'The red planet'
        });

        const header = modal.modalElement.querySelector('.modal-header');
        expect(header).not.toBeNull();

        const title = header?.querySelector('h2');
        expect(title).not.toBeNull();
        expect(title?.textContent).toBe('Mars');

        const actions = header?.querySelector('.modal-header-actions');
        expect(actions).not.toBeNull();

        const audioBtn = actions?.querySelector('.modal-audio-guide-btn');
        const closeBtn = actions?.querySelector('.modal-close-btn');

        expect(audioBtn).not.toBeNull();
        expect(closeBtn).not.toBeNull();
        expect(actions?.children.length).toBe(2);
    });

    it('renders radius in kilometers and relative Earth comparison in telemetry chips', () => {
        modal.show({
            name: 'Kepler-452b',
            radius: 2,
            displayRadius: 1.0,
            distance: 130,
            period: 1,
            description: 'Earth cousin'
        });

        const statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        const radiusChip = statChips.find(chip => chip.querySelector('.stat-label')?.textContent === 'Radius');

        expect(radiusChip).toBeDefined();
        const valueElem = radiusChip?.querySelector('.stat-value');
        const subValueElem = radiusChip?.querySelector('.stat-subvalue');
        const infoBtn = radiusChip?.querySelector('.info-btn');

        expect(valueElem?.textContent).toBe('6,371 km');
        expect(subValueElem?.textContent).toBe('1.0 × Earth');
        expect(infoBtn?.getAttribute('data-text')).toContain('Earth = 6,371 km');

        // Test that tooltip title and text are rendered in separate structured elements
        (infoBtn as HTMLElement).click();
        const tooltipTitle = modal.tooltipElement.querySelector('.modal-tooltip-title');
        const tooltipText = modal.tooltipElement.querySelector('.modal-tooltip-text');
        expect(tooltipTitle?.textContent).toBe('Radius');
        expect(tooltipText?.textContent).toContain('Earth = 6,371 km');
    });

    it('renders localized Earth comparison for planets properly', () => {
        // Test Jupiter
        modal.show({
            name: 'Jupiter',
            radius: 11.2,
            displayRadius: 10.97,
            distance: 300,
            period: 11.86,
            description: 'Gas giant'
        });

        let statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        let radiusChip = statChips.find(chip => chip.querySelector('.stat-label')?.textContent === 'Radius');
        expect(radiusChip?.querySelector('.stat-value')?.textContent).toBe('69,890 km');
        expect(radiusChip?.querySelector('.stat-subvalue')?.textContent).toBe('10.97 × Earth');

        // Switch to German and show Kepler-452b
        i18n.setLanguage('de');
        modal.show({
            name: 'Kepler-452b',
            radius: 2,
            displayRadius: 1.0,
            distance: 130,
            period: 1,
            description: 'Erd-Cousin'
        });

        statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        radiusChip = statChips.find(chip => chip.querySelector('.stat-label')?.textContent === i18n.t('modal.labels.radius'));
        expect(radiusChip?.querySelector('.stat-value')?.textContent).toBe('6.371 km');
        expect(radiusChip?.querySelector('.stat-subvalue')?.textContent).toBe('1,0 × Erde');

        // Switch to Bosnian and show Jupiter
        i18n.setLanguage('bs');
        modal.show({
            name: 'Jupiter',
            radius: 11.2,
            displayRadius: 10.97,
            distance: 300,
            period: 11.86,
            description: 'Plinski div'
        });

        statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        radiusChip = statChips.find(chip => chip.querySelector('.stat-label')?.textContent === i18n.t('modal.labels.radius'));
        expect(radiusChip?.querySelector('.stat-subvalue')?.textContent).toBe('10,97 × Zemlja');
    });

    it('does not render the Radius field for Earth', () => {
        modal.show({
            name: 'Earth',
            radius: 2,
            displayRadius: 1.0,
            distance: 130,
            period: 1,
            axialTilt: 23.44,
            description: 'Our home planet'
        });

        const statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        const labels = statChips.map(chip => chip.querySelector('.stat-label')?.textContent);

        expect(labels).not.toContain('Radius');
        expect(labels).toContain('Distance');
        expect(labels).toContain('Period');
        expect(labels).toContain('Axial Tilt');
        expect(statChips.length).toBe(3);
    });

    it('does not render distance and period chips for the Sun', () => {
        modal.show({
            name: 'Sun',
            radius: 25,
            displayRadius: 109.2,
            distance: 0,
            distanceAU: 0,
            period: 0,
            axialTilt: 7.25,
            description: 'The star at the center of the Solar System'
        });

        const statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        const labels = statChips.map(chip => chip.querySelector('.stat-label')?.textContent);

        expect(labels).toContain('Radius');
        expect(labels).toContain('Axial Tilt');
        expect(labels).not.toContain('Distance');
        expect(labels).not.toContain('Period');
        expect(statChips.length).toBe(2);
    });

    it('renders comet radius in kilometers without Earth comparison or subvalue', () => {
        i18n.setLanguage('en');
        modal.show({
            name: "Halley's Comet",
            radius: 0.1,
            displayRadius: 0.00086,
            semiMajorAxis: 180,
            eccentricity: 0.967,
            period: 75.3,
            inclination: 162.2,
            argumentOfPeriapsis: 111.3,
            color: 0xffffff,
            description: 'Famous short-period comet'
        });

        const statChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        const radiusChip = statChips.find(chip => chip.querySelector('.stat-label')?.textContent === 'Radius');

        expect(radiusChip).toBeDefined();
        expect(radiusChip?.querySelector('.stat-value')?.textContent).toBe('5.5 km');
        expect(radiusChip?.querySelector('.stat-subvalue')).toBeNull();

        const infoBtn = radiusChip?.querySelector('.info-btn');
        expect(infoBtn?.getAttribute('data-text')).toBe(i18n.t('modal.tooltips.cometRadius'));
        expect(infoBtn?.getAttribute('data-text')).not.toContain('Earth = 6,371 km');

        // Verify Hale-Bopp formatting
        modal.show({
            name: 'Hale-Bopp',
            radius: 0.3,
            displayRadius: 0.0047,
            semiMajorAxis: 300,
            eccentricity: 0.995,
            period: 2500,
            inclination: 89.4,
            argumentOfPeriapsis: 130.6,
            color: 0xccffff,
            description: 'Bright comet'
        });

        const hbChips = Array.from(modal.modalElement.querySelectorAll('.stat-chip'));
        const hbRadiusChip = hbChips.find(chip => chip.querySelector('.stat-label')?.textContent === 'Radius');
        expect(hbRadiusChip?.querySelector('.stat-value')?.textContent).toBe('29.9 km');
        expect(hbRadiusChip?.querySelector('.stat-subvalue')).toBeNull();
        expect(hbRadiusChip?.querySelector('.info-btn')?.getAttribute('data-text')).toBe(i18n.t('modal.tooltips.cometRadius'));
    });

    it('localizes True Scale modal title and description and dynamically updates on language changes', () => {
        i18n.setLanguage('en');
        modal.show({
            titleKey: 'popups.trueScaleTitle',
            descKey: 'popups.trueScaleDesc',
            name: i18n.t('popups.trueScaleTitle'),
            description: i18n.t('popups.trueScaleDesc')
        });

        expect(modal.isShowingPopup('popups.trueScaleTitle')).toBe(true);
        expect(modal.titleElement?.textContent).toBe('True Scale of the Solar System');
        expect(modal.contentElement.querySelector('.description')?.textContent).toBe(i18n.t('popups.trueScaleDesc'));

        // Switch to German
        i18n.setLanguage('de');
        expect(modal.titleElement?.textContent).toBe('Echter Maßstab des Sonnensystems');
        expect(modal.contentElement.querySelector('.description')?.textContent).toBe(i18n.t('popups.trueScaleDesc'));

        // Switch to Bosnian
        i18n.setLanguage('bs');
        expect(modal.titleElement?.textContent).toBe('Prave razmjere Sunčevog sistema');
        expect(modal.contentElement.querySelector('.description')?.textContent).toBe(i18n.t('popups.trueScaleDesc'));

        // Switch to Serbian
        i18n.setLanguage('sr');
        expect(modal.titleElement?.textContent).toBe('Праве размере Сунчевог система');
        expect(modal.contentElement.querySelector('.description')?.textContent).toBe(i18n.t('popups.trueScaleDesc'));

        // Switch to Polish
        i18n.setLanguage('pl');
        expect(modal.titleElement?.textContent).toBe('Rzeczywista skala Układu Słonecznego');
        expect(modal.contentElement.querySelector('.description')?.textContent).toBe(i18n.t('popups.trueScaleDesc'));

        // Switch to Indonesian
        i18n.setLanguage('id');
        expect(modal.titleElement?.textContent).toBe('Skala Sebenarnya Tata Surya');
        expect(modal.contentElement.querySelector('.description')?.textContent).toBe(i18n.t('popups.trueScaleDesc'));
    });

    it('automatically resolves True Scale popup when shown by name and narrates in the new language', () => {
        i18n.setLanguage('en');
        // Show by name without explicit titleKey
        modal.show({
            name: 'True Scale of the Solar System',
            description: 'English description fallback'
        });

        expect(modal.isShowingPopup('popups.trueScaleTitle')).toBe(true);
        expect(modal.titleElement?.textContent).toBe('True Scale of the Solar System');

        // Switch to Bosnian
        i18n.setLanguage('bs');
        expect(modal.titleElement?.textContent).toBe('Prave razmjere Sunčevog sistema');

        const audioBtn = modal.modalElement.querySelector('.modal-audio-guide-btn') as HTMLButtonElement;
        const speakSpy = vi.spyOn(modal.audioNarrator, 'speak').mockReturnValue(true);

        audioBtn.click();
        expect(speakSpy).toHaveBeenCalled();
        const calledText = speakSpy.mock.calls[0][0];
        const calledLang = speakSpy.mock.calls[0][1];

        expect(calledLang).toBe('bs');
        expect(calledText).toContain('Prave razmjere Sunčevog sistema');
    });

    it('omits or hides the audio guide button when enableAudioGuide is false or hideAudioGuide is set', () => {
        const noAudioModal = new Modal(container, { enableAudioGuide: false });
        expect(noAudioModal.modalElement.querySelector('.modal-audio-guide-btn')).toBeNull();
        noAudioModal.dispose();

        // Standard modal hides Listen button when hideAudioGuide is passed to show()
        modal.show({
            name: 'Header Quick Access',
            description: '<div>Slots</div>',
            hideAudioGuide: true
        });
        const audioBtn = modal.modalElement.querySelector('.modal-audio-guide-btn') as HTMLButtonElement;
        expect(audioBtn.hidden).toBe(true);
        expect(audioBtn.style.display).toBe('none');

        // Showing normal data restores the Listen button
        modal.show({
            name: 'Earth',
            description: 'Our home planet'
        });
        expect(audioBtn.hidden).toBe(false);
        expect(audioBtn.style.display).toBe('');
    });

    it('supports onAfterShow, autoReRenderOnLanguageChange: false, onHide, and unique content element IDs', () => {
        const onHideSpy = vi.fn();
        const secondaryModal = new Modal(container, {
            enableAudioGuide: false,
            autoReRenderOnLanguageChange: false,
            onHide: onHideSpy
        });

        // Primary modal keeps #modal-content; secondary modal gets a distinct ID and .modal-content class
        expect(modal.contentElement.id).toBe('modal-content');
        expect(modal.contentElement.classList.contains('modal-content')).toBe(true);
        expect(secondaryModal.contentElement.id).not.toBe('modal-content');
        expect(secondaryModal.contentElement.classList.contains('modal-content')).toBe(true);

        // Calling hide() while already closed does not invoke onHide
        secondaryModal.hide();
        expect(onHideSpy).not.toHaveBeenCalled();

        let clickCount = 0;
        const onAfterShowSpy = vi.fn((m: Modal) => {
            const btn = m.contentElement.querySelector<HTMLButtonElement>('#interactiveTestBtn');
            if (btn) {
                btn.onclick = () => {
                    clickCount++;
                };
            }
        });

        secondaryModal.show({
            name: 'Header Quick Access',
            description: '<button type="button" id="interactiveTestBtn">Toggle</button>',
            hideAudioGuide: true,
            onAfterShow: onAfterShowSpy
        });

        expect(onAfterShowSpy).toHaveBeenCalledTimes(1);
        const btnBefore = secondaryModal.contentElement.querySelector<HTMLButtonElement>('#interactiveTestBtn')!;
        btnBefore.click();
        expect(clickCount).toBe(1);

        // Switching language with autoReRenderOnLanguageChange: false updates close button without wiping custom DOM handlers
        i18n.setLanguage('de');
        const closeBtn = secondaryModal.modalElement.querySelector('.modal-close-btn') as HTMLButtonElement;
        expect(closeBtn.getAttribute('aria-label')).toBe(i18n.t('ui.close'));
        const btnAfter = secondaryModal.contentElement.querySelector<HTMLButtonElement>('#interactiveTestBtn')!;
        expect(btnAfter).toBe(btnBefore);
        btnAfter.click();
        expect(clickCount).toBe(2);

        // Closing via close button invokes onHide once
        closeBtn.click();
        expect(secondaryModal.isOpen).toBe(false);
        expect(onHideSpy).toHaveBeenCalledTimes(1);

        secondaryModal.dispose();
    });

    it('shows Jump to Launch Date button for all spacecraft only when viewing a different date and syncs dynamically', () => {
        let activeSimDate = new Date('2026-11-16T12:00:00Z');
        const dateAwareModal = new Modal(container, {
            getSimDate: () => activeSimDate
        });

        // 1. On a different date (2026-11-16), ALL 8 spacecraft display the Jump to Launch Date button
        for (const sc of SpacecraftDataList) {
            expect(sc.launchDate).toBeTruthy();
            dateAwareModal.show(sc);
            const btn = dateAwareModal.contentElement.querySelector<HTMLButtonElement>('.jump-to-date-btn');
            expect(btn, `Expected launch date button for ${sc.name} on 2026-11-16`).not.toBeNull();
            expect(btn!.getAttribute('data-date')).toBe(sc.launchDate);
            expect(btn!.textContent).toBe(`Jump to Launch Date (${sc.launchDate!.slice(0, 10)})`);
        }

        // 2. When already viewing a spacecraft's launch date (even at a different second/hour that same UTC day), button is omitted
        for (const sc of SpacecraftDataList) {
            const launchMs = new Date(sc.launchDate!).getTime();
            activeSimDate = new Date(launchMs + 1000); // e.g. Historical Space Mission milestone (+1s)
            dateAwareModal.show(sc);
            const btn = dateAwareModal.contentElement.querySelector('.jump-to-date-btn');
            expect(btn, `Expected NO launch date button for ${sc.name} when already on ${sc.launchDate}`).toBeNull();
        }

        // 2b. Apollo 11 also omits the button when viewing its 1969-07-20 Moon Landing milestone (and active 1969-07-16..24 mission window),
        // while restoring it outside the mission window (e.g. 1969-08-01 or 2026-11-16)
        const apollo11 = SpacecraftDataList.find(s => s.name === 'Apollo 11')!;
        activeSimDate = new Date('1969-07-20T12:00:00Z'); // Date Picker Apollo 11 milestone chip
        dateAwareModal.show(apollo11);
        expect(dateAwareModal.contentElement.querySelector('.jump-to-date-btn')).toBeNull();

        activeSimDate = new Date('1969-07-24T12:00:00Z'); // Splashdown day
        dateAwareModal.syncSimDate(activeSimDate);
        expect(dateAwareModal.contentElement.querySelector('.jump-to-date-btn')).toBeNull();

        activeSimDate = new Date('1969-08-01T12:00:00Z'); // After Apollo 11 mission ended
        dateAwareModal.syncSimDate(activeSimDate);
        expect(dateAwareModal.contentElement.querySelector('.jump-to-date-btn')).not.toBeNull();

        // 3. Dynamic syncSimDate toggles the button in-place as simulation date moves off and back onto launch date
        const voyager1 = SpacecraftDataList.find(s => s.name === 'Voyager 1')!;
        activeSimDate = new Date('1977-09-05T12:56:01Z');
        dateAwareModal.show(voyager1);
        expect(dateAwareModal.contentElement.querySelector('.jump-to-date-btn')).toBeNull();

        activeSimDate = new Date('2026-11-16T12:00:00Z');
        dateAwareModal.syncSimDate(activeSimDate);
        const dynamicBtn = dateAwareModal.contentElement.querySelector<HTMLButtonElement>('.jump-to-date-btn');
        expect(dynamicBtn).not.toBeNull();
        expect(dynamicBtn!.textContent).toBe('Jump to Launch Date (1977-09-05)');

        const linksSection = dateAwareModal.contentElement.querySelector('.modal-links-section');
        expect(dynamicBtn!.nextElementSibling).toBe(linksSection);

        const jumpEvents: string[] = [];
        const unsub = EventBus.on('jump-to-date', (dateStr) => jumpEvents.push(dateStr));
        dynamicBtn!.click();
        unsub();
        expect(jumpEvents).toEqual([voyager1.launchDate!]);

        // Jumping back onto 1977-09-05 removes the button immediately
        activeSimDate = new Date(voyager1.launchDate!);
        dateAwareModal.syncSimDate(activeSimDate);
        expect(dateAwareModal.contentElement.querySelector('.jump-to-date-btn')).toBeNull();

        dateAwareModal.dispose();
    });
});

