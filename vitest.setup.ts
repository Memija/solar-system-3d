import '@testing-library/jest-dom';
import { i18n } from './src/i18n';

// Preload lazy locale chunks for synchronous unit test switching
await Promise.all(['bs', 'de', 'id', 'pl', 'sr'].map(code => i18n.preloadLocale(code)));

// Mock getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    roundRect: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn((text?: string) => ({ width: (text?.length || 6) * 14 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
})) as any;

// Mock THREE.js properly
vi.mock('three', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        WebGLRenderer: class {
            domElement = document.createElement('canvas');
            setSize = vi.fn();
            setPixelRatio = vi.fn();
            render = vi.fn();
            dispose = vi.fn();
            toneMapping = 0;
            toneMappingExposure = 1;
            shadowMap = { enabled: false, type: 0 };
            capabilities = { getMaxAnisotropy: () => 16 };
            info = {
                autoReset: true,
                reset: vi.fn(),
                render: { calls: 12, triangles: 4500, points: 0, lines: 0 },
                memory: { geometries: 10, textures: 8 }
            };
        },
        PMREMGenerator: class {
            compileEquirectangularShader = vi.fn();
            fromEquirectangular = vi.fn(() => ({
                texture: new actual.Texture(),
                dispose: vi.fn()
            }));
            fromScene = vi.fn(() => ({
                texture: new actual.Texture(),
                dispose: vi.fn()
            }));
            dispose = vi.fn();
        }
    };
});

vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
    EffectComposer: class {
        renderTarget1: any;
        renderTarget2: any;
        writeBuffer: any;
        readBuffer: any;
        passes: any[] = [];
        constructor(_renderer?: any, renderTarget?: any) {
            this.renderTarget1 = renderTarget ?? { width: 800, height: 600, setSize: vi.fn(), dispose: vi.fn(), clone: () => ({ width: 800, height: 600, setSize: vi.fn(), dispose: vi.fn(), texture: {} }), texture: {} };
            this.renderTarget2 = this.renderTarget1.clone ? this.renderTarget1.clone() : { width: 800, height: 600, setSize: vi.fn(), dispose: vi.fn(), texture: {} };
            this.writeBuffer = this.renderTarget1;
            this.readBuffer = this.renderTarget2;
        }
        swapBuffers() {
            const tmp = this.readBuffer;
            this.readBuffer = this.writeBuffer;
            this.writeBuffer = tmp;
        }
        addPass = vi.fn((pass: any) => {
            this.passes.push(pass);
        });
        render = vi.fn(() => {
            for (const pass of this.passes) {
                if (pass?.enabled === false) continue;
                if (pass?.needsSwap) this.swapBuffers();
            }
        });
        setSize = vi.fn();
        dispose = vi.fn();
    }
}));

vi.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
    RenderPass: class {
        enabled = true;
        needsSwap = false;
        setSize = vi.fn();
    }
}));

vi.mock('three/examples/jsm/postprocessing/UnrealBloomPass.js', () => ({
    UnrealBloomPass: class {
        enabled = true;
        needsSwap = false;
        strength = 1;
        radius = 1;
        threshold = 1;
        setSize = vi.fn();
        dispose = vi.fn();
    }
}));

vi.mock('three/examples/jsm/postprocessing/OutputPass.js', () => ({
    OutputPass: class {
        enabled = true;
        needsSwap = true;
        setSize = vi.fn();
        dispose = vi.fn();
    }
}));
