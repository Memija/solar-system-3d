import * as THREE from 'three';
import { SpacecraftData } from './SolarSystemData.js';
import { createSpriteLabel } from './LabelHelper.js';

export class Spacecraft {
    data: SpacecraftData;
    parent: THREE.Object3D;
    mesh: THREE.Group; // Spacecraft usually composed of multiple parts
    orbitLine: THREE.LineLoop | null;
    orbitGroup: THREE.Group;
    baseGroup: THREE.Group;
    angle: number;
    labelSprite: THREE.Sprite | null;

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
        this.labelSprite = null;

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

        this.createLabel();
    }

    createModel() {
        const material = new THREE.MeshStandardMaterial({
            color: this.data.color,
            roughness: 0.5,
            metalness: 0.8
        });

        const panelMat = new THREE.MeshStandardMaterial({ color: 0x224488, metalness: 0.9, roughness: 0.2 });

        // Simple representations based on name
        const name = this.data.name;
        if (name.includes("ISS")) {
            this.createISSModel(material, panelMat);
        } else if (name.includes("Hubble")) {
            this.createHubbleModel(material, panelMat);
        } else if (name.includes("Voyager")) {
            this.createVoyagerModel(material);
        } else if (name.includes("James Webb")) {
            this.createJWSTModel(material);
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

    private createJWSTModel(material: THREE.MeshStandardMaterial) {
        // Sunshield (diamond shape)
        const shieldGeo = new THREE.PlaneGeometry(0.6, 0.3);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8, roughness: 0.2, side: THREE.DoubleSide });

        // 3 layers of sunshield
        for (let i = 0; i < 3; i++) {
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.rotation.x = Math.PI / 2;
            shield.position.y = -0.05 + (i * 0.02);
            this.mesh.add(shield);
        }

        // Primary mirror (hexagon)
        const mirrorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 6);
        const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 });
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
        const bus = new THREE.Mesh(busGeo, material);
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
        const apertureMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const aperture = new THREE.Mesh(apertureGeo, apertureMat);
        aperture.position.y = 0.2;
        this.mesh.add(aperture);

        const panelGeo = new THREE.BoxGeometry(0.4, 0.01, 0.1);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        this.mesh.add(panel);

        this.mesh.scale.set(0.5, 0.5, 0.5);
    }

    private createVoyagerModel(material: THREE.MeshStandardMaterial) {
        // Dish
        const dishGeo = new THREE.ConeGeometry(0.2, 0.1, 16);
        const dish = new THREE.Mesh(dishGeo, material);
        dish.rotation.x = -Math.PI / 2;
        this.mesh.add(dish);

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.z = 0.1;
        this.mesh.add(body);

        // Boom
        const boomGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.4);
        const boom = new THREE.Mesh(boomGeo, material);
        boom.position.set(0.2, 0, 0.1);
        boom.rotation.z = Math.PI / 4;
        this.mesh.add(boom);

        this.mesh.scale.set(2, 2, 2); // Make Voyager a bit bigger so it's visible far away
    }

    createOrbit() {
        const segments = 128;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array((segments + 1) * 3);

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            positions[i * 3] = Math.cos(theta) * this.data.distance;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = Math.sin(theta) * this.data.distance;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });

        this.orbitLine = new THREE.LineLoop(geometry, material);
        this.baseGroup.add(this.orbitLine);
    }

    createLabel() {
        const sprite = createSpriteLabel(this.data.name);
        if (!sprite) return;

        sprite.scale.set(15, 3.75, 1);
        sprite.position.y = 0.5;

        this.orbitGroup.add(sprite);
        this.labelSprite = sprite;
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

            const x = Math.cos(this.angle) * this.data.distance;
            const z = Math.sin(this.angle) * this.data.distance;

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

    toggleLabels(visible: boolean) {
        if (this.labelSprite) {
            this.labelSprite.visible = visible;
        }
    }
}
