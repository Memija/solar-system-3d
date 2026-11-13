/**
 * AudioManager.ts
 * Procedural Cosmic Audio Engine using Web Audio API.
 * Synthesizes deep space ambient drones and interactive audio cues
 * with zero external audio assets.
 *
 * Lifecycle notes:
 * - Browsers only allow an AudioContext to start after a user gesture, so when
 *   audio was left enabled in a previous session we create/resume the context
 *   on the first pointer/key interaction.
 * - Muting fades the master bus out and then suspends the context so the
 *   ambient oscillators stop consuming CPU while silent.
 * - The ambient bed ducks automatically while the voice narrator is speaking.
 */

import { PreferencesManager } from './PreferencesManager';

/** Window event dispatched by AudioNarrator when speech starts/stops. */
export const NARRATION_STATE_EVENT = 'audio-narration-state';

const FADE_IN_SEC = 0.35;
const FADE_OUT_SEC = 0.25;
const AMBIENT_LEVEL = 0.4;
const AMBIENT_DUCKED_LEVEL = 0.12;
const NOISE_LOOP_SEC = 8;
const NOISE_CROSSFADE_SEC = 0.5;

export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;

    // Ambient synthesis nodes
    private oscillators: OscillatorNode[] = [];
    private ambientFilter: BiquadFilterNode | null = null;
    private noiseNode: AudioBufferSourceNode | null = null;
    private noiseFilter: BiquadFilterNode | null = null;
    private noiseGain: GainNode | null = null;

    private isEnabled: boolean = false;
    private isInitialized: boolean = false;
    private isDucked: boolean = false;
    private volume: number = 0.5;
    private suspendTimer: ReturnType<typeof setTimeout> | null = null;
    private unlockHandler: (() => void) | null = null;
    private narrationHandler: ((e: Event) => void) | null = null;

    constructor() {
        // Load initial state from unified preferences
        this.isEnabled = PreferencesManager.get('audioEnabled');

        // Restore audio on first user gesture if it was enabled previously
        this.bindUnlockGesture();

        // Duck ambient bed while the narrator speaks
        if (typeof window !== 'undefined') {
            this.narrationHandler = (e: Event) => {
                this.setDucked(Boolean((e as CustomEvent).detail?.speaking));
            };
            window.addEventListener(NARRATION_STATE_EVENT, this.narrationHandler);
        }
    }

    private bindUnlockGesture(): void {
        if (typeof window === 'undefined') return;

        this.unlockHandler = () => {
            this.unbindUnlockGesture();
            if (!this.isEnabled) return;
            if (!this.initAudioContext()) return;
            this.resumeContext();
        };
        window.addEventListener('pointerdown', this.unlockHandler, { passive: true });
        window.addEventListener('keydown', this.unlockHandler, { passive: true });
    }

    private unbindUnlockGesture(): void {
        if (!this.unlockHandler || typeof window === 'undefined') return;
        window.removeEventListener('pointerdown', this.unlockHandler);
        window.removeEventListener('keydown', this.unlockHandler);
        this.unlockHandler = null;
    }

    private initAudioContext(): boolean {
        if (this.isInitialized && this.ctx) return true;

        try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtxClass) return false;

            this.ctx = new AudioCtxClass();
            const now = this.ctx.currentTime;

            this.masterGain = this.ctx.createGain();
            // Always start silent; setEnabled/resume fades in smoothly
            this.masterGain.gain.setValueAtTime(0.0001, now);
            this.masterGain.connect(this.ctx.destination);

            // Ambient sub-bus
            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(this.isDucked ? AMBIENT_DUCKED_LEVEL : AMBIENT_LEVEL, now);
            this.ambientGain.connect(this.masterGain);

            // SFX sub-bus
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.5, now);
            this.sfxGain.connect(this.masterGain);

            this.setupAmbientDrone();
            this.isInitialized = true;
            return true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
            return false;
        }
    }

    private setupAmbientDrone(): void {
        if (!this.ctx || !this.ambientGain) return;

        try {
            const now = this.ctx.currentTime;

            // Resonant lowpass "cabin" filter. Cutoff is high enough that the
            // upper partials survive on laptop/phone speakers (which roll off < ~120 Hz).
            this.ambientFilter = this.ctx.createBiquadFilter();
            this.ambientFilter.type = 'lowpass';
            this.ambientFilter.frequency.setValueAtTime(420, now);
            this.ambientFilter.Q.setValueAtTime(2.5, now);
            this.ambientFilter.connect(this.ambientGain);

            // Very slow LFO sweeping the filter (~16 s "breathing" cycle)
            const lfo = this.ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.06, now);
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(140, now);
            lfo.connect(lfoGain);
            lfoGain.connect(this.ambientFilter.frequency);
            lfo.start(now);
            this.oscillators.push(lfo);

            // Drone voices: sub fundamental + octave + fifth + soft upper octave.
            // Slight detuning produces slow beating for a living texture.
            const voices: { freq: number; type: OscillatorType; gain: number }[] = [
                { freq: 55, type: 'sine', gain: 1.0 },       // A1 sub (felt on headphones)
                { freq: 110.3, type: 'sine', gain: 0.45 },   // A2
                { freq: 164.6, type: 'triangle', gain: 0.18 }, // E3 (fifth)
                { freq: 220.4, type: 'triangle', gain: 0.1 }  // A3 (audible on small speakers)
            ];

            voices.forEach(v => {
                const osc = this.ctx!.createOscillator();
                osc.type = v.type;
                osc.frequency.setValueAtTime(v.freq, now);
                const g = this.ctx!.createGain();
                g.gain.setValueAtTime(v.gain, now);
                osc.connect(g);
                g.connect(this.ambientFilter!);
                osc.start(now);
                this.oscillators.push(osc);
            });

            // Solar wind pink noise generator
            this.setupSolarWind();
        } catch (e) {
            console.warn('Error configuring ambient synth drone:', e);
        }
    }

    /**
     * Builds a seamlessly looping pink-noise buffer: the tail is crossfaded into
     * the head so there is no click or audible repetition seam at the loop point.
     */
    private createLoopingPinkNoise(ctx: AudioContext): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const loopLength = Math.floor(sampleRate * NOISE_LOOP_SEC);
        const fadeLength = Math.floor(sampleRate * NOISE_CROSSFADE_SEC);
        const total = loopLength + fadeLength;

        const raw = new Float32Array(total);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < total; i++) {
            const white = Math.random() * 2 - 1;
            // Paul Kellet's economy pink-noise filter
            b0 = 0.99765 * b0 + white * 0.0990460;
            b1 = 0.96300 * b1 + white * 0.2965164;
            b2 = 0.57000 * b2 + white * 1.0526913;
            raw[i] = (b0 + b1 + b2 + white * 0.1848) * 0.05;
        }

        const buffer = ctx.createBuffer(1, loopLength, sampleRate);
        const out = buffer.getChannelData(0);
        for (let i = 0; i < loopLength; i++) {
            if (i < fadeLength) {
                // Equal-power crossfade of the extra tail into the head
                const t = i / fadeLength;
                const fadeIn = Math.sin(t * Math.PI * 0.5);
                const fadeOut = Math.cos(t * Math.PI * 0.5);
                out[i] = raw[i] * fadeIn + raw[loopLength + i] * fadeOut;
            } else {
                out[i] = raw[i];
            }
        }
        return buffer;
    }

    private setupSolarWind(): void {
        if (!this.ctx || !this.ambientGain) return;

        try {
            const now = this.ctx.currentTime;

            this.noiseNode = this.ctx.createBufferSource();
            this.noiseNode.buffer = this.createLoopingPinkNoise(this.ctx);
            this.noiseNode.loop = true;

            this.noiseFilter = this.ctx.createBiquadFilter();
            this.noiseFilter.type = 'bandpass';
            this.noiseFilter.frequency.setValueAtTime(650, now);
            this.noiseFilter.Q.setValueAtTime(1.2, now);

            // Slow, non-harmonic gust LFO on the noise band so the wind drifts
            // instead of sounding like a static hiss
            const gustLfo = this.ctx.createOscillator();
            gustLfo.frequency.setValueAtTime(0.037, now);
            const gustDepth = this.ctx.createGain();
            gustDepth.gain.setValueAtTime(250, now);
            gustLfo.connect(gustDepth);
            gustDepth.connect(this.noiseFilter.frequency);
            gustLfo.start(now);
            this.oscillators.push(gustLfo);

            this.noiseGain = this.ctx.createGain();
            this.noiseGain.gain.setValueAtTime(0.1, now);

            this.noiseNode.connect(this.noiseFilter);
            this.noiseFilter.connect(this.noiseGain);
            this.noiseGain.connect(this.ambientGain);

            this.noiseNode.start(now);
        } catch (e) {
            console.warn('Solar wind generator failed:', e);
        }
    }

    /** Smoothly ramps an AudioParam from its current value (anchored first). */
    private rampParam(param: AudioParam, target: number, duration: number): void {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        param.cancelScheduledValues(now);
        param.setValueAtTime(Math.max(param.value, 0.0001), now);
        param.linearRampToValueAtTime(Math.max(target, 0.0001), now + duration);
    }

    private clearSuspendTimer(): void {
        if (this.suspendTimer !== null) {
            clearTimeout(this.suspendTimer);
            this.suspendTimer = null;
        }
    }

    /**
     * Resumes the context (async) and fades the master bus in once running,
     * then invokes the optional callback.
     */
    private resumeContext(onRunning?: () => void): void {
        if (!this.ctx || !this.masterGain) return;
        this.clearSuspendTimer();

        const fadeIn = () => {
            if (!this.ctx || !this.masterGain || !this.isEnabled) return;
            this.rampParam(this.masterGain.gain, this.volume, FADE_IN_SEC);
            onRunning?.();
        };

        if (this.ctx.state === 'running') {
            fadeIn();
            return;
        }

        try {
            const p = this.ctx.resume();
            if (p && typeof p.then === 'function') {
                p.then(fadeIn).catch(() => {});
            } else {
                fadeIn();
            }
        } catch {
            // Ignore resume failures (autoplay policies)
        }
    }

    /**
     * Toggles sound on/off
     */
    public toggle(): boolean {
        return this.setEnabled(!this.isEnabled);
    }

    /**
     * Explicitly enables or disables audio
     */
    public setEnabled(enable: boolean): boolean {
        this.isEnabled = enable;
        PreferencesManager.set('audioEnabled', enable);

        if (enable) {
            // Explicit user action unlocks audio; the pending gesture hook is no longer needed
            this.unbindUnlockGesture();
            if (this.initAudioContext()) {
                // Confirmation ping plays only once the context is actually running
                this.resumeContext(() => this.playSelect());
            }
        } else if (this.ctx && this.masterGain) {
            this.rampParam(this.masterGain.gain, 0.0001, FADE_OUT_SEC);
            this.clearSuspendTimer();
            // Suspend after the fade so ambient oscillators stop using CPU
            this.suspendTimer = setTimeout(() => {
                this.suspendTimer = null;
                if (!this.isEnabled && this.ctx && this.ctx.state === 'running') {
                    this.ctx.suspend?.().catch(() => {});
                }
            }, FADE_OUT_SEC * 1000 + 50);
        }

        return this.isEnabled;
    }

    public getAudioEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Lowers the ambient bed (e.g. while the voice narrator speaks).
     */
    public setDucked(ducked: boolean): void {
        if (this.isDucked === ducked) return;
        this.isDucked = ducked;
        if (this.ctx && this.ambientGain) {
            this.rampParam(this.ambientGain.gain, ducked ? AMBIENT_DUCKED_LEVEL : AMBIENT_LEVEL, ducked ? 0.4 : 1.2);
        }
    }

    public getDucked(): boolean {
        return this.isDucked;
    }

    private canPlaySfx(): boolean {
        return this.isEnabled && !!this.ctx && !!this.sfxGain && this.ctx.state === 'running';
    }

    /**
     * Interactive sound effect: celestial body select / focus ping
     */
    public playSelect(): void {
        if (!this.canPlaySfx()) return;
        const ctx = this.ctx!;

        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

            // Short attack avoids a click at note onset
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain!);

            osc.start(now);
            osc.stop(now + 0.26);
        } catch {
            // Ignore audio interruption
        }
    }

    /**
     * Interactive sound effect: UI toggle tick
     */
    public playTick(): void {
        if (!this.canPlaySfx()) return;
        const ctx = this.ctx!;

        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain!);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch {
            // Ignore audio interruption
        }
    }

    /**
     * Interactive sound effect: camera transition whoosh
     */
    public playWarp(): void {
        if (!this.canPlaySfx()) return;
        const ctx = this.ctx!;

        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.5);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain!);

            osc.start(now);
            osc.stop(now + 0.52);
        } catch {
            // Ignore audio interruption
        }
    }

    /**
     * Interactive sound effect: astrophotography camera shutter
     */
    public playShutter(): void {
        if (!this.canPlaySfx()) return;
        const ctx = this.ctx!;

        try {
            const now = ctx.currentTime;
            // High click transient
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2400, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.sfxGain!);

            osc.start(now);
            osc.stop(now + 0.09);

            // Secondary mechanical shutter curtain release
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, now + 0.09);
            osc2.frequency.exponentialRampToValueAtTime(400, now + 0.18);

            gain2.gain.setValueAtTime(0.0001, now);
            gain2.gain.setValueAtTime(0.2, now + 0.09);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc2.connect(gain2);
            gain2.connect(this.sfxGain!);

            osc2.start(now + 0.09);
            osc2.stop(now + 0.19);
        } catch {
            // Ignore audio interruption
        }
    }

    /**
     * Full cleanup on page teardown
     */
    public dispose(): void {
        this.clearSuspendTimer();
        this.unbindUnlockGesture();
        if (this.narrationHandler && typeof window !== 'undefined') {
            window.removeEventListener(NARRATION_STATE_EVENT, this.narrationHandler);
            this.narrationHandler = null;
        }
        try {
            this.oscillators.forEach(o => { o.stop(); o.disconnect(); });
            if (this.noiseNode) { this.noiseNode.stop(); this.noiseNode.disconnect(); }
            if (this.noiseFilter) this.noiseFilter.disconnect();
            if (this.noiseGain) this.noiseGain.disconnect();
            if (this.ambientFilter) this.ambientFilter.disconnect();
            if (this.ambientGain) this.ambientGain.disconnect();
            if (this.sfxGain) this.sfxGain.disconnect();
            if (this.masterGain) this.masterGain.disconnect();
            if (this.ctx && this.ctx.state !== 'closed') {
                this.ctx.close().catch(() => {});
            }
        } catch (e) {
            console.warn('Error during AudioManager disposal:', e);
        }
        this.oscillators = [];
        this.noiseNode = null;
        this.ctx = null;
        this.isInitialized = false;
    }
}
