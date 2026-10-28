import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { PreferencesManager } from './PreferencesManager';

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
    private onPointerDownBound: (e: PointerEvent) => void;
    private onResizeBound: () => void;

    getEffectiveSize(): number {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            return 130;
        }
        return 210;
    }

    resize(newSize: number) {
        this.size = newSize;
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        this.canvas.width = this.size * dpr;
        this.canvas.height = this.size * dpr;
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
    }

    constructor(sceneManager: SceneManager, container: HTMLElement) {
        this.sceneManager = sceneManager;
        this.size = this.getEffectiveSize();
        this.maxDistance = 850;
        this.isVisible = PreferencesManager.get('minimap');

        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size * dpr;
        this.canvas.height = this.size * dpr;
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.canvas.className = 'minimap-radar';
        this.canvas.style.position = 'absolute';
        this.canvas.style.bottom = '20px';
        this.canvas.style.right = '20px';
        this.canvas.style.pointerEvents = 'auto';
        this.canvas.style.display = this.isVisible ? 'block' : 'none';

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context for minimap");
        this.context = ctx;

        container.appendChild(this.canvas);

        this.onPointerDownBound = (e: PointerEvent) => this.onPointerDown(e);
        this.onResizeBound = () => {
            const eff = this.getEffectiveSize();
            if (this.size !== eff) {
                this.resize(eff);
            }
        };

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

        const scale = this.maxDistance / radius;
        const x3d = (x - cx) * scale;
        const z3d = (y - cy) * scale;

        this.sceneManager.detachCamera();

        let currentY = this.sceneManager.camera.position.y;
        if (currentY < 10) currentY = 100;

        this.sceneManager.controls.target.set(x3d, 0, z3d);
        this.sceneManager.camera.position.set(x3d, currentY, z3d + currentY);
        this.sceneManager.controls.update();
    }

    setVisible(visible: boolean) {
        this.isVisible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        PreferencesManager.set('minimap', visible);
    }

    update() {
        if (!this.isVisible) return;

        const ctx = this.context;
        const dpr = window.devicePixelRatio || 1;
        const width = this.size * dpr;
        const height = this.size * dpr;
        const cx = width / 2;
        const cy = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Update rotating radar sweep
        this.sweepAngle = (this.sweepAngle + 0.025) % (Math.PI * 2);

        // Holographic Radar Background Sector Sweep
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.02)');
        sweepGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.05)');
        sweepGrad.addColorStop(1, 'rgba(129, 140, 248, 0.12)');
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Outer azimuth degree tick marks
        ctx.save();
        const outerR = cx - 3 * dpr;
        for (let deg = 0; deg < 360; deg += 15) {
            if (deg % 90 === 0) continue; // Leave room for N/S/E/W cardinal labels
            const rad = (deg * Math.PI) / 180;
            const isMajor = deg % 45 === 0;
            const tickLen = (isMajor ? 5 : 2.5) * dpr;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(rad) * (outerR - tickLen), cy + Math.sin(rad) * (outerR - tickLen));
            ctx.lineTo(cx + Math.cos(rad) * outerR, cy + Math.sin(rad) * outerR);
            ctx.strokeStyle = isMajor ? 'rgba(125, 211, 252, 0.42)' : 'rgba(56, 189, 248, 0.2)';
            ctx.lineWidth = (isMajor ? 1.2 : 0.8) * dpr;
            ctx.stroke();
        }
        ctx.restore();

        // Trailing radar beam cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, cx - 4 * dpr, this.sweepAngle - 0.5, this.sweepAngle);
        ctx.closePath();
        const beamGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
        beamGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.12)');
        beamGrad.addColorStop(1, 'rgba(125, 211, 252, 0.26)');
        ctx.fillStyle = beamGrad;
        ctx.fill();

        // Active scan line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(this.sweepAngle) * (cx - 4 * dpr), cy + Math.sin(this.sweepAngle) * (cy - 4 * dpr));
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.restore();

        // Concentric range rings & labels
        const ringLabels = ['10 AU', '20 AU', '30 AU', '40 AU'];
        for (let i = 1; i <= 4; i++) {
            const r = (cx * i) / 4.2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = i === 4 ? 'rgba(56, 189, 248, 0.38)' : 'rgba(56, 189, 248, 0.16)';
            ctx.lineWidth = 1 * dpr;
            ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(125, 211, 252, 0.48)';
            ctx.font = `${8.5 * dpr}px 'Orbitron', monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(ringLabels[i - 1], cx, cy - r + 10 * dpr);
        }

        // Reticle Crosshairs with breaks
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx, 16 * dpr); ctx.lineTo(cx, height - 16 * dpr);
        ctx.moveTo(16 * dpr, cy); ctx.lineTo(width - 16 * dpr, cy);
        ctx.stroke();

        // Cardinal Ticks
        ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
        ctx.font = `bold ${8.5 * dpr}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', cx, 9.5 * dpr);
        ctx.fillText('S', cx, height - 9.5 * dpr);
        ctx.fillText('W', 9.5 * dpr, cy);
        ctx.fillText('E', width - 9.5 * dpr, cy);

        // Helper function to map 3D distance to radar radius
        const mapToRadar = (x3d: number, z3d: number) => {
            const scale = (cx - 10 * dpr) / this.maxDistance;
            const rx = cx + x3d * scale;
            const ry = cy + z3d * scale;
            return { rx, ry };
        };

        // Draw planets and dwarf planets
        this.sceneManager.planets.forEach(planet => {
            if (planet.data.isDwarfPlanet && !this.sceneManager.showDwarfPlanets) return;

            const pos = planet.orbitGroup.position;
            const { rx, ry } = mapToRadar(pos.x, pos.z);
            const isSun = planet.data.name === 'Sun';
            const isFocused = this.sceneManager.focusedBody === planet;
            const hexColor = '#' + planet.data.color.toString(16).padStart(6, '0');

            // Glow Halo matched to planet's color
            ctx.beginPath();
            ctx.arc(rx, ry, (isSun ? 7.5 : isFocused ? 6 : 4.2) * dpr, 0, Math.PI * 2);
            ctx.fillStyle = isSun ? 'rgba(251, 191, 36, 0.38)' : hexColor + '44';
            ctx.fill();

            // Target lock ring if focused
            if (isFocused && !isSun) {
                ctx.beginPath();
                ctx.arc(rx, ry, 6.5 * dpr, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
                ctx.lineWidth = 1 * dpr;
                ctx.stroke();
            }

            // Core Blip Dot
            ctx.beginPath();
            ctx.arc(rx, ry, (isSun ? 4.5 : 2.6) * dpr, 0, Math.PI * 2);
            ctx.fillStyle = hexColor;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.lineWidth = 0.8 * dpr;
            ctx.stroke();
        });

        // Draw comets
        if (this.sceneManager.showComets) {
            this.sceneManager.comets.forEach(comet => {
                const pos = comet.mesh.position;
                const { rx, ry } = mapToRadar(pos.x, pos.z);

                ctx.beginPath();
                ctx.arc(rx, ry, 2 * dpr, 0, Math.PI * 2);
                ctx.fillStyle = '#67e8f9';
                ctx.fill();
            });
        }

        // Draw spacecrafts
        if (this.sceneManager.showSpacecrafts) {
            this.sceneManager.spacecrafts.forEach(sc => {
                sc.mesh.getWorldPosition(Minimap._tempPos);
                const { rx, ry } = mapToRadar(Minimap._tempPos.x, Minimap._tempPos.z);

                ctx.beginPath();
                ctx.arc(rx, ry, 1.8 * dpr, 0, Math.PI * 2);
                ctx.fillStyle = '#f59e0b';
                ctx.fill();
            });
        }

        // Camera position and view field cone
        const camPos = this.sceneManager.camera.position;
        const { rx: camX, ry: camY } = mapToRadar(camPos.x, camPos.z);

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

