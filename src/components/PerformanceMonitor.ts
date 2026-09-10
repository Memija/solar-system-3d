/**
 * PerformanceMonitor.ts
 * Real-time performance telemetry HUD widget.
 * Tracks FPS, frame time, draw calls, triangles, active textures, and memory.
 */

import * as THREE from 'three';
import { i18n } from '../i18n';

export class PerformanceMonitor {
    private renderer: THREE.WebGLRenderer;
    private container: HTMLElement;
    private domElement: HTMLElement;
    private isVisible: boolean = false;
    private unregisterI18n: (() => void) | null = null;

    // Metric tracking
    private lastTimestamp: number = 0;
    private lastDomUpdate: number = 0;
    private frameCount: number = 0;
    private currentFps: number = 60;
    private currentFrameTime: number = 16.6;

    // DOM sub-elements
    private fpsBadge: HTMLElement;
    private msBadge: HTMLElement;
    private callsBadge: HTMLElement;
    private trisBadge: HTMLElement;
    private memBadge: HTMLElement;

    constructor(renderer: THREE.WebGLRenderer, container: HTMLElement = document.body) {
        this.renderer = renderer;
        this.container = container;

        this.domElement = document.createElement('div');
        this.domElement.className = 'perf-monitor-hud';
        this.domElement.style.display = 'none';
        this.domElement.setAttribute('role', 'status');
        this.domElement.setAttribute('aria-label', i18n.t('ui.telemetry'));

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.domElement.setAttribute('aria-label', i18n.t('ui.telemetry'));
        });

        this.domElement.innerHTML = `
            <div class="perf-row main">
                <span class="perf-metric fps-metric"><span class="perf-val" id="perfFps">60</span> <span class="perf-unit">FPS</span></span>
                <span class="perf-metric ms-metric"><span class="perf-val" id="perfMs">16.6</span> <span class="perf-unit">ms</span></span>
            </div>
            <div class="perf-row sub">
                <span class="perf-metric" title="WebGL Draw Calls">Calls: <strong id="perfCalls">0</strong></span>
                <span class="perf-metric" title="Rendered Triangles">Tris: <strong id="perfTris">0</strong></span>
                <span class="perf-metric" title="Active GPU Textures">Tex: <strong id="perfTex">0</strong></span>
                <span class="perf-metric" id="perfMemContainer" title="JS Heap Memory">Mem: <strong id="perfMem">0</strong></span>
            </div>
        `;

        this.fpsBadge = this.domElement.querySelector('#perfFps') as HTMLElement;
        this.msBadge = this.domElement.querySelector('#perfMs') as HTMLElement;
        this.callsBadge = this.domElement.querySelector('#perfCalls') as HTMLElement;
        this.trisBadge = this.domElement.querySelector('#perfTris') as HTMLElement;
        this.memBadge = this.domElement.querySelector('#perfMem') as HTMLElement;

        this.container.appendChild(this.domElement);
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

        // Color coding for FPS
        this.fpsBadge.textContent = String(this.currentFps);
        if (this.currentFps >= 50) {
            this.fpsBadge.style.color = '#38bdf8'; // Cyan
        } else if (this.currentFps >= 30) {
            this.fpsBadge.style.color = '#facc15'; // Amber
        } else {
            this.fpsBadge.style.color = '#f87171'; // Red
        }

        this.msBadge.textContent = this.currentFrameTime.toFixed(1);

        const renderInfo = this.renderer.info.render;
        const memoryInfo = this.renderer.info.memory;

        if (this.callsBadge) this.callsBadge.textContent = String(renderInfo.calls);
        if (this.trisBadge) {
            const tris = renderInfo.triangles;
            this.trisBadge.textContent = tris > 1000 ? `${(tris / 1000).toFixed(1)}k` : String(tris);
        }
        if (this.domElement.querySelector('#perfTex')) {
            const texSpan = this.domElement.querySelector('#perfTex');
            if (texSpan) texSpan.textContent = String(memoryInfo.textures);
        }

        const perf = (performance as any);
        if (perf && perf.memory && this.memBadge) {
            const usedMb = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
            this.memBadge.textContent = `${usedMb}MB`;
        } else {
            const memRow = this.domElement.querySelector('#perfMemContainer') as HTMLElement;
            if (memRow) memRow.style.display = 'none';
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
