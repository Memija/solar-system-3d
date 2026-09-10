import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '../Modal';
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
});
