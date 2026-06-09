import * as THREE from 'three';
import { SpacecraftData } from './SolarSystemData.js';
import { solveKepler, createOrbitLine } from './MathUtils';


export class Spacecraft {
    data: SpacecraftData;
    parent: THREE.Object3D;
    mesh: THREE.Group; // Spacecraft usually composed of multiple parts
    orbitLine: THREE.LineLoop | null;
    orbitGroup: THREE.Group;
    baseGroup: THREE.Group;
    angle: number;
    realisticDistances: boolean = false;

    constructor(data: SpacecraftData, parent: THREE.Object3D) {
        this.data = data;
        this.parent = parent;
        this.orbitLine = null;

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

        this.createModel();
        this.orbitGroup.add(this.mesh);

        if (!this.data.escaping) {
            this.createOrbit();
        } else {
            // For escaping spacecraft, set initial position
            this.orbitGroup.position.set(this.data.distance, 0, 0);
        }

    }

    createModel() {
        // Base metallic materials
        const baseColor = this.data.color;
        // Make sure base metallic material is spicy
        const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.4,
            metalness: 0.9
        });

        const goldFoil = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 1.0
        });

        const silverFoil = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.3,
            metalness: 1.0
        });

        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x224488,
            metalness: 0.9,
            roughness: 0.2
        });

        // Simple representations based on name
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
        } else {
            // Generic box
            const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const mesh = new THREE.Mesh(geo, material);
            this.mesh.add(mesh);
        }

        // Apply shadows to all meshes in the spacecraft group
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    private createJWSTModel(material: THREE.MeshStandardMaterial, mirrorMat: THREE.MeshStandardMaterial) {
        // Sunshield (diamond shape)
        const shieldGeo = new THREE.PlaneGeometry(0.6, 0.3);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide });

        // 3 layers of sunshield
        for (let i = 0; i < 3; i++) {
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.rotation.x = Math.PI / 2;
            shield.position.y = -0.05 + (i * 0.02);
            this.mesh.add(shield);
        }

        // Primary mirror (hexagon)
        const mirrorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 6);
        const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirror.rotation.x = Math.PI / 2;
        mirror.position.set(0, 0.1, 0.1);
        this.mesh.add(mirror);

        // Secondary mirror support
        const supportGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.2);
        const support = new THREE.Mesh(supportGeo, material);
        support.position.set(0, 0.1, 0.2);
        support.rotation.x = Math.PI / 2;
        this.mesh.add(support);

        // Spacecraft bus
        const busGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const goldBus = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.3 });
        const bus = new THREE.Mesh(busGeo, goldBus);
        bus.position.set(0, -0.1, 0);
        this.mesh.add(bus);

        this.mesh.scale.set(1.5, 1.5, 1.5);
    }

    private createISSModel(material: THREE.MeshStandardMaterial, panelMat: THREE.MeshStandardMaterial) {
        // Central cylinder
        const bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.rotation.z = Math.PI / 2;
        this.mesh.add(body);

        // Solar panels
        const panelGeo = new THREE.BoxGeometry(0.2, 0.01, 0.6);

        const panel1 = new THREE.Mesh(panelGeo, panelMat);
        panel1.position.set(0.1, 0, 0);
        this.mesh.add(panel1);

        const panel2 = new THREE.Mesh(panelGeo, panelMat);
        panel2.position.set(-0.1, 0, 0);
        this.mesh.add(panel2);

        // Scale it down slightly
        this.mesh.scale.set(0.5, 0.5, 0.5);
    }

    private createHubbleModel(material: THREE.MeshStandardMaterial, panelMat: THREE.MeshStandardMaterial) {
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        this.mesh.add(body);

        const apertureGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 16);
        const apertureMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.8 });
        const aperture = new THREE.Mesh(apertureGeo, apertureMat);
        aperture.position.y = 0.2;
        this.mesh.add(aperture);

        const panelGeo = new THREE.BoxGeometry(0.4, 0.01, 0.1);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        this.mesh.add(panel);

        this.mesh.scale.set(0.5, 0.5, 0.5);
    }

    private createCassiniModel(material: THREE.MeshStandardMaterial, foilMat: THREE.MeshStandardMaterial) {
        // High-Gain Antenna (Dish)
        const dishGeo = new THREE.ConeGeometry(0.15, 0.05, 16);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.8 }); // White dish
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.y = 0.2;
        this.mesh.add(dish);

        // Main body cylinder
        const bodyGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16);
        // Cassini is famously wrapped in gold multi-layer insulation
        const body = new THREE.Mesh(bodyGeo, foilMat);
        this.mesh.add(body);

        // Lower equipment section
        const baseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
        const base = new THREE.Mesh(baseGeo, material);
        base.position.y = -0.2;
        this.mesh.add(base);

        // Magnetometer boom
        const boomGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.6);
        const boomMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.5 });
        const boom = new THREE.Mesh(boomGeo, boomMat);
        boom.position.set(0.2, -0.1, 0);
        boom.rotation.z = Math.PI / 2;
        this.mesh.add(boom);

        this.mesh.scale.set(1.5, 1.5, 1.5);
    }

    private createVoyagerModel(material: THREE.MeshStandardMaterial, goldMat: THREE.MeshStandardMaterial) {
        // High-gain antenna (dish) - Parabolic shape using a sphere cap
        const dishGeo = new THREE.SphereGeometry(0.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, metalness: 0.3, roughness: 0.7 });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.rotation.x = -Math.PI / 2; // point "forward"
        dish.position.z = -0.05;
        this.mesh.add(dish);

        // Antenna sub-reflector (small cone in the middle)
        const subReflectorGeo = new THREE.ConeGeometry(0.03, 0.05, 16);
        const subReflector = new THREE.Mesh(subReflectorGeo, dishMat);
        subReflector.position.z = -0.15;
        subReflector.rotation.x = -Math.PI / 2;
        this.mesh.add(subReflector);

        // Feed struts
        const strutGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.15);
        for (let i = 0; i < 3; i++) {
            const strut = new THREE.Mesh(strutGeo, material);
            const angle = (i / 3) * Math.PI * 2;
            strut.position.set(Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, -0.1);
            strut.lookAt(0, 0, -0.15);
            strut.rotateX(Math.PI / 2);
            this.mesh.add(strut);
        }

        // Bus (Decagon)
        const busGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 10);
        const busMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 });
        const bus = new THREE.Mesh(busGeo, busMat);
        bus.rotation.x = Math.PI / 2;
        bus.position.z = 0.08;
        this.mesh.add(bus);

        // Gold Record
        const recordGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 16);
        const record = new THREE.Mesh(recordGeo, goldMat);
        record.position.set(0.1, 0, 0.08);
        record.rotation.z = Math.PI / 2;
        this.mesh.add(record);

        // RTG Boom
        const boomGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3);
        const rtgBoom = new THREE.Mesh(boomGeo, material);
        rtgBoom.position.set(-0.15, -0.15, 0.15);
        rtgBoom.rotation.z = -Math.PI / 4;
        rtgBoom.rotation.x = -Math.PI / 6;
        this.mesh.add(rtgBoom);

        // RTGs (3 cylinders)
        const rtgGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);
        const rtgMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.4 });
        for (let i = 0; i < 3; i++) {
            const rtg = new THREE.Mesh(rtgGeo, rtgMat);
            // Offset each RTG along the boom
            rtg.position.set(-0.15 - (i * 0.05), -0.15 - (i * 0.05), 0.15 + (i * 0.03));
            rtg.rotation.z = -Math.PI / 4;
            rtg.rotation.x = -Math.PI / 6;
            this.mesh.add(rtg);
        }

        // Science Boom
        const sciBoomGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.4);
        const sciBoom = new THREE.Mesh(sciBoomGeo, material);
        sciBoom.position.set(0.2, 0.2, 0.15);
        sciBoom.rotation.z = -Math.PI / 4;
        this.mesh.add(sciBoom);

        // Instruments on Science Boom
        const instrumentGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const instrument = new THREE.Mesh(instrumentGeo, material);
        instrument.position.set(0.35, 0.35, 0.15);
        this.mesh.add(instrument);

        // Magnetometer Boom (Very long)
        const magBoomGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.8);
        const magBoom = new THREE.Mesh(magBoomGeo, material);
        magBoom.position.set(-0.3, 0.3, 0.1);
        magBoom.rotation.z = Math.PI / 4;
        this.mesh.add(magBoom);

        this.mesh.scale.set(2, 2, 2); // Make Voyager a bit bigger so it's visible far away
    }

    rebuildOrbit(realistic: boolean) {
        this.realisticDistances = realistic;
        if (this.orbitLine) {
            this.baseGroup.remove(this.orbitLine);
            this.orbitLine.geometry.dispose();
            (this.orbitLine.material as THREE.Material).dispose();
            this.orbitLine = null;
        }

        if (!this.data.escaping) {
            this.createOrbit();
        }
    }

    createOrbit() {
        const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;
        const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;

        const geometry = createOrbitLine(a, e);
        const material = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });

        this.orbitLine = new THREE.LineLoop(geometry, material);
        this.baseGroup.add(this.orbitLine);
    }



    update(deltaTime: number) {
        if (this.data.escaping) {
            // Voyager travels outward
            const speedMultiplier = 5; // make it visible
            const speed = (this.data.speed || 1) * speedMultiplier;
            this.orbitGroup.position.x += speed * deltaTime;
            this.orbitGroup.position.z += (speed * 0.5) * deltaTime; // Diagonal path
            this.mesh.rotation.y += 0.1 * deltaTime; // slow spin
        } else {
            const speedMultiplier = 0.5;
            const speed = (1 / this.data.period) * speedMultiplier;

            this.angle += speed * deltaTime;
            this.angle = this.angle % (Math.PI * 2);

            const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;
            const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;
            const b = a * Math.sqrt(1 - e * e);

            let x = 0;
            let z = 0;

            if (e > 0) {
                let M = this.angle;
                let E = solveKepler(M, e);
                x = a * (Math.cos(E) - e);
                z = b * Math.sin(E);
            } else {
                x = Math.cos(this.angle) * a;
                z = Math.sin(this.angle) * a;
            }

            this.orbitGroup.position.set(x, 0, z);

            // Always point somewhat tangentially
            this.mesh.rotation.y = -this.angle;
        }
    }

    toggleOrbit(visible: boolean) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
    }


}
