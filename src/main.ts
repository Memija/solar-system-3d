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

const PREWARM_WORLD_TEXTURES = [
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune'
];

// Kick off chunk fetch, static skybox/Earth texture fetches, and off-thread planet bitmap decoding
// BEFORE `acquireWebGLContext()` blocks the main thread on GPU-process WebGL2 context creation.
const hasWebGL2Api = typeof window.WebGL2RenderingContext !== 'undefined';
const localePromise = i18n.currentLanguage !== 'en'
  ? i18n.preloadLocale(i18n.currentLanguage)
  : null;
const uiModulePromise = hasWebGL2Api ? import('./components/UIManager') : null;
uiModulePromise?.catch(() => {});

let earlyPrewarmProgress: ((done: number, total: number) => void) | null = null;
let prewarmPromise: Promise<void> | null = null;
if (hasWebGL2Api) {
  const baseUrl = import.meta.env.BASE_URL;
  TextureGenerator.preloadStaticImageBitmap(`${baseUrl}textures/milky_way.webp`);
  TextureGenerator.preloadStaticImageBitmap(`${baseUrl}textures/earth_equirectangular.webp`);
  TextureGenerator.preloadStaticImageBitmap(`${baseUrl}textures/earth_roughness.webp`);
  prewarmPromise = TextureGenerator.prewarmTexturesAsync(PREWARM_WORLD_TEXTURES, (done, total) => {
    earlyPrewarmProgress?.(done, total);
  });
  prewarmPromise.catch(() => {});
}

const bootWebGL = acquireWebGLContext();

if (!bootWebGL) {
  if (localePromise) {
    void localePromise.then(() => {
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

async function init() {
  if (localePromise) {
    await localePromise;
  }

  const loadingScreen = new LoadingScreen();
  loadingScreen.setProgress(32, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  earlyPrewarmProgress = (done, total) => {
    const pct = 32 + Math.round((done / total) * 38);
    loadingScreen.setProgress(pct, i18n.t('loading.surfaces'), i18n.t('loading.tagSynthesizing'));
  };
  if (prewarmPromise) {
    await prewarmPromise;
  } else {
    await TextureGenerator.prewarmTexturesAsync(PREWARM_WORLD_TEXTURES, earlyPrewarmProgress);
  }
  earlyPrewarmProgress = null;

  loadingScreen.setProgress(74, i18n.t('loading.ephemerides'), i18n.t('loading.tagCalibrating'));
  const sceneManager = new SceneManager(container as HTMLElement, bootWebGL);

  // Yield a macrotask so SceneManager construction doesn't merge with shader setup into a single
  // long task, then overlap GPU background shader compilation (KHR_parallel_shader_compile) with
  // CPU-bound UIManager DOM initialization instead of stalling the main thread idle in `await`.
  loadingScreen.setProgress(82, i18n.t('loading.calibrating'), i18n.t('loading.tagCalibrating'));
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  const compilePromise = sceneManager.precompileShaders();

  const { UIManager } = await (uiModulePromise ?? import('./components/UIManager'));
  loadingScreen.setProgress(90, i18n.t('loading.controls'), i18n.t('loading.tagConfiguring'));
  const uiManager = new UIManager(sceneManager);
  await compilePromise;

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

  // Flush accumulated clock delta from shader precompilation and UI setup before starting the render loop
  sceneManager.clock.getDelta();
  animate();

  // Signal completion once the initial render cycle (synchronously executed by `animate()` above) paints
  requestAnimationFrame(() => {
    void loadingScreen.complete().then(() => {
      document.getElementById('critical-loading-css')?.remove();
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
    (window as any).sceneManager?.clock?.getDelta?.();
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
