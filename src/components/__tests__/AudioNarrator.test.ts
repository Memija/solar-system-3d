import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioNarrator, cyrillicToLatin, hasCyrillic, adaptForPolishVoice } from '../AudioNarrator';

class MockSpeechSynthesisUtterance {
    text: string;
    lang: string = 'en';
    voice: any = null;
    rate: number = 1.0;
    pitch: number = 1.0;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(text: string) {
        this.text = text;
    }
}

class MockSpeechSynthesis {
    speaking: boolean = false;
    paused: boolean = false;
    onvoiceschanged: (() => void) | null = null;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();

    speak = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
        this.speaking = true;
        if (utterance.onstart) utterance.onstart();
    });

    cancel = vi.fn(() => {
        this.speaking = false;
    });

    getVoices = vi.fn(() => [
        { name: 'Alex', lang: 'en-US', default: true },
        { name: 'Anna', lang: 'de-DE', default: false },
        { name: 'Zofia', lang: 'pl-PL', default: false }
    ]);
}

describe('AudioNarrator Utilities', () => {
    it('detects Cyrillic text accurately', () => {
        expect(hasCyrillic('Земља је трећа планета.')).toBe(true);
        expect(hasCyrillic('Венера')).toBe(true);
        expect(hasCyrillic('Earth is the third planet.')).toBe(false);
        expect(hasCyrillic('12345 !?')).toBe(false);
    });

    it('transliterates Serbian Cyrillic to Gaj Latin accurately', () => {
        expect(cyrillicToLatin('Венера је друга планета од Сунца.'))
            .toBe('Venera je druga planeta od Sunca.');
        expect(cyrillicToLatin('Земља, Месец, Јупитер, Ђурђевдан, џин, њен, људски.'))
            .toBe('Zemlja, Mesec, Jupiter, Đurđevdan, džin, njen, ljudski.');
        expect(cyrillicToLatin('ЉУДСКИ'))
            .toBe('LJUDSKI');
        expect(cyrillicToLatin('ЊУЈОРК'))
            .toBe('NJUJORK');
        expect(cyrillicToLatin('ЏИНОВСКИ'))
            .toBe('DŽINOVSKI');
    });

    it('adapts South Slavic Latin digraphs for Polish phonetic engine', () => {
        expect(adaptForPolishVoice('Zemlja, život, čaša, šuma, đak, džin.'))
            .toBe('Zemlja, żivot, czasza, szuma, dźak, dżin.');
        expect(adaptForPolishVoice('DŽINOVSKI'))
            .toBe('DŻINOVSKI');
    });
});

describe('AudioNarrator', () => {
    let originalSpeechSynthesis: any;
    let originalUtterance: any;

    beforeEach(() => {
        originalSpeechSynthesis = (window as any).speechSynthesis;
        originalUtterance = (window as any).SpeechSynthesisUtterance;
        (window as any).speechSynthesis = new MockSpeechSynthesis();
        (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    });

    afterEach(() => {
        (window as any).speechSynthesis = originalSpeechSynthesis;
        (window as any).SpeechSynthesisUtterance = originalUtterance;
    });

    it('reports availability when speechSynthesis is present', () => {
        const narrator = new AudioNarrator();
        expect(narrator.isAvailable()).toBe(true);
        narrator.dispose();
    });

    it('cleans HTML tags and entities properly', () => {
        const narrator = new AudioNarrator();
        const dirty = '<div class="test">Hello <b>World</b>&nbsp;&amp;&times;!</div>';
        const clean = narrator.cleanText(dirty);
        expect(clean).toBe('Hello World &x!');
        narrator.dispose();
    });

    it('initiates speech and sets correct language code', () => {
        const narrator = new AudioNarrator();
        const spoken = narrator.speak('Earth is the third planet.', 'en');
        expect(spoken).toBe(true);
        expect(narrator.isSpeaking()).toBe(true);
        expect((window as any).speechSynthesis.speak).toHaveBeenCalled();
        narrator.dispose();
    });

    it('maps language locales to valid BCP 47 codes', () => {
        const narrator = new AudioNarrator();
        narrator.speak('Erde ist der dritte Planet.', 'de');
        expect((window as any).speechSynthesis.speak).toHaveBeenCalledWith(
            expect.objectContaining({ lang: 'de-DE' })
        );
        narrator.dispose();
    });

    it('transliterates Cyrillic text and chooses optimal fallback voice when no Serbian voice is installed', () => {
        const narrator = new AudioNarrator();
        narrator.speak('Венера је друга планета од Сунца.', 'sr');

        expect((window as any).speechSynthesis.speak).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Venera je druga planeta od Sunca.',
                // Since Mock has Zofia (pl-PL), it chooses Polish Slavic voice for optimal cadence
                lang: 'pl-PL',
                voice: expect.objectContaining({ name: 'Zofia', lang: 'pl-PL' })
            })
        );
        narrator.dispose();
    });

    it('uses native Serbian voice without transliterating if a Serbian voice is available', () => {
        const mockSynth = (window as any).speechSynthesis as MockSpeechSynthesis;
        mockSynth.getVoices = vi.fn(() => [
            { name: 'Alex', lang: 'en-US', default: true },
            { name: 'Filip', lang: 'sr-RS', default: false }
        ]);

        const narrator = new AudioNarrator();
        narrator.speak('Венера је друга планета од Сунца.', 'sr');

        expect(mockSynth.speak).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Венера је друга планета од Сунца.',
                lang: 'sr-RS',
                voice: expect.objectContaining({ name: 'Filip', lang: 'sr-RS' })
            })
        );
        narrator.dispose();
    });

    it('uses native Bosnian voice if a Bosnian voice is available', () => {
        const mockSynth = (window as any).speechSynthesis as MockSpeechSynthesis;
        mockSynth.getVoices = vi.fn(() => [
            { name: 'Alex', lang: 'en-US', default: true },
            { name: 'Jasmina', lang: 'bs-BA', default: false }
        ]);

        const narrator = new AudioNarrator();
        narrator.speak('Zemlja je treća planeta od Sunca.', 'bs');

        expect(mockSynth.speak).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Zemlja je treća planeta od Sunca.',
                lang: 'bs-BA',
                voice: expect.objectContaining({ name: 'Jasmina', lang: 'bs-BA' })
            })
        );
        narrator.dispose();
    });

    it('prioritizes Croatian voice for Bosnian speech if available', () => {
        const mockSynth = (window as any).speechSynthesis as MockSpeechSynthesis;
        mockSynth.getVoices = vi.fn(() => [
            { name: 'Alex', lang: 'en-US', default: true },
            { name: 'Tomislav', lang: 'hr-HR', default: false },
            { name: 'Zofia', lang: 'pl-PL', default: false }
        ]);

        const narrator = new AudioNarrator();
        narrator.speak('Zemlja je treća planeta od Sunca i na njoj postoji život.', 'bs');

        expect(mockSynth.speak).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Zemlja je treća planeta od Sunca i na njoj postoji život.',
                lang: 'hr-HR',
                voice: expect.objectContaining({ name: 'Tomislav', lang: 'hr-HR' })
            })
        );
        narrator.dispose();
    });

    it('uses Polish phonetic voice fallback with adapted diacritics for Bosnian when no native Balkan voice is available', () => {
        const narrator = new AudioNarrator();
        narrator.speak('Zemlja je treća planeta od Sunca i na njoj postoji život.', 'bs');

        expect((window as any).speechSynthesis.speak).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Zemlja je treća planeta od Sunca i na njoj postoji żivot.',
                lang: 'pl-PL',
                voice: expect.objectContaining({ name: 'Zofia', lang: 'pl-PL' })
            })
        );
        narrator.dispose();
    });

    it('prioritizes Croatian or Bosnian voices when available for Cyrillic transliteration', () => {
        const mockSynth = (window as any).speechSynthesis as MockSpeechSynthesis;
        mockSynth.getVoices = vi.fn(() => [
            { name: 'Alex', lang: 'en-US', default: true },
            { name: 'Tomislav', lang: 'hr-HR', default: false },
            { name: 'Zofia', lang: 'pl-PL', default: false }
        ]);

        const narrator = new AudioNarrator();
        narrator.speak('Земља је трећа планета од Сунца.', 'sr');

        expect(mockSynth.speak).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Zemlja je treća planeta od Sunca.',
                lang: 'hr-HR',
                voice: expect.objectContaining({ name: 'Tomislav', lang: 'hr-HR' })
            })
        );
        narrator.dispose();
    });

    it('cancels speech on stop() and notifies state callbacks', () => {
        const narrator = new AudioNarrator();
        const stateSpy = vi.fn();
        narrator.onStateChange(stateSpy);

        narrator.speak('Jupiter has 95 moons.', 'en');
        expect(stateSpy).toHaveBeenCalledWith(true);

        narrator.stop();
        expect((window as any).speechSynthesis.cancel).toHaveBeenCalled();
        expect(stateSpy).toHaveBeenCalledWith(false);
        expect(narrator.isSpeaking()).toBe(false);

        narrator.dispose();
    });

    it('toggles speech on and off', () => {
        const narrator = new AudioNarrator();
        narrator.toggle('Mars has two small moons.', 'en');
        expect(narrator.isSpeaking()).toBe(true);

        narrator.toggle('Mars has two small moons.', 'en');
        expect(narrator.isSpeaking()).toBe(false);

        narrator.dispose();
    });

    it('handles environments without speechSynthesis gracefully', () => {
        (window as any).speechSynthesis = undefined;
        const narrator = new AudioNarrator();
        expect(narrator.isAvailable()).toBe(false);
        expect(narrator.speak('Test')).toBe(false);
        expect(() => narrator.stop()).not.toThrow();
        expect(() => narrator.dispose()).not.toThrow();
    });
});
