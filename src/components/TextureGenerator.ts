import * as THREE from 'three';

/**
 * Procedural Equirectangular 2:1 Planet Texture Generator
 * Generates seamless, scientifically styled surface maps for all Solar System bodies.
 */
export class TextureGenerator {
    private static cache: Map<string, THREE.CanvasTexture> = new Map();
    public static maxAnisotropy: number = 16;

    /**
     * Configure maximum anisotropy based on hardware capabilities
     */
    static setMaxAnisotropy(max: number): void {
        this.maxAnisotropy = Math.max(1, max);
    }

    /**
     * Clear and dispose all cached textures to free GPU memory and canvas pixel buffers
     */
    static dispose(): void {
        this.cache.forEach(texture => {
            texture.dispose();
        });
        this.cache.clear();
    }

    /**
     * Get or create a 2:1 equirectangular texture for a celestial body
     */
    static getPlanetTexture(name: string): THREE.CanvasTexture {
        if (this.cache.has(name)) {
            return this.cache.get(name)!;
        }

        const isMobile = typeof window !== 'undefined' && (
            ('ontouchstart' in window) ||
            (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
            window.innerWidth <= 768
        );
        const width = isMobile ? 1024 : 2048;
        const height = isMobile ? 512 : 1024;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            const fallback = new THREE.CanvasTexture(canvas);
            return fallback;
        }

        switch (name) {
            case 'Mercury':
                this.drawMercury(ctx, width, height);
                break;
            case 'Venus':
                this.drawVenus(ctx, width, height);
                break;
            case 'Earth':
                this.drawEarth(ctx, width, height);
                break;
            case 'EarthClouds':
                this.drawEarthClouds(ctx, width, height);
                break;
            case 'Moon':
            case 'Phobos':
            case 'Deimos':
                this.drawMoon(ctx, width, height);
                break;
            case 'Mars':
                this.drawMars(ctx, width, height);
                break;
            case 'Jupiter':
                this.drawJupiter(ctx, width, height);
                break;
            case 'Saturn':
                this.drawSaturn(ctx, width, height);
                break;
            case 'Uranus':
                this.drawUranus(ctx, width, height);
                break;
            case 'Neptune':
                this.drawNeptune(ctx, width, height);
                break;
            case 'Pluto':
                this.drawPluto(ctx, width, height);
                break;
            case 'Ceres':
                this.drawCeres(ctx, width, height);
                break;
            case 'Haumea':
                this.drawHaumea(ctx, width, height);
                break;
            case 'Makemake':
                this.drawMakemake(ctx, width, height);
                break;
            case 'Io':
                this.drawIo(ctx, width, height);
                break;
            case 'Europa':
                this.drawEuropa(ctx, width, height);
                break;
            case 'Ganymede':
                this.drawGanymede(ctx, width, height);
                break;
            case 'Callisto':
                this.drawCallisto(ctx, width, height);
                break;
            case 'Titan':
                this.drawTitan(ctx, width, height);
                break;
            case 'Enceladus':
                this.drawEnceladus(ctx, width, height);
                break;
            case 'Triton':
                this.drawTriton(ctx, width, height);
                break;
            default:
                this.drawGenericPlanet(ctx, width, height, name);
                break;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = TextureGenerator.maxAnisotropy;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;

        this.cache.set(name, texture);
        return texture;
    }

    /**
     * Get or create a 2:1 equirectangular roughness map (e.g. for Earth ocean specular reflection)
     */
    static getPlanetRoughnessMap(name: string): THREE.CanvasTexture {
        const key = `${name}_Roughness`;
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const width = 1024;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        this.cache.set(key, texture);

        if (!ctx) return texture;

        // Default fill matte
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, 0, width, height);

        if (name === 'Earth' && typeof Image !== 'undefined') {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = `${import.meta.env.BASE_URL}textures/earth_equirectangular.png`;
                img.onload = () => {
                    if (!ctx.getImageData) return;
                    ctx.drawImage(img, 0, 0, width, height);
                    const imgData = ctx.getImageData(0, 0, width, height);
                    if (!imgData || !imgData.data) return;
                    const data = imgData.data;
                    for (let i = 0; i < width * height; i++) {
                        const p = i * 4;
                        const r = data[p];
                        const g = data[p + 1];
                        const b = data[p + 2];

                        // Detect ocean (deep blue where blue dominates and red is low)
                        const isOcean = b > 55 && r < 50 && g < 80;
                        const isIce = r > 190 && g > 190 && b > 190;

                        let roughness: number;
                        if (isOcean) {
                            roughness = 30; // 0.12 roughness - specular sun glint for oceans
                        } else if (isIce) {
                            roughness = 120; // 0.47 roughness for polar ice
                        } else {
                            roughness = 225; // 0.88 roughness for dry landmass
                        }

                        data[p] = roughness;
                        data[p + 1] = roughness;
                        data[p + 2] = roughness;
                        data[p + 3] = 255;
                    }
                    ctx.putImageData(imgData, 0, 0);
                    texture.needsUpdate = true;
                };
            } catch {
                // Ignore in testing environments
            }
        }

        return texture;
    }

    // --- PROCEDURAL DRAWING HELPERS ---

    private static safeCreateImageData(ctx: CanvasRenderingContext2D, w: number, h: number): ImageData | null {
        try {
            if (typeof ctx.createImageData === 'function') {
                const data = ctx.createImageData(w, h);
                if (data && data.data) return data;
            }
        } catch {
            // fallback
        }
        return null;
    }

    private static createNoise(w: number, h: number, octaves = 4, persistence = 0.5): Float32Array {
        const size = w * h;
        const result = new Float32Array(size);

        // Simple deterministic noise
        const baseNoise = new Float32Array(size);
        let s = 1234567;
        const pseudoRand = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };

        for (let i = 0; i < size; i++) {
            baseNoise[i] = pseudoRand();
        }

        let maxVal = 0;
        let amplitude = 1;

        for (let o = 0; o < octaves; o++) {
            const step = Math.max(1, Math.floor(Math.pow(2, octaves - o)));
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const x0 = Math.floor(x / step) * step;
                    const x1 = (x0 + step) % w;
                    const y0 = Math.floor(y / step) * step;
                    const y1 = Math.min(h - 1, y0 + step);

                    const fx = (x - x0) / step;
                    const fy = (y - y0) / step;

                    const sx = fx * fx * (3 - 2 * fx);
                    const sy = fy * fy * (3 - 2 * fy);

                    const v00 = baseNoise[y0 * w + x0];
                    const v10 = baseNoise[y0 * w + x1];
                    const v01 = baseNoise[y1 * w + x0];
                    const v11 = baseNoise[y1 * w + x1];

                    const top = v00 + (v10 - v00) * sx;
                    const bottom = v01 + (v11 - v01) * sx;
                    const val = top + (bottom - top) * sy;

                    result[y * w + x] += val * amplitude;
                }
            }
            maxVal += amplitude;
            amplitude *= persistence;
        }

        for (let i = 0; i < size; i++) {
            result[i] /= maxVal;
        }

        return result;
    }

    private static drawMercury(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 6, 0.55);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x);
                const n = noise[idx];
                const p = idx * 4;

                // Mercury cratered grey/brown terrain
                const base = Math.floor(100 + n * 110);
                data[p] = Math.min(255, base + 8);     // R
                data[p + 1] = Math.min(255, base + 4); // G
                data[p + 2] = base;                   // B
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Add impact craters
        ctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
        ctx.strokeStyle = 'rgba(210, 210, 210, 0.35)';
        ctx.lineWidth = 2;

        let seed = 42;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

        for (let i = 0; i < 350; i++) {
            const cx = rand() * w;
            const cy = (0.1 + rand() * 0.8) * h;
            const r = 3 + rand() * 22;

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Central peak for large craters
            if (r > 12) {
                ctx.fillStyle = 'rgba(230, 230, 230, 0.4)';
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
            }
        }
    }

    private static drawVenus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise1 = this.createNoise(w, h, 5, 0.5);
        const noise2 = this.createNoise(w, h, 3, 0.6);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const latFlow = Math.sin(lat * 3) * 0.15;

            for (let x = 0; x < w; x++) {
                const shiftX = (x + Math.floor(latFlow * w) + w) % w;
                const idx = y * w + shiftX;
                const n = noise1[idx] * 0.6 + noise2[idx] * 0.4;
                const p = (y * w + x) * 4;

                // Golden sulfuric acid clouds
                data[p] = Math.floor(220 + n * 35);     // R (Gold)
                data[p + 1] = Math.floor(180 + n * 45); // G
                data[p + 2] = Math.floor(110 + n * 40); // B
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Add prominent horizontal cloud storm bands
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(190, 140, 70, 0.35)');
        grad.addColorStop(0.2, 'rgba(245, 210, 140, 0.1)');
        grad.addColorStop(0.5, 'rgba(215, 165, 90, 0.25)');
        grad.addColorStop(0.8, 'rgba(245, 210, 140, 0.1)');
        grad.addColorStop(1, 'rgba(190, 140, 70, 0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    private static drawEarth(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 6, 0.55);

        for (let y = 0; y < h; y++) {
            const lat = (y / h); // 0 (North Pole) to 1 (South Pole)
            const isPolar = lat < 0.12 || lat > 0.88;
            const isSubPolar = lat < 0.18 || lat > 0.82;

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const p = idx * 4;

                if (isPolar || (isSubPolar && n > 0.35)) {
                    // Ice caps
                    data[p] = 240;
                    data[p + 1] = 248;
                    data[p + 2] = 255;
                } else if (n > 0.52) {
                    // Landmass / Continents
                    if (n > 0.68) {
                        // Mountains / High elevation
                        data[p] = 165;
                        data[p + 1] = 145;
                        data[p + 2] = 120;
                    } else if (lat > 0.35 && lat < 0.55 && n > 0.58) {
                        // Desert / Savanna
                        data[p] = 195;
                        data[p + 1] = 170;
                        data[p + 2] = 110;
                    } else {
                        // Lush green forests & grasslands
                        data[p] = 45;
                        data[p + 1] = 115;
                        data[p + 2] = 45;
                    }
                } else if (n > 0.49) {
                    // Coastlines & Shallow continental shelves
                    data[p] = 25;
                    data[p + 1] = 95;
                    data[p + 2] = 150;
                } else {
                    // Deep Oceans
                    data[p] = 10;
                    data[p + 1] = 40;
                    data[p + 2] = 105;
                }
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawEarthClouds(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise1 = this.createNoise(w, h, 6, 0.55);
        const noise2 = this.createNoise(w, h, 4, 0.65);
        const noise3 = this.createNoise(w, h, 2, 0.75);

        for (let y = 0; y < h; y++) {
            const lat = y / h; // 0 = North pole, 0.5 = Equator, 1 = South pole

            // Earth atmospheric meteorological circulation belts:
            // 1. ITCZ: Intense equatorial convective cloud band
            const itcz = Math.exp(-Math.pow((lat - 0.5) * 16, 2)) * 0.18;

            // 2. Mid-latitude storm tracks (35 - 55 deg N & S) with cyclonic waves
            const midLatWaveNorth = Math.exp(-Math.pow((lat - 0.28) * 9, 2)) * 0.16;
            const midLatWaveSouth = Math.exp(-Math.pow((lat - 0.72) * 9, 2)) * 0.16;
            const midLatBelts = midLatWaveNorth + midLatWaveSouth;

            // 3. Subtropical high-pressure clear belts (Sahara, Kalahari, oceanic dry zones at ~20-30 deg)
            const dryZoneNorth = Math.exp(-Math.pow((lat - 0.38) * 12, 2)) * 0.12;
            const dryZoneSouth = Math.exp(-Math.pow((lat - 0.62) * 12, 2)) * 0.12;
            const dryZones = dryZoneNorth + dryZoneSouth;

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const lon = x / w;

                // Cyclonic swirling vorticity along jet-stream waves
                const cycloneVorticity = Math.sin(lon * Math.PI * 8 + lat * 14) * 0.07 * (midLatBelts > 0.05 ? 1.0 : 0.0);

                // Multi-scale cloud noise synthesis
                const rawN = (noise1[idx] * 0.52 + noise2[idx] * 0.33 + noise3[idx] * 0.15);
                const n = rawN + itcz + midLatBelts - dryZones + cycloneVorticity;
                const p = idx * 4;

                if (n > 0.53) {
                    // Crisp, bright white cloud banks with soft feathered edges:
                    // n in [0.53, 0.58] -> feathered fringes (alpha 60 to 200)
                    // n > 0.58 -> thick storm cores (alpha 200 to 255)
                    let alpha: number;
                    if (n > 0.58) {
                        alpha = Math.min(255, Math.floor(210 + (n - 0.58) * 450));
                    } else {
                        const t = (n - 0.53) / 0.05;
                        alpha = Math.floor(60 + t * 150);
                    }

                    // Pure brilliant white clouds
                    data[p] = 255;
                    data[p + 1] = 255;
                    data[p + 2] = 255;
                    data[p + 3] = alpha;
                } else {
                    data[p] = 255;
                    data[p + 1] = 255;
                    data[p + 2] = 255;
                    data[p + 3] = 0;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawMars(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 6, 0.52);
        const fineNoise = this.createNoise(w, h, 3, 0.6);

        for (let y = 0; y < h; y++) {
            const lat = y / h; // 0 = North pole, 1 = South pole

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const fn = fineNoise[idx];
                const p = idx * 4;

                // Base Martian iron-oxide colors
                let r: number;
                let g: number;
                let b: number;

                if (n > 0.58) {
                    // Dark volcanic basaltic provinces (Syrtis Major, Acidalia, etc.)
                    r = Math.floor(135 + n * 45);
                    g = Math.floor(55 + n * 25);
                    b = Math.floor(35 + n * 18);
                } else {
                    // Rusty reddish-ochre desert regolith & sand seas
                    r = Math.floor(190 + n * 45);
                    g = Math.floor(82 + n * 30);
                    b = Math.floor(45 + n * 20);
                }

                // Natural organic polar ice caps with spiral pinwheel chasmata (Chasma Boreale)
                // North polar cap (Planum Boreum)
                const lon = (x / w) * Math.PI * 2;
                const northSpiral = Math.sin(lon * 3 + (1.0 - lat * 15)) * 0.008;
                const northCapEdge = 0.035 + (n * 0.015) + northSpiral;

                if (lat < northCapEdge + 0.02) {
                    // Smooth transition factor
                    const frostFactor = Math.min(1, Math.max(0, (northCapEdge + 0.02 - lat) / 0.025 * (0.6 + fn * 0.4)));
                    const iceR = 230 + Math.floor(fn * 20);
                    const iceG = 220 + Math.floor(fn * 20);
                    const iceB = 210 + Math.floor(fn * 25);

                    r = Math.floor(r * (1 - frostFactor) + iceR * frostFactor);
                    g = Math.floor(g * (1 - frostFactor) + iceG * frostFactor);
                    b = Math.floor(b * (1 - frostFactor) + iceB * frostFactor);
                }

                // South polar cap (Planum Australe)
                const southSpiral = Math.sin(lon * 2 + (lat * 15)) * 0.006;
                const southCapEdge = 0.965 - (n * 0.012) + southSpiral;

                if (lat > southCapEdge - 0.02) {
                    const frostFactor = Math.min(1, Math.max(0, (lat - (southCapEdge - 0.02)) / 0.025 * (0.6 + fn * 0.4)));
                    const iceR = 230 + Math.floor(fn * 20);
                    const iceG = 220 + Math.floor(fn * 20);
                    const iceB = 210 + Math.floor(fn * 25);

                    r = Math.floor(r * (1 - frostFactor) + iceR * frostFactor);
                    g = Math.floor(g * (1 - frostFactor) + iceG * frostFactor);
                    b = Math.floor(b * (1 - frostFactor) + iceB * frostFactor);
                }

                data[p] = Math.min(255, r);
                data[p + 1] = Math.min(255, g);
                data[p + 2] = Math.min(255, b);
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Valles Marineris canyon feature
        ctx.strokeStyle = 'rgba(70, 25, 15, 0.7)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(w * 0.33, h * 0.52);
        ctx.bezierCurveTo(w * 0.42, h * 0.54, w * 0.52, h * 0.50, w * 0.62, h * 0.53);
        ctx.stroke();

        // Olympus Mons volcano
        ctx.fillStyle = 'rgba(120, 45, 25, 0.7)';
        ctx.beginPath();
        ctx.arc(w * 0.26, h * 0.43, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(55, 18, 10, 0.8)';
        ctx.beginPath();
        ctx.arc(w * 0.26, h * 0.43, 8, 0, Math.PI * 2);
        ctx.fill();

        // Impact craters in southern highlands
        ctx.fillStyle = 'rgba(45, 15, 10, 0.35)';
        ctx.strokeStyle = 'rgba(215, 120, 80, 0.3)';
        ctx.lineWidth = 1.5;
        let seed = 777;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let i = 0; i < 120; i++) {
            const cx = rand() * w;
            const cy = (0.45 + rand() * 0.45) * h;
            const cr = 2 + rand() * 12;
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    private static drawJupiter(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 5, 0.5);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            // Characteristic horizontal band turbulence
            const bandFreq = Math.sin(lat * 16) * 0.5 + Math.sin(lat * 32) * 0.2;

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const combined = (bandFreq + 0.7) * 0.5 + n * 0.3;
                const p = idx * 4;

                // Belts and zones (russet, ochre, cream, and white)
                if (combined > 0.65) {
                    // Dark reddish brown belt
                    data[p] = 185 + Math.floor(n * 35);
                    data[p + 1] = 105 + Math.floor(n * 30);
                    data[p + 2] = 65 + Math.floor(n * 20);
                } else if (combined > 0.45) {
                    // Tan / Ochre zone
                    data[p] = 215 + Math.floor(n * 30);
                    data[p + 1] = 165 + Math.floor(n * 30);
                    data[p + 2] = 120 + Math.floor(n * 25);
                } else {
                    // Light cream zone
                    data[p] = 240 + Math.floor(n * 15);
                    data[p + 1] = 220 + Math.floor(n * 20);
                    data[p + 2] = 190 + Math.floor(n * 25);
                }
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Draw Great Red Spot (southern hemisphere)
        const grsX = w * 0.62;
        const grsY = h * 0.68;
        const radX = 65;
        const radY = 40;

        const grsGrad = ctx.createRadialGradient(grsX, grsY, 5, grsX, grsY, radX);
        grsGrad.addColorStop(0, 'rgba(215, 65, 30, 0.95)');
        grsGrad.addColorStop(0.6, 'rgba(235, 120, 60, 0.85)');
        grsGrad.addColorStop(1, 'rgba(215, 165, 90, 0.0)');

        ctx.fillStyle = grsGrad;
        ctx.beginPath();
        ctx.ellipse(grsX, grsY, radX, radY, 0, 0, Math.PI * 2);
        ctx.fill();

        // GRS central vortex core
        ctx.fillStyle = 'rgba(180, 45, 20, 0.9)';
        ctx.beginPath();
        ctx.ellipse(grsX - 4, grsY, radX * 0.35, radY * 0.4, 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    private static drawSaturn(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 4, 0.45);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const band = Math.sin(lat * 20) * 0.25 + Math.sin(lat * 8) * 0.4;

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const p = idx * 4;

                // Saturn's golden-tan pastel bands
                const v = band + n * 0.2;
                data[p] = Math.floor(220 + v * 30);     // R (Gold)
                data[p + 1] = Math.floor(195 + v * 35); // G (Tan)
                data[p + 2] = Math.floor(145 + v * 30); // B
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawUranus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 3, 0.4);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const polarGlow = Math.cos(lat) * 0.15;

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx] * 0.1;
                const p = idx * 4;

                // Aquamarine / pale cyan
                data[p] = Math.floor(145 + polarGlow * 30 + n * 20);
                data[p + 1] = Math.floor(215 + polarGlow * 20 + n * 15);
                data[p + 2] = Math.floor(235 + n * 15);
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawNeptune(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 4, 0.5);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const band = Math.sin(lat * 14) * 0.2;

            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const p = idx * 4;

                // Deep vivid azure cobalt blue
                data[p] = Math.floor(35 + (band + n) * 30);
                data[p + 1] = Math.floor(80 + (band + n) * 45);
                data[p + 2] = Math.floor(210 + n * 35);
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Great Dark Spot
        ctx.fillStyle = 'rgba(15, 35, 110, 0.75)';
        ctx.beginPath();
        ctx.ellipse(w * 0.38, h * 0.45, 55, 30, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // White methane cirrus companion streaks
        ctx.strokeStyle = 'rgba(240, 250, 255, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.33, h * 0.42);
        ctx.lineTo(w * 0.44, h * 0.42);
        ctx.stroke();
    }

    private static drawPluto(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 6, 0.55);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const p = idx * 4;

                // Reddish-brown tholin terrain & rocky highlands
                const base = 120 + n * 80;
                data[p] = Math.floor(base + 35);     // R (Reddish)
                data[p + 1] = Math.floor(base * 0.75); // G
                data[p + 2] = Math.floor(base * 0.6);  // B
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Tombaugh Regio (The iconic bright heart-shaped nitrogen ice sheet)
        const heartX = w * 0.55;
        const heartY = h * 0.52;

        ctx.fillStyle = 'rgba(245, 238, 225, 0.92)';
        ctx.beginPath();
        ctx.arc(heartX - 35, heartY - 20, 50, 0, Math.PI * 2);
        ctx.arc(heartX + 35, heartY - 20, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(heartX - 80, heartY - 15);
        ctx.lineTo(heartX, heartY + 75);
        ctx.lineTo(heartX + 80, heartY - 15);
        ctx.fill();
    }

    private static drawMoon(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 6, 0.55);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const n = noise[idx];
                const p = idx * 4;

                // Dark basaltic maria vs bright highlands
                const base = n < 0.45 ? Math.floor(65 + n * 60) : Math.floor(140 + n * 90);
                data[p] = base;
                data[p + 1] = base;
                data[p + 2] = base;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Impact craters and ray systems
        ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
        ctx.strokeStyle = 'rgba(240, 240, 240, 0.4)';
        ctx.lineWidth = 1.5;

        let seed = 101;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

        for (let i = 0; i < 400; i++) {
            const cx = rand() * w;
            const cy = (0.05 + rand() * 0.9) * h;
            const r = 2 + rand() * 18;

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    private static drawCeres(ctx: CanvasRenderingContext2D, w: number, h: number) {
        this.drawMoon(ctx, w, h);
        // Bright salt spots (Occator crater)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(w * 0.48, h * 0.42, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    private static drawHaumea(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 4, 0.5);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            const b = 180 + n * 65;
            data[p] = b;
            data[p + 1] = b + 10;
            data[p + 2] = b + 15;
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Dark red spot
        ctx.fillStyle = 'rgba(160, 60, 40, 0.6)';
        ctx.beginPath();
        ctx.arc(w * 0.35, h * 0.5, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    private static drawMakemake(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 5, 0.5);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            data[p] = Math.floor(180 + n * 50);     // Reddish brown
            data[p + 1] = Math.floor(100 + n * 40);
            data[p + 2] = Math.floor(70 + n * 30);
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawIo(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 5, 0.5);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            data[p] = Math.floor(220 + n * 35);     // Sulfur yellow & orange
            data[p + 1] = Math.floor(190 + n * 40);
            data[p + 2] = Math.floor(40 + n * 30);
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Volcanic calderas (Loki Patera, Pele)
        ctx.fillStyle = 'rgba(80, 20, 10, 0.85)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc((i * 53) % w, (i * 29) % h, 4 + (i % 6), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private static drawEuropa(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 4, 0.4);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            const b = 220 + n * 35;
            data[p] = b;
            data[p + 1] = b;
            data[p + 2] = b + 5;
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Lineae (reddish-brown cracked ice fractures)
        ctx.strokeStyle = 'rgba(160, 75, 45, 0.65)';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.moveTo((i * 70) % w, (i * 35) % h);
            ctx.bezierCurveTo(
                (i * 70 + 200) % w, (i * 35 + 100) % h,
                (i * 70 + 400) % w, (i * 35 - 80 + h) % h,
                (i * 70 + 600) % w, (i * 35 + 40) % h
            );
            ctx.stroke();
        }
    }

    private static drawGanymede(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 5, 0.5);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            const b = 110 + n * 80;
            data[p] = b + 10;
            data[p + 1] = b + 5;
            data[p + 2] = b;
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawCallisto(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 6, 0.55);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            const b = 70 + n * 65;
            data[p] = b;
            data[p + 1] = b;
            data[p + 2] = b;
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawTitan(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 3, 0.4);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            data[p] = Math.floor(220 + n * 25);     // Deep orange photochemical haze
            data[p + 1] = Math.floor(140 + n * 30);
            data[p + 2] = Math.floor(40 + n * 20);
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawEnceladus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 4, 0.4);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            const b = 240 + n * 15;
            data[p] = b;
            data[p + 1] = b;
            data[p + 2] = b;
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Tiger stripes (South polar geyser rifts)
        ctx.strokeStyle = 'rgba(100, 160, 220, 0.7)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(w * 0.4 + i * 40, h * 0.88);
            ctx.lineTo(w * 0.45 + i * 40, h * 0.96);
            ctx.stroke();
        }
    }

    private static drawTriton(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 5, 0.5);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            data[p] = Math.floor(205 + n * 35);     // Cantaloupe terrain & nitrogen frost
            data[p + 1] = Math.floor(215 + n * 30);
            data[p + 2] = Math.floor(220 + n * 30);
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawGenericPlanet(ctx: CanvasRenderingContext2D, w: number, h: number, _name: string) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const noise = this.createNoise(w, h, 4, 0.5);

        for (let i = 0; i < w * h; i++) {
            const n = noise[i];
            const p = i * 4;
            const b = Math.floor(120 + n * 80);
            data[p] = b;
            data[p + 1] = b;
            data[p + 2] = b;
            data[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    /**
     * Radial ring texture generator (Cassini division, A/B/C rings, Encke gap)
     */
    static getRingTexture(name: string): THREE.CanvasTexture {
        const key = `${name}_Rings`;
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const width = 512;
        const height = 1;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        this.cache.set(key, texture);

        if (!ctx) return texture;

        const imgData = this.safeCreateImageData(ctx, width, 1);
        if (!imgData) return texture;
        const data = imgData.data;

        for (let x = 0; x < width; x++) {
            const t = x / width; // 0 at inner radius, 1 at outer radius
            let r = 215, g = 195, b = 155, alpha = 0;

            if (name === 'Saturn') {
                // C Ring (inner, faint): 0.0 to 0.25
                if (t < 0.25) {
                    alpha = Math.floor(t * 4 * 110);
                    r = 160; g = 145; b = 125;
                }
                // B Ring (main, bright, dense): 0.25 to 0.65
                else if (t < 0.65) {
                    alpha = 235;
                    const ringlet = Math.sin(t * 150) * 20;
                    r = Math.min(255, Math.floor(225 + ringlet));
                    g = Math.min(255, Math.floor(205 + ringlet));
                    b = Math.min(255, Math.floor(165 + ringlet));
                }
                // Cassini Division (dark gap): 0.65 to 0.72
                else if (t < 0.72) {
                    alpha = 15;
                    r = 60; g = 50; b = 40;
                }
                // A Ring (outer ring): 0.72 to 0.98
                else if (t < 0.98) {
                    // Encke division at 0.90
                    if (t > 0.895 && t < 0.915) {
                        alpha = 10;
                    } else {
                        alpha = 185;
                        r = 210; g = 190; b = 155;
                    }
                }
                // Faint outer edge
                else {
                    alpha = Math.floor((1.0 - t) * 50 * 50);
                }
            } else {
                // Uranus / Chariklo / other rings
                alpha = t > 0.3 && t < 0.8 ? 160 : 0;
                r = 180; g = 200; b = 220;
            }

            const p = x * 4;
            data[p] = r;
            data[p + 1] = g;
            data[p + 2] = b;
            data[p + 3] = alpha;
        }

        ctx.putImageData(imgData, 0, 0);
        return texture;
    }
}
