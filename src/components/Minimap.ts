import * as THREE from 'three';
import { SceneManager } from './SceneManager';

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
        this.isVisible = true;

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
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.03)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.08)');
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Trailing radar beam cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, cx - 4 * dpr, this.sweepAngle - 0.45, this.sweepAngle);
        ctx.closePath();
        const beamGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
        beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
        ctx.fillStyle = beamGrad;
        ctx.fill();

        // Active scan line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(this.sweepAngle) * (cx - 4 * dpr), cy + Math.sin(this.sweepAngle) * (cy - 4 * dpr));
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.restore();

        // Concentric range rings & labels
        const ringLabels = ['10 AU', '20 AU', '30 AU', '40 AU'];
        for (let i = 1; i <= 4; i++) {
            const r = (cx * i) / 4.2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = i === 4 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.15)';
            ctx.lineWidth = 1 * dpr;
            ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.font = `${9 * dpr}px 'Orbitron', monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(ringLabels[i - 1], cx, cy - r + 10 * dpr);
        }

        // Reticle Crosshairs with breaks
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx, 8 * dpr); ctx.lineTo(cx, height - 8 * dpr);
        ctx.moveTo(8 * dpr, cy); ctx.lineTo(width - 8 * dpr, cy);
        ctx.stroke();

        // Cardinal Ticks
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.font = `bold ${8 * dpr}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', cx, 10 * dpr);
        ctx.fillText('S', cx, height - 10 * dpr);
        ctx.fillText('W', 10 * dpr, cy);
        ctx.fillText('E', width - 10 * dpr, cy);

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

            // Glow Halo
            ctx.beginPath();
            ctx.arc(rx, ry, (isSun ? 7 : 4) * dpr, 0, Math.PI * 2);
            ctx.fillStyle = isSun ? 'rgba(255, 180, 0, 0.35)' : 'rgba(56, 189, 248, 0.25)';
            ctx.fill();

            // Core Blip Dot
            ctx.beginPath();
            ctx.arc(rx, ry, (isSun ? 4.5 : 2.5) * dpr, 0, Math.PI * 2);
            ctx.fillStyle = '#' + planet.data.color.toString(16).padStart(6, '0');
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
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

