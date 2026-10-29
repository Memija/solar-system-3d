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

    constructor(ui: UIManager) {
        this.ui = ui;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
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

        const targets: THREE.Object3D[] = [];
        const entryByObj = new Map<THREE.Object3D, PickEntry>();

        const registerObject = (obj: THREE.Object3D | null | undefined, entry: PickEntry) => {
            if (!obj || obj.visible === false) return;
            targets.push(obj);
            entryByObj.set(obj, entry);
        };

        // 1. Sun, Planets, Dwarf Planets, and Moons
        (sm.planets || []).forEach(planet => {
            if (!planet) return;
            if (planet.data?.isDwarfPlanet && sm.showDwarfPlanets === false) return;
            if (planet.orbitGroup && planet.orbitGroup.visible === false) return;

            const planetKind: PickKind = planet.data?.name === 'Sun' ? 'star' : 'planet';
            const planetEntry: PickEntry = {
                kind: planetKind,
                name: planet.data.name,
                data: planet.data,
                object: planet.mesh
            };

            registerObject(planet.mesh, planetEntry);
            registerObject(planet.cloudMesh, planetEntry);
            if (planet.labelSprite && planet.labelSprite.visible) {
                registerObject(planet.labelSprite, planetEntry);
            }
            if (Array.isArray(planet.ringMeshes)) {
                planet.ringMeshes.forEach(ring => registerObject(ring, planetEntry));
            }

            if (sm.showMoons !== false && Array.isArray(planet.moons)) {
                planet.moons.forEach(moon => {
                    if (!moon || (moon.orbitGroup && moon.orbitGroup.visible === false)) return;
                    const moonEntry: PickEntry = {
                        kind: 'moon',
                        name: moon.data.name,
                        data: moon.data,
                        object: moon.mesh
                    };
                    registerObject(moon.mesh, moonEntry);
                    if (moon.labelSprite && moon.labelSprite.visible) {
                        registerObject(moon.labelSprite, moonEntry);
                    }
                });
            }
        });

        // 2. Comets
        if (sm.showComets !== false && Array.isArray(sm.comets)) {
            sm.comets.forEach(comet => {
                if (!comet?.mesh || comet.mesh.visible === false) return;
                registerObject(comet.mesh, {
                    kind: 'comet',
                    name: comet.data.name,
                    data: comet.data,
                    object: comet.mesh
                });
            });
        }

        // 3. Spacecrafts (meshes may be hierarchical Groups)
        if (sm.showSpacecrafts !== false && Array.isArray(sm.spacecrafts)) {
            sm.spacecrafts.forEach(sc => {
                if (!sc?.mesh || sc.mesh.visible === false) return;
                registerObject(sc.mesh, {
                    kind: 'spacecraft',
                    name: sc.data.name,
                    data: sc.data,
                    object: sc.mesh
                });
            });
        }

        // 4. Major Background Catalog Stars
        if (Array.isArray(sm.starMeshes)) {
            sm.starMeshes.forEach(starMesh => {
                if (!starMesh || starMesh.visible === false || !starMesh.userData?.name) return;
                registerObject(starMesh, {
                    kind: 'star',
                    name: starMesh.userData.name,
                    data: starMesh.userData,
                    object: starMesh
                });
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
                registerObject(cObj, {
                    kind: 'constellation',
                    name: cObj.userData.name,
                    data: cObj.userData,
                    object: cObj
                });
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
                const found = entryByObj.get(curr);
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

        const dropdownTypeMap: Record<PickKind, string> = {
            planet: 'Planet',
            moon: 'Moon',
            comet: 'Comet',
            spacecraft: 'Spacecraft',
            star: 'Star',
            constellation: 'Constellation'
        };

        ui.syncDropdownSelection(matched.name, dropdownTypeMap[matched.kind]);

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
