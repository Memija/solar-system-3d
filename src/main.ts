import './style.scss';
import { SceneManager } from './components/SceneManager';
import { UIManager } from './components/UIManager';
import { LoadingScreen } from './components/LoadingScreen';
import { TextureGenerator } from './components/TextureGenerator';
import { i18n } from './i18n';

const container = document.getElementById('app');
if (!container) {
  throw new Error('App container not found');
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function renderBootFallback(title: string, description: string): void {
  document.getElementById('loading-screen')?.remove();
  document.getElementById('critical-loading-css')?.remove();
  if (!container) return;
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;height:100dvh;background:#02050d;color:#f8fafc;font-family:'Inter',sans-serif;padding:24px;text-align:center;">
      <div style="max-width:500px;background:rgba(15,23,42,0.92);border:1px solid rgba(56,189,248,0.4);border-radius:14px;padding:32px;box-shadow:0 0 40px rgba(0,0,0,0.8);">
        <h2 style="color:#38bdf8;font-family:'Exo 2',sans-serif;font-size:22px;margin-top:0;letter-spacing:1.2px;text-transform:uppercase;">${title}</h2>
        <p style="color:#cbd5e1;line-height:1.6;font-size:15px;margin-bottom:0;">
          ${description}
        </p>
      </div>
    </div>
  `;
}

if (!isWebGLAvailable()) {
  if (i18n.currentLanguage !== 'en') {
    void i18n.preloadLocale(i18n.currentLanguage).then(() => {
      renderBootFallback(
        i18n.t('ui.webglUnavailableTitle'),
        i18n.t('ui.webglUnavailableDesc')
      );
    });
  }
  renderBootFallback(
    i18n.t('ui.webglUnavailableTitle'),
    i18n.t('ui.webglUnavailableDesc')
  );
  throw new Error('WebGL is not supported or hardware acceleration is disabled.');
}

let animationFrameId: number | null = null;
let isAnimating = true;
let animate = () => {};

const yieldFrame = (ms: number = 16) => new Promise(resolve => setTimeout(resolve, ms));

const PREWARM_WORLD_TEXTURES = [
  'Mercury',
  'Venus',
  'EarthClouds',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Ceres',
  'Io',
  'Europa',
  'Ganymede',
  'Callisto',
  'Titan',
  'Enceladus',
  'Triton'
];

async function init() {
  if (i18n.currentLanguage !== 'en') {
    await i18n.preloadLocale(i18n.currentLanguage);
  }

  const loadingScreen = new LoadingScreen();
  loadingScreen.setProgress(24, i18n.t('loading.core'), i18n.t('loading.tagBoot'));
  await yieldFrame(16);

  loadingScreen.setProgress(32, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  await TextureGenerator.prewarmTexturesAsync(PREWARM_WORLD_TEXTURES, (done, total) => {
    const pct = 32 + Math.round((done / total) * 38);
    loadingScreen.setProgress(pct, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  });

  loadingScreen.setProgress(74, i18n.t('loading.ephemerides'), i18n.t('loading.tagCalibrating'));
  await yieldFrame(16);

  const sceneManager = new SceneManager(container as HTMLElement);
  await yieldFrame(16);

  loadingScreen.setProgress(90, i18n.t('loading.controls'), i18n.t('loading.tagConfiguring'));
  const uiManager = new UIManager(sceneManager);
  await yieldFrame(16);

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
      void loadingScreen.complete().then(() => {
        document.getElementById('critical-loading-css')?.remove();
      });
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

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
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
  console.error('Observatory failed to initialize:', err);
  renderBootFallback(
    i18n.t('ui.webglUnavailableTitle'),
    i18n.t('ui.webglUnavailableDesc')
  );
});
