import * as THREE from 'three';
import { SpacecraftData } from './SolarSystemData';
import { solveKepler } from './MathUtils';
import { markLineBatchable } from './LineBatcher';


export class Spacecraft {
    data: SpacecraftData;
    parent: THREE.Object3D;
    mesh: THREE.Group; // Spacecraft usually composed of multiple parts
    orbitLine: THREE.LineLoop | null;
    escapeLine: THREE.Line | null = null;
    markerSprite: THREE.Sprite | null = null;
    orbitGroup: THREE.Group;
    baseGroup: THREE.Group;
    angle: number;
    realisticDistances: boolean = false;
    isActive: boolean = true;
    spacecraftEnabled: boolean = true;
    materials: THREE.Material[] = [];
    parentCelestialBody?: { data: { radius: number; displayRadius?: number } };
    readonly launchTimestamp: number | null = null;
    readonly endTimestamp: number | null = null;
    private baseModelScale: number = 1.0;
    private beaconMesh: THREE.Mesh | null = null;
    private beaconMaterial: THREE.MeshBasicMaterial | null = null;
    private beaconTimer: number = 0;
    private beaconInLodRange: boolean = true;
    private subMeshes: THREE.Mesh[] = [];
    private lazyModel: boolean = false;
    private modelBuilt: boolean = false;
    private getEnvironmentMap?: () => THREE.Texture | null;
    private shadowCastingEnabled: boolean = false;
    private currentScaleFactor: number = 1.0;
    private currentSizeRatio: number = 1.0;
    private orbitEnabled: boolean = true;
    private static _sharedBeaconGeo: THREE.SphereGeometry | null = null;
    private static _sharedActiveMarkerTex: THREE.Texture | null = null;
    private static _sharedInactiveMarkerTex: THREE.Texture | null = null;
    private static readonly _tempWorldPos = new THREE.Vector3();

    constructor(
        data: SpacecraftData,
        parent: THREE.Object3D,
        options?: { lazyModel?: boolean; getEnvironmentMap?: () => THREE.Texture | null }
    ) {
        this.data = data;
        this.parent = parent;
        this.orbitLine = null;
        this.lazyModel = Boolean(options?.lazyModel);
        this.getEnvironmentMap = options?.getEnvironmentMap;

        if (this.data.launchDate) {
            this.launchTimestamp = new Date(this.data.launchDate).getTime();
        }
        if (this.data.endDate) {
            this.endTimestamp = new Date(this.data.endDate).getTime();
        }

        // Secure random angle
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        this.angle = (randomArray[0] / (0xFFFFFFFF + 1)) * Math.PI * 2;

        this.baseGroup = new THREE.Group();
        this.orbitGroup = new THREE.Group();
        this.mesh = new THREE.Group();

        this.init();
    }

    init() {
        this.parent.add(this.baseGroup);

        if (this.data.inclination !== undefined) {
            this.baseGroup.rotation.x = THREE.MathUtils.degToRad(this.data.inclination);
        }

        this.baseGroup.add(this.orbitGroup);

        if (this.lazyModel) {
            this.baseModelScale = this.getDefaultModelScale();
            this.mesh.scale.setScalar(this.baseModelScale);
        } else {
            this.ensureModelBuilt();
        }
        this.orbitGroup.add(this.mesh);
        this.createMarkerSprite();

        if (!this.data.escaping) {
            this.createOrbit();
        } else {
            // For escaping spacecraft, set initial position
            this.orbitGroup.position.set(this.data.distance, 0, 0);
            this.createEscapeTrajectory();
        }
    }

    private getDefaultModelScale(): number {
        const name = this.data.name;
        if (name.includes('ISS') || name.includes('Hubble')) return 0.5;
        if (name.includes('Voyager')) return 2.0;
        if (name.includes('James Webb') || name.includes('Cassini') || name.includes('Sputnik') || name.includes('Apollo')) return 1.5;
        return 1.0;
    }

    private getRawModelRadius(): number {
        const name = this.data.name;
        if (name.includes('ISS')) return 0.36;
        if (name.includes('Hubble')) return 0.26;
        if (name.includes('Sputnik')) return 0.28;
        if (name.includes('Apollo')) return 0.34;
        if (name.includes('James Webb') || name.includes('Cassini')) return 0.42;
        if (name.includes('Voyager')) return 0.52;
        return 0.24;
    }

    getVisualRadius(): number {
        return this.getRawModelRadius() * this.currentScaleFactor * this.baseModelScale;
    }

    private getVisualOrbitSemiMajorAxis(): number {
        if (!this.realisticDistances || !this.data.distanceAU) {
            return this.data.distance;
        }
        const rawA = this.data.distanceAU * 130;
        if (!this.parentCelestialBody) {
            return rawA;
        }
        const parentDisplayRadius = this.parentCelestialBody.data.displayRadius ?? this.parentCelestialBody.data.radius;
        const parentRealisticRadius = parentDisplayRadius * 0.005536 * this.currentSizeRatio;
        const ecc = this.data.eccentricity || 0;
        const minPeriapsis = parentRealisticRadius * 1.06 + this.getVisualRadius() * 2.2;
        const minClearanceA = minPeriapsis / Math.max(0.2, 1 - ecc);
        return Math.max(rawA, minClearanceA);
    }

    private static getSharedMarkerTexture(active: boolean): THREE.Texture {
        const cached = active ? Spacecraft._sharedActiveMarkerTex : Spacecraft._sharedInactiveMarkerTex;
        if (cached) return cached;

        const size = 64;
        let tex: THREE.Texture | null = null;

        if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx && typeof ctx.beginPath === 'function') {
                ctx.clearRect(0, 0, size, size);
                const c = size / 2;
                const strokeColor = active ? '#38bdf8' : '#f59e0b';
                const glowColor = active ? 'rgba(56, 189, 248, 0.32)' : 'rgba(245, 158, 11, 0.32)';

                // Soft outer telemetry halo
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(c, c, 20, 0, Math.PI * 2);
                ctx.fill();

                // Dark observatory contrast backing inside diamond
                ctx.fillStyle = 'rgba(4, 10, 24, 0.78)';
                ctx.beginPath();
                ctx.moveTo(c, c - 13);
                ctx.lineTo(c + 13, c);
                ctx.lineTo(c, c + 13);
                ctx.lineTo(c - 13, c);
                ctx.closePath();
                ctx.fill();

                // Crisp diamond reticle border
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2.6;
                ctx.stroke();

                // Bright central spacecraft telemetry core
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.arc(c, c, 4.2, 0, Math.PI * 2);
                ctx.fill();

                tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
            }
        }

        if (!tex) {
            const fbSize = 16;
            const data = new Uint8Array(fbSize * fbSize * 4);
            const cr = active ? 56 : 245;
            const cg = active ? 189 : 158;
            const cb = active ? 248 : 11;
            const mid = (fbSize - 1) * 0.5;
            for (let y = 0; y < fbSize; y++) {
                for (let x = 0; x < fbSize; x++) {
                    const manhattan = Math.abs(x - mid) + Math.abs(y - mid);
                    const idx = (y * fbSize + x) * 4;
                    if (manhattan <= 2.2) {
                        data[idx] = 248;
                        data[idx + 1] = 250;
                        data[idx + 2] = 252;
                        data[idx + 3] = 255;
                    } else if (manhattan >= 4.2 && manhattan <= 6.2) {
                        data[idx] = cr;
                        data[idx + 1] = cg;
                        data[idx + 2] = cb;
                        data[idx + 3] = 235;
                    }
                }
            }
            tex = new THREE.DataTexture(data, fbSize, fbSize, THREE.RGBAFormat);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
        }

        tex.userData.shared = true;
        if (active) {
            Spacecraft._sharedActiveMarkerTex = tex;
        } else {
            Spacecraft._sharedInactiveMarkerTex = tex;
        }
        return tex;
    }

    private createMarkerSprite(): void {
        const spriteMat = new THREE.SpriteMaterial({
            map: Spacecraft.getSharedMarkerTexture(this.isActive),
            transparent: true,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: false
        });
        this.markerSprite = new THREE.Sprite(spriteMat);
        this.markerSprite.scale.set(0.024, 0.024, 1);
        this.markerSprite.renderOrder = 12;
        this.markerSprite.visible = this.spacecraftEnabled;
        this.orbitGroup.add(this.markerSprite);
    }

    ensureModelBuilt(): void {
        if (this.modelBuilt) return;
        this.modelBuilt = true;
        const prevQuat = this.mesh.quaternion.clone();
        const prevRotY = this.mesh.rotation.y;
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.scale.set(1, 1, 1);

        this.createModel();
        if (this.getEnvironmentMap) {
            const envMap = this.getEnvironmentMap();
            if (envMap) {
                this.applyEnvironmentMap(envMap);
            }
        }
        this.baseModelScale = this.mesh.scale.x || 1.0;
        this.mesh.scale.setScalar(this.currentScaleFactor * this.baseModelScale);

        if (this.data.escaping && (this.data.name.includes('Voyager 1') || this.data.name.includes('Voyager 2'))) {
            this.mesh.quaternion.copy(prevQuat);
        } else {
            this.mesh.rotation.y = prevRotY;
        }

        if (!this.isActive) {
            this.syncMaterialActiveColors();
        }
        if (this.shadowCastingEnabled) {
            this.setShadowCasting(true);
        }
    }

    applyEnvironmentMap(envMap: THREE.Texture | null): void {
        if (!envMap) return;
        for (const mat of this.materials) {
            const stdMat = mat as THREE.MeshStandardMaterial;
            if (stdMat && (stdMat as any).isMeshStandardMaterial) {
                stdMat.envMap = envMap;
                stdMat.envMapIntensity = 1.15;
                stdMat.needsUpdate = true;
            }
        }
    }

    createModel() {
        const baseColor = this.data.color;
        const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.35,
            metalness: 0.5
        });

        const goldFoil = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.25,
            metalness: 0.65
        });

        const silverFoil = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.28,
            metalness: 0.55
        });

        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x2563eb,
            metalness: 0.45,
            roughness: 0.25
        });

        this.materials.push(material, goldFoil, silverFoil, panelMat);

        const name = this.data.name;
        if (name.includes("ISS")) {
            this.createISSModel(silverFoil, panelMat);
        } else if (name.includes("Hubble")) {
            this.createHubbleModel(silverFoil, panelMat);
        } else if (name.includes("Voyager")) {
            this.createVoyagerModel(material, goldFoil);
        } else if (name.includes("James Webb")) {
            this.createJWSTModel(silverFoil, goldFoil);
        } else if (name.includes("Cassini")) {
            this.createCassiniModel(material, goldFoil);
        } else if (name.includes("Sputnik")) {
            this.createSputnikModel(silverFoil);
        } else if (name.includes("Apollo")) {
            this.createApolloModel(silverFoil, material);
        } else {
            const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const mesh = new THREE.Mesh(geo, material);
            this.mesh.add(mesh);
        }

        this.mergeStaticSubMeshes();

        // Active telemetry beacon / navigation strobe indicator
        if (!Spacecraft._sharedBeaconGeo) {
            Spacecraft._sharedBeaconGeo = new THREE.SphereGeometry(0.04, 8, 8);
            Spacecraft._sharedBeaconGeo.userData.shared = true;
        }
        this.beaconMaterial = new THREE.MeshBasicMaterial({
            color: this.isActive ? 0x38bdf8 : 0xf59e0b,
            transparent: true,
            opacity: 0.85
        });
        this.materials.push(this.beaconMaterial);
        this.beaconMesh = new THREE.Mesh(Spacecraft._sharedBeaconGeo, this.beaconMaterial);
        this.beaconMesh.position.set(0, 0.25, 0);
        this.mesh.add(this.beaconMesh);

        this.subMeshes = [];
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Disable shadow cubemap casting by default on tiny (<0.5 unit) spacecraft parts;
                // enabled dynamically when the camera focuses on this spacecraft.
                child.castShadow = false;
                child.receiveShadow = false;
                this.subMeshes.push(child);
            }
        });
    }

    setShadowCasting(enabled: boolean) {
        this.shadowCastingEnabled = enabled;
        if (enabled && !this.modelBuilt) {
            this.ensureModelBuilt();
        }
        for (let i = 0; i < this.subMeshes.length; i++) {
            const m = this.subMeshes[i];
            if (m !== this.beaconMesh) {
                m.castShadow = enabled;
                m.receiveShadow = enabled;
            }
        }
    }

    private syncMaterialActiveColors() {
        for (let i = 0; i < this.materials.length; i++) {
            const mat = this.materials[i];
            if (mat instanceof THREE.MeshStandardMaterial) {
                if (mat.userData.originalColor === undefined) {
                    mat.userData.originalColor = mat.color.getHex();
                }
                if (!this.isActive) {
                    mat.color.setHex(0xffcf8b);
                    mat.emissive.setHex(0x4a2f10);
                } else {
                    mat.color.setHex(mat.userData.originalColor);
                    mat.emissive.setHex(0x2a3950);
                }
            } else if (mat instanceof THREE.MeshBasicMaterial) {
                if (mat.userData.originalColor === undefined) {
                    mat.userData.originalColor = mat.color.getHex();
                }
                if (!this.isActive) {
                    mat.color.setHex(0xf59e0b);
                } else {
                    mat.color.setHex(0x38bdf8);
                }
            }
        }
        if (this.markerSprite) {
            const nextTex = Spacecraft.getSharedMarkerTexture(this.isActive);
            if (this.markerSprite.material.map !== nextTex) {
                this.markerSprite.material.map = nextTex;
                this.markerSprite.material.needsUpdate = true;
            }
        }
    }

    private mergeStaticSubMeshes() {
        const savedRot = this.mesh.rotation.clone();
        const savedScale = this.mesh.scale.clone();
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.scale.set(1, 1, 1);

        // Accumulate transforms strictly relative to `this.mesh` (NEVER `m.matrixWorld`),
        // otherwise lazy model builds bake the host planet's heliocentric world offset into vertices!
        const meshEntries: { mesh: THREE.Mesh; relMatrix: THREE.Matrix4 }[] = [];
        const accumulate = (node: THREE.Object3D, parentRelMatrix: THREE.Matrix4) => {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                child.updateMatrix();
                const childRelMatrix = parentRelMatrix.clone().multiply(child.matrix);
                if (child instanceof THREE.Mesh && child.material && !Array.isArray(child.material)) {
                    meshEntries.push({ mesh: child, relMatrix: childRelMatrix });
                }
                if (child.children.length > 0) {
                    accumulate(child, childRelMatrix);
                }
            }
        };
        accumulate(this.mesh, new THREE.Matrix4());

        if (meshEntries.length > 0) {
            let totalVerts = 0;
            let totalIndices = 0;
            const bakedGeoms: { g: THREE.BufferGeometry; r: number; gr: number; b: number }[] = [];

            for (let i = 0; i < meshEntries.length; i++) {
                const { mesh: m, relMatrix } = meshEntries[i];
                const g = m.geometry.clone();
                g.applyMatrix4(relMatrix);
                const matColor = (m.material as THREE.MeshStandardMaterial)?.color;
                const r = matColor ? matColor.r : 1;
                const gr = matColor ? matColor.g : 1;
                const b = matColor ? matColor.b : 1;
                bakedGeoms.push({ g, r, gr, b });
                const pos = g.getAttribute('position');
                if (!pos) continue;
                totalVerts += pos.count;
                const idx = g.getIndex();
                totalIndices += idx ? idx.count : pos.count;
            }

            if (totalVerts > 0) {
                const mergedPos = new Float32Array(totalVerts * 3);
                const mergedNorm = new Float32Array(totalVerts * 3);
                const mergedColors = new Float32Array(totalVerts * 3);
                const mergedIndices = new Uint32Array(totalIndices);

                let vertOffset = 0;
                let idxOffset = 0;

                for (let i = 0; i < bakedGeoms.length; i++) {
                    const { g, r, gr, b } = bakedGeoms[i];
                    const pos = g.getAttribute('position') as THREE.BufferAttribute | undefined;
                    if (!pos) continue;
                    const norm = g.getAttribute('normal') as THREE.BufferAttribute | undefined;

                    for (let v = 0; v < pos.count; v++) {
                        const base = (vertOffset + v) * 3;
                        mergedPos[base] = pos.getX(v);
                        mergedPos[base + 1] = pos.getY(v);
                        mergedPos[base + 2] = pos.getZ(v);
                        if (norm) {
                            mergedNorm[base] = norm.getX(v);
                            mergedNorm[base + 1] = norm.getY(v);
                            mergedNorm[base + 2] = norm.getZ(v);
                        }
                        mergedColors[base] = r;
                        mergedColors[base + 1] = gr;
                        mergedColors[base + 2] = b;
                    }

                    const idx = g.getIndex();
                    if (idx) {
                        for (let k = 0; k < idx.count; k++) {
                            mergedIndices[idxOffset + k] = idx.getX(k) + vertOffset;
                        }
                        idxOffset += idx.count;
                    } else {
                        for (let k = 0; k < pos.count; k++) {
                            mergedIndices[idxOffset + k] = vertOffset + k;
                        }
                        idxOffset += pos.count;
                    }

                    vertOffset += pos.count;
                    g.dispose();
                }

                for (let i = 0; i < meshEntries.length; i++) {
                    const m = meshEntries[i].mesh;
                    m.geometry.dispose();
                    if (m.parent) m.parent.remove(m);
                }

                // Dispose temporary per-part materials and replace with a single aerospace metallic-satin material
                this.materials.forEach(mat => mat.dispose());
                this.materials = [];

                const bodyMat = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    vertexColors: true,
                    roughness: 0.34,
                    metalness: 0.48,
                    emissive: new THREE.Color(0x2a3950),
                    emissiveIntensity: 0.38,
                    side: THREE.DoubleSide
                });
                this.materials.push(bodyMat);

                const mergedGeo = new THREE.BufferGeometry();
                mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
                mergedGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
                mergedGeo.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));
                mergedGeo.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
                this.mesh.add(new THREE.Mesh(mergedGeo, bodyMat));
            }
        }

        // Remove any now-empty pivot groups
        for (let i = this.mesh.children.length - 1; i >= 0; i--) {
            const child = this.mesh.children[i];
            if (!(child as THREE.Mesh).isMesh && child.children.length === 0) {
                this.mesh.remove(child);
            }
        }

        this.mesh.rotation.copy(savedRot);
        this.mesh.scale.copy(savedScale);
    }

    private createSputnikModel(silverFoil: THREE.MeshStandardMaterial) {
        const sphereGeo = new THREE.SphereGeometry(0.1, 16, 16);
        const sphere = new THREE.Mesh(sphereGeo, silverFoil);
        this.mesh.add(sphere);

        const antennaGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.4);
        antennaGeo.translate(0, 0.2, 0);

        for (let i = 0; i < 4; i++) {
            const antenna = new THREE.Mesh(antennaGeo, silverFoil);
            const pivot = new THREE.Group();

            const radius = 0.095;
            const attachAngle = Math.PI / 4;

            const zAttach = -Math.cos(attachAngle) * radius;
            const xyAttach = Math.sin(attachAngle) * radius;

            const angle = (i / 4) * Math.PI * 2;
            pivot.position.set(
                Math.cos(angle) * xyAttach,
                Math.sin(angle) * xyAttach,
                zAttach
            );

            pivot.lookAt(new THREE.Vector3(0, 0, 0));

            antenna.rotation.x = -Math.PI / 2;
            antenna.rotation.x -= Math.PI / 8;

            pivot.add(antenna);
            this.mesh.add(pivot);
        }

        this.mesh.scale.set(1.5, 1.5, 1.5);
    }

    private createApolloModel(silverFoil: THREE.MeshStandardMaterial, greyMat: THREE.MeshStandardMaterial) {
        const cmGeo = new THREE.ConeGeometry(0.15, 0.2, 16);
        const cm = new THREE.Mesh(cmGeo, silverFoil);
        cm.position.set(0, 0.2, 0);
        this.mesh.add(cm);

        const smGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
        const sm = new THREE.Mesh(smGeo, silverFoil);
        sm.position.set(0, -0.05, 0);
        this.mesh.add(sm);

        const engineGeo = new THREE.ConeGeometry(0.08, 0.15, 16);
        const engine = new THREE.Mesh(engineGeo, greyMat);
        engine.position.set(0, -0.25, 0);
        engine.rotation.x = Math.PI;
        this.mesh.add(engine);

        const dishGeo = new THREE.SphereGeometry(0.05, 16, 16, 0, Math.PI);
        const dish = new THREE.Mesh(dishGeo, greyMat);
        dish.position.set(0.15, -0.15, 0);
        dish.rotation.z = -Math.PI / 2;
        this.mesh.add(dish);

        this.mesh.rotation.z = -Math.PI / 2;
        this.mesh.scale.set(1.5, 1.5, 1.5);
    }

    private createJWSTModel(material: THREE.MeshStandardMaterial, mirrorMat: THREE.MeshStandardMaterial) {
        const shieldGeo = new THREE.PlaneGeometry(0.6, 0.3);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide });
        this.materials.push(shieldMat);

        for (let i = 0; i < 3; i++) {
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.rotation.x = Math.PI / 2;
            shield.position.y = -0.05 + (i * 0.02);
            this.mesh.add(shield);
        }

        const mirrorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 6);
        const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirror.rotation.x = Math.PI / 2;
        mirror.position.set(0, 0.1, 0.1);
        this.mesh.add(mirror);

        const supportGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.2);
        const support = new THREE.Mesh(supportGeo, material);
        support.position.set(0, 0.1, 0.2);
        support.rotation.x = Math.PI / 2;
        this.mesh.add(support);

        const busGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const goldBus = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.3 });
        this.materials.push(goldBus);
        const bus = new THREE.Mesh(busGeo, goldBus);
        bus.position.set(0, -0.1, 0);
        this.mesh.add(bus);

        this.mesh.scale.set(1.5, 1.5, 1.5);
    }

    private createISSModel(material: THREE.MeshStandardMaterial, panelMat: THREE.MeshStandardMaterial) {
        const bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.rotation.z = Math.PI / 2;
        this.mesh.add(body);

        const panelGeo = new THREE.BoxGeometry(0.2, 0.01, 0.6);

        const panel1 = new THREE.Mesh(panelGeo, panelMat);
        panel1.position.set(0.1, 0, 0);
        this.mesh.add(panel1);

        const panel2 = new THREE.Mesh(panelGeo, panelMat);
        panel2.position.set(-0.1, 0, 0);
        this.mesh.add(panel2);

        this.mesh.scale.set(0.5, 0.5, 0.5);
    }

    private createHubbleModel(material: THREE.MeshStandardMaterial, panelMat: THREE.MeshStandardMaterial) {
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        this.mesh.add(body);

        const apertureGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 16);
        const apertureMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.35, roughness: 0.65 });
        this.materials.push(apertureMat);
        const aperture = new THREE.Mesh(apertureGeo, apertureMat);
        aperture.position.y = 0.2;
        this.mesh.add(aperture);

        const panelGeo = new THREE.BoxGeometry(0.4, 0.01, 0.1);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        this.mesh.add(panel);

        this.mesh.scale.set(0.5, 0.5, 0.5);
    }

    private createCassiniModel(material: THREE.MeshStandardMaterial, foilMat: THREE.MeshStandardMaterial) {
        const dishGeo = new THREE.ConeGeometry(0.15, 0.05, 16);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.65 });
        this.materials.push(dishMat);
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.y = 0.2;
        this.mesh.add(dish);

        const bodyGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16);
        const body = new THREE.Mesh(bodyGeo, foilMat);
        this.mesh.add(body);

        const baseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
        const base = new THREE.Mesh(baseGeo, material);
        base.position.y = -0.2;
        this.mesh.add(base);

        const boomGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.6);
        const boomMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
        this.materials.push(boomMat);
        const boom = new THREE.Mesh(boomGeo, boomMat);
        boom.position.set(0.2, -0.1, 0);
        boom.rotation.z = Math.PI / 2;
        this.mesh.add(boom);

        this.mesh.scale.set(1.5, 1.5, 1.5);
    }

    private createVoyagerModel(material: THREE.MeshStandardMaterial, goldMat: THREE.MeshStandardMaterial) {
        const dishGeo = new THREE.SphereGeometry(0.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, metalness: 0.25, roughness: 0.55 });
        this.materials.push(dishMat);
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.rotation.x = -Math.PI / 2;
        dish.position.z = -0.05;
        this.mesh.add(dish);

        const subReflectorGeo = new THREE.ConeGeometry(0.03, 0.05, 16);
        const subReflector = new THREE.Mesh(subReflectorGeo, dishMat);
        subReflector.position.z = -0.15;
        subReflector.rotation.x = -Math.PI / 2;
        this.mesh.add(subReflector);

        const strutGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.15);
        for (let i = 0; i < 3; i++) {
            const strut = new THREE.Mesh(strutGeo, material);
            const angle = (i / 3) * Math.PI * 2;
            strut.position.set(Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, -0.1);
            strut.lookAt(0, 0, -0.15);
            strut.rotateX(Math.PI / 2);
            this.mesh.add(strut);
        }

        const busGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 10);
        const busMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.45, roughness: 0.5 });
        this.materials.push(busMat);
        const bus = new THREE.Mesh(busGeo, busMat);
        bus.rotation.x = Math.PI / 2;
        bus.position.z = 0.08;
        this.mesh.add(bus);

        const recordGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 16);
        const record = new THREE.Mesh(recordGeo, goldMat);
        record.position.set(0.1, 0, 0.08);
        record.rotation.z = Math.PI / 2;
        this.mesh.add(record);

        const boomGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3);
        const rtgBoom = new THREE.Mesh(boomGeo, material);
        rtgBoom.position.set(-0.15, -0.15, 0.15);
        rtgBoom.rotation.z = -Math.PI / 4;
        rtgBoom.rotation.x = -Math.PI / 6;
        this.mesh.add(rtgBoom);

        const rtgGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);
        const rtgMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 });
        this.materials.push(rtgMat);
        for (let i = 0; i < 3; i++) {
            const rtg = new THREE.Mesh(rtgGeo, rtgMat);
            rtg.position.set(-0.15 - (i * 0.05), -0.15 - (i * 0.05), 0.15 + (i * 0.03));
            rtg.rotation.z = -Math.PI / 4;
            rtg.rotation.x = -Math.PI / 6;
            this.mesh.add(rtg);
        }

        const sciBoomGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.4);
        const sciBoom = new THREE.Mesh(sciBoomGeo, material);
        sciBoom.position.set(0.2, 0.2, 0.15);
        sciBoom.rotation.z = -Math.PI / 4;
        this.mesh.add(sciBoom);

        const instrumentGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const instrument = new THREE.Mesh(instrumentGeo, material);
        instrument.position.set(0.35, 0.35, 0.15);
        this.mesh.add(instrument);

        const magBoomGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.8);
        const magBoom = new THREE.Mesh(magBoomGeo, material);
        magBoom.position.set(-0.3, 0.3, 0.1);
        magBoom.rotation.z = Math.PI / 4;
        this.mesh.add(magBoom);

        this.mesh.scale.set(2, 2, 2);
    }

    rebuildOrbit(realistic: boolean, sizeRatio: number = 1.0) {
        this.realisticDistances = realistic;
        this.currentSizeRatio = sizeRatio;

        // Preserve each spacecraft's bespoke relative model scale (ISS 0.5, Cassini/JWST 1.5, Voyager 2.0)
        const scaleFactor = realistic ? 0.0015 * sizeRatio : 1.0;
        this.currentScaleFactor = scaleFactor;
        this.mesh.scale.setScalar(scaleFactor * this.baseModelScale);

        if (this.orbitLine) {
            this.baseGroup.remove(this.orbitLine);
            this.orbitLine.geometry.dispose();
            (this.orbitLine.material as THREE.Material).dispose();
            this.orbitLine = null;
        }

        if (!this.data.escaping) {
            this.createOrbit();
        } else {
            this.updateEscapeTrajectory();
        }
    }

    createOrbit() {
        const segments = 64;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array((segments + 1) * 3);

        const a = this.getVisualOrbitSemiMajorAxis();
        const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;
        const b = a * Math.sqrt(1 - e * e);

        for (let i = 0; i <= segments; i++) {
            const E = (i / segments) * Math.PI * 2;
            positions[i * 3] = a * (Math.cos(E) - e);
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = -b * Math.sin(E);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({
            color: 0x5ea8d6,
            transparent: true,
            opacity: 0.58,
            depthWrite: false
        });

        this.orbitLine = new THREE.LineLoop(geometry, material);
        this.orbitLine.visible = this.spacecraftEnabled && this.orbitEnabled && this.baseGroup.visible;
        this.orbitLine.matrixAutoUpdate = false;
        this.orbitLine.updateMatrix?.();
        markLineBatchable(this.orbitLine);
        this.baseGroup.add(this.orbitLine);
    }

    private createEscapeTrajectory(): void {
        const isVoyager1 = this.data.name.includes('Voyager 1');
        const isVoyager2 = this.data.name.includes('Voyager 2');
        if (!isVoyager1 && !isVoyager2) return;

        const positions = new Float32Array(6);
        const azimuth = isVoyager1 ? 1.8059 : 1.2175;
        const elevation = THREE.MathUtils.degToRad(isVoyager1 ? 35.01 : -38.45);
        const cosEl = Math.cos(elevation);
        const startDist = 130;
        positions[0] = startDist * cosEl * Math.cos(azimuth);
        positions[1] = startDist * Math.sin(elevation);
        positions[2] = startDist * cosEl * Math.sin(azimuth);
        positions[3] = this.orbitGroup.position.x || positions[0];
        positions[4] = this.orbitGroup.position.y || positions[1];
        positions[5] = this.orbitGroup.position.z || positions[2];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.42,
            depthWrite: false
        });
        this.escapeLine = new THREE.Line(geometry, material);
        this.escapeLine.visible = this.spacecraftEnabled && this.orbitEnabled && this.baseGroup.visible;
        this.escapeLine.matrixAutoUpdate = false;
        this.escapeLine.updateMatrix?.();
        markLineBatchable(this.escapeLine);
        this.baseGroup.add(this.escapeLine);
    }

    private updateEscapeTrajectory(): void {
        if (!this.escapeLine) return;
        const posAttr = this.escapeLine.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
        if (!posAttr) return;
        const arr = posAttr.array as Float32Array;
        const px = this.orbitGroup.position.x;
        const py = this.orbitGroup.position.y;
        const pz = this.orbitGroup.position.z;
        if (arr[3] !== px || arr[4] !== py || arr[5] !== pz) {
            arr[3] = px;
            arr[4] = py;
            arr[5] = pz;
            posAttr.needsUpdate = true;
        }
    }

    setSpacecraftVisible(visible: boolean): void {
        this.spacecraftEnabled = visible;
        const isLaunched = this.baseGroup.visible !== false;
        const effective = visible && isLaunched;
        if (!effective) {
            this.mesh.visible = false;
            if (this.markerSprite) this.markerSprite.visible = false;
            if (this.beaconMesh) this.beaconMesh.visible = false;
            if (this.orbitLine) this.orbitLine.visible = false;
            if (this.escapeLine) this.escapeLine.visible = false;
        } else {
            this.mesh.visible = true;
            if (this.markerSprite) this.markerSprite.visible = true;
            if (this.beaconMesh) this.beaconMesh.visible = this.beaconInLodRange;
            if (this.orbitLine) this.orbitLine.visible = this.orbitEnabled;
            if (this.escapeLine) this.escapeLine.visible = this.orbitEnabled;
        }
    }

    update(deltaTime: number, simTimePassed?: number, simDate?: Date, rawDelta?: number) {
        const wasVisible = this.baseGroup.visible;
        if (this.launchTimestamp !== null && simDate) {
            if (simDate.getTime() < this.launchTimestamp) {
                this.baseGroup.visible = false;
                this.mesh.visible = false;
                if (this.markerSprite) this.markerSprite.visible = false;
                if (this.orbitLine) this.orbitLine.visible = false;
                if (this.escapeLine) this.escapeLine.visible = false;
                if (this.beaconMesh) this.beaconMesh.visible = false;
                this.orbitGroup.position.set(0, 0, 0);
                return;
            } else {
                this.baseGroup.visible = true;
            }
        } else {
            this.baseGroup.visible = true;
        }

        if (!wasVisible && this.baseGroup.visible && this.spacecraftEnabled) {
            this.mesh.visible = true;
            if (this.markerSprite) this.markerSprite.visible = true;
            if (this.orbitLine) {
                this.orbitLine.visible = this.orbitEnabled;
            }
            if (this.escapeLine) {
                this.escapeLine.visible = this.orbitEnabled;
            }
        }

        if (this.endTimestamp !== null && simDate) {
            const currentlyActive = simDate.getTime() <= this.endTimestamp;
            if (this.isActive !== currentlyActive) {
                this.isActive = currentlyActive;
                this.syncMaterialActiveColors();
            }
        }

        if (this.beaconMesh && this.beaconMaterial) {
            if (this.spacecraftEnabled && this.beaconInLodRange && this.baseGroup.visible) {
                const step = (rawDelta !== undefined && rawDelta > 0) ? rawDelta : deltaTime;
                if (this.isActive) {
                    if (step > 0) {
                        this.beaconTimer += step * 4;
                        this.beaconMaterial.opacity = (Math.sin(this.beaconTimer) > 0.3) ? 0.95 : 0.35;
                    } else {
                        this.beaconMaterial.opacity = 0.85;
                    }
                } else {
                    this.beaconMaterial.opacity = 0.68;
                }
                this.beaconMesh.visible = true;
            } else {
                this.beaconMesh.visible = false;
            }
        }

        if (this.data.escaping) {
            const speedMultiplier = 5;
            const speed = (this.data.speed || 1) * speedMultiplier;

            if (simTimePassed !== undefined && simDate && this.launchTimestamp !== null) {
                const yearsSinceLaunch = Math.max(0, (simDate.getTime() - this.launchTimestamp) / (365.25 * 24 * 60 * 60 * 1000));
                const isVoyager1 = this.data.name.includes('Voyager 1');
                const isVoyager2 = this.data.name.includes('Voyager 2');

                if (isVoyager1 || isVoyager2) {
                    // Heliocentric interstellar escape trajectory departing 1 AU (130 units):
                    // Voyager 1 climbs +35.01 deg north toward Ophiuchus (~3.483 AU/yr, ecliptic lon 256.53 deg);
                    // Voyager 2 dives -38.45 deg south toward Pavo (~2.914 AU/yr, ecliptic lon 290.24 deg).
                    const auPerYear = isVoyager1 ? 3.483 : 2.914;
                    const radialDist = this.realisticDistances
                        ? (1.0 + yearsSinceLaunch * auPerYear) * 130
                        : 130 + yearsSinceLaunch * (isVoyager1 ? 16.5 : 14.2);
                    const azimuth = isVoyager1 ? 1.8059 : 1.2175;
                    const elevation = THREE.MathUtils.degToRad(isVoyager1 ? 35.01 : -38.45);
                    const cosEl = Math.cos(elevation);

                    this.orbitGroup.position.set(
                        radialDist * cosEl * Math.cos(azimuth),
                        radialDist * Math.sin(elevation),
                        radialDist * cosEl * Math.sin(azimuth)
                    );
                    // Orient high-gain antenna dish (-Z) back toward inner Solar System / Earth
                    this.mesh.lookAt(0, 0, 0);
                    this.updateEscapeTrajectory();
                } else {
                    const earthYearInSimSeconds = 2 * Math.PI / 0.5;
                    const effectiveSimTimePassed = yearsSinceLaunch * earthYearInSimSeconds;
                    this.orbitGroup.position.x = this.data.distance + speed * effectiveSimTimePassed;
                    this.orbitGroup.position.z = (speed * 0.5) * effectiveSimTimePassed;
                    this.mesh.rotation.y = 0.1 * effectiveSimTimePassed;
                }
            } else if (simTimePassed !== undefined) {
                this.orbitGroup.position.x = this.data.distance + speed * simTimePassed;
                this.orbitGroup.position.z = (speed * 0.5) * simTimePassed;
                this.mesh.rotation.y = 0.1 * simTimePassed;
            } else {
                this.orbitGroup.position.x += speed * deltaTime;
                this.orbitGroup.position.z += (speed * 0.5) * deltaTime;
                this.mesh.rotation.y += 0.1 * deltaTime;
            }
        } else {
            const speedMultiplier = 0.5;
            const speed = (1 / this.data.period) * speedMultiplier;

            if (simTimePassed !== undefined && simDate && this.launchTimestamp !== null) {
                const yearsSinceLaunch = (simDate.getTime() - this.launchTimestamp) / (365.25 * 24 * 60 * 60 * 1000);
                const earthYearInSimSeconds = 2 * Math.PI / 0.5;
                const effectiveSimTimePassed = yearsSinceLaunch * earthYearInSimSeconds;

                const baseAngle = this.data.baseLongitude || 0;
                this.angle = (((baseAngle + speed * effectiveSimTimePassed) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            } else if (simTimePassed !== undefined) {
                const baseAngle = this.data.baseLongitude || 0;
                this.angle = (((baseAngle + speed * simTimePassed) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            } else {
                this.angle = (((this.angle + speed * deltaTime) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            }

            const a = this.getVisualOrbitSemiMajorAxis();
            const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;
            const b = a * Math.sqrt(1 - e * e);

            let x = 0;
            let z = 0;

            if (e > 0) {
                const M = this.angle;
                const E = solveKepler(M, e);
                x = a * (Math.cos(E) - e);
                z = -b * Math.sin(E);
            } else {
                x = Math.cos(this.angle) * a;
                z = -Math.sin(this.angle) * a;
            }

            this.orbitGroup.position.set(x, 0, z);
            this.mesh.rotation.y = this.angle;
        }
    }

    updateLOD(cameraWorldPos: THREE.Vector3, isFocused: boolean = false) {
        if (!this.spacecraftEnabled || !this.baseGroup.visible) {
            this.mesh.visible = false;
            if (this.markerSprite) this.markerSprite.visible = false;
            if (this.orbitLine) this.orbitLine.visible = false;
            if (this.escapeLine) this.escapeLine.visible = false;
            this.beaconInLodRange = false;
            if (this.beaconMesh) this.beaconMesh.visible = false;
            return;
        }
        this.orbitGroup.getWorldPosition(Spacecraft._tempWorldPos);
        const distSq = cameraWorldPos.distanceToSquared(Spacecraft._tempWorldPos);
        const showMesh = isFocused || distSq <= 650 * 650;
        if (showMesh && !this.modelBuilt) {
            this.ensureModelBuilt();
        }
        this.mesh.visible = showMesh;
        if (this.orbitLine) {
            this.orbitLine.visible = this.orbitEnabled;
        }
        if (this.escapeLine) {
            this.escapeLine.visible = this.orbitEnabled;
        }
        const closeFadeDist = this.getVisualRadius() * 12;
        if (this.markerSprite) {
            this.markerSprite.visible = distSq > closeFadeDist * closeFadeDist;
        }
        this.beaconInLodRange = showMesh && (isFocused || distSq <= 160 * 160);
        if (this.beaconMesh) {
            this.beaconMesh.visible = this.beaconInLodRange;
        }
    }

    toggleOrbit(visible: boolean) {
        this.orbitEnabled = visible;
        const canShow = visible && this.spacecraftEnabled && this.baseGroup.visible;
        if (this.orbitLine) {
            this.orbitLine.visible = canShow;
        }
        if (this.escapeLine) {
            this.escapeLine.visible = canShow;
        }
    }

    dispose() {
        this.mesh.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.geometry && !mesh.geometry.userData?.shared) {
                    mesh.geometry.dispose();
                }
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material?.dispose();
                }
            }
        });

        if (this.markerSprite) {
            if (this.markerSprite.material?.map && !this.markerSprite.material.map.userData?.shared) {
                this.markerSprite.material.map.dispose();
            }
            this.markerSprite.material?.dispose();
            if (this.markerSprite.parent) {
                this.markerSprite.parent.remove(this.markerSprite);
            }
            this.markerSprite = null;
        }

        if (this.orbitLine) {
            this.orbitLine.geometry?.dispose();
            if (Array.isArray(this.orbitLine.material)) {
                this.orbitLine.material.forEach(m => m.dispose());
            } else {
                (this.orbitLine.material as any)?.dispose?.();
            }
        }

        if (this.escapeLine) {
            this.escapeLine.geometry?.dispose();
            if (Array.isArray(this.escapeLine.material)) {
                this.escapeLine.material.forEach(m => m.dispose());
            } else {
                (this.escapeLine.material as any)?.dispose?.();
            }
            this.escapeLine = null;
        }

        this.materials.forEach(m => m.dispose());
        this.materials = [];

        if (this.orbitGroup.parent) {
            this.orbitGroup.parent.remove(this.orbitGroup);
        }
        if (this.baseGroup.parent) {
            this.baseGroup.parent.remove(this.baseGroup);
        }
    }
}
