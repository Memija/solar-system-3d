import * as THREE from 'three';
import { MajorConstellations } from './ConstellationData';
import { equatorialToEcliptic3D } from './MathUtils';

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
        this.interactableObjects.forEach(obj => {
            obj.visible = this.isVisible;
        });
        return this.isVisible;
    }

    createConstellations() {
        const radius = 49000;
        this.sharedStarGeometry = new THREE.SphereGeometry(80, 8, 8);
        this.sharedStarMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const basePosAttr = this.sharedStarGeometry.getAttribute('position') as THREE.BufferAttribute;
        const baseNormAttr = this.sharedStarGeometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
        const baseIndex = this.sharedStarGeometry.getIndex();
        const vertsPerStar = basePosAttr.count;
        const indicesPerStar = baseIndex ? baseIndex.count : vertsPerStar;

        MajorConstellations.forEach(constellation => {
            const constellationGroup = new THREE.Group();
            constellationGroup.userData = constellation;
            constellationGroup.visible = this.isVisible;

            const points: THREE.Vector3[] = [];
            const starCount = constellation.stars.length;
            const mergedPositions = new Float32Array(starCount * vertsPerStar * 3);
            const mergedNormals = new Float32Array(starCount * vertsPerStar * 3);
            const mergedIndices = new Uint32Array(starCount * indicesPerStar);

            // Create Stars (transform J2000 Equatorial RA/Dec into J2000 Ecliptic scene coordinates)
            constellation.stars.forEach((star, sIdx) => {
                const ecl = equatorialToEcliptic3D(star.ra, star.dec, radius);
                const pos = new THREE.Vector3(ecl.x, ecl.y, ecl.z);
                points.push(pos);

                const starMesh = new THREE.Mesh(this.sharedStarGeometry!, this.sharedStarMaterial!);
                starMesh.position.copy(pos);
                starMesh.visible = this.isVisible;
                starMesh.matrixAutoUpdate = false;
                starMesh.updateMatrix();
                starMesh.updateMatrixWorld(true);
                starMesh.userData = { ...constellation, type: 'ConstellationStar' };
                this.interactableObjects.push(starMesh);

                const vOffset = sIdx * vertsPerStar;
                for (let v = 0; v < vertsPerStar; v++) {
                    const dst = (vOffset + v) * 3;
                    mergedPositions[dst] = basePosAttr.getX(v) + ecl.x;
                    mergedPositions[dst + 1] = basePosAttr.getY(v) + ecl.y;
                    mergedPositions[dst + 2] = basePosAttr.getZ(v) + ecl.z;
                    if (baseNormAttr) {
                        mergedNormals[dst] = baseNormAttr.getX(v);
                        mergedNormals[dst + 1] = baseNormAttr.getY(v);
                        mergedNormals[dst + 2] = baseNormAttr.getZ(v);
                    }
                }

                const iOffset = sIdx * indicesPerStar;
                if (baseIndex) {
                    for (let k = 0; k < indicesPerStar; k++) {
                        mergedIndices[iOffset + k] = baseIndex.getX(k) + vOffset;
                    }
                } else {
                    for (let k = 0; k < indicesPerStar; k++) {
                        mergedIndices[iOffset + k] = vOffset + k;
                    }
                }
            });

            if (starCount > 0) {
                const batchedStarGeo = new THREE.BufferGeometry();
                batchedStarGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
                batchedStarGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
                batchedStarGeo.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
                const batchedStarMesh = new THREE.Mesh(batchedStarGeo, this.sharedStarMaterial!);
                batchedStarMesh.matrixAutoUpdate = false;
                batchedStarMesh.updateMatrix();
                constellationGroup.add(batchedStarMesh);
            }

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
                if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
                    if (child.geometry && child.geometry !== this.sharedStarGeometry) {
                        child.geometry.dispose();
                    }
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m !== this.sharedStarMaterial) m.dispose();
                        });
                    } else if (child.material && child.material !== this.sharedStarMaterial) {
                        child.material.dispose();
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
