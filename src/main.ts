import './style.scss';
import { SceneManager, type BootWebGLContext } from './components/SceneManager';
import { LoadingScreen } from './components/LoadingScreen';
import { TextureGenerator } from './components/TextureGenerator';
import { i18n } from './i18n';

const container = document.getElementById('app');
if (!container) {
  throw new Error('App container not found');
}

/**
 * Probe WebGL2 support (required by three.js r163+) and keep the resulting context so the
 * renderer can adopt it. Creating a throwaway probe context and then a second one for the
 * renderer costs hundreds of milliseconds of GPU-process initialisation on boot and leaves
 * an orphaned context alive until garbage collection.
 * Attributes mirror what SceneManager would otherwise request from THREE.WebGLRenderer.
 */
function acquireWebGLContext(): BootWebGLContext | null {
  try {
    if (typeof window.WebGL2RenderingContext === 'undefined') return null;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', {
      alpha: false,
      depth: true,
      stencil: false,
      antialias: false, // MSAA is resolved inside the EffectComposer render target
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    });
    return context ? { canvas, context } : null;
  } catch {
    return null;
  }
}

function renderBootFallback(title: string, description: string): void {
  document.getElementById('loading-screen')?.remove();
  document.getElementById('critical-loading-css')?.remove();
  if (!container) return;
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;height:100dvh;background:#02050d;color:#f8fafc;font-family:'Inter',sans-serif;padding:24px;text-align:center;">
      <div style="max-width:500px;background:rgba(15,23,42,0.92);border:1px solid rgba(56,189,248,0.4);border-radius:14px;padding:32px;box-shadow:0 0 40px rgba(0,0,0,0.8);">
        <h2 style="color:#38bdf8;font-family:'Exo 2',sans-serif;font-size:22px;margin-top:0;letter-spacing:1.2px;">${title}</h2>
        <p style="color:#cbd5e1;line-height:1.6;font-size:15px;margin-bottom:0;">
          ${description}
        </p>
      </div>
    </div>
  `;
}

const bootWebGL = acquireWebGLContext();

if (!bootWebGL) {
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
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune'
];

async function init() {
  if (i18n.currentLanguage !== 'en') {
    await i18n.preloadLocale(i18n.currentLanguage);
  }

  const loadingScreen = new LoadingScreen();
  loadingScreen.setProgress(24, i18n.t('loading.core'), i18n.t('loading.tagBoot'));
  // Begin fetching the code-split UI chunk in parallel while textures & shaders warm up
  const uiModulePromise = import('./components/UIManager');
  await yieldFrame(16);

  loadingScreen.setProgress(32, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  await TextureGenerator.prewarmTexturesAsync(PREWARM_WORLD_TEXTURES, (done, total) => {
    const pct = 32 + Math.round((done / total) * 38);
    loadingScreen.setProgress(pct, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  });

  loadingScreen.setProgress(74, i18n.t('loading.ephemerides'), i18n.t('loading.tagCalibrating'));
  await yieldFrame(16);

  const sceneManager = new SceneManager(container as HTMLElement, bootWebGL);
  await yieldFrame(16);

  // Compile every material's shader program in parallel (KHR_parallel_shader_compile) while the
  // loading screen is still animating, instead of stalling the main thread on the first frame.
  loadingScreen.setProgress(82, i18n.t('loading.calibrating'), i18n.t('loading.tagCalibrating'));
  await sceneManager.precompileShaders();

  loadingScreen.setProgress(90, i18n.t('loading.controls'), i18n.t('loading.tagConfiguring'));
  const { UIManager } = await uiModulePromise;
  const uiManager = new UIManager(sceneManager);
  await yieldFrame(16);

  // EXPOSE FOR TESTING & CONSOLE INSPECTION
  (window as any).sceneManager = sceneManager;
  (window as any).uiManager = uiManager;
  (window as any).loadingScreen = loadingScreen;

  let lastFrameTime = 0;
  animate = () => {
    if (!isAnimating || document.hidden) {
      animationFrameId = null;
      return;
    }
    animationFrameId = requestAnimationFrame(animate);
    if (sceneManager.maxFps > 0) {
      const now = performance.now();
      const minInterval = 1000 / sceneManager.maxFps;
      const elapsed = now - lastFrameTime;
      if (elapsed < minInterval - 0.5) {
        return;
      }
      lastFrameTime = now - (elapsed % minInterval);
    }
    sceneManager.update();
    uiManager.update();
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else if (isAnimating) {
      // Flush accumulated clock delta while the tab was hidden to prevent a time jump
      sceneManager.clock.getDelta();
      if (animationFrameId === null) {
        animate();
      }
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

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
    document.removeEventListener('visibilitychange', onVisibilityChange);
    (window as any).stopSimulation?.();
    loadingScreen.dispose();
    uiManager.dispose();
    sceneManager.dispose();
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
