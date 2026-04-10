import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';

export class Minimap {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    sceneManager: SceneManager;
    size: number;
    maxDistance: number;
    isVisible: boolean;

    constructor(sceneManager: SceneManager, container: HTMLElement) {
        this.sceneManager = sceneManager;
        this.size = 200; // 200x200 pixels
        // Neptune is at distance 640. Eris at 780. Voyager 1 is at 800+.
        // Let's set max distance to 850.
        this.maxDistance = 850;
        this.isVisible = true;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.position = 'absolute';
        this.canvas.style.bottom = '20px';
        this.canvas.style.right = '20px';
        this.canvas.style.borderRadius = '50%';
        this.canvas.style.border = '2px solid rgba(100, 150, 255, 0.5)';
        this.canvas.style.backgroundColor = 'rgba(0, 10, 20, 0.7)';
        this.canvas.style.pointerEvents = 'none'; // click through
        this.canvas.style.boxShadow = '0 0 15px rgba(0, 100, 255, 0.3)';

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context for minimap");
        this.context = ctx;

        container.appendChild(this.canvas);
    }

    setVisible(visible: boolean) {
        this.isVisible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
    }

    update() {
        if (!this.isVisible) return;

        const ctx = this.context;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cx = width / 2;
        const cy = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Draw radar background
        ctx.strokeStyle = 'rgba(50, 100, 200, 0.3)';
        ctx.lineWidth = 1;

        // Concentric circles
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, (cx * i) / 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();

        // Helper function to map 3D distance to radar radius
        const mapToRadar = (x3d: number, z3d: number) => {
            const scale = (this.size / 2) / this.maxDistance;
            const rx = cx + x3d * scale;
            const ry = cy + z3d * scale;
            return { rx, ry };
        };

        // Draw planets and dwarf planets
        this.sceneManager.planets.forEach(planet => {
            // Ignore if dwarf planet and they are hidden
            if (planet.data.isDwarfPlanet && !this.sceneManager.showDwarfPlanets) return;

            const pos = planet.orbitGroup.position;
            const { rx, ry } = mapToRadar(pos.x, pos.z);

            ctx.beginPath();
            // Sun gets a bigger dot
            const isSun = planet.data.name === 'Sun';
            const radius = isSun ? 4 : 2;
            ctx.arc(rx, ry, radius, 0, Math.PI * 2);

            ctx.fillStyle = '#' + planet.data.color.toString(16).padStart(6, '0');
            ctx.fill();

            // Outline for visibility
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();
        });

        // Draw comets
        if (this.sceneManager.showComets) {
            this.sceneManager.comets.forEach(comet => {
                const pos = comet.mesh.position;
                const { rx, ry } = mapToRadar(pos.x, pos.z);

                ctx.beginPath();
                ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#' + comet.data.color.toString(16).padStart(6, '0');
                ctx.fill();
            });
        }

        // Draw spacecrafts
        if (this.sceneManager.showSpacecrafts) {
            this.sceneManager.spacecrafts.forEach(sc => {
                // If it's a child of a planet, use the world position
                const pos = new THREE.Vector3();
                sc.mesh.getWorldPosition(pos);

                const { rx, ry } = mapToRadar(pos.x, pos.z);

                ctx.beginPath();
                ctx.arc(rx, ry, 1, 0, Math.PI * 2);
                ctx.fillStyle = '#' + sc.data.color.toString(16).padStart(6, '0');
                ctx.fill();
            });
        }

        // Draw camera position and view direction
        const camPos = this.sceneManager.camera.position;
        const { rx: camX, ry: camY } = mapToRadar(camPos.x, camPos.z);

        // Get camera direction (projected on XZ plane)
        const camDir = new THREE.Vector3();
        this.sceneManager.camera.getWorldDirection(camDir);

        // The camera looks down the -Z axis of its local space
        const angle = Math.atan2(camDir.z, camDir.x);

        // Draw view cone
        const coneLength = 20;
        const fovRad = THREE.MathUtils.degToRad(this.sceneManager.camera.fov);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.arc(camX, camY, coneLength, angle - fovRad / 2, angle + fovRad / 2);
        ctx.lineTo(camX, camY);
        ctx.fill();

        // Draw camera dot
        ctx.beginPath();
        ctx.arc(camX, camY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}
