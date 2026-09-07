import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../AudioManager';

class MockAudioParam {
    value = 0;
    setValueAtTime = vi.fn();
    linearRampToValueAtTime = vi.fn();
    exponentialRampToValueAtTime = vi.fn();
    cancelScheduledValues = vi.fn();
}

class MockAudioNode {
    connect = vi.fn();
    disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
    gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
    frequency = new MockAudioParam();
    Q = new MockAudioParam();
    type = 'lowpass';
}

class MockOscillatorNode extends MockAudioNode {
    frequency = new MockAudioParam();
    type = 'sine';
    start = vi.fn();
    stop = vi.fn();
}

class MockAudioBufferSourceNode extends MockAudioNode {
    buffer: any = null;
    loop = false;
    start = vi.fn();
    stop = vi.fn();
}

class MockAudioContext {
    state = 'running';
    currentTime = 0;
    sampleRate = 44100;
    destination = new MockAudioNode();
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);

    createGain() { return new MockGainNode(); }
    createBiquadFilter() { return new MockBiquadFilterNode(); }
    createOscillator() { return new MockOscillatorNode(); }
    createBufferSource() { return new MockAudioBufferSourceNode(); }
    createBuffer(_channels: number, length: number, _sampleRate: number) {
        return {
            getChannelData: () => new Float32Array(length)
        };
    }
}

describe('AudioManager', () => {
    let originalAudioContext: any;

    beforeEach(() => {
        localStorage.clear();
        originalAudioContext = (window as any).AudioContext;
        (window as any).AudioContext = MockAudioContext;
    });

    afterEach(() => {
        (window as any).AudioContext = originalAudioContext;
    });

    it('initializes muted by default if no localStorage flag exists', () => {
        const audio = new AudioManager();
        expect(audio.getAudioEnabled()).toBe(false);
        audio.dispose();
    });

    it('toggles audio state and persists to localStorage', () => {
        const audio = new AudioManager();
        const enabled = audio.toggle();
        expect(enabled).toBe(true);
        expect(audio.getAudioEnabled()).toBe(true);
        expect(localStorage.getItem('solar_system_audio_enabled')).toBe('true');

        const disabled = audio.toggle();
        expect(disabled).toBe(false);
        expect(audio.getAudioEnabled()).toBe(false);
        expect(localStorage.getItem('solar_system_audio_enabled')).toBe('false');

        audio.dispose();
    });

    it('plays interactive SFX without throwing errors', () => {
        const audio = new AudioManager();
        audio.setEnabled(true);

        expect(() => audio.playSelect()).not.toThrow();
        expect(() => audio.playTick()).not.toThrow();
        expect(() => audio.playWarp()).not.toThrow();

        audio.dispose();
    });

    it('handles Web Audio API unavailability gracefully', () => {
        (window as any).AudioContext = undefined;
        (window as any).webkitAudioContext = undefined;

        const audio = new AudioManager();
        expect(() => audio.setEnabled(true)).not.toThrow();
        expect(() => audio.playSelect()).not.toThrow();
        expect(() => audio.dispose()).not.toThrow();
    });

    it('disposes all nodes and audio context cleanly', () => {
        const audio = new AudioManager();
        audio.setEnabled(true);
        audio.dispose();
        expect(audio.getAudioEnabled()).toBe(true); // retains preference
    });
});
