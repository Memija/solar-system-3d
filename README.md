# Solar System 3D

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Memija_solar-system-3d&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Memija_solar-system-3d)

A beautiful, interactive 3D simulation of our Solar System, built using TypeScript, Three.js, and Vite.

## Features

- Interactive 3D visualization of the solar system
- Built with modern web technologies: [TypeScript](https://www.typescriptlang.org/) and [Three.js](https://threejs.org/)
- Fast and optimized development build process powered by [Vite](https://vitejs.dev/)

## Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

## Running Tests

To run the unit tests, use the following command:

```bash
npm test
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Memija/solar-system-3d.git
   cd solar-system-3d
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided by Vite (typically `http://localhost:5173`).

## Building for Production

To create a production build, run:

```bash
npm run build
```

This will generate an optimized build in the `dist` directory.

## Performance benchmark

`npm run perf` builds the app into a temporary directory, serves it with `vite preview` on a free port and drives headless Google Chrome (GPU enabled; ANGLE/D3D11 on Windows) at a 1600×900 desktop viewport. Each run does a **cold** first visit with a fresh browser profile, then a **warm** returning visit reusing that profile (HTTP cache, IndexedDB, etc.).

Per visit it records: time until `window.sceneManager` exists and until `#loading-screen` is removed, long tasks during boot (count/total/max), transferred bytes, and over a steady-state window: average FPS, p50/p95/p99 frame time, long tasks, and `renderer.info` draw calls, triangles, shader programs and textures. A table of medians is printed and the full data is written to `perf-results/<timestamp>.json` (git-ignored).

```bash
npm run perf                                   # 3 runs, 8 s steady state
npm run perf -- --runs 5 --seconds 10
npm run perf -- --compare perf-results/2026-01-01T12-00-00-000Z.json   # print deltas vs a previous result
npm run perf -- --url http://localhost:5173/solar-system-3d/           # benchmark a running server
```

| Flag | Default | Description |
| --- | --- | --- |
| `--runs <n>` | `3` | Number of cold + warm iterations |
| `--seconds <n>` | `8` | Steady-state measurement window per visit |
| `--settle <n>` | `3` | Seconds to wait after load before measuring (also lets idle-time cache writes finish before the warm visit) |
| `--no-build` | | Serve the existing `dist/` instead of building |
| `--url <url>` | | Benchmark an already running server (no build/serve) |
| `--compare <file>` | | Print deltas against a previous result JSON (▲ marks >5% regressions) |
| `--channel <name>` | `chrome` | Browser channel (`msedge`, `chrome-beta`, … or `bundled` for Playwright's Chromium). Env: `PERF_CHANNEL` |
| `--executable <path>` | | Explicit browser binary. Env: `PERF_EXECUTABLE` |
| `--vsync` | off | Keep the frame-rate limit; by default frames are uncapped to measure throughput |
| `--headed` | | Show the browser window |
| `--timeout <s>` | `120` | Max time to wait for the app to load |
| `--out <dir>` | `perf-results` | Output directory |

Results depend on the machine's GPU; check the reported `GPU:` line (a software renderer such as SwiftShader triggers a warning) and only compare results from the same machine.

## Deployment

The project is configured for easy deployment to GitHub Pages. To deploy the current build, run:

```bash
npm run deploy
```

## Technologies Used

- [Three.js](https://threejs.org/) - A cross-browser JavaScript library and application programming interface used to create and display animated 3D computer graphics in a web browser using WebGL.
- [TypeScript](https://www.typescriptlang.org/) - A strongly typed programming language that builds on JavaScript.
- [Vite](https://vitejs.dev/) - A frontend build tool that significantly improves the frontend development experience.
- [Sass](https://sass-lang.com/) - CSS extension language.
