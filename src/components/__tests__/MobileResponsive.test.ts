import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Minimap } from '../Minimap';
import { UIManager } from '../UIManager';
import { Modal } from '../Modal';

// Mock dat.gui
vi.mock('dat.gui', () => ({
    GUI: class {
        addFolder = vi.fn(() => ({
            add: vi.fn().mockReturnValue({
                name: vi.fn().mockReturnThis(),
                onChange: vi.fn().mockReturnThis(),
                step: vi.fn().mockReturnThis(),
                min: vi.fn().mockReturnThis(),
                setValue: vi.fn().mockReturnThis()
            }),
            open: vi.fn()
        }));
        domElement = document.createElement('div');
        add = vi.fn(() => ({
            name: vi.fn().mockReturnThis(),
            onChange: vi.fn().mockReturnThis(),
            step: vi.fn().mockReturnThis(),
            min: vi.fn().mockReturnThis(),
            setValue: vi.fn().mockReturnThis()
        }));
        open = vi.fn();
        close = vi.fn();
    }
}));

describe('Mobile Responsiveness & Touch Support', () => {
    describe('Minimap responsive sizing', () => {
        let container: HTMLElement;
        let mockSceneManager: any;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);

            mockSceneManager = {
                renderer: { domElement: document.createElement('canvas') },
                camera: { position: { x: 0, y: 100, z: 200 }, getWorldDirection: vi.fn() },
                controls: { target: { set: vi.fn() }, update: vi.fn() },
                detachCamera: vi.fn(),
                planets: [],
                showDwarfPlanets: true,
                showComets: true,
                showSpacecrafts: true,
                comets: [],
                spacecrafts: []
            };
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        it('should report 130px size for mobile screens (<= 768px)', () => {
            window.innerWidth = 390;
            const minimap = new Minimap(mockSceneManager, container);
            expect(minimap.getEffectiveSize()).toBe(130);
            expect(minimap.size).toBe(130);
        });

        it('should report 210px size for desktop screens (> 768px)', () => {
            window.innerWidth = 1200;
            const minimap = new Minimap(mockSceneManager, container);
            expect(minimap.getEffectiveSize()).toBe(210);
            expect(minimap.size).toBe(210);
        });
    });

    describe('UIManager Mobile HUD & Touch Interactions', () => {
        let uiContainer: HTMLElement;
        let mockSceneManager: any;
        let uiManager: UIManager;

        beforeEach(() => {
            uiContainer = document.createElement('div');
            uiContainer.id = 'ui-container';
            document.body.appendChild(uiContainer);

            mockSceneManager = {
                renderer: {
                    domElement: document.createElement('canvas')
                },
                camera: {},
                simDate: new Date(),
                planets: [
                    { data: { name: 'Mars' }, moons: [] }
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

            vi.spyOn(Modal.prototype, 'show').mockImplementation(vi.fn());
            vi.spyOn(Modal.prototype, 'hide').mockImplementation(vi.fn());

            window.innerWidth = 390;
            uiManager = new UIManager(mockSceneManager);
        });

        afterEach(() => {
            document.body.innerHTML = '';
            vi.clearAllMocks();
        });

        it('should include mobile HUD toggle buttons for radar and controls', () => {
            const radarBtn = uiContainer.querySelector('#hudRadarBtn') as HTMLButtonElement;
            const controlsBtn = uiContainer.querySelector('#hudControlsBtn') as HTMLButtonElement;

            expect(radarBtn).toBeTruthy();
            expect(controlsBtn).toBeTruthy();
        });

        it('should toggle minimap visibility when radar button is clicked', () => {
            const radarBtn = uiContainer.querySelector('#hudRadarBtn') as HTMLButtonElement;
            const initialVisible = uiManager.minimap.isVisible;

            radarBtn.click();
            expect(uiManager.minimap.isVisible).toBe(!initialVisible);

            radarBtn.click();
            expect(uiManager.minimap.isVisible).toBe(initialVisible);
        });

        it('should tolerate touch drag jitter up to 22px on touch devices', () => {
            const onClickSpy = vi.spyOn(uiManager, 'onClick').mockImplementation(vi.fn());

            // Simulate touch pointer down at (100, 100)
            uiManager.onPointerDown({
                isPrimary: true,
                clientX: 100,
                clientY: 100,
                pointerType: 'touch'
            } as any);

            // Simulate touch pointer up at (115, 100) - 15px movement
            uiManager.onPointerUp({
                isPrimary: true,
                clientX: 115,
                clientY: 100,
                pointerType: 'touch'
            } as any);

            // 15px is < 22px touch threshold, so it SHOULD trigger onClick
            expect(onClickSpy).toHaveBeenCalledWith(115, 100);
        });

        it('should NOT trigger click if mouse drag exceeds 10px on desktop', () => {
            const onClickSpy = vi.spyOn(uiManager, 'onClick').mockImplementation(vi.fn());

            // Simulate mouse down at (100, 100)
            uiManager.onPointerDown({
                isPrimary: true,
                clientX: 100,
                clientY: 100,
                pointerType: 'mouse'
            } as any);

            // Simulate mouse up at (115, 100) - 15px movement
            uiManager.onPointerUp({
                isPrimary: true,
                clientX: 115,
                clientY: 100,
                pointerType: 'mouse'
            } as any);

            // 15px exceeds 10px mouse threshold, so it should NOT trigger onClick
            expect(onClickSpy).not.toHaveBeenCalled();
        });
    });
});
