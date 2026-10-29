/**
 * PerformanceMonitor.ts
 * Real-time performance telemetry HUD widget.
 * Tracks FPS, frame time, draw calls, triangles, active textures, and memory.
 */

import * as THREE from 'three';
import { i18n } from '../i18n';
import { PreferencesManager } from './PreferencesManager';

export class PerformanceMonitor {
    private renderer: THREE.WebGLRenderer;
    private container: HTMLElement;
    private domElement: HTMLElement;
    private isVisible: boolean = true;
    private unregisterI18n: (() => void) | null = null;

    // Metric tracking
    private lastTimestamp: number = 0;
    private lastDomUpdate: number = 0;
    private frameCount: number = 0;
    private currentFps: number = 60;
    private currentFrameTime: number = 16.6;

    // Cached DOM sub-elements (zero querySelector calls in render loop)
    private fpsBadge: HTMLElement;
    private msBadge: HTMLElement;
    private callsBadge: HTMLElement;
    private trisBadge: HTMLElement;
    private texBadge: HTMLElement;
    private memBadge: HTMLElement;
    private memContainer: HTMLElement;
    private callsLabel: HTMLElement;
    private trisLabel: HTMLElement;
    private texLabel: HTMLElement;
    private memLabel: HTMLElement;

    constructor(renderer: THREE.WebGLRenderer, container: HTMLElement = document.body, initialVisible?: boolean) {
        this.renderer = renderer;
        this.container = container;
        this.isVisible = initialVisible !== undefined ? initialVisible : PreferencesManager.get('telemetry');

        this.domElement = document.createElement('div');
        this.domElement.className = 'perf-monitor-hud';
        this.domElement.style.display = this.isVisible ? 'flex' : 'none';
        this.domElement.setAttribute('role', 'status');
        this.domElement.setAttribute('aria-label', i18n.t('ui.telemetry'));

        this.domElement.innerHTML = `
            <div class="perf-row main">
                <span class="perf-metric fps-metric"><span class="perf-val" id="perfFps">60</span> <span class="perf-unit">FPS</span></span>
                <span class="perf-metric ms-metric"><span class="perf-val" id="perfMs">16.6</span> <span class="perf-unit">ms</span></span>
            </div>
            <div class="perf-row sub">
                <span class="perf-metric" title="WebGL Draw Calls"><span class="perf-lbl" data-perf-lbl="calls"></span>: <strong id="perfCalls">0</strong></span>
                <span class="perf-metric" title="Rendered Triangles"><span class="perf-lbl" data-perf-lbl="tris"></span>: <strong id="perfTris">0</strong></span>
                <span class="perf-metric" title="Active GPU Textures"><span class="perf-lbl" data-perf-lbl="tex"></span>: <strong id="perfTex">0</strong></span>
                <span class="perf-metric" id="perfMemContainer" title="JS Heap Memory"><span class="perf-lbl" data-perf-lbl="mem"></span>: <strong id="perfMem">0</strong></span>
            </div>
        `;

        this.fpsBadge = this.domElement.querySelector('#perfFps') as HTMLElement;
        this.msBadge = this.domElement.querySelector('#perfMs') as HTMLElement;
        this.callsBadge = this.domElement.querySelector('#perfCalls') as HTMLElement;
        this.trisBadge = this.domElement.querySelector('#perfTris') as HTMLElement;
        this.texBadge = this.domElement.querySelector('#perfTex') as HTMLElement;
        this.memBadge = this.domElement.querySelector('#perfMem') as HTMLElement;
        this.memContainer = this.domElement.querySelector('#perfMemContainer') as HTMLElement;
        this.callsLabel = this.domElement.querySelector('[data-perf-lbl="calls"]') as HTMLElement;
        this.trisLabel = this.domElement.querySelector('[data-perf-lbl="tris"]') as HTMLElement;
        this.texLabel = this.domElement.querySelector('[data-perf-lbl="tex"]') as HTMLElement;
        this.memLabel = this.domElement.querySelector('[data-perf-lbl="mem"]') as HTMLElement;

        this.syncLabels();

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.syncLabels();
        });

        this.container.appendChild(this.domElement);

        if (this.isVisible) {
            this.renderMetrics();
        }
    }

    private syncLabels(): void {
        this.domElement.setAttribute('aria-label', i18n.t('ui.telemetry'));
        if (this.callsLabel) this.callsLabel.textContent = i18n.t('ui.perfCalls') || 'Calls';
        if (this.trisLabel) this.trisLabel.textContent = i18n.t('ui.perfTris') || 'Tris';
        if (this.texLabel) this.texLabel.textContent = i18n.t('ui.perfTex') || 'Tex';
        if (this.memLabel) this.memLabel.textContent = i18n.t('ui.perfMem') || 'Mem';
    }

    /**
     * Called on each animation frame
     */
    public update(timestamp: number): void {
        if (this.lastTimestamp === 0) {
            this.lastTimestamp = timestamp;
            this.lastDomUpdate = timestamp;
            return;
        }

        const delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (delta > 0) {
            const instantFps = 1000 / delta;
            this.currentFps = Math.round(this.currentFps * 0.85 + instantFps * 0.15);
            this.currentFrameTime = Math.round((this.currentFrameTime * 0.85 + delta * 0.15) * 10) / 10;
        }

        this.frameCount++;

        // Update DOM at 4Hz to prevent browser reflow thrashing
        if (this.isVisible && timestamp - this.lastDomUpdate > 250) {
            this.lastDomUpdate = timestamp;
            this.renderMetrics();
        }
    }

    private renderMetrics(): void {
        if (!this.renderer || !this.renderer.info) return;

        this.fpsBadge.textContent = String(this.currentFps);
        if (this.currentFps >= 50) {
            this.fpsBadge.style.color = '#38bdf8';
        } else if (this.currentFps >= 30) {
            this.fpsBadge.style.color = '#facc15';
        } else {
            this.fpsBadge.style.color = '#f87171';
        }

        this.msBadge.textContent = this.currentFrameTime.toFixed(1);

        const renderInfo = this.renderer.info.render;
        const memoryInfo = this.renderer.info.memory;

        if (this.callsBadge) this.callsBadge.textContent = String(renderInfo.calls);
        if (this.trisBadge) {
            const tris = renderInfo.triangles;
            this.trisBadge.textContent = tris > 1000 ? `${(tris / 1000).toFixed(1)}k` : String(tris);
        }
        if (this.texBadge) {
            this.texBadge.textContent = String(memoryInfo.textures);
        }

        const perf = (performance as any);
        if (perf && perf.memory && this.memBadge) {
            if (this.memContainer) this.memContainer.style.display = '';
            const usedMb = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
            this.memBadge.textContent = `${usedMb}MB`;
        } else if (this.memContainer) {
            this.memContainer.style.display = 'none';
        }
    }

    public toggle(): boolean {
        return this.setVisible(!this.isVisible);
    }

    public setVisible(visible: boolean): boolean {
        this.isVisible = visible;
        this.domElement.style.display = visible ? 'flex' : 'none';
        if (visible) {
            this.renderMetrics();
        }
        PreferencesManager.set('telemetry', visible);
        return this.isVisible;
    }

    public getVisible(): boolean {
        return this.isVisible;
    }

    public dispose(): void {
        if (this.unregisterI18n) {
            this.unregisterI18n();
            this.unregisterI18n = null;
        }
        if (this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
    }
}
