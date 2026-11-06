import * as THREE from 'three';
import type { UIManager } from './UIManager';
import { HeaderSlotsManager } from './HeaderSlotsManager';

type PickKind = 'planet' | 'moon' | 'comet' | 'spacecraft' | 'star' | 'constellation';

interface PickEntry {
    kind: PickKind;
    name: string;
    data: any;
    object: THREE.Object3D | null;
}

/**
 * ScenePicker
 * Performs normalized 3D raycasting against planets, moons, rings, labels,
 * comets, spacecraft, major catalog stars, and constellations, routing hits
 * either to active Measure Mode or to camera focus & dossier inspection.
 */
export class ScenePicker {
    private readonly ui: UIManager;
    public readonly raycaster: THREE.Raycaster;
    public readonly mouse: THREE.Vector2;
    private readonly targets: THREE.Object3D[] = [];
    private readonly entryByObj = new WeakMap<THREE.Object3D, PickEntry>();
    private static readonly DROPDOWN_TYPE_MAP: Record<PickKind, string> = {
        planet: 'Planet',
        moon: 'Moon',
        comet: 'Comet',
        spacecraft: 'Spacecraft',
        star: 'Star',
        constellation: 'Constellation'
    };

    constructor(ui: UIManager) {
        this.ui = ui;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    private registerTarget(
        obj: THREE.Object3D | null | undefined,
        kind: PickKind,
        name: string,
        data: any,
        rootObj: THREE.Object3D | null
    ): void {
        if (!obj || obj.visible === false) return;
        this.targets.push(obj);
        let entry = this.entryByObj.get(obj);
        if (!entry || entry.name !== name || entry.data !== data) {
            entry = { kind, name, data, object: rootObj };
            this.entryByObj.set(obj, entry);
        }
    }

    public pick(clientX: number, clientY: number): void {
        const ui = this.ui;
        const sm = ui.sceneManager;
        if (!sm || !sm.camera) return;

        const width = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1024;
        const height = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 768;

        this.mouse.x = (clientX / width) * 2 - 1;
        this.mouse.y = -(clientY / height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, sm.camera);

        const targets = this.targets;
        targets.length = 0;

        // 1. Sun, Planets, Dwarf Planets, and Moons
        (sm.planets || []).forEach(planet => {
            if (!planet) return;
            if (planet.data?.isDwarfPlanet && sm.showDwarfPlanets === false) return;
            if (planet.orbitGroup && planet.orbitGroup.visible === false) return;

            const planetKind: PickKind = planet.data?.name === 'Sun' ? 'star' : 'planet';
            const pName = planet.data.name;
            const pData = planet.data;
            const pMesh = planet.mesh;

            this.registerTarget(pMesh, planetKind, pName, pData, pMesh);
            this.registerTarget(planet.cloudMesh, planetKind, pName, pData, pMesh);
            if (planet.labelSprite && planet.labelSprite.visible) {
                this.registerTarget(planet.labelSprite, planetKind, pName, pData, pMesh);
            }
            if (Array.isArray(planet.ringMeshes)) {
                planet.ringMeshes.forEach(ring => this.registerTarget(ring, planetKind, pName, pData, pMesh));
            }

            if (sm.showMoons !== false && Array.isArray(planet.moons)) {
                planet.moons.forEach(moon => {
                    if (!moon || (moon.orbitGroup && moon.orbitGroup.visible === false)) return;
                    const mName = moon.data.name;
                    const mData = moon.data;
                    const mMesh = moon.mesh;
                    this.registerTarget(mMesh, 'moon', mName, mData, mMesh);
                    if (moon.labelSprite && moon.labelSprite.visible) {
                        this.registerTarget(moon.labelSprite, 'moon', mName, mData, mMesh);
                    }
                });
            }
        });

        // 2. Comets
        if (sm.showComets !== false && Array.isArray(sm.comets)) {
            sm.comets.forEach(comet => {
                if (!comet?.mesh || comet.mesh.visible === false) return;
                this.registerTarget(comet.mesh, 'comet', comet.data.name, comet.data, comet.mesh);
            });
        }

        // 3. Spacecrafts (meshes may be hierarchical Groups)
        if (sm.showSpacecrafts !== false && Array.isArray(sm.spacecrafts)) {
            sm.spacecrafts.forEach(sc => {
                if (!sc?.mesh || sc.mesh.visible === false) return;
                this.registerTarget(sc.mesh, 'spacecraft', sc.data.name, sc.data, sc.mesh);
            });
        }

        // 4. Major Background Catalog Stars
        if (Array.isArray(sm.starMeshes)) {
            sm.starMeshes.forEach(starMesh => {
                if (!starMesh || starMesh.visible === false || !starMesh.userData?.name) return;
                this.registerTarget(starMesh, 'star', starMesh.userData.name, starMesh.userData, starMesh);
            });
        }

        // 5. Constellations (only when visible)
        const constellationsVisible = sm.showConstellations ?? sm.constellationManager?.isVisible ?? true;
        if (constellationsVisible && sm.constellationManager) {
            const interactables = typeof sm.constellationManager.getInteractableObjects === 'function'
                ? sm.constellationManager.getInteractableObjects()
                : [];
            interactables.forEach(cObj => {
                if (!cObj || cObj.visible === false || !cObj.userData?.name) return;
                this.registerTarget(cObj, 'constellation', cObj.userData.name, cObj.userData, cObj);
            });
        }

        if (targets.length === 0) return;

        const intersects = this.raycaster.intersectObjects(targets, true);
        if (!intersects || intersects.length === 0) return;

        // Resolve hit object (walking ancestor chain for grouped meshes like Spacecraft)
        let matched: PickEntry | undefined;
        for (const hit of intersects) {
            let curr: THREE.Object3D | null = hit.object;
            while (curr) {
                const found = this.entryByObj.get(curr);
                if (found) {
                    matched = found;
                    break;
                }
                curr = curr.parent;
            }
            if (matched) break;
        }

        if (!matched) return;

        // Active Measure Mode: route physical Solar System bodies to ruler endpoints
        if (sm.measureMode) {
            const isSolarSystemBody =
                matched.name === 'Sun' ||
                matched.kind === 'planet' ||
                matched.kind === 'moon' ||
                matched.kind === 'comet' ||
                matched.kind === 'spacecraft';

            if (isSolarSystemBody && typeof sm.setMeasureTarget === 'function') {
                sm.setMeasureTarget(matched.name);
                ui.audioManager?.playTick?.();
                ui.updateMeasureHud();
            }
            return;
        }

        // Stop Cinematic Tour if user manually selects an object in the 3D scene
        if (sm.tourMode) {
            sm.tourMode = false;
            ui.controlCenter?.syncSwitches();
            if (ui.headerSlotsContainer) {
                HeaderSlotsManager.updateSlotStates(ui.headerSlotsContainer, ui);
            }
        }

        ui.selectedBody = matched.data;
        ui.audioManager?.playTick?.();

        ui.syncDropdownSelection(matched.name, ScenePicker.DROPDOWN_TYPE_MAP[matched.kind]);

        if (matched.kind === 'constellation') {
            sm.focusOnConstellation?.(matched.name);
        } else if (matched.kind === 'star' && matched.name !== 'Sun' && matched.object) {
            sm.focusOnStar?.(matched.object);
        } else {
            ui.focusOrSurfaceTarget(matched.name);
        }

        ui.showModal(matched.data);
    }
}
