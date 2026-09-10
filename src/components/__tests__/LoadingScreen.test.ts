import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { LoadingScreen } from '../LoadingScreen';
import { i18n } from '../../i18n';

describe('LoadingScreen', () => {
    let container: HTMLElement;

    beforeEach(() => {
        vi.useFakeTimers();
        i18n.setLanguage('en');
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.id = 'loading-screen';
        container.className = 'loading-screen';
        container.innerHTML = `
            <div class="loading-content">
                <div class="loading-badge"><span class="status-live-dot"></span><span>Observatory Boot</span></div>
                <div class="loading-orrery"><div class="loading-sun"></div></div>
                <h1 class="loading-title">SOLAR SYSTEM 3D</h1>
                <div class="loading-progress-wrapper">
                    <div class="loading-status-text">INITIALIZING...</div>
                    <div class="loading-progress-bar-container">
                        <div class="loading-progress-bar" style="width: 0%;"></div>
                    </div>
                    <div class="loading-telemetry-row">
                        <span class="loading-percentage">0%</span>
                        <span class="loading-subsystems">STANDBY</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        i18n.setLanguage('en');
        vi.restoreAllMocks();
        vi.clearAllTimers();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });


    it('should initialize and attach to existing DOM element', () => {
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });
        expect(loadingScreen.getElement()).toBe(container);
        expect(loadingScreen.isFinished()).toBe(false);
        loadingScreen.dispose();
    });

    it('should create default DOM element if not already present', () => {
        document.body.innerHTML = '';
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });
        const element = loadingScreen.getElement();
        expect(element).toBeDefined();
        expect(document.getElementById('loading-screen')).toBe(element);
        expect(element.querySelector('.loading-title')?.textContent).toContain('SOLAR SYSTEM 3D');
        loadingScreen.dispose();
    });

    it('should set progress, status text, and subsystems text', () => {
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });
        loadingScreen.setProgress(60, 'SYNTHESIZING TEXTURES...', 'SYSTEMS: 3/5');

        const statusLabel = container.querySelector('.loading-status-text');
        const subsystemsLabel = container.querySelector('.loading-subsystems');

        expect(statusLabel?.textContent).toBe('SYNTHESIZING TEXTURES...');
        expect(subsystemsLabel?.textContent).toBe('SYSTEMS: 3/5');

        // Advance RAF loop to interpolate progress
        vi.advanceTimersByTime(500);

        const percentageLabel = container.querySelector('.loading-percentage');
        expect(percentageLabel?.textContent).toBe('60%');
        const progressBar = container.querySelector('.loading-progress-bar') as HTMLElement;
        expect(progressBar.style.width).toBe('60%');

        loadingScreen.dispose();
    });

    it('should update status class on setStatus with isComplete', () => {
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });
        loadingScreen.setStatus('ONLINE', true);

        const statusLabel = container.querySelector('.loading-status-text');
        expect(statusLabel?.textContent).toBe('ONLINE');
        expect(statusLabel?.classList.contains('status-complete')).toBe(true);

        loadingScreen.setStatus('OFFLINE', false);
        expect(statusLabel?.classList.contains('status-complete')).toBe(false);

        loadingScreen.dispose();
    });

    it('should hook into THREE.DefaultLoadingManager events', () => {
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });

        // Trigger onStart
        THREE.DefaultLoadingManager.onStart?.('milky_way.jpg', 0, 5);
        const statusLabel = container.querySelector('.loading-status-text');
        expect(statusLabel?.textContent).toBe('ACQUIRING HIGH-RES ASTROPHOTOGRAPHY...');

        // Trigger onProgress
        THREE.DefaultLoadingManager.onProgress?.('milky_way.jpg', 3, 5);
        expect(statusLabel?.textContent).toBe('STREAMING DEEP SPACE TEXTURES...');
        const subsystemsLabel = container.querySelector('.loading-subsystems');
        expect(subsystemsLabel?.textContent).toBe('ASSETS: 3/5');

        // Trigger onLoad
        THREE.DefaultLoadingManager.onLoad?.();
        expect(statusLabel?.textContent).toBe('SYNCHRONIZING CELESTIAL ORBITS...');
        expect(subsystemsLabel?.textContent).toBe('ASSETS LOADED');

        // Trigger onError without breaking
        expect(() => {
            THREE.DefaultLoadingManager.onError?.('missing_texture.png');
        }).not.toThrow();

        loadingScreen.dispose();
    });

    it('should complete and transition smoothly to completion', async () => {
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 200 });

        const completePromise = loadingScreen.complete();
        expect(loadingScreen.isFinished()).toBe(true);

        // Advance past interpolation, minimum duration, and transition delays
        await vi.advanceTimersByTimeAsync(700);
        expect(container.classList.contains('is-complete')).toBe(true);

        await vi.advanceTimersByTimeAsync(800);
        await completePromise;


        expect(container.classList.contains('is-hidden') || !document.body.contains(container)).toBe(true);
    });


    it('should cleanly dispose without errors', () => {
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });
        expect(() => loadingScreen.dispose()).not.toThrow();
        expect(document.getElementById('loading-screen')).toBeNull();
    });

    it('should localize loading screen labels upon initialization and language switch', () => {
        i18n.setLanguage('bs');
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 100 });

        const badgeLabel = container.querySelector('.loading-badge span:last-child');
        const statusLabel = container.querySelector('.loading-status-text');
        const subsystemsLabel = container.querySelector('.loading-subsystems');

        expect(badgeLabel?.textContent).toBe('Pokretanje opservatorije');
        expect(statusLabel?.textContent).toBe('INICIJALIZACIJA JEZGRA OPSERVATORIJE...');
        expect(subsystemsLabel?.textContent).toBe('PRIPRAVNOST');

        // Dynamically switch language
        i18n.setLanguage('de');
        expect(badgeLabel?.textContent).toBe('Observatorium-Start');
        expect(statusLabel?.textContent).toBe('INITIALISIERUNG DES OBSERVATORIUM-KERNS...');
        expect(subsystemsLabel?.textContent).toBe('STANDBY');

        loadingScreen.dispose();
    });

    it('should show localized assets text and ready/online states', async () => {
        i18n.setLanguage('bs');
        const loadingScreen = new LoadingScreen({ minDisplayDuration: 50 });

        THREE.DefaultLoadingManager.onProgress?.('texture.jpg', 2, 4);
        const subsystemsLabel = container.querySelector('.loading-subsystems');
        expect(subsystemsLabel?.textContent).toBe('RESURSI: 2/4');

        const completePromise = loadingScreen.complete();
        await vi.advanceTimersByTimeAsync(300);
        expect(subsystemsLabel?.textContent).toBe('AKTIVNO');
        const statusLabel = container.querySelector('.loading-status-text');
        expect(statusLabel?.textContent).toBe('SISTEMI OPERATIVNI • OPSERVATORIJA SPREMNA');

        await vi.advanceTimersByTimeAsync(800);
        await completePromise;
    });
});
