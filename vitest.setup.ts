import '@testing-library/jest-dom';

// Mock getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
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
            toneMapping = 0;
            toneMappingExposure = 1;
            shadowMap = { enabled: false, type: 0 };
        }
    }
});

vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
    EffectComposer: class {
        addPass = vi.fn();
        render = vi.fn();
        setSize = vi.fn();
    }
}));

vi.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
    RenderPass: class {}
}));

vi.mock('three/examples/jsm/postprocessing/UnrealBloomPass.js', () => ({
    UnrealBloomPass: class {
        strength = 1;
        radius = 1;
        threshold = 1;
    }
}));
