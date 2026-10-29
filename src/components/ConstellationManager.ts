import * as THREE from 'three';
import { MajorConstellations } from './ConstellationData';

export class ConstellationManager {
    scene: THREE.Scene;
    constellationMeshes: THREE.Group[];
    interactableObjects: THREE.Object3D[];
    isVisible: boolean = true;
    private sharedStarGeometry: THREE.SphereGeometry | null = null;
    private sharedStarMaterial: THREE.MeshBasicMaterial | null = null;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.constellationMeshes = [];
        this.interactableObjects = [];
    }

    toggleVisibility(visible?: boolean): boolean {
        this.isVisible = visible !== undefined ? visible : !this.isVisible;
        this.constellationMeshes.forEach(group => {
            group.visible = this.isVisible;
        });
        return this.isVisible;
    }

    createConstellations() {
        const radius = 49000;
        this.sharedStarGeometry = new THREE.SphereGeometry(80, 8, 8);
        this.sharedStarMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        MajorConstellations.forEach(constellation => {
            const constellationGroup = new THREE.Group();
            constellationGroup.userData = constellation;
            constellationGroup.visible = this.isVisible;

            const points: THREE.Vector3[] = [];

            // Create Stars
            constellation.stars.forEach(star => {
                const raRad = (star.ra / 24) * Math.PI * 2;
                const decRad = (star.dec / 180) * Math.PI;

                const x = radius * Math.cos(decRad) * Math.cos(raRad);
                const z = -radius * Math.cos(decRad) * Math.sin(raRad);
                const y = radius * Math.sin(decRad);

                const pos = new THREE.Vector3(x, y, z);
                points.push(pos);

                const starMesh = new THREE.Mesh(this.sharedStarGeometry!, this.sharedStarMaterial!);
                starMesh.position.copy(pos);
                starMesh.matrixAutoUpdate = false;
                starMesh.updateMatrix();
                starMesh.userData = { ...constellation, type: 'ConstellationStar' };

                constellationGroup.add(starMesh);
                this.interactableObjects.push(starMesh);
            });

            // Batch all constellation lines into a single LineSegments draw call
            const lineVertices: number[] = [];
            constellation.connections.forEach(pair => {
                const pA = points[pair[0]];
                const pB = points[pair[1]];
                if (pA && pB) {
                    lineVertices.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
                }
            });

            if (lineVertices.length > 0) {
                const material = new THREE.LineBasicMaterial({
                    color: constellation.color,
                    linewidth: 1.5,
                    transparent: true,
                    opacity: 0.6,
                    depthWrite: false
                });
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
                const lineSegments = new THREE.LineSegments(geometry, material);
                lineSegments.matrixAutoUpdate = false;
                lineSegments.updateMatrix();
                lineSegments.userData = { ...constellation, type: 'ConstellationLine' };
                constellationGroup.add(lineSegments);
            }

            this.scene.add(constellationGroup);
            this.constellationMeshes.push(constellationGroup);
        });
    }

    getInteractableObjects(): THREE.Object3D[] {
        return this.interactableObjects;
    }

    getConstellationCenter(name: string): THREE.Vector3 | null {
        const group = this.constellationMeshes.find(g => g.userData.name === name);
        if (!group) return null;

        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }

    dispose() {
        this.constellationMeshes.forEach(group => {
            group.traverse(child => {
                if (child instanceof THREE.Line) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
            this.scene.remove(group);
        });

        this.sharedStarGeometry?.dispose();
        this.sharedStarMaterial?.dispose();
        this.sharedStarGeometry = null;
        this.sharedStarMaterial = null;

        this.constellationMeshes = [];
        this.interactableObjects = [];
    }
}
