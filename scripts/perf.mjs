#!/usr/bin/env node
// Repeatable startup + steady-state performance benchmark for the Solar System app.
//
//   npm run perf                          # build to a temp dir, 3 runs, 8 s steady state
//   npm run perf -- --runs 5 --seconds 10
//   npm run perf -- --no-build            # reuse the existing ./dist
//   npm run perf -- --url http://localhost:5173/solar-system-3d/
//   npm run perf -- --compare perf-results/<previous>.json
//
// Each run performs a cold first visit (fresh Chrome profile) followed by a warm returning
// visit (same profile), so HTTP cache / IndexedDB / Cache Storage effects are captured.
// Run `node scripts/perf.mjs --help` for all flags.

import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `Usage: npm run perf -- [options]

Options:
  --runs <n>           Number of cold+warm iterations (default 3)
  --seconds <n>        Steady-state measurement window per visit in seconds (default 8)
  --settle <n>         Seconds to wait after load before measuring steady state; also lets
                       idle-time cache writes finish before the warm visit (default 3)
  --url <url>          Benchmark an already running server instead of building/serving
  --no-build           Serve the existing ./dist instead of building into a temp dir
  --channel <name>     Browser channel: chrome (default), msedge, chrome-beta, or "bundled"
                       for Playwright's own Chromium. Env: PERF_CHANNEL
  --executable <path>  Explicit browser executable (overrides --channel). Env: PERF_EXECUTABLE
  --vsync              Keep vsync / frame-rate limit (default: uncapped, measures throughput)
  --headed             Show the browser window
  --timeout <s>        Max seconds to wait for the app to finish loading (default 120)
  --compare <file>     Print deltas against a previous perf-results JSON file
  --out <dir>          Output directory for JSON results (default perf-results)
  --help               Show this help
`;

// ---------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------
function parseCli() {
  let parsed;
  try {
    parsed = parseArgs({
      allowNegative: true,
      options: {
        runs: { type: 'string', default: '3' },
        seconds: { type: 'string', default: '8' },
        settle: { type: 'string', default: '3' },
        url: { type: 'string' },
        build: { type: 'boolean', default: true },
        channel: { type: 'string', default: process.env.PERF_CHANNEL || 'chrome' },
        executable: { type: 'string', default: process.env.PERF_EXECUTABLE },
        vsync: { type: 'boolean', default: false },
        headed: { type: 'boolean', default: false },
        timeout: { type: 'string', default: '120' },
        compare: { type: 'string' },
        out: { type: 'string', default: 'perf-results' },
        help: { type: 'boolean', default: false },
      },
    }).values;
  } catch (err) {
    console.error(`${err.message}\n\n${HELP}`);
    process.exit(2);
  }
  if (parsed.help) {
    console.log(HELP);
    process.exit(0);
  }
  const num = (name, min) => {
    const v = Number(parsed[name]);
    if (!Number.isFinite(v) || v < min) {
      console.error(`--${name} must be a number >= ${min} (got "${parsed[name]}")`);
      process.exit(2);
    }
    return v;
  };
  return {
    runs: Math.floor(num('runs', 1)),
    seconds: num('seconds', 1),
    settle: num('settle', 0),
    timeoutMs: num('timeout', 5) * 1000,
    url: parsed.url,
    build: parsed.build,
    channel: parsed.channel,
    executable: parsed.executable,
    vsync: parsed.vsync,
    headed: parsed.headed,
    compare: parsed.compare,
    outDir: path.resolve(projectRoot, parsed.out),
  };
}

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
const cleanups = [];
const round = (v, d = 0) => (v == null || Number.isNaN(v) ? null : +Number(v).toFixed(d));

function median(values) {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function rmrf(dir) {
  // Chrome may hold profile files for a moment after closing (EBUSY on Windows).
  await fsp.rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }).catch((e) => {
    console.warn(`warning: could not remove ${dir}: ${e.message}`);
  });
}

async function dirSizeKB(dir, filter = () => true) {
  let total = 0;
  for (const entry of await fsp.readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    const full = path.join(entry.parentPath ?? entry.path, entry.name);
    if (filter(full)) total += (await fsp.stat(full)).size;
  }
  return round(total / 1024, 1);
}

function gitInfo() {
  try {
    const opts = { cwd: projectRoot, stdio: ['ignore', 'pipe', 'ignore'] };
    const commit = execSync('git rev-parse --short HEAD', opts).toString().trim();
    const dirty = execSync('git status --porcelain', opts).toString().trim().length > 0;
    return { commit, dirty };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------
// Build + serve (Vite JS API)
// ---------------------------------------------------------------------------------------
async function buildAndServe(opts) {
  const vite = await import('vite');
  let outDir = path.join(projectRoot, 'dist');
  let buildInfo = null;

  if (opts.build) {
    outDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'solar-perf-dist-'));
    cleanups.push(() => rmrf(outDir));
    console.log(`Building app into ${outDir} ...`);
    const t0 = Date.now();
    await vite.build({
      root: projectRoot,
      logLevel: 'warn',
      build: { outDir, emptyOutDir: true },
    });
    buildInfo = {
      ms: Date.now() - t0,
      totalKB: await dirSizeKB(outDir),
      jsKB: await dirSizeKB(outDir, (f) => f.endsWith('.js')),
    };
    console.log(`Build finished in ${buildInfo.ms} ms (${buildInfo.totalKB} KB, JS ${buildInfo.jsKB} KB)`);
  } else if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`--no-build was given but ${outDir}${path.sep}index.html does not exist. Run "npm run build" first.`);
  }

  const port = await getFreePort();
  const server = await vite.preview({
    root: projectRoot,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port, strictPort: true, open: false },
  });
  cleanups.push(() => server.close());
  const url = server.resolvedUrls?.local?.[0];
  if (!url) throw new Error('vite preview did not report a local URL');
  console.log(`Serving ${opts.build ? 'fresh build' : './dist'} at ${url}`);
  return { url, buildInfo };
}

// ---------------------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------------------
function launchOptions(opts) {
  const args = ['--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'];
  if (process.platform === 'win32') args.unshift('--use-angle=d3d11');
  if (!opts.vsync) args.push('--disable-frame-rate-limit', '--disable-gpu-vsync');
  const channel = (opts.executable || ['bundled', 'none', ''].includes(opts.channel)) ? undefined : opts.channel;
  return {
    headless: !opts.headed,
    ...(channel ? { channel } : {}),
    ...(opts.executable ? { executablePath: opts.executable } : {}),
    args,
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  };
}

function browserHint(opts, err) {
  const what = opts.executable ? `executable "${opts.executable}"` : `channel "${opts.channel}"`;
  return new Error(
    `Could not launch the browser (${what}).\n` +
      `  - Install Google Chrome, or pick another installed browser: --channel msedge\n` +
      `  - Or use Playwright's Chromium: npx playwright install chromium, then --channel bundled\n` +
      `  - Or point to a binary: --executable <path> (env PERF_EXECUTABLE)\n` +
      `Original error: ${err.message.split('\n')[0]}`,
  );
}

/**
 * Headless Chrome reports navigator.maxTouchPoints = 10 even with hasTouch: false, which makes
 * the app pick its mobile quality settings. Force a desktop (non-touch) environment.
 */
function forceDesktopInit() {
  try {
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 0, configurable: true });
    delete window.ontouchstart;
  } catch {
    /* ignore */
  }
}

/** Injected before any page script: records long tasks from navigation start. */
function longTaskObserverInit() {
  window.__perfLongTasks = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perfLongTasks.push({ start: e.startTime, dur: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    /* longtask not supported */
  }
}

function summarizeLongTasks(tasks) {
  return {
    count: tasks.length,
    totalMs: round(tasks.reduce((a, t) => a + t.dur, 0)),
    maxMs: round(Math.max(0, ...tasks.map((t) => t.dur))),
  };
}

async function measureVisit({ chromium, opts, url, userDataDir, visit, run }) {
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, launchOptions(opts));
  } catch (err) {
    throw browserHint(opts, err);
  }
  try {
    await context.addInitScript(forceDesktopInit);
    await context.addInitScript(longTaskObserverInit);
    const page = context.pages()[0] || (await context.newPage());
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`.slice(0, 300)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`.slice(0, 300));
    });

    // ---- Boot ----
    const wall0 = Date.now();
    await page.goto(url, { waitUntil: 'commit', timeout: opts.timeoutMs });
    const bootHandle = await page.waitForFunction(
      () => {
        const w = window;
        if (w.sceneManager && w.__perfSceneManagerAt == null) w.__perfSceneManagerAt = performance.now();
        if (w.sceneManager && !document.getElementById('loading-screen')) {
          return { sceneManagerMs: w.__perfSceneManagerAt, loadedMs: performance.now() };
        }
        return false;
      },
      null,
      { polling: 16, timeout: opts.timeoutMs },
    );
    const boot = await bootHandle.jsonValue();
    const wallLoadedMs = Date.now() - wall0;

    const bootDetails = await page.evaluate((loadedAt) => {
      const nav = performance.getEntriesByType('navigation')[0];
      const res = performance.getEntriesByType('resource');
      const r = window.sceneManager.renderer;
      const gl = r.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        longTasks: window.__perfLongTasks.filter((t) => t.start <= loadedAt),
        domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
        loadEventMs: nav ? nav.loadEventEnd : null,
        resourceCount: res.length + 1,
        transferBytes: res.reduce((a, e) => a + (e.transferSize || 0), nav ? nav.transferSize || 0 : 0),
        env: {
          glRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a',
          pixelRatio: r.getPixelRatio(),
          canvas: [r.domElement.width, r.domElement.height],
          touchDetected: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        },
      };
    }, boot.loadedMs);

    // ---- Settle (also gives idle-time cache writes a chance to finish before warm visit) ----
    await page.waitForTimeout(opts.settle * 1000);

    // ---- Steady state ----
    const steadyStart = await page.evaluate(() => {
      window.__perfFrames = [];
      let last = performance.now();
      const loop = (t) => {
        window.__perfFrames.push(t - last);
        last = t;
        window.__perfRaf = requestAnimationFrame(loop);
      };
      window.__perfRaf = requestAnimationFrame(loop);
      return performance.now();
    });
    await page.waitForTimeout(opts.seconds * 1000);
    const steady = await page.evaluate(
      ({ steadyStart, loadedAt }) => {
        cancelAnimationFrame(window.__perfRaf);
        const elapsed = performance.now() - steadyStart;
        const frames = window.__perfFrames.slice(5).sort((a, b) => a - b); // drop warm-up frames
        const pct = (p) => (frames.length ? frames[Math.min(frames.length - 1, Math.floor(frames.length * p))] : null);
        const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : null;
        const info = window.sceneManager.renderer.info;
        return {
          elapsedMs: elapsed,
          frames: frames.length,
          avgFrameMs: avg,
          fps: avg ? 1000 / avg : 0,
          p50: pct(0.5),
          p95: pct(0.95),
          p99: pct(0.99),
          maxFrameMs: frames.length ? frames[frames.length - 1] : null,
          steadyLongTasks: window.__perfLongTasks.filter((t) => t.start >= steadyStart),
          postLoadLongTasks: window.__perfLongTasks.filter((t) => t.start > loadedAt),
          renderer: {
            calls: info.render.calls,
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
            programs: info.programs ? info.programs.length : null,
            textures: info.memory.textures,
            geometries: info.memory.geometries,
          },
        };
      },
      { steadyStart, loadedAt: boot.loadedMs },
    );

    return {
      run,
      visit,
      boot: {
        sceneManagerMs: round(boot.sceneManagerMs),
        loadedMs: round(boot.loadedMs),
        wallLoadedMs,
        domContentLoadedMs: round(bootDetails.domContentLoadedMs),
        loadEventMs: round(bootDetails.loadEventMs),
        longTasks: summarizeLongTasks(bootDetails.longTasks),
        resources: { count: bootDetails.resourceCount, transferKB: round(bootDetails.transferBytes / 1024, 1) },
      },
      steady: {
        seconds: round(steady.elapsedMs / 1000, 2),
        frames: steady.frames,
        fps: round(steady.fps, 1),
        avgFrameMs: round(steady.avgFrameMs, 2),
        p50: round(steady.p50, 2),
        p95: round(steady.p95, 2),
        p99: round(steady.p99, 2),
        maxFrameMs: round(steady.maxFrameMs, 2),
        longTasks: summarizeLongTasks(steady.steadyLongTasks),
        postLoadLongTasks: summarizeLongTasks(steady.postLoadLongTasks),
      },
      renderer: steady.renderer,
      env: bootDetails.env,
      errors,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------------------
// [label, getter, lowerIsBetter]
const METRICS = [
  ['sceneManager (ms)', (r) => r.boot.sceneManagerMs, true],
  ['loaded (ms)', (r) => r.boot.loadedMs, true],
  ['boot long tasks', (r) => r.boot.longTasks.count, true],
  ['boot LT total (ms)', (r) => r.boot.longTasks.totalMs, true],
  ['boot LT max (ms)', (r) => r.boot.longTasks.maxMs, true],
  ['transfer (KB)', (r) => r.boot.resources.transferKB, true],
  ['avg FPS', (r) => r.steady.fps, false],
  ['frame p50 (ms)', (r) => r.steady.p50, true],
  ['frame p95 (ms)', (r) => r.steady.p95, true],
  ['frame p99 (ms)', (r) => r.steady.p99, true],
  ['steady long tasks', (r) => r.steady.longTasks.count, true],
  ['steady LT total (ms)', (r) => r.steady.longTasks.totalMs, true],
  ['post-load long tasks', (r) => r.steady.postLoadLongTasks.count, true],
  ['draw calls', (r) => r.renderer.calls, true],
  ['triangles', (r) => r.renderer.triangles, true],
  ['programs', (r) => r.renderer.programs, true],
  ['textures', (r) => r.renderer.textures, true],
];

function summarize(results) {
  const summary = {};
  for (const visit of ['cold', 'warm']) {
    const rows = results.filter((r) => r.visit === visit);
    summary[visit] = {};
    for (const [label, get] of METRICS) {
      const m = median(rows.map((r) => {
        try {
          return get(r);
        } catch {
          return null;
        }
      }));
      summary[visit][label] = m == null ? null : round(m, 2);
    }
  }
  return summary;
}

function printSummary(summary, runs) {
  console.log(`\nMedians over ${runs} run(s):`);
  const table = {};
  for (const [label] of METRICS) table[label] = { cold: summary.cold[label], warm: summary.warm[label] };
  console.table(table);
}

function printComparison(summary, comparePath) {
  const file = path.resolve(process.cwd(), comparePath);
  let prev;
  try {
    prev = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`\n--compare: could not read ${file}: ${err.message}`);
    return null;
  }
  const prevSummary = prev.summary || summarize(prev.results || []);
  const fmtDelta = (a, b) => (a == null || b == null ? '' : `${b - a >= 0 ? '+' : ''}${round(b - a, 2)}`);
  const fmtPct = (a, b) => (a == null || b == null || a === 0 ? '' : `${b - a >= 0 ? '+' : ''}${round(((b - a) / a) * 100, 1)}%`);
  const table = {};
  const deltas = {};
  for (const [label, , lowerIsBetter] of METRICS) {
    const row = {};
    deltas[label] = {};
    for (const visit of ['cold', 'warm']) {
      const a = prevSummary[visit]?.[label] ?? null;
      const b = summary[visit][label];
      row[`${visit} prev`] = a;
      row[`${visit} now`] = b;
      const pct = fmtPct(a, b);
      const worse = a != null && b != null && Math.abs(b - a) / Math.max(Math.abs(a), 1e-9) > 0.05 && (lowerIsBetter ? b > a : b < a);
      row[`${visit} Δ`] = fmtDelta(a, b);
      row[`${visit} Δ%`] = pct + (worse ? ' ▲' : '');
      deltas[label][visit] = { prev: a, now: b, delta: a == null || b == null ? null : round(b - a, 2) };
    }
    table[label] = row;
  }
  console.log(`\nComparison vs ${path.relative(process.cwd(), file)} (${prev.timestamp ?? 'unknown time'}${prev.git ? `, ${prev.git.commit}${prev.git.dirty ? '+dirty' : ''}` : ''}); ▲ = >5% worse:`);
  console.table(table);
  return { file, deltas };
}

// ---------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------
async function main() {
  const opts = parseCli();
  const { chromium } = await import('playwright');

  let url = opts.url;
  let buildInfo = null;
  if (!url) ({ url, buildInfo } = await buildAndServe(opts));
  else console.log(`Benchmarking existing server at ${url}`);

  const launch = launchOptions(opts);
  console.log(
    `Browser: ${opts.executable || launch.channel || 'bundled chromium'} ${launch.headless ? '(headless)' : '(headed)'}, ` +
      `${opts.vsync ? 'vsync on' : 'uncapped frame rate'}; runs=${opts.runs}, steady=${opts.seconds}s, settle=${opts.settle}s\n`,
  );

  const results = [];
  for (let run = 1; run <= opts.runs; run++) {
    const userDataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'solar-perf-profile-'));
    try {
      for (const visit of ['cold', 'warm']) {
        const r = await measureVisit({ chromium, opts, url, userDataDir, visit, run });
        results.push(r);
        console.log(
          `run ${run}/${opts.runs} ${visit.padEnd(4)}: loaded ${r.boot.loadedMs} ms, boot LT ${r.boot.longTasks.count}× ` +
            `(max ${r.boot.longTasks.maxMs} ms), ${r.steady.fps} fps, p95 ${r.steady.p95} ms, ` +
            `${r.renderer.calls} calls, ${r.renderer.programs} programs` +
            (r.errors.length ? `, ${r.errors.length} page error(s)` : ''),
        );
        for (const e of r.errors.slice(0, 3)) console.log(`    ${e}`);
        if (run === 1 && visit === 'cold') {
          if (/swiftshader|llvmpipe|software/i.test(r.env.glRenderer)) {
            console.warn(`  warning: software WebGL renderer in use (${r.env.glRenderer}); numbers are not representative.`);
          }
          if (r.env.touchDetected) console.warn('  warning: page detected touch support; app may have chosen mobile settings.');
        }
      }
    } finally {
      await rmrf(userDataDir);
    }
  }

  const summary = summarize(results);
  printSummary(summary, opts.runs);
  const comparison = opts.compare ? printComparison(summary, opts.compare) : null;

  const timestamp = new Date().toISOString();
  const output = {
    timestamp,
    git: gitInfo(),
    url: opts.url ?? null,
    config: {
      runs: opts.runs,
      seconds: opts.seconds,
      settle: opts.settle,
      vsync: opts.vsync,
      headless: !opts.headed,
      browser: opts.executable || launch.channel || 'bundled',
      args: launch.args,
      viewport: launch.viewport,
      source: opts.url ? 'url' : opts.build ? 'fresh-build' : 'dist',
      platform: `${process.platform}-${process.arch}`,
      node: process.version,
    },
    env: results[0]?.env ?? null,
    build: buildInfo,
    summary,
    comparison,
    results,
  };
  await fsp.mkdir(opts.outDir, { recursive: true });
  const outFile = path.join(opts.outDir, `${timestamp.replace(/[:.]/g, '-')}.json`);
  await fsp.writeFile(outFile, JSON.stringify(output, null, 2));
  console.log(`\nGPU: ${output.env?.glRenderer}`);
  console.log(`Full results written to ${path.relative(process.cwd(), outFile)}`);
}

async function runCleanups() {
  while (cleanups.length) {
    const fn = cleanups.pop();
    try {
      await fn();
    } catch (err) {
      console.warn(`cleanup warning: ${err.message}`);
    }
  }
}

process.once('SIGINT', async () => {
  console.error('\nInterrupted, cleaning up...');
  await runCleanups();
  process.exit(130);
});

main()
  .then(runCleanups)
  .catch(async (err) => {
    console.error(`\nperf failed: ${err.stack || err.message}`);
    await runCleanups();
    process.exitCode = 1;
  });
