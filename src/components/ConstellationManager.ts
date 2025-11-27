import * as THREE from 'three';
import { MajorConstellations } from './ConstellationData.js';


export class ConstellationManager {
    scene: THREE.Scene;
    constellationMeshes: THREE.Group[];
    interactableObjects: THREE.Object3D[];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.constellationMeshes = [];
        this.interactableObjects = [];
    }

    createConstellations() {
        const radius = 49000;

        MajorConstellations.forEach(constellation => {
            const constellationGroup = new THREE.Group();
            constellationGroup.userData = constellation; // Store data for interaction

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

                const starGeo = new THREE.SphereGeometry(80, 8, 8);
                const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const starMesh = new THREE.Mesh(starGeo, starMat);
                starMesh.position.copy(pos);
                starMesh.userData = { ...constellation, type: 'ConstellationStar' }; // Link back to constellation

                constellationGroup.add(starMesh);
                this.interactableObjects.push(starMesh);
            });

            // Create Lines
            const material = new THREE.LineBasicMaterial({
                color: constellation.color,
                linewidth: 1.5,
                transparent: true,
                opacity: 0.6
            });

            constellation.connections.forEach(pair => {
                if (points[pair[0]] && points[pair[1]]) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        points[pair[0]],
                        points[pair[1]]
                    ]);
                    const line = new THREE.Line(geometry, material);
                    line.userData = { ...constellation, type: 'ConstellationLine' }; // Link back to constellation
                    constellationGroup.add(line);
                    // Lines are hard to click, so we might not add them to interactableObjects unless we use a thick raycast
                    // For now, clicking stars is easier.
                }
            });

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

        // Calculate center of bounding box of all stars in the constellation
        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }
}
