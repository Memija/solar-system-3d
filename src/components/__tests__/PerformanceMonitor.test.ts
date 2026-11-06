import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { i18n } from '../../i18n';

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

        const fpsEl = container.querySelector('#perfFps') as HTMLElement;
        expect(fpsEl).not.toBeNull();
        expect(fpsEl.textContent).toBeDefined();
        expect(fpsEl.style.color).toBeTruthy();

        const msEl = container.querySelector('#perfMs') as HTMLElement;
        expect(msEl.style.color).toBeTruthy();

        const callsEl = container.querySelector('#perfCalls') as HTMLElement;
        expect(callsEl.textContent).toBe('12');
        expect(callsEl.style.color).toBeTruthy();

        const trisEl = container.querySelector('#perfTris') as HTMLElement;
        expect(trisEl.style.color).toBeTruthy();

        const texEl = container.querySelector('#perfTex') as HTMLElement;
        expect(texEl.style.color).toBeTruthy();
    });

    it('removes DOM element upon disposal', () => {
        monitor.dispose();
        const dom = container.querySelector('.perf-monitor-hud');
        expect(dom).toBeNull();
    });

    it('displays a localized telemetry explanation tooltip when hovering or clicking the FPS HUD across all 6 languages', async () => {
        await Promise.all(['en', 'bs', 'de', 'id', 'pl', 'sr'].map(code => i18n.preloadLocale(code)));
        i18n.setLanguage('en');

        const dom = container.querySelector('.perf-monitor-hud') as HTMLElement;
        expect(dom.querySelector('.perf-info-badge')).toBeNull();

        dom.dispatchEvent(new MouseEvent('mouseenter'));
        const tooltip = container.querySelector('.perf-telemetry-tooltip') as HTMLElement;
        expect(tooltip).not.toBeNull();
        expect(tooltip.classList.contains('visible')).toBe(true);
        expect(tooltip.style.pointerEvents).toBe('none');
        expect(tooltip.querySelectorAll('.telemetry-detail-item').length).toBe(6);
        expect(tooltip.textContent).toContain('Frames Per Second');
        expect(tooltip.textContent).toContain('Frame Time');
        expect(tooltip.textContent).toContain('Draw Calls');
        expect(tooltip.textContent).toContain('3D Triangles');
        expect(tooltip.textContent).toContain('3D Textures');
        expect(tooltip.textContent).toContain('Memory Usage');

        // Updates dynamically when switching languages
        i18n.setLanguage('de');
        expect(tooltip.textContent).toContain('Bilder pro Sekunde');
        expect(tooltip.textContent).toContain('Bildzeit');
        expect(tooltip.textContent).toContain('Zeichenbefehle');
        expect(tooltip.textContent).toContain('3D-Texturen');
        expect(tooltip.textContent).toContain('Arbeitsspeicher');

        i18n.setLanguage('bs');
        expect(tooltip.textContent).toContain('Sličica u sekundi');
        expect(tooltip.textContent).toContain('3D teksture');
        expect(tooltip.textContent).toContain('Radna memorija');

        i18n.setLanguage('sr');
        expect(tooltip.textContent).toContain('Сличица у секунди');
        expect(tooltip.textContent).toContain('3D текстуре');
        expect(tooltip.textContent).toContain('Радна меморија');

        i18n.setLanguage('id');
        expect(tooltip.textContent).toContain('Frame per Detik');
        expect(tooltip.textContent).toContain('Tekstur 3D');
        expect(tooltip.textContent).toContain('Penggunaan Memori');

        i18n.setLanguage('pl');
        expect(tooltip.textContent).toContain('Klatki na sekundę');
        expect(tooltip.textContent).toContain('Tekstury 3D');
        expect(tooltip.textContent).toContain('Pamięć podręczna');

        dom.dispatchEvent(new MouseEvent('mouseleave'));
        expect(tooltip.classList.contains('visible')).toBe(false);

        i18n.setLanguage('en');
    });
});
