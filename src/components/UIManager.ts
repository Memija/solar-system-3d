import * as THREE from 'three';
import * as dat from 'dat.gui';
import { SceneManager } from './SceneManager.js';
import { Modal } from './Modal.js';
import { Minimap } from './Minimap.js';
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
    datePanel: HTMLElement;
    tourController: dat.GUIController | null = null;
    minimap: Minimap;
    previousTimeSpeed: number | null = null;
    cameraTarget: string = 'Earth';

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

        this.datePanel = this.createDatePanel();

        this.minimap = new Minimap(sceneManager, this.uiContainer);

        this.createSelectionMenu();
        this.initControls();
        this.initInteraction();
        window.addEventListener('tour-focus', (e: Event) => {
            const customEvent = e as CustomEvent;
            const targetName = customEvent.detail;

            // Find data for this body
            let foundData: any = null;
            const findTarget = (body: any) => {
                if (body.data.name === targetName) {
                    foundData = body.data;
                }
                if (body.moons) body.moons.forEach(findTarget);
            };
            this.sceneManager.planets.forEach(findTarget);
            if (!foundData) {
                const comet = this.sceneManager.comets.find(c => c.data.name === targetName);
                if (comet) foundData = comet.data;
            }
            if (!foundData) {
                const sc = this.sceneManager.spacecrafts.find(s => s.data.name === targetName);
                if (sc) foundData = sc.data;
            }
            if (foundData) {
                this.showModal(foundData);
            }
        });
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

    createDatePanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.bottom = '20px';
        panel.style.left = '20px';
        panel.style.padding = '10px 20px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'monospace';
        panel.style.fontSize = '18px';
        panel.style.borderRadius = '8px';
        panel.style.border = '1px solid #555';
        panel.style.pointerEvents = 'none';
        this.uiContainer.appendChild(panel);
        return panel;
    }

    update() {
        if (this.sceneManager.simDate) {
            this.datePanel.textContent = this.sceneManager.simDate.toDateString();
        }
        if (this.minimap) {
            this.minimap.update();
        }
    }

    initControls() {
        const gui = new dat.GUI({ autoPlace: false, width: 300 });
        this.gui = gui;
        this.uiContainer.appendChild(gui.domElement);
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '20px';
        gui.domElement.style.left = '20px';

        const params = {
            timeSpeed: 0.1,
            showOrbits: true,
            showMoons: true,
            measureMode: false,
            showAsteroids: true,
            showKuiperBelt: true,
            showDwarfPlanets: true,
            showComets: true,
            showSpacecrafts: true,
            showMeteors: false,
            showTrails: true,
            showMinimap: true,
            enableBloom: true,
            showHabitableZone: false,
            showEclipticGrid: false,
            realisticLighting: false,
            showAxes: false,
            realisticDistances: false,
            realSizeRatio: 1.0
        };

        // Setup custom tooltip for GUI
        const tooltip = document.createElement('div');
        tooltip.id = 'gui-custom-tooltip';
        tooltip.className = 'gui-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // Hide tooltip globally if clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('.gui-info-icon')) {
                tooltip.style.display = 'none';
            }
        });

        // Helper to add arrows to numeric input controllers
        const addNumericArrows = (controller: dat.GUIController | undefined, obj: any, prop: string, step: number, min?: number, max?: number) => {
            setTimeout(() => {
                if (controller && controller.domElement) {
                    const inputElement = controller.domElement.querySelector('input');
                    if (inputElement) {
                        inputElement.type = 'number';
                        inputElement.style.textAlign = 'center';
                        inputElement.style.width = '60px';

                        const parent = inputElement.parentNode as HTMLElement;
                        if (parent) {
                            parent.style.display = 'flex';
                            parent.style.alignItems = 'center';
                            parent.style.justifyContent = 'center';

                            const decBtn = document.createElement('button');
                            decBtn.innerHTML = '◀';
                            decBtn.style.background = 'none';
                            decBtn.style.border = 'none';
                            decBtn.style.color = '#3b82f6';
                            decBtn.style.cursor = 'pointer';
                            decBtn.style.padding = '0 5px';
                            decBtn.style.fontSize = '12px';
                            decBtn.onclick = () => {
                                let newVal = obj[prop] - step;
                                if (min !== undefined) newVal = Math.max(min, newVal);
                                controller.setValue(newVal);
                            };
                            parent.insertBefore(decBtn, inputElement);

                            const incBtn = document.createElement('button');
                            incBtn.innerHTML = '▶';
                            incBtn.style.background = 'none';
                            incBtn.style.border = 'none';
                            incBtn.style.color = '#3b82f6';
                            incBtn.style.cursor = 'pointer';
                            incBtn.style.padding = '0 5px';
                            incBtn.style.fontSize = '12px';
                            incBtn.onclick = () => {
                                let newVal = obj[prop] + step;
                                if (max !== undefined) newVal = Math.min(max, newVal);
                                controller.setValue(newVal);
                            };
                            parent.appendChild(incBtn);
                        }
                    }
                }
            }, 100);
        };

        // Helper to add info icons to dat.gui items
        const addInfoIcon = (controller: dat.GUIController | undefined, text: string) => {
            // Check if controller exists, helpful when testing where dat.gui might be mocked
            if (!controller) return;

            // dat.gui manipulates DOM somewhat asynchronously, we use setTimeout to ensure element is there
            setTimeout(() => {
                if (controller && controller.domElement && controller.domElement.closest) {
                    const li = controller.domElement.closest('li');
                    if (li) {
                        const nameNode = li.querySelector('.property-name');
                        if (nameNode) {
                            const icon = document.createElement('span');
                            icon.innerHTML = 'i';
                            icon.className = 'gui-info-icon';
                            icon.style.display = 'inline-block';
                            icon.style.width = '14px';
                            icon.style.height = '14px';
                            icon.style.lineHeight = '14px';
                            icon.style.textAlign = 'center';
                            icon.style.borderRadius = '50%';
                            icon.style.backgroundColor = '#444';
                            icon.style.color = '#fff';
                            icon.style.fontSize = '10px';
                            icon.style.marginLeft = '5px';
                            icon.style.cursor = 'help';
                            icon.style.position = 'relative';

                            // Show custom tooltip on hover
                            icon.addEventListener('mouseenter', () => {
                                tooltip.innerHTML = text;
                                tooltip.style.display = 'block';
                                const rect = icon.getBoundingClientRect();
                                let top = rect.top - tooltip.offsetHeight - 10;
                                let left = rect.left - (tooltip.offsetWidth / 2) + (rect.width / 2);

                                if (top < 0) {
                                    top = rect.bottom + 10;
                                }
                                if (left + tooltip.offsetWidth > window.innerWidth) {
                                    left = window.innerWidth - tooltip.offsetWidth - 10;
                                }
                                if (left < 0) {
                                    left = 10;
                                }

                                tooltip.style.top = `${top}px`;
                                tooltip.style.left = `${left}px`;
                            });

                            icon.addEventListener('mouseleave', () => {
                                tooltip.style.display = 'none';
                            });

                            nameNode.appendChild(icon);
                        }
                    }
                }
            }, 100);
        };

        // Simulation Controls
        const simFolder = gui.addFolder('Simulation');

        const distCtrl = simFolder.add(params, 'realisticDistances').name('Realistic Scale').onChange(val => {
            this.sceneManager.toggleRealisticDistances(val);
            if (val) {
                this.modal.show({
                    name: "True Scale of the Solar System",
                    description: "You are now viewing the Solar System at its true scale. Planets are rendered at their actual sizes relative to the vast distances between them. Because space is mostly empty, planets appear extremely small, almost invisible dots, compared to their orbits. Pointers have been enabled to help you locate them in this mode."
                });
            } else {
                if (this.modal.contentElement && this.modal.contentElement.innerHTML.includes("True Scale of the Solar System")) {
                    this.modal.hide();
                }
            }
        });
        addInfoIcon(distCtrl, "Toggles realistic orbital distances and scales bodies to real sizes relative to the distances.");

        simFolder.add(params, 'showMinimap').name('Show Minimap').onChange(val => {
            this.minimap.setVisible(val);
        });

        const timeSpeedController = simFolder.add(params, 'timeSpeed').min(0).step(0.01).name('Time Speed').onChange(val => {
            this.sceneManager.timeScale = val;
            if (this.previousTimeSpeed !== null) {
                // User changed speed manually while something was selected
                this.previousTimeSpeed = val;
            }
        });

        // Make time speed input better looking and add arrows
        addNumericArrows(timeSpeedController, params, 'timeSpeed', 0.1, 0);

        // Listen for internal speed changes
        this.sceneManager.onTimeScaleChange = (newSpeed: number) => {
            timeSpeedController.setValue(newSpeed);
        };
        simFolder.add(params, 'showOrbits').name('Show Orbits').onChange(val => {
            this.sceneManager.toggleOrbits(val);
        });
        simFolder.add(params, 'showMoons').name('Show Moons').onChange(val => {
            this.sceneManager.toggleMoons(val);
        });
        simFolder.add(params, 'showAsteroids').name('Show Asteroids').onChange(val => {
            this.sceneManager.toggleAsteroids(val);
        });
        simFolder.add(params, 'showKuiperBelt').name('Show Kuiper Belt').onChange(val => {
            this.sceneManager.toggleKuiperBelt(val);
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
            if (val) {
                this.sceneManager.focusOnBody('Earth');
                this.modal.show({
                    name: "Meteors",
                    description: "You are now viewing meteors near Earth. A meteor is a streak of light in the sky caused by a meteoroid crashing through Earth's atmosphere. Millions of meteors occur in Earth's atmosphere daily. Most meteoroids that cause meteors are about the size of a grain of sand, and they come from comets or asteroids. They usually consist of rock or iron. When these meteoroids enter Earth's atmosphere at high speeds, friction with the air causes them to heat up and burn, creating the visible streak of light. Famous meteor showers include the Perseids (originating from Comet Swift-Tuttle), the Leonids (from Comet Tempel-Tuttle), and the Geminids (from the asteroid 3200 Phaethon)."
                });
            } else {
                if (this.modal.contentElement && this.modal.contentElement.innerHTML.includes("Meteors")) {
                    this.modal.hide();
                }
            }
        });
        const trailsCtrl = simFolder.add(params, 'showTrails').name('Show Trails').onChange(val => {
            this.sceneManager.toggleTrails(val);
        });
        addInfoIcon(trailsCtrl, "Displays the orbital paths or trails behind celestial bodies as they move.");
        simFolder.open();

        // Environment Enhancements
        const envFolder = gui.addFolder('Environment');
        const habZoneCtrl = envFolder.add(params, 'showHabitableZone').name('Habitable Zone').onChange(val => {
            this.sceneManager.toggleHabitableZone(val);
        });
        addInfoIcon(habZoneCtrl, "The region around a star where conditions might be right for liquid water to exist on a planet's surface.");

        const eclipticCtrl = envFolder.add(params, 'showEclipticGrid').name('Ecliptic Grid').onChange(val => {
            this.sceneManager.toggleEclipticGrid(val);
        });
        addInfoIcon(eclipticCtrl, "A grid representing the plane of Earth's orbit around the Sun.");

        const bloomCtrl = envFolder.add(params, 'enableBloom').name('Enable Bloom').onChange(val => {
            if (this.sceneManager.bloomPass) {
                this.sceneManager.bloomPass.enabled = val;
            }
        });
        addInfoIcon(bloomCtrl, "A post-processing effect that makes bright objects appear to glow.");

        const lightingCtrl = envFolder.add(params, 'realisticLighting').name('Realistic Lighting').onChange(val => {
            this.sceneManager.toggleRealisticLighting(val);
        });
        addInfoIcon(lightingCtrl, "Uses physically based rendering to simulate realistic light interaction with planetary surfaces.");

        const axesCtrl = envFolder.add(params, 'showAxes').name('Show Axes').onChange(val => {
            this.sceneManager.toggleAxes(val);
        });
        addInfoIcon(axesCtrl, "Displays X (red), Y (green), and Z (blue) axes for spatial orientation.");

        envFolder.open();

        // Camera Controls
        const cameraFolder = gui.addFolder('Camera Controls');

        const cameraControls = {
            focus: () => {
                const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
                if (typeSelect?.value === 'Star') {
                    const star = this.sceneManager.starMeshes.find(m => m.userData.name === this.cameraTarget);
                    if (star) this.sceneManager.focusOnStar(star);
                } else if (typeSelect?.value === 'Constellation') {
                    this.sceneManager.focusOnConstellation(this.cameraTarget);
                } else {
                    this.sceneManager.focusOnBody(this.cameraTarget);
                }
            },
            surfaceView: () => this.sceneManager.setSurfaceView(this.cameraTarget),
            detach: () => this.sceneManager.detachCamera()
        };

        cameraFolder.add(cameraControls, 'focus').name('Attach Camera');
        cameraFolder.add(cameraControls, 'surfaceView').name('View from Surface');
        cameraFolder.add(cameraControls, 'detach').name('Free Camera');

        const toolsFolder = gui.addFolder('Tools');
        const measureCtrl = toolsFolder.add(params, 'measureMode').name('Measure Distance').onChange(val => {
            this.sceneManager.toggleMeasureMode(val);
            if (val && !params.realisticDistances) {
                distCtrl.setValue(true);
            }
        });
        addInfoIcon(measureCtrl, "Enable Measure Distance, then click on two bodies in the 3D scene (or select them from the dropdown) to measure the distance between them.");
        toolsFolder.open();

        const tourParams = {
            tourMode: false,
            tourSpeed: 5 // Default speed maps to a moderate interval
        };

        this.tourController = cameraFolder.add(tourParams, 'tourMode').name('Cinematic Tour').onChange(val => {
            this.sceneManager.tourMode = val;
            if (val) {
                this.sceneManager.tourTimer = 0;
                // Start with the first body
                const targetName = this.sceneManager.tourTargets[this.sceneManager.tourIndex];
                this.sceneManager.focusOnBody(targetName);
                window.dispatchEvent(new CustomEvent('tour-focus', { detail: targetName }));
            } else {
                this.sceneManager.detachCamera();
            }
        });

        // 1 to 10 range. Speed 1 -> 20s interval. Speed 10 -> 2s interval.
        // Formula: interval = 22 - (speed * 2)
        const tourSpeedController = cameraFolder.add(tourParams, 'tourSpeed', 1, 10).name('Tour Speed').onChange(val => {
            this.sceneManager.tourInterval = 22 - (val * 2);
        });

        addNumericArrows(tourSpeedController, tourParams, 'tourSpeed', 1, 1, 10);

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
        typeSelect.id = 'typeSelect';
        typeSelect.style.padding = '8px 12px';
        typeSelect.style.backgroundColor = 'rgba(15, 15, 25, 0.65)';
        typeSelect.style.backdropFilter = 'blur(12px)';
        (typeSelect.style as any).webkitBackdropFilter = 'blur(12px)';
        typeSelect.style.color = '#fff';
        typeSelect.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        typeSelect.style.borderRadius = '8px';
        typeSelect.style.cursor = 'pointer';
        typeSelect.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        typeSelect.style.fontFamily = 'inherit';
        typeSelect.style.outline = 'none';
        typeSelect.style.transition = 'all 0.2s ease';
        typeSelect.addEventListener('mouseenter', () => typeSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
        typeSelect.addEventListener('mouseleave', () => typeSelect.style.backgroundColor = 'rgba(15, 15, 25, 0.65)');

        const types = ['Star', 'Planet', 'Moon', 'Constellation', 'Comet', 'Spacecraft'];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });

        // Body Selector
        const bodySelect = document.createElement('select');
        bodySelect.id = 'bodySelect';
        bodySelect.style.padding = '8px 12px';
        bodySelect.style.backgroundColor = 'rgba(15, 15, 25, 0.65)';
        bodySelect.style.backdropFilter = 'blur(12px)';
        (bodySelect.style as any).webkitBackdropFilter = 'blur(12px)';
        bodySelect.style.color = '#fff';
        bodySelect.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        bodySelect.style.borderRadius = '8px';
        bodySelect.style.cursor = 'pointer';
        bodySelect.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        bodySelect.style.fontFamily = 'inherit';
        bodySelect.style.outline = 'none';
        bodySelect.style.transition = 'all 0.2s ease';
        bodySelect.addEventListener('mouseenter', () => bodySelect.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
        bodySelect.addEventListener('mouseleave', () => bodySelect.style.backgroundColor = 'rgba(15, 15, 25, 0.65)');

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
            } else if (selectedType === 'Moon') {
                this.sceneManager.planets.forEach(planet => {
                    if (planet.moons && planet.moons.length > 0) {
                        planet.moons.forEach(moon => {
                            const option = document.createElement('option');
                            option.value = moon.data.name;
                            option.textContent = `${moon.data.name} (orbiting ${planet.data.name})`;
                            bodySelect.appendChild(option);
                        });
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
        typeSelect.addEventListener('change', () => {
            updateBodyOptions();
            // Trigger selection update
            bodySelect.dispatchEvent(new Event('change'));
        });

        bodySelect.addEventListener('change', () => {
            const selectedName = bodySelect.value;
            const selectedType = typeSelect.value;

            // Sync the camera target
            this.cameraTarget = selectedName;

            if (this.sceneManager.tourMode && this.tourController) {
                this.tourController.setValue(false);
            }

            if (this.sceneManager.measureMode) {
                this.sceneManager.setMeasureTarget(selectedName);
                return; // Don't show modal or focus when measuring
            }

            // Automatically hide any previous UI panels
            this.hideInfo();

            if (selectedType === 'Star') {
                if (selectedName === 'Sun') {
                    const sun = this.sceneManager.planets.find(p => p.data.name === 'Sun');
                    if (sun) {
                        this.showModal(sun.data);
                    }
                    this.sceneManager.focusOnBody('Sun');
                } else {
                    const star = this.sceneManager.starMeshes.find(m => m.userData.name === selectedName);
                    if (star && star.userData) {
                        this.showModal(star.userData);
                    }
                    if (star) {
                        this.sceneManager.focusOnStar(star);
                    }
                }
            } else if (selectedType === 'Constellation') {
                const center = this.sceneManager.constellationManager?.getConstellationCenter(selectedName);
                if (center) {
                    // Try to find the constellation data
                    const group = this.sceneManager.constellationManager?.constellationMeshes.find(g => g.userData.name === selectedName);
                    if (group && group.userData) {
                        this.showModal(group.userData);
                    }
                }
                this.sceneManager.focusOnConstellation(selectedName);
            } else {
                // Find planet, comet, spacecraft or moon
                let foundData: any = null;
                const findTarget = (body: any) => {
                    if (body.data && body.data.name === selectedName) {
                        foundData = body.data;
                    }
                    if (body.moons) {
                        body.moons.forEach(findTarget);
                    }
                };
                this.sceneManager.planets.forEach(findTarget);
                if (!foundData) {
                    const comet = this.sceneManager.comets.find(c => c.data.name === selectedName);
                    if (comet) foundData = comet.data;
                }
                if (!foundData) {
                    const sc = this.sceneManager.spacecrafts.find(s => s.data.name === selectedName);
                    if (sc) foundData = sc.data;
                }

                if (foundData) {
                    this.showModal(foundData);
                }
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
                    if (this.sceneManager.tourMode && this.tourController) {
                        this.tourController.setValue(false);
                    }

                    if (this.sceneManager.measureMode) {
                        this.sceneManager.setMeasureTarget(foundData.name);
                        return true; // Don't show modal or focus when measuring
                    }

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
            if (this.sceneManager.tourMode && this.tourController) {
                this.tourController.setValue(false);
            }
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
                if (this.sceneManager.tourMode && this.tourController) {
                    this.tourController.setValue(false);
                }
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

    showModal(data: any) {
        this.modal.show(data);
        this.infoPanel.style.display = 'none'; // Ensure simple info is hidden

        // Slow down time for low Earth orbit spacecraft
        if ('targetBody' in data && data.targetBody === 'Earth' && 'distance' in data && data.distance < 10) {
            if (this.previousTimeSpeed === null) {
                this.previousTimeSpeed = this.sceneManager.timeScale;
            }
            const slowSpeed = 0.05; // Slow down
            if (this.sceneManager.timeScale > slowSpeed) {
                this.sceneManager.timeScale = slowSpeed;
                if (this.sceneManager.onTimeScaleChange) {
                    this.sceneManager.onTimeScaleChange(slowSpeed);
                }
            }
        } else if (this.previousTimeSpeed !== null) {
            // Restore speed if switching to something else
            this.sceneManager.timeScale = this.previousTimeSpeed;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(this.previousTimeSpeed);
            }
            this.previousTimeSpeed = null;
        }
    }

    hideInfo() {
        this.selectedBody = null;
        this.infoPanel.style.display = 'none';

        if (this.previousTimeSpeed !== null) {
            this.sceneManager.timeScale = this.previousTimeSpeed;
            if (this.sceneManager.onTimeScaleChange) {
                this.sceneManager.onTimeScaleChange(this.previousTimeSpeed);
            }
            this.previousTimeSpeed = null;
        }
    }
}
