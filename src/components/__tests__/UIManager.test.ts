import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../UIManager';
import { Modal } from '../Modal';

// Mock dat.gui
vi.mock('dat.gui', () => ({
    GUI: class {
        addFolder = vi.fn(() => ({
            add: vi.fn(() => ({
                name: vi.fn(() => ({
                    onChange: vi.fn()
                })),
                onChange: vi.fn()
            })),
            open: vi.fn()
        }));
        domElement = document.createElement('div');
        add = vi.fn(() => ({
            name: vi.fn(() => ({
                onChange: vi.fn()
            }))
        }));
    }
}));

vi.mock('three', () => ({
    Raycaster: class {
        setFromCamera = vi.fn();
        intersectObjects = vi.fn(() => []);
    },
    Vector2: class {
        x = 0;
        y = 0;
        distanceTo = vi.fn(() => 0);
        set = vi.fn();
    }
}));

// Provide proper implementation of Minimap mock
vi.mock('../Minimap', () => {
    return {
        Minimap: class MockMinimap {
            update = vi.fn();
        }
    };
});

describe('UIManager', () => {
    let uiContainer: HTMLElement;
    let sceneManager: any;
    let uiManager: UIManager;

    beforeEach(() => {
        uiContainer = document.createElement('div');
        uiContainer.id = 'ui-container';
        document.body.appendChild(uiContainer);

        sceneManager = {
            renderer: { domElement: document.createElement('canvas') },
            camera: {},
            simDate: new Date(),
            planets: [
                { data: { name: 'Mars', description: 'Red planet' }, moons: [] },
                { data: { name: 'Jupiter', description: 'Gas giant' }, moons: [] }
            ],
            starMeshes: [],
            comets: [],
            spacecrafts: [],
            constellationManager: {
                getConstellationCenter: vi.fn(),
                constellationMeshes: []
            },
            focusOnBody: vi.fn(),
            tourMode: false,
            tourTargets: []
        };

        // Mock modal to avoid errors
        vi.spyOn(Modal.prototype, 'show').mockImplementation(vi.fn());
        vi.spyOn(Modal.prototype, 'hide').mockImplementation(vi.fn());

        uiManager = new UIManager(sceneManager);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should automatically open the modal when a planet is selected from the dropdown', () => {
        const selects = uiContainer.querySelectorAll('select');
        const typeSelect = selects[0] as HTMLSelectElement;
        const bodySelect = selects[1] as HTMLSelectElement;

        const showModalSpy = vi.spyOn(uiManager, 'showModal');
        const hideInfoSpy = vi.spyOn(uiManager, 'hideInfo');

        // Simulate changing type to Planet
        typeSelect.value = 'Planet';
        typeSelect.dispatchEvent(new Event('change'));

        // Simulate selecting Mars
        bodySelect.value = 'Mars';
        bodySelect.dispatchEvent(new Event('change'));

        // Verify that hideInfo was called first
        expect(hideInfoSpy).toHaveBeenCalled();

        // Verify that showModal was called with Mars data
        expect(showModalSpy).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Mars' })
        );

        // Verify that sceneManager.focusOnBody was called with 'Mars'
        expect(sceneManager.focusOnBody).toHaveBeenCalledWith('Mars');
    });
});
