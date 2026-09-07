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

    it('creates hidden telemetry DOM element inside container', () => {
        const dom = container.querySelector('.perf-monitor-hud') as HTMLElement;
        expect(dom).not.toBeNull();
        expect(dom.style.display).toBe('none');
        expect(monitor.getVisible()).toBe(false);
    });

    it('toggles visibility and updates display style', () => {
        const isVisible = monitor.toggle();
        expect(isVisible).toBe(true);
        expect(monitor.getVisible()).toBe(true);

        const dom = container.querySelector('.perf-monitor-hud') as HTMLElement;
        expect(dom.style.display).toBe('flex');

        const isHidden = monitor.toggle();
        expect(isHidden).toBe(false);
        expect(dom.style.display).toBe('none');
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
