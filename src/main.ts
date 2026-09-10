import './style.scss';
import { SceneManager } from './components/SceneManager';
import { UIManager } from './components/UIManager';
import { LoadingScreen } from './components/LoadingScreen';

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
  document.getElementById('loading-screen')?.remove();
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

let animationFrameId: number | null = null;
let isAnimating = true;
let animate = () => {};

import { i18n } from './i18n';

const yieldFrame = (ms: number = 30) => new Promise(resolve => setTimeout(resolve, ms));

async function init() {
  const loadingScreen = new LoadingScreen();
  loadingScreen.setProgress(25, i18n.t('loading.core'), i18n.t('loading.tagBoot'));
  await yieldFrame(30);

  loadingScreen.setProgress(45, i18n.t('loading.ephemerides'), i18n.t('loading.tagCalibrating'));
  await yieldFrame(30);

  const sceneManager = new SceneManager(container as HTMLElement);
  await yieldFrame(30);

  loadingScreen.setProgress(70, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  await yieldFrame(30);

  const uiManager = new UIManager(sceneManager);
  await yieldFrame(30);

  loadingScreen.setProgress(90, i18n.t('loading.controls'), i18n.t('loading.tagConfiguring'));
  await yieldFrame(30);


  // EXPOSE FOR TESTING & CONSOLE INSPECTION
  (window as any).sceneManager = sceneManager;
  (window as any).uiManager = uiManager;
  (window as any).loadingScreen = loadingScreen;

  animate = () => {
    if (!isAnimating) return;
    animationFrameId = requestAnimationFrame(animate);
    sceneManager.update();
    uiManager.update();
  };

  animate();

  // Signal completion once the initial render cycle executes
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loadingScreen.complete();
    });
  });

  window.addEventListener('beforeunload', () => {
    (window as any).stopSimulation?.();
    loadingScreen.dispose();
    uiManager.dispose();
    sceneManager.dispose();
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      (window as any).stopSimulation?.();
      loadingScreen.dispose();
      uiManager.dispose();
      sceneManager.dispose();
    });
  }
}

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


init().catch(err => {
  console.error("Observatory failed to initialize:", err);
});



