import './style.scss';
import { SceneManager } from './components/SceneManager';
import { UIManager } from './components/UIManager';

const container = document.getElementById('app');
if (!container) {
  throw new Error("App container not found");
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

if (!isWebGLAvailable()) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#030712;color:#f8fafc;font-family:sans-serif;padding:24px;text-align:center;">
      <div style="max-width:500px;background:rgba(15,23,42,0.9);border:1px solid rgba(56,189,248,0.4);border-radius:12px;padding:32px;box-shadow:0 0 40px rgba(0,0,0,0.8);">
        <h2 style="color:#38bdf8;font-size:24px;margin-top:0;letter-spacing:1px;">OBSERVATORY OFFLINE</h2>
        <p style="color:#94a3b8;line-height:1.6;font-size:15px;">
          Hardware-accelerated WebGL graphics are required to simulate the Solar System observatory.
        </p>
        <p style="color:#cbd5e1;font-size:14px;margin-bottom:0;">
          Please enable hardware acceleration in your browser settings or access via a WebGL-compatible browser.
        </p>
      </div>
    </div>
  `;
  throw new Error("WebGL is not supported or hardware acceleration is disabled.");
}

const sceneManager = new SceneManager(container);
const uiManager = new UIManager(sceneManager);

// EXPOSE FOR TESTING & CONSOLE INSPECTION
(window as any).sceneManager = sceneManager;
(window as any).uiManager = uiManager;

let animationFrameId: number | null = null;
let isAnimating = true;

function animate() {
  if (!isAnimating) return;
  animationFrameId = requestAnimationFrame(animate);
  sceneManager.update();
  uiManager.update();
}

animate();

(window as any).stopSimulation = () => {
  isAnimating = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

(window as any).startSimulation = () => {
  if (!isAnimating) {
    isAnimating = true;
    animate();
  }
};

window.addEventListener('beforeunload', () => {
  (window as any).stopSimulation?.();
  uiManager.dispose();
  sceneManager.dispose();
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    (window as any).stopSimulation?.();
    uiManager.dispose();
    sceneManager.dispose();
  });
}

