import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { PreferencesManager } from './PreferencesManager';
import { i18n } from '../i18n';

export class Minimap {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    sceneManager: SceneManager;
    size: number;
    maxDistance: number;
    sweepAngle: number = 0;
    public isVisible: boolean = true;
    private static readonly _tempPos = new THREE.Vector3();
    private static readonly _camDir = new THREE.Vector3();
    private static readonly _radarPt = { rx: 0, ry: 0 };
    private static readonly _hexCache = new Map<number, { solid: string; glow: string }>();
    private onPointerDownBound: (e: PointerEvent) => void;
    private onResizeBound: () => void;
    private unregisterI18n: (() => void) | null = null;
    private lastDrawTime: number = -1;
    private reducedMotion: boolean = false;
    private staticCanvas: HTMLCanvasElement | null = null;
    private staticCtx: CanvasRenderingContext2D | null = null;
    private staticCacheKey: string = '';
    private cachedBeamGrad: CanvasGradient | null = null;
    private cachedBeamGradKey: string = '';

    getEffectiveSize(): number {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            return 130;
        }
        return 210;
    }

    private getEffectiveMaxDistance(): number {
        // In realistic distances mode, 1 AU = 130 units, so 45 AU (Neptune + Kuiper Belt) = 5850 units
        return this.sceneManager.realisticDistances ? 5850 : this.maxDistance;
    }

    resize(newSize: number) {
        this.size = newSize;
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        this.canvas.width = this.size * dpr;
        this.canvas.height = this.size * dpr;
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.lastDrawTime = -1;
    }

    constructor(sceneManager: SceneManager, container: HTMLElement) {
        this.sceneManager = sceneManager;
        this.size = this.getEffectiveSize();
        this.maxDistance = 850;
        this.isVisible = PreferencesManager.get('minimap');

        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size * dpr;
        this.canvas.height = this.size * dpr;
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.canvas.className = 'minimap-radar';
        this.canvas.style.pointerEvents = 'auto';
        this.canvas.style.display = this.isVisible ? 'block' : 'none';

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context for minimap');
        this.context = ctx;

        container.appendChild(this.canvas);

        this.onPointerDownBound = (e: PointerEvent) => this.onPointerDown(e);
        this.onResizeBound = () => {
            const eff = this.getEffectiveSize();
            if (this.size !== eff) {
                this.resize(eff);
            }
        };

        this.unregisterI18n = i18n.onLanguageChange(() => {
            this.lastDrawTime = -1;
            if (this.isVisible) {
                this.update();
            }
        });

        this.canvas.addEventListener('pointerdown', this.onPointerDownBound);
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this.onResizeBound);
        }
    }

    dispose() {
        this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.onResizeBound);
        }
        if (this.unregisterI18n) {
            this.unregisterI18n();
            this.unregisterI18n = null;
        }
        if (this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }

    onPointerDown(event: PointerEvent) {
        if (!this.isVisible) return;
        event.stopPropagation();

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const radius = rect.width / 2;
        const cx = radius;
        const cy = radius;

        const distFromCenter = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        if (distFromCenter > radius) return;

        const effectiveMax = this.getEffectiveMaxDistance();
        const scale = effectiveMax / Math.max(1, radius - 10);
        const x3d = (x - cx) * scale;
        const z3d = (y - cy) * scale;

        this.sceneManager.detachCamera();

        const minHeight = this.sceneManager.realisticDistances ? 150 : 100;
        let currentY = this.sceneManager.camera.position.y;
        if (currentY < 10) currentY = minHeight;

        this.sceneManager.controls.target.set(x3d, 0, z3d);
        this.sceneManager.camera.position.set(x3d, currentY, z3d + currentY);
        this.sceneManager.controls.update();
        this.lastDrawTime = -1;
    }

    setVisible(visible: boolean) {
        this.isVisible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        this.lastDrawTime = -1;
        PreferencesManager.set('minimap', visible);
    }

    private renderStaticBackdrop(targetCtx: CanvasRenderingContext2D, width: number, height: number, dpr: number) {
        const cx = width / 2;
        const cy = height / 2;

        targetCtx.clearRect(0, 0, width, height);

        // Holographic Radar Background Sector
        const sweepGrad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, cx);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.03)');
        sweepGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.06)');
        sweepGrad.addColorStop(1, 'rgba(129, 140, 248, 0.13)');
        targetCtx.fillStyle = sweepGrad;
        targetCtx.beginPath();
        targetCtx.arc(cx, cy, cx - 2 * dpr, 0, Math.PI * 2);
        targetCtx.fill();

        // Outer azimuth degree tick marks
        targetCtx.save();
        const outerR = cx - 3 * dpr;
        for (let deg = 0; deg < 360; deg += 15) {
            if (deg % 90 === 0) continue;
            const rad = (deg * Math.PI) / 180;
            const isMajor = deg % 45 === 0;
            const tickLen = (isMajor ? 5 : 2.5) * dpr;
            const cosR = Math.cos(rad);
            const sinR = Math.sin(rad);
            targetCtx.beginPath();
            targetCtx.moveTo(cx + cosR * (outerR - tickLen), cy + sinR * (outerR - tickLen));
            targetCtx.lineTo(cx + cosR * outerR, cy + sinR * outerR);
            targetCtx.strokeStyle = isMajor ? 'rgba(125, 211, 252, 0.45)' : 'rgba(56, 189, 248, 0.22)';
            targetCtx.lineWidth = (isMajor ? 1.2 : 0.8) * dpr;
            targetCtx.stroke();
        }
        targetCtx.restore();

        // Concentric range rings & localized high-contrast AU labels
        const unitAU = i18n.t('measurement.unitAU') || 'AU';
        const showRingText = this.size >= 160;
        targetCtx.fillStyle = 'rgba(186, 230, 253, 0.78)';
        targetCtx.font = `600 ${8.5 * dpr}px "JetBrains Mono", "Orbitron", monospace`;
        targetCtx.textAlign = 'center';
        for (let i = 1; i <= 4; i++) {
            const r = (cx * i) / 4.2;
            targetCtx.beginPath();
            targetCtx.arc(cx, cy, r, 0, Math.PI * 2);
            targetCtx.strokeStyle = i === 4 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.18)';
            targetCtx.lineWidth = 1 * dpr;
            targetCtx.stroke();

            if (showRingText || i % 2 === 0) {
                targetCtx.fillText(`${i * 10} ${unitAU}`, cx, cy - r + 10 * dpr);
            }
        }

        // Reticle Crosshairs
        targetCtx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        targetCtx.lineWidth = 1 * dpr;
        targetCtx.beginPath();
        targetCtx.moveTo(cx, 16 * dpr); targetCtx.lineTo(cx, height - 16 * dpr);
        targetCtx.moveTo(16 * dpr, cy); targetCtx.lineTo(width - 16 * dpr, cy);
        targetCtx.stroke();

        // Localized Cardinal Ticks
        targetCtx.fillStyle = 'rgba(224, 242, 254, 0.9)';
        targetCtx.font = `bold ${8.5 * dpr}px "Exo 2", "Space Grotesk", sans-serif`;
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText(i18n.t('ui.compassN') || 'N', cx, 9.5 * dpr);
        targetCtx.fillText(i18n.t('ui.compassS') || 'S', cx, height - 9.5 * dpr);
        targetCtx.fillText(i18n.t('ui.compassW') || 'W', 9.5 * dpr, cy);
        targetCtx.fillText(i18n.t('ui.compassE') || 'E', width - 9.5 * dpr, cy);
    }

    update() {
        if (!this.isVisible) return;

        // Throttle 2D radar redraws to ~24 Hz to keep main thread crisp at 60-120 FPS
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (this.lastDrawTime >= 0 && now - this.lastDrawTime < 42) {
            return;
        }
        this.lastDrawTime = now;

        const ctx = this.context;
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const width = this.size * dpr;
        const height = this.size * dpr;
        const cx = width / 2;
        const cy = height / 2;
        const effectiveMax = this.getEffectiveMaxDistance();

        ctx.clearRect(0, 0, width, height);

        if (!this.reducedMotion) {
            this.sweepAngle = (this.sweepAngle + 0.055) % (Math.PI * 2);
        }

        const cacheKey = `${width}x${height}:${dpr}:${i18n.currentLanguage}`;
        if (typeof ctx.drawImage === 'function' && typeof document !== 'undefined') {
            if (!this.staticCanvas) {
                this.staticCanvas = document.createElement('canvas');
                this.staticCtx = this.staticCanvas.getContext('2d');
            }
            if (this.staticCtx) {
                if (this.staticCacheKey !== cacheKey) {
                    this.staticCanvas.width = width;
                    this.staticCanvas.height = height;
                    this.renderStaticBackdrop(this.staticCtx, width, height, dpr);
                    this.staticCacheKey = cacheKey;
                }
                ctx.drawImage(this.staticCanvas, 0, 0);
            } else {
                this.renderStaticBackdrop(ctx, width, height, dpr);
            }
        } else {
            this.renderStaticBackdrop(ctx, width, height, dpr);
        }

        // Trailing radar beam cone (suppressed under prefers-reduced-motion)
        if (!this.reducedMotion) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, cx - 4 * dpr, this.sweepAngle - 0.5, this.sweepAngle);
            ctx.closePath();
            const beamKey = `${cx}:${cy}`;
            if (!this.cachedBeamGrad || this.cachedBeamGradKey !== beamKey) {
                const beamGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
                beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
                beamGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.12)');
                beamGrad.addColorStop(1, 'rgba(125, 211, 252, 0.24)');
                this.cachedBeamGrad = beamGrad;
                this.cachedBeamGradKey = beamKey;
            }
            ctx.fillStyle = this.cachedBeamGrad;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(this.sweepAngle) * (cx - 4 * dpr), cy + Math.sin(this.sweepAngle) * (cy - 4 * dpr));
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.82)';
            ctx.lineWidth = 1.4 * dpr;
            ctx.stroke();
            ctx.restore();
        }

        const usableRadius = cx - 10 * dpr;
        const radarScale = usableRadius / effectiveMax;
        const mapToRadar = (x3d: number, z3d: number) => {
            let dx = x3d * radarScale;
            let dy = z3d * radarScale;
            const distSq = dx * dx + dy * dy;
            if (distSq > usableRadius * usableRadius) {
                const invDist = usableRadius / Math.sqrt(distSq);
                dx *= invDist;
                dy *= invDist;
            }
            Minimap._radarPt.rx = cx + dx;
            Minimap._radarPt.ry = cy + dy;
            return Minimap._radarPt;
        };

        // Draw planets and dwarf planets
        this.sceneManager.planets.forEach(planet => {
            if (planet.data.isDwarfPlanet && !this.sceneManager.showDwarfPlanets) return;

            const pos = planet.orbitGroup.position;
            const pt = mapToRadar(pos.x, pos.z);
            const rx = pt.rx;
            const ry = pt.ry;
            const isSun = planet.data.name === 'Sun';
            const isFocused = this.sceneManager.focusedBody === planet;
            let colorEntry = Minimap._hexCache.get(planet.data.color);
            if (!colorEntry) {
                const solid = '#' + planet.data.color.toString(16).padStart(6, '0');
                colorEntry = { solid, glow: solid + '44' };
                Minimap._hexCache.set(planet.data.color, colorEntry);
            }

            ctx.beginPath();
            ctx.arc(rx, ry, (isSun ? 7.5 : isFocused ? 6 : 4.2) * dpr, 0, Math.PI * 2);
            ctx.fillStyle = isSun ? 'rgba(251, 191, 36, 0.38)' : colorEntry.glow;
            ctx.fill();

            if (isFocused && !isSun) {
                ctx.beginPath();
                ctx.arc(rx, ry, 6.5 * dpr, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(125, 211, 252, 0.92)';
                ctx.lineWidth = 1 * dpr;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(rx, ry, (isSun ? 4.5 : 2.6) * dpr, 0, Math.PI * 2);
            ctx.fillStyle = colorEntry.solid;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.lineWidth = 0.8 * dpr;
            ctx.stroke();
        });

        // Draw comets using world position of orbitGroup (not local mesh.position which is always 0,0,0)
        if (this.sceneManager.showComets) {
            ctx.fillStyle = '#67e8f9';
            this.sceneManager.comets.forEach(comet => {
                comet.orbitGroup.getWorldPosition(Minimap._tempPos);
                const pt = mapToRadar(Minimap._tempPos.x, Minimap._tempPos.z);

                ctx.beginPath();
                ctx.arc(pt.rx, pt.ry, 2.1 * dpr, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw spacecrafts
        if (this.sceneManager.showSpacecrafts) {
            ctx.fillStyle = '#f59e0b';
            this.sceneManager.spacecrafts.forEach(sc => {
                if (sc.baseGroup && !sc.baseGroup.visible) return;
                sc.mesh.getWorldPosition(Minimap._tempPos);
                const pt = mapToRadar(Minimap._tempPos.x, Minimap._tempPos.z);

                ctx.beginPath();
                ctx.arc(pt.rx, pt.ry, 1.8 * dpr, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Camera position and view field cone
        const camPos = this.sceneManager.camera.position;
        const camPt = mapToRadar(camPos.x, camPos.z);
        const camX = camPt.rx;
        const camY = camPt.ry;

        this.sceneManager.camera.getWorldDirection(Minimap._camDir);
        const angle = Math.atan2(Minimap._camDir.z, Minimap._camDir.x);

        const coneLength = 22 * dpr;
        const fovRad = THREE.MathUtils.degToRad(this.sceneManager.camera.fov);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.arc(camX, camY, coneLength, angle - fovRad / 2, angle + fovRad / 2);
        ctx.lineTo(camX, camY);
        ctx.fill();

        // Camera Dot
        ctx.beginPath();
        ctx.arc(camX, camY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
    }
}
