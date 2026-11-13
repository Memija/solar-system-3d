import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager, NARRATION_STATE_EVENT } from '../AudioManager';

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
    suspend = vi.fn().mockResolvedValue(undefined);
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
        const prefsTrue = JSON.parse(localStorage.getItem('solar-system-3d') || '{}');
        expect(prefsTrue.audioEnabled).toBe(true);

        const disabled = audio.toggle();
        expect(disabled).toBe(false);
        expect(audio.getAudioEnabled()).toBe(false);
        const prefsFalse = JSON.parse(localStorage.getItem('solar-system-3d') || '{}');
        expect(prefsFalse.audioEnabled).toBe(false);

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

    it('restores audio on the first user gesture after reload when previously enabled', async () => {
        localStorage.setItem('solar-system-3d', JSON.stringify({ audioEnabled: true }));
        const { PreferencesManager } = await import('../PreferencesManager');
        PreferencesManager.set('audioEnabled', true);

        const audio = new AudioManager();
        expect(audio.getAudioEnabled()).toBe(true);
        expect((audio as any).ctx).toBeNull();

        window.dispatchEvent(new Event('pointerdown'));
        expect((audio as any).ctx).not.toBeNull();
        expect((audio as any).isInitialized).toBe(true);

        audio.dispose();
        PreferencesManager.set('audioEnabled', false);
    });

    it('does not create an AudioContext on gesture when audio is disabled', () => {
        const audio = new AudioManager();
        window.dispatchEvent(new Event('pointerdown'));
        expect((audio as any).ctx).toBeNull();
        audio.dispose();
    });

    it('plays the enable confirmation ping only after the context resumes', async () => {
        const audio = new AudioManager();
        const selectSpy = vi.spyOn(audio, 'playSelect');
        audio.setEnabled(true);
        await Promise.resolve();
        await Promise.resolve();
        expect(selectSpy).toHaveBeenCalled();
        audio.dispose();
    });

    it('anchors master gain before ramping and suspends the context after fade-out', () => {
        vi.useFakeTimers();
        const audio = new AudioManager();
        audio.setEnabled(true);
        const ctx = (audio as any).ctx;
        ctx.suspend = vi.fn().mockResolvedValue(undefined);
        const gain = (audio as any).masterGain.gain as MockAudioParam;
        gain.setValueAtTime.mockClear();

        audio.setEnabled(false);
        expect(gain.cancelScheduledValues).toHaveBeenCalled();
        expect(gain.setValueAtTime).toHaveBeenCalled();
        expect(gain.linearRampToValueAtTime).toHaveBeenCalled();

        vi.advanceTimersByTime(500);
        expect(ctx.suspend).toHaveBeenCalled();

        audio.dispose();
        vi.useRealTimers();
    });

    it('ducks the ambient bed while narration is speaking', () => {
        const audio = new AudioManager();
        audio.setEnabled(true);
        window.dispatchEvent(new CustomEvent(NARRATION_STATE_EVENT, { detail: { speaking: true } }));
        expect(audio.getDucked()).toBe(true);
        window.dispatchEvent(new CustomEvent(NARRATION_STATE_EVENT, { detail: { speaking: false } }));
        expect(audio.getDucked()).toBe(false);
        audio.dispose();
    });
});
