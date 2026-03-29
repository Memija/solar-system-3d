import * as THREE from 'three';
import * as dat from 'dat.gui';
import { SceneManager } from './SceneManager.js';
import { Modal } from './Modal.js';
import { CelestialBodyData, MoonData, StarData, ConstellationData, CometData, SpacecraftData } from './SolarSystemData.js';

export class UIManager {
    sceneManager: SceneManager;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    selectedBody: CelestialBodyData | MoonData | StarData | ConstellationData | CometData | SpacecraftData | null;
    uiContainer: HTMLElement;
    infoPanel: HTMLElement;
    modal: Modal;
    gui: dat.GUI | null;
    mouseDownPos: THREE.Vector2;
    mouseUpPos: THREE.Vector2;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedBody = null;
        this.gui = null;
        this.mouseDownPos = new THREE.Vector2();
        this.mouseUpPos = new THREE.Vector2();

        const container = document.getElementById('ui-container');
        if (!container) throw new Error("UI Container not found");
        this.uiContainer = container;

        this.infoPanel = this.createInfoPanel();
        this.modal = new Modal(this.uiContainer);

        this.createSelectionMenu();
        this.initControls();
        this.initInteraction();
    }

    createInfoPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.top = '20px';
        panel.style.right = '20px';
        panel.style.padding = '15px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        panel.style.border = '1px solid #444';
        panel.style.borderRadius = '8px';
        panel.style.color = '#fff';
        panel.style.display = 'none';
        panel.style.pointerEvents = 'none';
        this.uiContainer.appendChild(panel);
        return panel;
    }

    initControls() {
        const gui = new dat.GUI({ autoPlace: false });
        this.gui = gui;
        this.uiContainer.appendChild(gui.domElement);
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '20px';
        gui.domElement.style.left = '20px';

        const params = {
            timeSpeed: 1,
            showOrbits: true,
            showMoons: true,
            showAsteroids: true,
            showDwarfPlanets: true,
            showComets: true,
            showSpacecrafts: true,
            showMeteors: false,
            showLabels: true,
            showInfos: true
        };

        // Simulation Controls
        const simFolder = gui.addFolder('Simulation');
        simFolder.add(params, 'timeSpeed', 0, 5).name('Time Speed').onChange(val => {
            this.sceneManager.timeScale = val;
        });
        simFolder.add(params, 'showOrbits').name('Show Orbits').onChange(val => {
            this.sceneManager.toggleOrbits(val);
        });
        simFolder.add(params, 'showMoons').name('Show Moons').onChange(val => {
            this.sceneManager.toggleMoons(val);
        });
        simFolder.add(params, 'showAsteroids').name('Show Asteroids').onChange(val => {
            this.sceneManager.toggleAsteroids(val);
        });
        simFolder.add(params, 'showDwarfPlanets').name('Show Dwarf Planets').onChange(val => {
            this.sceneManager.toggleDwarfPlanets(val);
        });
        simFolder.add(params, 'showComets').name('Show Comets').onChange(val => {
            this.sceneManager.toggleComets(val);
        });
        simFolder.add(params, 'showSpacecrafts').name('Show Spacecraft').onChange(val => {
            this.sceneManager.toggleSpacecrafts(val);
        });
        simFolder.add(params, 'showMeteors').name('Show Meteors').onChange(val => {
            this.sceneManager.toggleMeteors(val);
        });
        simFolder.add(params, 'showLabels').name('Show Labels').onChange(val => {
            this.sceneManager.toggleLabels(val);
        });
        simFolder.add(params, 'showInfos').name('Show Info').onChange(val => {
            this.sceneManager.toggleInfos(val);
        });
        simFolder.open();

        // Camera Controls
        const cameraFolder = gui.addFolder('Camera Controls');

        const cameraControls = {
            target: 'Earth', // Default
            focus: () => this.sceneManager.focusOnBody(cameraControls.target),
            surfaceView: () => this.sceneManager.setSurfaceView(cameraControls.target),
            detach: () => this.sceneManager.detachCamera()
        };

        // Dropdown for selecting target - keeping it as it was part of the old menu, 
        // though redundant with the new menu, user asked to restore the "old camera related menu".
        // I will keep it to be safe, or I could remove just the target dropdown if I'm sure.
        // Given the user said "broke the old camera related menu", they probably miss the buttons.
        // I'll keep the target dropdown too to ensure full restoration.
        const targetNames = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ceres', 'Eris', 'Haumea', 'Makemake', "Halley's Comet", "Hale-Bopp", "ISS (International Space Station)", "Hubble Space Telescope", "Voyager 1"];
        cameraFolder.add(cameraControls, 'target', targetNames).name('Target Body');

        cameraFolder.add(cameraControls, 'focus').name('Attach Camera');
        cameraFolder.add(cameraControls, 'surfaceView').name('View from Surface');
        cameraFolder.add(cameraControls, 'detach').name('Free Camera');

        cameraFolder.open();
    }

    createSelectionMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.style.position = 'absolute';
        menuContainer.style.top = '20px';
        menuContainer.style.right = '20px';
        menuContainer.style.display = 'flex';
        menuContainer.style.gap = '10px';
        menuContainer.style.zIndex = '1000';

        // Type Selector
        const typeSelect = document.createElement('select');
        typeSelect.style.padding = '8px';
        typeSelect.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        typeSelect.style.color = '#fff';
        typeSelect.style.border = '1px solid #444';
        typeSelect.style.borderRadius = '4px';
        typeSelect.style.cursor = 'pointer';

        const types = ['Star', 'Planet', 'Constellation', 'Comet', 'Spacecraft'];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });

        // Body Selector
        const bodySelect = document.createElement('select');
        bodySelect.style.padding = '8px';
        bodySelect.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        bodySelect.style.color = '#fff';
        bodySelect.style.border = '1px solid #444';
        bodySelect.style.borderRadius = '4px';
        bodySelect.style.cursor = 'pointer';

        // Populate Body Selector based on Type
        const updateBodyOptions = () => {
            bodySelect.innerHTML = '';
            const selectedType = typeSelect.value;

            if (selectedType === 'Star') {
                // Add Sun (if it's in planets but we want it here)
                const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                if (sun) {
                    const option = document.createElement('option');
                    option.value = 'Sun';
                    option.textContent = 'Sun';
                    bodySelect.appendChild(option);
                }

                // Add other stars
                this.sceneManager.starMeshes.forEach(mesh => {
                    if (mesh.userData?.name) {
                        const option = document.createElement('option');
                        option.value = mesh.userData.name;
                        option.textContent = mesh.userData.name;
                        bodySelect.appendChild(option);
                    }
                });
            } else if (selectedType === 'Planet') {
                this.sceneManager.planets.forEach(planet => {
                    if (planet.data.name !== 'Sun') {
                        const option = document.createElement('option');
                        option.value = planet.data.name;
                        option.textContent = planet.data.name;
                        bodySelect.appendChild(option);
                    }
                });

            } else if (selectedType === 'Constellation') {
                if (this.sceneManager.constellationManager) {
                    this.sceneManager.constellationManager.constellationMeshes.forEach(group => {
                        if (group.userData?.name) {
                            const option = document.createElement('option');
                            option.value = group.userData.name;
                            option.textContent = group.userData.name;
                            bodySelect.appendChild(option);
                        }
                    });
                }
            } else if (selectedType === 'Comet') {
                this.sceneManager.comets.forEach(comet => {
                    const option = document.createElement('option');
                    option.value = comet.data.name;
                    option.textContent = comet.data.name;
                    bodySelect.appendChild(option);
                });
            } else if (selectedType === 'Spacecraft') {
                this.sceneManager.spacecrafts.forEach(sc => {
                    const option = document.createElement('option');
                    option.value = sc.data.name;
                    option.textContent = sc.data.name;
                    bodySelect.appendChild(option);
                });
            }
        };

        // Initial population
        typeSelect.value = 'Planet'; // Default
        updateBodyOptions();

        // Event Listeners
        typeSelect.addEventListener('change', updateBodyOptions);

        bodySelect.addEventListener('change', () => {
            const selectedName = bodySelect.value;
            const selectedType = typeSelect.value;

            if (selectedType === 'Star') {
                if (selectedName === 'Sun') {
                    this.sceneManager.focusOnBody('Sun');
                } else {
                    const star = this.sceneManager.starMeshes.find(m => m.userData.name === selectedName);
                    if (star) this.sceneManager.focusOnStar(star);
                }
            } else if (selectedType === 'Constellation') {
                this.sceneManager.focusOnConstellation(selectedName);
            } else {
                this.sceneManager.focusOnBody(selectedName);
            }
        });

        menuContainer.appendChild(typeSelect);
        menuContainer.appendChild(bodySelect);
        this.uiContainer.appendChild(menuContainer);
    }

    initInteraction() {
        const canvas = this.sceneManager.renderer.domElement;
        // Use pointer events for better compatibility and to match OrbitControls
        canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
        canvas.addEventListener('pointerup', (event) => this.onPointerUp(event));
    }

    onPointerDown(event: PointerEvent) {
        if (event.isPrimary === false) return;
        this.mouseDownPos.set(event.clientX, event.clientY);
    }

    onPointerUp(event: PointerEvent) {
        if (event.isPrimary === false) return;
        this.mouseUpPos.set(event.clientX, event.clientY);

        // Only process click if mouse hasn't moved much (not a drag)
        const dragDistance = this.mouseDownPos.distanceTo(this.mouseUpPos);
        if (dragDistance < 10) { // Threshold for click vs drag
            this.onClick(event.clientX, event.clientY);
        }
    }

    private handlePlanetsAndMoonsIntersection(): boolean {
        const interactableObjects: THREE.Object3D[] = [];
        const bodyMap = new Map<THREE.Object3D, CelestialBodyData | MoonData | CometData | SpacecraftData>();

        const addBodyToInteractables = (body: import('./CelestialBody.js').CelestialBody) => {
            if (body.mesh) {
                interactableObjects.push(body.mesh);
                bodyMap.set(body.mesh, body.data);
            }
            if (body.cloudMesh) {
                interactableObjects.push(body.cloudMesh);
                bodyMap.set(body.cloudMesh, body.data);
            }
            if (body.atmosphereMesh) {
                interactableObjects.push(body.atmosphereMesh);
                bodyMap.set(body.atmosphereMesh, body.data);
            }
            body.moons.forEach(moon => addBodyToInteractables(moon));
        };

        this.sceneManager.planets.forEach(p => addBodyToInteractables(p));

        this.sceneManager.comets.forEach(comet => {
            if (comet.mesh?.visible) {
                interactableObjects.push(comet.mesh);
                bodyMap.set(comet.mesh, comet.data);
            }
        });

        this.sceneManager.spacecrafts.forEach(sc => {
            if (sc.mesh?.visible) {
                interactableObjects.push(sc.mesh);
                bodyMap.set(sc.mesh, sc.data);
            }
        });

        const intersects = this.raycaster.intersectObjects(interactableObjects, true); // true for recursive (since spacecraft is a Group)

        if (intersects.length > 0) {
            for (const intersect of intersects) {
                // Because we use recursive intersection (true), intersect.object might be a child mesh of the Spacecraft group
                // We need to trace up to see if it's in our bodyMap
                let currentObj: THREE.Object3D | null = intersect.object;
                let foundData = null;

                while (currentObj && currentObj !== this.sceneManager.scene) {
                    foundData = bodyMap.get(currentObj);
                    if (foundData) break;
                    currentObj = currentObj.parent;
                }

                if (foundData) {
                    this.showModal(foundData);
                    this.sceneManager.focusOnBody(foundData.name);
                    return true;
                }
            }
        }
        return false;
    }

    private handleStarsIntersection(): boolean {
        if (!this.sceneManager.starMeshes) return false;

        const starIntersects = this.raycaster.intersectObjects(this.sceneManager.starMeshes);
        if (starIntersects.length > 0) {
            const selectedStar = starIntersects[0].object;
            if (selectedStar.userData?.name) {
                this.showModal(selectedStar.userData);
                this.sceneManager.focusOnStar(selectedStar);
            }
            return true;
        }
        return false;
    }

    private handleConstellationsIntersection(): boolean {
        if (!this.sceneManager.constellationManager) return false;

        const constellationObjects = this.sceneManager.constellationManager.getInteractableObjects();
        const constellationIntersects = this.raycaster.intersectObjects(constellationObjects);

        if (constellationIntersects.length > 0) {
            const selectedObj = constellationIntersects[0].object;
            if (selectedObj.userData?.type === 'ConstellationStar' || selectedObj.userData?.type === 'ConstellationLine') {
                this.showModal(selectedObj.userData);
                return true;
            }
        }
        return false;
    }

    onClick(clientX: number, clientY: number) {
        try {
            // Calculate NDC from click coordinates
            const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            // Raycast
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

            if (this.handlePlanetsAndMoonsIntersection()) return;
            if (this.handleStarsIntersection()) return;
            if (this.handleConstellationsIntersection()) return;

            // Nothing clicked
            this.hideInfo();
        } catch (error) {
            console.error("Error in onClick:", error);
        }
    }

    showModal(data: CelestialBodyData | MoonData | StarData | ConstellationData | CometData | SpacecraftData) {
        this.modal.show(data);
        this.infoPanel.style.display = 'none'; // Ensure simple info is hidden
    }

    hideInfo() {
        this.selectedBody = null;
        this.infoPanel.style.display = 'none';
    }
}
