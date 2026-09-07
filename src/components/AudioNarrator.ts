/**
 * AudioNarrator.ts
 * Multilingual Celestial Audio Guide using the Web Speech API (SpeechSynthesis).
 * Narrates planetary dossiers and astronomical details in the active language.
 * Features automatic South Slavic (Bosnian/Serbian/Croatian) voice adaptation,
 * Cyrillic-to-Latin transliteration, and intelligent phonetic voice fallback
 * for systems lacking native Balkan speech engines.
 */

/**
 * Detects if a text string contains Cyrillic characters.
 */
export function hasCyrillic(text: string): boolean {
    return /[\u0400-\u04FF]/.test(text);
}

/**
 * Transliterates Serbian / Slavic Cyrillic text into standard Gaj's Latin alphabet.
 * Maps 1-to-1:
 * Венера -> Venera, Земља -> Zemlja, Јупитер -> Jupiter, Ђурђевдан -> Đurđevdan
 */
export function cyrillicToLatin(text: string): string {
    if (!text) return '';

    const map: Record<string, string> = {
        // Serbian Cyrillic uppercase & lowercase
        'А': 'A', 'а': 'a',
        'Б': 'B', 'б': 'b',
        'В': 'V', 'в': 'v',
        'Г': 'G', 'г': 'g',
        'Д': 'D', 'д': 'd',
        'Ђ': 'Đ', 'ђ': 'đ',
        'Е': 'E', 'е': 'e',
        'Ж': 'Ž', 'ж': 'ž',
        'З': 'Z', 'з': 'z',
        'И': 'I', 'и': 'i',
        'Ј': 'J', 'ј': 'j',
        'К': 'K', 'к': 'k',
        'Л': 'L', 'л': 'l',
        'Љ': 'Lj', 'љ': 'lj',
        'М': 'M', 'м': 'm',
        'Н': 'N', 'н': 'n',
        'Њ': 'Nj', 'њ': 'nj',
        'О': 'O', 'о': 'o',
        'П': 'P', 'п': 'p',
        'Р': 'R', 'р': 'r',
        'С': 'S', 'с': 's',
        'Т': 'T', 'т': 't',
        'Ћ': 'Ć', 'ћ': 'ć',
        'У': 'U', 'у': 'u',
        'Ф': 'F', 'ф': 'f',
        'Х': 'H', 'х': 'h',
        'Ц': 'C', 'ц': 'c',
        'Ч': 'Č', 'ч': 'č',
        'Џ': 'Dž', 'џ': 'dž',
        'Ш': 'Š', 'ш': 'š',
        // General Slavic / Cyrillic extended characters
        'Э': 'E', 'э': 'e',
        'Я': 'Ja', 'я': 'ja',
        'Ю': 'Ju', 'ю': 'ju',
        'Ё': 'Jo', 'ё': 'jo',
        'Щ': 'Šč', 'щ': 'šč',
        'Ы': 'Y', 'ы': 'y',
        'Й': 'J', 'й': 'j',
        'І': 'I', 'і': 'i',
        'Ї': 'Ji', 'ї': 'ji',
        'Є': 'Je', 'є': 'je',
        'Ѕ': 'Dz', 'ѕ': 'dz',
        'Ѓ': 'Gj', 'ѓ': 'gj',
        'Ќ': 'Kj', 'ќ': 'kj',
        'Ў': 'U', 'ў': 'u',
        'Ъ': '', 'ъ': '',
        'Ь': '', 'ь': ''
    };

    // Handle all-caps digraphs when followed by another uppercase Cyrillic letter
    return text
        .replace(/Љ(?=[А-ЯЁЉЊЏЂЋЖЧШ])/g, 'LJ')
        .replace(/Њ(?=[А-ЯЁЉЊЏЂЋЖЧШ])/g, 'NJ')
        .replace(/Џ(?=[А-ЯЁЉЊЏЂЋЖЧШ])/g, 'DŽ')
        .replace(/[\u0400-\u04FF]/g, match => map[match] ?? match);
}

/**
 * Adapts South Slavic Latin digraphs/diacritics for optimal phonetics when spoken by a Polish TTS engine.
 * - ž -> ż (voiced retroflex fricative [ʐ])
 * - š -> sz (voiceless postalveolar fricative [ʂ])
 * - č -> cz (postalveolar affricate [t͡ʂ])
 * - đ -> dź (voiced alveolo-palatal affricate [d͡ʑ])
 * - dž -> dż (voiced postalveolar affricate [d͡ʐ])
 * - ć is already native Polish [t͡ɕ]
 */
export function adaptForPolishVoice(text: string): string {
    if (!text) return '';
    return text
        .replace(/dž/g, 'dż').replace(/Dž/g, 'Dż').replace(/DŽ/g, 'DŻ')
        .replace(/đ/g, 'dź').replace(/Đ/g, 'Dź')
        .replace(/č/g, 'cz').replace(/Č/g, 'Cz')
        .replace(/š/g, 'sz').replace(/Š/g, 'Sz')
        .replace(/ž/g, 'ż').replace(/Ž/g, 'Ż');
}

export class AudioNarrator {
    private synth: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private speaking: boolean = false;
    private onStateChangeCallbacks: ((speaking: boolean) => void)[] = [];
    private boundVoicesChanged: (() => void) | null = null;

    // Locale to speech synthesis language code mapping
    private localeMap: Record<string, string> = {
        en: 'en-US',
        de: 'de-DE',
        id: 'id-ID',
        pl: 'pl-PL',
        sr: 'sr-RS',
        bs: 'bs-BA'
    };

    constructor() {
        if (typeof window !== 'undefined' && Boolean(window.speechSynthesis)) {
            this.synth = window.speechSynthesis;
            this.loadVoices();
            this.boundVoicesChanged = () => this.loadVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = this.boundVoicesChanged;
            }
            if (window.speechSynthesis.addEventListener) {
                window.speechSynthesis.addEventListener('voiceschanged', this.boundVoicesChanged);
            }
        }
    }

    private loadVoices(): void {
        if (!this.synth) return;
        try {
            this.voices = this.synth.getVoices();
        } catch {
            this.voices = [];
        }
    }

    public isAvailable(): boolean {
        return Boolean(this.synth);
    }

    public getCurrentUtterance(): SpeechSynthesisUtterance | null {
        return this.currentUtterance;
    }

    public isSpeaking(): boolean {
        return this.speaking && Boolean(this.synth?.speaking);
    }

    public onStateChange(cb: (speaking: boolean) => void): () => void {
        this.onStateChangeCallbacks.push(cb);
        return () => {
            this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(c => c !== cb);
        };
    }

    private notifyState(speaking: boolean): void {
        this.speaking = speaking;
        this.onStateChangeCallbacks.forEach(cb => {
            try {
                cb(speaking);
            } catch {
                // Ignore callback errors
            }
        });
    }

    /**
     * Cleans up HTML markup and markdown entities for natural voice reading
     */
    public cleanText(raw: string): string {
        if (!raw) return '';
        return raw
            .replace(/<[^>]*>/g, ' ') // Strip HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&times;/g, 'x')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Resolves the best voice, language code, and text for speech synthesis.
     * Handles South Slavic languages (Bosnian, Serbian, Croatian) with prioritized
     * native voice resolution and Slavic phonetic fallbacks.
     */
    public resolveVoiceAndText(rawText: string, lang: string): { text: string; voice: SpeechSynthesisVoice | null; targetLang: string } {
        const targetLang = this.localeMap[lang] || lang;
        const normLang = lang.toLowerCase();
        const containsCyrillic = hasCyrillic(rawText);
        const isSouthSlavic = normLang === 'bs' || normLang === 'sr' || normLang === 'hr' || normLang === 'sh' || containsCyrillic;

        // 1. Check for exact direct native voice match first (e.g. bs-BA, sr-RS, de-DE, etc.)
        if (this.voices.length > 0) {
            const directVoice = this.voices.find(v => {
                const l = v.lang.toLowerCase();
                return l === targetLang.toLowerCase() || l === normLang || l.startsWith(`${normLang}-`);
            });

            if (directVoice) {
                return {
                    text: rawText,
                    voice: directVoice,
                    targetLang: directVoice.lang
                };
            }
        }

        // 2. South Slavic family handling (Bosnian, Serbian, Croatian, Montenegrin)
        if (isSouthSlavic) {
            const latinText = containsCyrillic ? cyrillicToLatin(rawText) : rawText;

            if (this.voices.length > 0) {
                // Priority A: Any native South Slavic voice (Bosnian, Croatian, Serbian, Slovenian)
                const southSlavicVoice = this.voices.find(v => {
                    const l = v.lang.toLowerCase();
                    return l.startsWith('bs') || l.startsWith('hr') || l.startsWith('sr') || l.startsWith('sl');
                });

                if (southSlavicVoice) {
                    const voiceIsCyrillicOnly = southSlavicVoice.lang.toLowerCase().includes('cyrl');
                    return {
                        text: (containsCyrillic && voiceIsCyrillicOnly) ? rawText : latinText,
                        voice: southSlavicVoice,
                        targetLang: southSlavicVoice.lang
                    };
                }

                // Priority B: Polish voice ('pl') with Polish phonetic mapping (outstanding natural Slavic cadence)
                const polishVoice = this.voices.find(v => v.lang.toLowerCase().startsWith('pl'));
                if (polishVoice) {
                    return {
                        text: adaptForPolishVoice(latinText),
                        voice: polishVoice,
                        targetLang: polishVoice.lang
                    };
                }

                // Priority C: Czech or Slovak voices
                const slavicVoice = this.voices.find(v => {
                    const l = v.lang.toLowerCase();
                    return l.startsWith('cs') || l.startsWith('sk');
                });
                if (slavicVoice) {
                    return {
                        text: latinText,
                        voice: slavicVoice,
                        targetLang: slavicVoice.lang
                    };
                }

                // Priority D: Romance phonetic voices (Italian, Spanish - clear vowels)
                const romanceVoice = this.voices.find(v => {
                    const l = v.lang.toLowerCase();
                    return l.startsWith('it') || l.startsWith('es');
                });
                if (romanceVoice) {
                    return {
                        text: latinText,
                        voice: romanceVoice,
                        targetLang: romanceVoice.lang
                    };
                }

                // Priority E: Default system voice
                const defaultVoice = this.voices.find(v => v.default) || this.voices[0];
                return {
                    text: latinText,
                    voice: defaultVoice,
                    targetLang: defaultVoice?.lang || targetLang
                };
            }

            return {
                text: latinText,
                voice: null,
                targetLang
            };
        }

        // 3. For other non-South Slavic languages without direct voice
        if (this.voices.length > 0) {
            const matchedVoice = this.voices.find(v => v.lang === targetLang || v.lang.startsWith(lang));
            if (matchedVoice) {
                return { text: rawText, voice: matchedVoice, targetLang: matchedVoice.lang };
            }
            const defaultVoice = this.voices.find(v => v.default) || this.voices[0];
            return { text: rawText, voice: defaultVoice, targetLang: defaultVoice?.lang || targetLang };
        }

        return {
            text: rawText,
            voice: null,
            targetLang
        };
    }

    /**
     * Reads text aloud in the specified or detected language
     */
    public speak(rawText: string, lang: string = 'en', onComplete?: () => void): boolean {
        if (!this.synth) return false;

        this.stop();

        const cleaned = this.cleanText(rawText);
        if (!cleaned) return false;

        if (this.voices.length === 0) {
            this.loadVoices();
        }

        try {
            const { text, voice, targetLang } = this.resolveVoiceAndText(cleaned, lang);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = targetLang;

            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = 0.95;
            utterance.pitch = 1.0;

            utterance.onstart = () => {
                this.notifyState(true);
            };

            utterance.onend = () => {
                this.notifyState(false);
                this.currentUtterance = null;
                if (onComplete) onComplete();
            };

            utterance.onerror = () => {
                this.notifyState(false);
                this.currentUtterance = null;
                if (onComplete) onComplete();
            };

            this.currentUtterance = utterance;
            this.synth.speak(utterance);
            return true;
        } catch (e) {
            console.warn('Speech synthesis failed:', e);
            this.notifyState(false);
            return false;
        }
    }

    public stop(): void {
        if (this.synth) {
            try {
                this.synth.cancel();
            } catch {
                // Ignore cancel errors
            }
        }
        this.currentUtterance = null;
        this.notifyState(false);
    }

    /**
     * Toggles speech on and off
     */
    public toggle(text: string, lang: string = 'en', onComplete?: () => void): boolean {
        if (this.isSpeaking()) {
            this.stop();
            return false;
        } else {
            return this.speak(text, lang, onComplete);
        }
    }

    public dispose(): void {
        this.stop();
        if (this.boundVoicesChanged && typeof window !== 'undefined' && window.speechSynthesis?.removeEventListener) {
            window.speechSynthesis.removeEventListener('voiceschanged', this.boundVoicesChanged);
        }
        this.onStateChangeCallbacks = [];
        this.synth = null;
    }
}
