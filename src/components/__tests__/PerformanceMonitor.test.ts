import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { PerformanceMonitor } from '../PerformanceMonitor';

describe('PerformanceMonitor', () => {
    let container: HTMLElement;
    let renderer: THREE.WebGLRenderer;
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        renderer = new THREE.WebGLRenderer();
        monitor = new PerformanceMonitor(renderer, container);
    });

    afterEach(() => {
        monitor.dispose();
        if (container.parentElement) {
            container.parentElement.removeChild(container);
        }
    });

    it('creates active telemetry DOM element inside container by default', () => {
        const dom = container.querySelector('.perf-monitor-hud') as HTMLElement;
        expect(dom).not.toBeNull();
        expect(dom.style.display).toBe('flex');
        expect(monitor.getVisible()).toBe(true);
    });

    it('toggles visibility and updates display style', () => {
        const isHidden = monitor.toggle();
        expect(isHidden).toBe(false);
        expect(monitor.getVisible()).toBe(false);

        const dom = container.querySelector('.perf-monitor-hud') as HTMLElement;
        expect(dom.style.display).toBe('none');

        const isVisible = monitor.toggle();
        expect(isVisible).toBe(true);
        expect(dom.style.display).toBe('flex');
    });

    it('persists telemetry visibility state to localStorage under solar-system-3d', () => {
        monitor.setVisible(false);
        const stored = JSON.parse(localStorage.getItem('solar-system-3d')!);
        expect(stored.telemetry).toBe(false);

        monitor.setVisible(true);
        const updated = JSON.parse(localStorage.getItem('solar-system-3d')!);
        expect(updated.telemetry).toBe(true);
    });

    it('updates metrics on animation frames without error', () => {
        monitor.setVisible(true);

        // Simulate a sequence of frames
        monitor.update(1000);
        monitor.update(1016.6);
        monitor.update(1300); // Trigger 250ms DOM flush

        const fpsEl = container.querySelector('#perfFps');
        expect(fpsEl).not.toBeNull();
        expect(fpsEl?.textContent).toBeDefined();

        const callsEl = container.querySelector('#perfCalls');
        expect(callsEl?.textContent).toBe('12');
    });

    it('removes DOM element upon disposal', () => {
        monitor.dispose();
        const dom = container.querySelector('.perf-monitor-hud');
        expect(dom).toBeNull();
    });
});
