import * as THREE from 'three';
import { i18n } from '../i18n';

export interface LoadingScreenOptions {
    minDisplayDuration?: number;
    safetyTimeoutDuration?: number;
}

export class LoadingScreen {
    private element: HTMLElement;
    private progressBar: HTMLElement | null = null;
    private percentageLabel: HTMLElement | null = null;
    private statusLabel: HTMLElement | null = null;
    private subsystemsLabel: HTMLElement | null = null;
    private badgeLabel: HTMLElement | null = null;
    private subtitleLabel: HTMLElement | null = null;
    private hasCustomStatus: boolean = false;
    private hasCustomSubsystems: boolean = false;
    private unsubscribeI18n: (() => void) | null = null;

    private currentProgress: number = 0;
    private targetProgress: number = 10;
    private isCompleted: boolean = false;
    private isDisposed: boolean = false;
    private minDisplayDuration: number;
    private startTime: number;
    private rafId: number | null = null;
    private safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

    private totalAssets: number = 0;
    private loadedAssets: number = 0;

    constructor(options: LoadingScreenOptions = {}) {
        this.minDisplayDuration = options.minDisplayDuration ?? 650;
        this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

        // 1. Locate or create loading screen element
        let existing = document.getElementById('loading-screen');
        if (!existing) {
            existing = this.createDefaultElement();
            document.body.prepend(existing);
        }
        this.element = existing;

        this.progressBar = this.element.querySelector('.loading-progress-bar');
        this.percentageLabel = this.element.querySelector('.loading-percentage');
        this.statusLabel = this.element.querySelector('.loading-status-text');
        this.subsystemsLabel = this.element.querySelector('.loading-subsystems');
        this.badgeLabel = this.element.querySelector('.loading-badge span:last-child');
        this.subtitleLabel = this.element.querySelector('.loading-subtitle');

        // Apply localization to loading screen elements
        this.applyTranslations();

        // Listen for language changes if language is updated while loading
        this.unsubscribeI18n = i18n.onLanguageChange(() => {
            this.applyTranslations();
        });

        // Signal to any inline ticker in index.html to stop
        if (typeof window !== 'undefined') {
            (window as any).loadingScreenInitialized = true;
        }

        // Read initial progress if already started by inline script
        if (this.progressBar && this.progressBar.style.width) {
            const parsed = parseFloat(this.progressBar.style.width);
            if (!isNaN(parsed) && parsed > 0) {
                this.currentProgress = parsed;
                this.targetProgress = Math.max(parsed, 20);
            }
        }

        // Initial progress state
        this.updateUI(this.currentProgress);

        // 2. Hook into Three.js DefaultLoadingManager
        this.setupThreeLoadingManager();

        // 3. Start smooth interpolation RAF loop
        this.startInterpolationLoop();

        // 4. Safety fallback timeout
        const safetyTimeout = options.safetyTimeoutDuration ?? 10000;
        this.safetyTimeoutId = setTimeout(() => {
            if (!this.isCompleted) {
                console.warn('[LoadingScreen] Safety timeout reached, forcing completion.');
                this.complete();
            }
        }, safetyTimeout);
    }

    public applyTranslations(): void {
        if (this.badgeLabel) {
            this.badgeLabel.textContent = i18n.t('loading.boot');
        }
        if (this.subtitleLabel) {
            this.subtitleLabel.textContent = i18n.t('loading.subtitle');
        }
        if (this.isCompleted) {
            if (this.statusLabel) {
                this.statusLabel.textContent = i18n.t('loading.ready');
            }
            if (this.subsystemsLabel) {
                this.subsystemsLabel.textContent = i18n.t('loading.online');
            }
        } else {
            if (!this.hasCustomStatus && this.statusLabel) {
                this.statusLabel.textContent = i18n.t('loading.core');
            }
            if (!this.hasCustomSubsystems && this.subsystemsLabel) {
                this.subsystemsLabel.textContent = i18n.t('loading.standby');
            }
        }
    }

    private setupThreeLoadingManager(): void {
        const manager = THREE.DefaultLoadingManager;

        const originalOnStart = manager.onStart;
        const originalOnProgress = manager.onProgress;
        const originalOnLoad = manager.onLoad;
        const originalOnError = manager.onError;

        manager.onStart = (url, itemsLoaded, itemsTotal) => {
            originalOnStart?.(url, itemsLoaded, itemsTotal);
            this.totalAssets = itemsTotal;
            this.loadedAssets = itemsLoaded;
            this.setProgress(
                Math.max(this.targetProgress, 35),
                i18n.t('loading.acquiring'),
                `${i18n.t('loading.assets')}: ${itemsLoaded}/${itemsTotal}`
            );
        };

        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            originalOnProgress?.(url, itemsLoaded, itemsTotal);
            this.totalAssets = itemsTotal;
            this.loadedAssets = itemsLoaded;
            // Map asset loading across 40% -> 92%
            const assetRatio = itemsTotal > 0 ? itemsLoaded / itemsTotal : 1;
            const computedProgress = 40 + assetRatio * 52;
            this.setProgress(
                computedProgress,
                assetRatio >= 1 ? i18n.t('loading.calibrating') : i18n.t('loading.streaming'),
                `${i18n.t('loading.assets')}: ${itemsLoaded}/${itemsTotal}`
            );
        };

        manager.onLoad = () => {
            originalOnLoad?.();
            this.setProgress(95, i18n.t('loading.synchronizing'), i18n.t('loading.loaded'));
        };

        manager.onError = (url) => {
            originalOnError?.(url);
            console.warn(`[LoadingScreen] Warning: Asset failed to load: ${url}`);
        };
    }

    private startInterpolationLoop(): void {
        const tick = () => {
            if (this.isDisposed) return;

            if (this.currentProgress < this.targetProgress) {
                // Smooth ease towards target progress
                const diff = this.targetProgress - this.currentProgress;
                const step = this.targetProgress >= 100 
                    ? Math.max(diff * 0.35, 3.0) 
                    : Math.max(diff * 0.14, 0.5);
                this.currentProgress = Math.min(this.currentProgress + step, this.targetProgress);
                this.updateUI(this.currentProgress);
            }


            this.rafId = requestAnimationFrame(tick);
        };

        this.rafId = requestAnimationFrame(tick);
    }

    private updateUI(progress: number): void {
        const rounded = Math.round(progress);
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        if (this.percentageLabel) {
            this.percentageLabel.textContent = `${rounded}%`;
        }
    }

    public setProgress(target: number, statusText?: string, subsystemsText?: string): void {
        this.targetProgress = Math.min(100, Math.max(this.targetProgress, target));

        if (statusText && this.statusLabel) {
            this.hasCustomStatus = true;
            this.statusLabel.textContent = statusText;
        }

        if (subsystemsText && this.subsystemsLabel) {
            this.hasCustomSubsystems = true;
            this.subsystemsLabel.textContent = subsystemsText;
        }
    }

    public setStatus(statusText: string, isComplete: boolean = false): void {
        this.hasCustomStatus = true;
        if (this.statusLabel) {
            this.statusLabel.textContent = statusText;
            if (isComplete) {
                this.statusLabel.classList.add('status-complete');
            } else {
                this.statusLabel.classList.remove('status-complete');
            }
        }
    }

    public async complete(): Promise<void> {
        if (this.isCompleted) return;
        this.isCompleted = true;

        if (this.safetyTimeoutId) {
            clearTimeout(this.safetyTimeoutId);
            this.safetyTimeoutId = null;
        }

        // Set target to 100% and smoothly finish filling the line together with percentage
        this.targetProgress = 100;

        await new Promise<void>(resolve => {
            const check = () => {
                if (this.currentProgress >= 99.5 || this.isDisposed) {
                    this.currentProgress = 100;
                    this.updateUI(100);
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });

        this.setStatus(i18n.t('loading.ready'), true);
        if (this.subsystemsLabel) {
            this.subsystemsLabel.textContent = i18n.t('loading.online');
        }


        // Ensure minimum visual duration so users experience a smooth transition
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const elapsed = now - this.startTime;
        const remainingWait = Math.max(0, this.minDisplayDuration - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingWait + 200));

        // Start cinematic dismissal transition
        this.element.classList.add('is-complete');

        // Cleanup element after transition finishes
        await new Promise(resolve => setTimeout(resolve, 750));
        this.element.classList.add('is-hidden');
        this.dispose();
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getProgress(): number {
        return this.currentProgress;
    }

    public isFinished(): boolean {
        return this.isCompleted;
    }

    public getAssetProgress(): { loaded: number; total: number } {
        return { loaded: this.loadedAssets, total: this.totalAssets };
    }


    public dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
        if (this.unsubscribeI18n) {
            this.unsubscribeI18n();
            this.unsubscribeI18n = null;
        }
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        if (this.safetyTimeoutId) {
            clearTimeout(this.safetyTimeoutId);
            this.safetyTimeoutId = null;
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    private createDefaultElement(): HTMLElement {
        const div = document.createElement('div');
        div.id = 'loading-screen';
        div.className = 'loading-screen';
        div.innerHTML = `
            <div class="loading-content">
                <div class="loading-badge">
                    <span class="status-live-dot"></span>
                    <span>${i18n.t('loading.boot')}</span>
                </div>
                <div class="loading-orrery">
                    <div class="loading-sun"></div>
                    <div class="loading-sun-corona"></div>
                    <div class="loading-orbit-system">
                        <div class="loading-orbit-ring ring-inner">
                            <div class="loading-planet"></div>
                        </div>
                        <div class="loading-orbit-ring ring-middle">
                            <div class="loading-planet"></div>
                        </div>
                        <div class="loading-orbit-ring ring-outer">
                            <div class="loading-planet"></div>
                        </div>
                    </div>
                </div>
                <h1 class="loading-title">SOLAR SYSTEM 3D</h1>
                <p class="loading-subtitle">${i18n.t('loading.subtitle')}</p>
                <div class="loading-progress-wrapper">
                    <div class="loading-status-text">${i18n.t('loading.core')}</div>
                    <div class="loading-progress-bar-container">
                        <div class="loading-progress-bar"></div>
                    </div>
                    <div class="loading-telemetry-row">
                        <span class="loading-percentage">0%</span>
                        <span class="loading-subsystems">${i18n.t('loading.standby')}</span>
                    </div>
                </div>
            </div>
        `;
        return div;
    }
}
