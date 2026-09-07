/**
 * AudioManager.ts
 * Procedural Cosmic Audio Engine using Web Audio API.
 * Synthesizes deep space ambient drones and interactive audio cues
 * with zero external audio assets.
 */

export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;

    // Ambient synthesis nodes
    private osc1: OscillatorNode | null = null;
    private osc2: OscillatorNode | null = null;
    private lfo: OscillatorNode | null = null;
    private lfoGain: GainNode | null = null;
    private ambientFilter: BiquadFilterNode | null = null;
    private noiseNode: AudioBufferSourceNode | null = null;
    private noiseFilter: BiquadFilterNode | null = null;
    private noiseGain: GainNode | null = null;

    private isEnabled: boolean = false;
    private isInitialized: boolean = false;
    private volume: number = 0.5;
    private storageKey: string = 'solar_system_audio_enabled';

    constructor() {
        // Load initial state from localStorage if available
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.isEnabled = saved === 'true';
        } catch {
            this.isEnabled = false;
        }

        // Set up gesture listener to unlock AudioContext if user enabled sound
        this.bindUnlockGesture();
    }

    private bindUnlockGesture(): void {
        const unlock = () => {
            if (this.ctx && this.ctx.state === 'suspended' && this.isEnabled) {
                this.ctx.resume().catch(() => {});
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock, { passive: true, once: true });
        window.addEventListener('keydown', unlock, { passive: true, once: true });
    }

    private initAudioContext(): boolean {
        if (this.isInitialized && this.ctx) return true;

        try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtxClass) return false;

            this.ctx = new AudioCtxClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isEnabled ? this.volume : 0, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Ambient sub-bus
            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            this.ambientGain.connect(this.masterGain);

            // SFX sub-bus
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
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
            // Lowpass resonant filter simulating space acoustic dampening
            this.ambientFilter = this.ctx.createBiquadFilter();
            this.ambientFilter.type = 'lowpass';
            this.ambientFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
            this.ambientFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);
            this.ambientFilter.connect(this.ambientGain);

            // LFO sweeping the filter to simulate cosmic tidal breath
            this.lfo = this.ctx.createOscillator();
            this.lfo.frequency.setValueAtTime(0.06, this.ctx.currentTime); // ~16s cycle
            this.lfoGain = this.ctx.createGain();
            this.lfoGain.gain.setValueAtTime(60, this.ctx.currentTime);
            this.lfo.connect(this.lfoGain);
            this.lfoGain.connect(this.ambientFilter.frequency);
            this.lfo.start();

            // Sub drone oscillator 1 (A1 - 55 Hz)
            this.osc1 = this.ctx.createOscillator();
            this.osc1.type = 'sine';
            this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
            this.osc1.connect(this.ambientFilter);
            this.osc1.start();

            // Harmonic oscillator 2 (A2 - 110 Hz slightly detuned)
            this.osc2 = this.ctx.createOscillator();
            this.osc2.type = 'sine';
            this.osc2.frequency.setValueAtTime(110.3, this.ctx.currentTime);
            const osc2Gain = this.ctx.createGain();
            osc2Gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            this.osc2.connect(osc2Gain);
            osc2Gain.connect(this.ambientFilter);
            this.osc2.start();

            // Solar wind pink noise generator
            this.setupSolarWind();
        } catch (e) {
            console.warn('Error configuring ambient synth drone:', e);
        }
    }

    private setupSolarWind(): void {
        if (!this.ctx || !this.ambientGain) return;

        try {
            // 2-second looped noise buffer
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                // Pink noise filter approximation
                b0 = 0.99765 * b0 + white * 0.0990460;
                b1 = 0.96300 * b1 + white * 0.2965164;
                b2 = 0.57000 * b2 + white * 1.0526913;
                output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.05;
            }

            this.noiseNode = this.ctx.createBufferSource();
            this.noiseNode.buffer = noiseBuffer;
            this.noiseNode.loop = true;

            this.noiseFilter = this.ctx.createBiquadFilter();
            this.noiseFilter.type = 'bandpass';
            this.noiseFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
            this.noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

            this.noiseGain = this.ctx.createGain();
            this.noiseGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

            this.noiseNode.connect(this.noiseFilter);
            this.noiseFilter.connect(this.noiseGain);
            this.noiseGain.connect(this.ambientGain);

            this.noiseNode.start();
        } catch (e) {
            console.warn('Solar wind generator failed:', e);
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
        try {
            localStorage.setItem(this.storageKey, String(enable));
        } catch {
            // Ignore storage errors
        }

        if (enable) {
            if (!this.isInitialized) {
                this.initAudioContext();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.3);
            }
            this.playSelect();
        } else {
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
            }
        }

        return this.isEnabled;
    }

    public getAudioEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Interactive sound effect: celestial body select / focus ping
     */
    public playSelect(): void {
        if (!this.isEnabled || !this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.26);
        } catch {
            // Ignore audio interruption
        }
    }

    /**
     * Interactive sound effect: time-warp tick
     */
    public playTick(): void {
        if (!this.isEnabled || !this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain);

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
        if (!this.isEnabled || !this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.5);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

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
        if (!this.isEnabled || !this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            // High click transient
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2400, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.09);

            // Secondary mechanical shutter curtain release
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, now + 0.09);
            osc2.frequency.exponentialRampToValueAtTime(400, now + 0.18);

            gain2.gain.setValueAtTime(0.2, now + 0.09);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc2.connect(gain2);
            gain2.connect(this.sfxGain);

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
        try {
            if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
            if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
            if (this.lfo) { this.lfo.stop(); this.lfo.disconnect(); }
            if (this.noiseNode) { this.noiseNode.stop(); this.noiseNode.disconnect(); }
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
        this.ctx = null;
        this.isInitialized = false;
    }
}
