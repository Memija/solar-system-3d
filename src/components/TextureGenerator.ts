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
        this.deferredQueue.forEach(item => {
            if (!this.cache.has(item.name)) {
                if (!item.placeholderMap.userData?.shared) item.placeholderMap.dispose();
                if (item.placeholderBump && !item.placeholderBump.userData?.shared) item.placeholderBump.dispose();
            }
        });
        this.deferredQueue = [];
        this.loadingDeferred.clear();
        if (this.sharedPlaceholderMap) {
            this.sharedPlaceholderMap.dispose();
            this.sharedPlaceholderMap = null;
        }
        if (this.sharedPlaceholderBump) {
            this.sharedPlaceholderBump.dispose();
            this.sharedPlaceholderBump = null;
        }
        this.cache.forEach(texture => {
            texture.dispose();
        });
        this.cache.clear();
    }

    static hasCachedTexture(name: string): boolean {
        return this.cache.has(name);
    }

    static hasBumpMap(name: string): boolean {
        return this.BUMP_WORLDS.has(name);
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
            case 'Iapetus':
                this.drawIapetus(ctx, width, height);
                break;
            case 'Mimas':
                this.drawMimas(ctx, width, height);
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

    private static readonly BUMP_WORLDS = new Set([
        'Mercury', 'Mars', 'Phobos', 'Deimos', 'Ceres', 'Pluto',
        'Ganymede', 'Callisto', 'Mimas', 'Iapetus', 'Enceladus',
        'Triton', 'Haumea', 'Makemake', 'Io', 'Europa'
    ]);

    private static hashSeed(label: string): number {
        let h = 2166136261;
        for (let i = 0; i < label.length; i++) {
            h ^= label.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (Math.abs(h) % 2147483645) + 1;
    }

    private static readonly IDB_NAME = 'solar-system-textures-v1';
    private static readonly IDB_STORE = 'textures';
    private static idbPromise: Promise<IDBDatabase | null> | null = null;

    private static openTextureCacheDB(): Promise<IDBDatabase | null> {
        if (typeof indexedDB === 'undefined') return Promise.resolve(null);
        if (this.idbPromise) return this.idbPromise;

        this.idbPromise = new Promise<IDBDatabase | null>((resolve) => {
            try {
                const req = indexedDB.open(this.IDB_NAME, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(this.IDB_STORE)) {
                        db.createObjectStore(this.IDB_STORE);
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
        return this.idbPromise;
    }

    private static async getCachedTextureBlob(key: string): Promise<Blob | null> {
        const db = await this.openTextureCacheDB();
        if (!db) return null;
        return new Promise<Blob | null>((resolve) => {
            try {
                const tx = db.transaction(this.IDB_STORE, 'readonly');
                const req = tx.objectStore(this.IDB_STORE).get(key);
                req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
                req.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    }

    private static cacheWorker: Worker | null | undefined = undefined;

    /**
     * Lazily spawn the WebP encoder worker. Returns null where module workers, OffscreenCanvas
     * or ImageBitmap are unavailable so callers fall back to main-thread `toBlob`.
     */
    private static getCacheWorker(): Worker | null {
        if (this.cacheWorker !== undefined) return this.cacheWorker;
        this.cacheWorker = null;
        if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') {
            return null;
        }
        try {
            const worker = new Worker(new URL('./TextureCacheWorker.ts', import.meta.url), { type: 'module' });
            worker.onerror = () => {
                worker.terminate();
                if (this.cacheWorker === worker) this.cacheWorker = null;
            };
            this.cacheWorker = worker;
        } catch {
            this.cacheWorker = null;
        }
        return this.cacheWorker;
    }

    private static persistCanvasToCache(key: string, canvas: HTMLCanvasElement): void {
        if (typeof canvas.toBlob !== 'function' || typeof indexedDB === 'undefined') return;
        const schedule = typeof requestIdleCallback === 'function'
            ? requestIdleCallback
            : (cb: () => void) => setTimeout(cb, 50);

        schedule(() => {
            // Preferred path: snapshot the canvas and let a worker do the ~35 ms WebP encode + IDB write,
            // so first-visit cache population never janks the render loop.
            const worker = this.getCacheWorker();
            if (worker) {
                createImageBitmap(canvas).then(bitmap => {
                    worker.postMessage(
                        { key, bitmap, dbName: this.IDB_NAME, storeName: this.IDB_STORE, quality: 0.92 },
                        [bitmap]
                    );
                }).catch(() => {
                    // Snapshot failed; skip caching this texture
                });
                return;
            }

            try {
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const db = await this.openTextureCacheDB();
                    if (!db) return;
                    try {
                        const tx = db.transaction(this.IDB_STORE, 'readwrite');
                        tx.objectStore(this.IDB_STORE).put(blob, key);
                    } catch {
                        // Ignore quota or private-browsing errors
                    }
                }, 'image/webp', 0.92);
            } catch {
                // Ignore in headless/test environments
            }
        });
    }

    private static deferredQueue: Array<{
        name: string;
        material: THREE.MeshStandardMaterial;
        placeholderMap: THREE.CanvasTexture;
        placeholderBump: THREE.CanvasTexture | null;
    }> = [];
    private static loadingDeferred: Set<string> = new Set();
    private static sharedPlaceholderMap: THREE.CanvasTexture | null = null;
    private static sharedPlaceholderBump: THREE.CanvasTexture | null = null;

    private static getSharedPlaceholderMap(): THREE.CanvasTexture {
        if (!this.sharedPlaceholderMap) {
            const mapCanvas = document.createElement('canvas');
            mapCanvas.width = 8;
            mapCanvas.height = 4;
            const ctx = mapCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 8, 4);
            }
            const tex = new THREE.CanvasTexture(mapCanvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.userData = { shared: true };
            tex.needsUpdate = true;
            this.sharedPlaceholderMap = tex;
        }
        return this.sharedPlaceholderMap;
    }

    private static getSharedPlaceholderBump(): THREE.CanvasTexture {
        if (!this.sharedPlaceholderBump) {
            const bumpCanvas = document.createElement('canvas');
            bumpCanvas.width = 8;
            bumpCanvas.height = 4;
            const bctx = bumpCanvas.getContext('2d');
            if (bctx) {
                bctx.fillStyle = '#808080';
                bctx.fillRect(0, 0, 8, 4);
            }
            const tex = new THREE.CanvasTexture(bumpCanvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.userData = { shared: true };
            tex.needsUpdate = true;
            this.sharedPlaceholderBump = tex;
        }
        return this.sharedPlaceholderBump;
    }

    /**
     * Trigger background loading of a deferred moon or dwarf planet surface map on demand
     * (e.g. when the camera approaches its planetary system or focuses on the body).
     */
    static ensureDeferredLoaded(name: string, onLoaded?: (name: string) => void): void {
        if (this.cache.has(name) || this.loadingDeferred.has(name)) return;
        const matching = this.deferredQueue.filter(it => it.name === name);
        if (matching.length === 0) return;
        this.deferredQueue = this.deferredQueue.filter(it => it.name !== name);
        this.loadingDeferred.add(name);

        const isMobile = typeof window !== 'undefined' && (
            ('ontouchstart' in window) ||
            (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
            window.innerWidth <= 768
        );

        void this.loadPrebakedTextureAsync(name, isMobile).then(prebaked => {
            const fullMap = prebaked ?? this.getPlanetTexture(name);
            const fullBump = this.BUMP_WORLDS.has(name) ? this.getPlanetBumpMap(name) : null;
            for (const item of matching) {
                item.material.map = fullMap;
                item.material.color.setHex(0xffffff);
                if (fullBump) {
                    item.material.bumpMap = fullBump;
                }
                if (!item.placeholderMap.userData?.shared) item.placeholderMap.dispose();
                if (item.placeholderBump && !item.placeholderBump.userData?.shared) item.placeholderBump.dispose();
            }
            this.loadingDeferred.delete(name);
            onLoaded?.(name);
        });
    }

    /**
     * Fetch a pre-baked static `.webp` surface map from `public/textures/planets/<Name>.webp`,
     * decode it off the main thread via `createImageBitmap`, and draw it into a 2D canvas.
     * Returns `null` if unavailable (e.g. unit tests or offline custom world), allowing callers
     * to fall back to IndexedDB or procedural synthesis.
     */
    private static async loadPrebakedTextureAsync(name: string, isMobile: boolean): Promise<THREE.CanvasTexture | null> {
        if (typeof fetch !== 'function' || typeof createImageBitmap !== 'function') {
            return null;
        }
        try {
            const baseUrl = (import.meta as any).env?.BASE_URL || '/';
            const url = `${baseUrl}textures/planets/${encodeURIComponent(name)}.webp`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const contentType = res.headers?.get?.('content-type') || '';
            if (contentType && !contentType.includes('image')) return null;

            const blob = await res.blob();
            const needsCanvasForBump = this.BUMP_WORLDS.has(name);
            if (!needsCanvasForBump && !isMobile) {
                const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' });
                const tex = new THREE.CanvasTexture(bitmap as unknown as HTMLCanvasElement);
                tex.flipY = false;
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = TextureGenerator.maxAnisotropy;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.generateMipmaps = true;
                tex.needsUpdate = true;
                this.cache.set(name, tex);
                return tex;
            }

            const bitmap = await createImageBitmap(blob);
            const targetW = isMobile ? Math.min(1024, bitmap.width) : bitmap.width;
            const targetH = isMobile ? Math.min(512, bitmap.height) : bitmap.height;

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                bitmap.close?.();
                return null;
            }
            ctx.drawImage(bitmap, 0, 0, targetW, targetH);
            bitmap.close?.();

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = TextureGenerator.maxAnisotropy;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.generateMipmaps = true;
            tex.needsUpdate = true;
            this.cache.set(name, tex);
            return tex;
        } catch {
            return null;
        }
    }

    /**
     * Create a tiny 64x32 placeholder surface texture (plus 16x8 neutral bump map if applicable)
     * for non-boot moons & outer dwarf planets, and queue the material for background loading
     * after the main scene finishes booting. In test environments without `createImageBitmap`,
     * falls back synchronously to `getPlanetTexture`.
     */
    static getOrDeferPlanetSurface(
        name: string,
        baseColorHex: number,
        onCreateMaterial: (map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture | null) => THREE.MeshStandardMaterial
    ): THREE.MeshStandardMaterial {
        if (this.cache.has(name) || typeof createImageBitmap !== 'function') {
            const map = this.getPlanetTexture(name);
            const bumpMap = this.getPlanetBumpMap(name);
            return onCreateMaterial(map, bumpMap);
        }

        const placeholderMap = this.getSharedPlaceholderMap();
        const placeholderBump = this.BUMP_WORLDS.has(name) ? this.getSharedPlaceholderBump() : null;

        const material = onCreateMaterial(placeholderMap, placeholderBump);
        material.color.setHex(baseColorHex || 0x888888);
        this.deferredQueue.push({ name, material, placeholderMap, placeholderBump });
        return material;
    }

    /**
     * Asynchronously load all deferred moon/dwarf textures in the background after boot and swap
     * them onto their materials without triggering shader recompilation.
     */
    static async loadDeferredTexturesAsync(onEachLoaded?: (name: string) => void): Promise<void> {
        if (this.deferredQueue.length === 0) return;
        const items = this.deferredQueue.slice();
        this.deferredQueue = [];

        const isMobile = typeof window !== 'undefined' && (
            ('ontouchstart' in window) ||
            (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
            window.innerWidth <= 768
        );

        const uniqueNames = Array.from(new Set(items.map(it => it.name)));
        const fetchMap = new Map<string, Promise<THREE.CanvasTexture | null>>();
        for (const name of uniqueNames) {
            if (!this.cache.has(name)) {
                fetchMap.set(name, this.loadPrebakedTextureAsync(name, isMobile));
            }
        }

        for (const item of items) {
            let fullMap = this.cache.get(item.name) ?? null;
            if (!fullMap) {
                fullMap = (await fetchMap.get(item.name)) ?? null;
            }
            if (!fullMap) {
                fullMap = this.getPlanetTexture(item.name);
            }
            const fullBump = this.BUMP_WORLDS.has(item.name) ? this.getPlanetBumpMap(item.name) : null;

            item.material.map = fullMap;
            item.material.color.setHex(0xffffff);
            if (fullBump) {
                item.material.bumpMap = fullBump;
            }
            if (!item.placeholderMap.userData?.shared) item.placeholderMap.dispose();
            if (item.placeholderBump && !item.placeholderBump.userData?.shared) item.placeholderBump.dispose();
            onEachLoaded?.(item.name);

            // Yield between background texture swaps so steady-state frame pacing stays smooth
            await new Promise<void>(resolve => setTimeout(resolve, 16));
        }
    }

    /**
     * Asynchronously prewarm procedural textures across animation frames so boot UI never freezes.
     * Prefers pre-baked WebP assets under `public/textures/planets/`, falling back to IndexedDB
     * or procedural synthesis when unavailable.
     */
    static async prewarmTexturesAsync(
        names: string[],
        onProgress?: (done: number, total: number, name: string) => void
    ): Promise<void> {
        const total = names.length;
        const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
        let sliceStart = getNow();
        const canUseBitmapCache = typeof indexedDB !== 'undefined' && typeof createImageBitmap === 'function';
        const isMobile = typeof window !== 'undefined' && (
            ('ontouchstart' in window) ||
            (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
            window.innerWidth <= 768
        );
        const resSuffix = isMobile ? '1024x512' : '2048x1024';

        // Pipeline pre-baked WebP fetches + off-thread ImageBitmap decodes in parallel
        const prebakedPromises = names.map(name =>
            this.cache.has(name) ? Promise.resolve(this.cache.get(name)!) : this.loadPrebakedTextureAsync(name, isMobile)
        );

        for (let i = 0; i < total; i++) {
            const name = names[i];
            const wasCached = this.cache.has(name);
            let restored = false;

            const prebaked = await prebakedPromises[i];
            if (prebaked) {
                restored = true;
            } else if (!wasCached && canUseBitmapCache) {
                const blob = await this.getCachedTextureBlob(`${name}_${resSuffix}`);
                if (blob) {
                    try {
                        // Decode off-thread, then blit into a canvas: WebGL ignores flipY for ImageBitmap
                        // sources (which rendered restored maps upside-down), and bump-map derivation
                        // needs a canvas source.
                        const bitmap = await createImageBitmap(blob);
                        const canvas = document.createElement('canvas');
                        canvas.width = bitmap.width;
                        canvas.height = bitmap.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(bitmap, 0, 0);
                            const tex = new THREE.CanvasTexture(canvas);
                            tex.wrapS = THREE.RepeatWrapping;
                            tex.wrapT = THREE.ClampToEdgeWrapping;
                            tex.colorSpace = THREE.SRGBColorSpace;
                            tex.anisotropy = TextureGenerator.maxAnisotropy;
                            tex.minFilter = THREE.LinearMipmapLinearFilter;
                            tex.generateMipmaps = true;
                            tex.needsUpdate = true;
                            this.cache.set(name, tex);
                            restored = true;
                        }
                        bitmap.close?.();
                    } catch {
                        // Fall through to procedural synthesis
                    }
                }
            }

            const tex = this.getPlanetTexture(name);
            // Only persist freshly synthesized maps; re-encoding pre-baked or restored ones would waste ~35 ms each
            if (!wasCached && !restored && canUseBitmapCache && tex.image instanceof HTMLCanvasElement) {
                this.persistCanvasToCache(`${name}_${resSuffix}`, tex.image);
            }

            if (this.BUMP_WORLDS.has(name)) {
                this.getPlanetBumpMap(name);
            }
            onProgress?.(i + 1, total, name);
            // Yield to browser paint loop only when the frame budget (~10ms) is exceeded
            if (getNow() - sliceStart >= 10) {
                await new Promise<void>(resolve => setTimeout(resolve, 0));
                sliceStart = getNow();
            }
        }
    }

    /**
     * Get or create a 2:1 equirectangular roughness map (e.g. for Earth ocean specular reflection).
     * Updated in-place via `updateEarthRoughnessFromImage` once CelestialBody loads `earth_equirectangular.webp`,
     * avoiding any duplicate network fetch.
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

        if (ctx) {
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(0, 0, width, height);
        }

        return texture;
    }

    /**
     * Derive Earth ocean/ice/land roughness map directly from an already-loaded image element,
     * eliminating duplicate image downloads.
     */
    static updateEarthRoughnessFromImage(img: CanvasImageSource): void {
        const texture = this.getPlanetRoughnessMap('Earth');
        const canvas = texture.image as HTMLCanvasElement | undefined;
        if (!canvas || typeof canvas.getContext !== 'function') return;
        const ctx = canvas.getContext('2d');
        if (!ctx || typeof ctx.getImageData !== 'function') return;

        const width = canvas.width;
        const height = canvas.height;
        try {
            ctx.drawImage(img, 0, 0, width, height);
            const imgData = ctx.getImageData(0, 0, width, height);
            if (!imgData || !imgData.data) return;
            const data = imgData.data;
            const total = width * height;
            const u32 = this.getUint32View(data, total);
            const OCEAN_ROUGH = (255 << 24) | (30 << 16) | (30 << 8) | 30;
            const ICE_ROUGH = (255 << 24) | (120 << 16) | (120 << 8) | 120;
            const LAND_ROUGH = (255 << 24) | (225 << 16) | (225 << 8) | 225;

            for (let i = 0; i < total; i++) {
                const p = i * 4;
                const r = data[p];
                const g = data[p + 1];
                const b = data[p + 2];

                const isOcean = b > 55 && r < 50 && g < 80;
                const isIce = r > 190 && g > 190 && b > 190;

                if (u32) {
                    u32[i] = isOcean ? OCEAN_ROUGH : isIce ? ICE_ROUGH : LAND_ROUGH;
                } else {
                    const roughness = isOcean ? 30 : isIce ? 120 : 225;
                    data[p] = roughness;
                    data[p + 1] = roughness;
                    data[p + 2] = roughness;
                    data[p + 3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            texture.needsUpdate = true;
        } catch {
            // Ignore in headless/mock canvas environments
        }
    }

    private static canvasFilterSupported: boolean | null = null;

    /** Whether CanvasRenderingContext2D.filter is implemented (Chromium, Firefox; not older Safari). */
    private static supportsCanvasFilter(ctx: CanvasRenderingContext2D): boolean {
        if (this.canvasFilterSupported === null) {
            this.canvasFilterSupported = typeof CanvasRenderingContext2D !== 'undefined' &&
                'filter' in CanvasRenderingContext2D.prototype &&
                ctx instanceof CanvasRenderingContext2D;
        }
        return this.canvasFilterSupported;
    }

    /**
     * Derive a grayscale relief bump map for rocky and icy cratered worlds so craters, ridges,
     * and canyons cast realistic 3D relief along the solar terminator.
     */
    static getPlanetBumpMap(name: string): THREE.CanvasTexture | null {
        if (!this.BUMP_WORLDS.has(name)) return null;
        const key = `${name}_Bump`;
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const baseTexture = this.getPlanetTexture(name);
        const srcCanvas = baseTexture.image as HTMLCanvasElement | undefined;
        if (!srcCanvas || typeof srcCanvas.getContext !== 'function') return null;

        const width = Math.min(1024, srcCanvas.width || 1024);
        const height = Math.min(512, srcCanvas.height || 512);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        try {
            const useCanvasFilter = this.supportsCanvasFilter(ctx);
            if (useCanvasFilter) {
                // GPU path: luminance + midtone contrast applied by the canvas filter pipeline,
                // avoiding a synchronous GPU->CPU getImageData readback per bump map.
                ctx.filter = 'grayscale(1) contrast(1.35)';
                ctx.drawImage(srcCanvas, 0, 0, width, height);
                ctx.filter = 'none';
            } else {
                ctx.drawImage(srcCanvas, 0, 0, width, height);
            }
            if (!useCanvasFilter && typeof ctx.getImageData === 'function') {
                const imgData = ctx.getImageData(0, 0, width, height);
                if (imgData && imgData.data) {
                    const d = imgData.data;
                    const total = width * height;
                    const u32 = this.getUint32View(d, total);
                    for (let i = 0; i < total; i++) {
                        const p = i * 4;
                        // Perceptual luminance boosted around midtones for crisp crater/ridge normal relief
                        const lum = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
                        const contrasted = Math.max(0, Math.min(255, ((lum - 128) * 1.35 + 128.5) | 0));
                        if (u32) {
                            u32[i] = (255 << 24) | (contrasted << 16) | (contrasted << 8) | contrasted;
                        } else {
                            d[p] = contrasted;
                            d[p + 1] = contrasted;
                            d[p + 2] = contrasted;
                            d[p + 3] = 255;
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                }
            }
        } catch {
            // Safe fallback in test environment
        }

        const bumpTex = new THREE.CanvasTexture(canvas);
        bumpTex.wrapS = THREE.RepeatWrapping;
        bumpTex.wrapT = THREE.ClampToEdgeWrapping;
        bumpTex.anisotropy = TextureGenerator.maxAnisotropy;
        bumpTex.minFilter = THREE.LinearMipmapLinearFilter;
        bumpTex.generateMipmaps = true;
        bumpTex.needsUpdate = true;
        this.cache.set(key, bumpTex);
        return bumpTex;
    }

    /**
     * Draw an impact crater wrapped seamlessly across the equirectangular u = 0 / 1 boundary.
     */
    private static drawWrappedCrater(
        _ctx: CanvasRenderingContext2D,
        w: number,
        cx: number,
        cy: number,
        r: number,
        drawFn: (x: number, y: number, radius: number) => void
    ): void {
        drawFn(cx, cy, r);
        if (cx - r < 0) {
            drawFn(cx + w, cy, r);
        } else if (cx + r > w) {
            drawFn(cx - w, cy, r);
        }
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

    private static getUint32View(data: Uint8ClampedArray, length: number): Uint32Array | null {
        if (data && data.buffer && data.buffer.byteLength >= length * 4) {
            return new Uint32Array(data.buffer, data.byteOffset || 0, length);
        }
        return null;
    }

    private static createNoise(w: number, h: number, octaves = 4, persistence = 0.5, seed = 1234567): Float32Array {
        const size = w * h;
        const result = new Float32Array(size);

        // Deterministic per-seed Lehmer PRNG so every planet/layer gets unique geology & cloud structure
        const baseNoise = new Float32Array(size);
        let s = (Math.abs(Math.floor(seed)) % 2147483645) + 1;
        for (let i = 0; i < size; i++) {
            // Schrage's method: bit-identical to (s * 16807) % 2147483647, but stays in int32
            // arithmetic instead of a floating-point modulo (~2.4x faster for 2M-texel maps)
            const hi = (s / 127773) | 0;
            s = 16807 * (s - hi * 127773) - 2836 * hi;
            if (s <= 0) s += 2147483647;
            baseNoise[i] = (s - 1) / 2147483646;
        }

        let maxVal = 0;
        let amplitude = 1;

        for (let o = 0; o < octaves; o++) {
            const step = Math.max(1, Math.floor(Math.pow(2, octaves - o)));
            const invStep = 1 / step;
            const sxLut = new Float32Array(step);
            for (let f = 0; f < step; f++) {
                const fx = f * invStep;
                sxLut[f] = fx * fx * (3 - 2 * fx);
            }

            for (let y = 0; y < h; y++) {
                const y0 = Math.floor(y * invStep) * step;
                const y1 = Math.min(h - 1, y0 + step);
                const fy = (y - y0) * invStep;
                const sy = fy * fy * (3 - 2 * fy);
                const row0 = y0 * w;
                const row1 = y1 * w;
                const outRow = y * w;

                for (let x0 = 0; x0 < w; x0 += step) {
                    const x1 = (x0 + step) % w;
                    const v00 = baseNoise[row0 + x0];
                    const v10 = baseNoise[row0 + x1];
                    const v01 = baseNoise[row1 + x0];
                    const v11 = baseNoise[row1 + x1];

                    const c0 = (v00 + (v01 - v00) * sy) * amplitude;
                    const c1 = (v10 + (v11 - v10) * sy) * amplitude;
                    const dc = c1 - c0;

                    const span = Math.min(step, w - x0);
                    const baseIdx = outRow + x0;
                    for (let f = 0; f < span; f++) {
                        result[baseIdx + f] += c0 + dc * sxLut[f];
                    }
                }
            }
            maxVal += amplitude;
            amplitude *= persistence;
        }

        const invMaxVal = maxVal > 0 ? 1 / maxVal : 1;
        for (let i = 0; i < size; i++) {
            result[i] *= invMaxVal;
        }

        return result;
    }

    private static drawMercury(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 6, 0.55, 10113);

        if (u32) {
            for (let idx = 0; idx < total; idx++) {
                const base = (100 + noise[idx] * 110) | 0;
                const r = base + 8 > 255 ? 255 : base + 8;
                const g = base + 4 > 255 ? 255 : base + 4;
                u32[idx] = (255 << 24) | (base << 16) | (g << 8) | r;
            }
        } else {
            for (let idx = 0; idx < total; idx++) {
                const base = (100 + noise[idx] * 110) | 0;
                const p = idx * 4;
                data[p] = Math.min(255, base + 8);
                data[p + 1] = Math.min(255, base + 4);
                data[p + 2] = base;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Add impact craters wrapped seamlessly across u = 0 / 1
        ctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
        ctx.strokeStyle = 'rgba(210, 210, 210, 0.35)';
        ctx.lineWidth = 2;

        let seed = 42;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

        for (let i = 0; i < 350; i++) {
            const cx = rand() * w;
            const cy = (0.1 + rand() * 0.8) * h;
            const r = 3 + rand() * 22;

            this.drawWrappedCrater(ctx, w, cx, cy, r, (x, y, rad) => {
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                if (rad > 12) {
                    ctx.fillStyle = 'rgba(230, 230, 230, 0.4)';
                    ctx.beginPath();
                    ctx.arc(x, y, rad * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
                }
            });
        }
    }

    private static drawVenus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const u32 = this.getUint32View(data, w * h);
        const noise1 = this.createNoise(w, h, 5, 0.5, 20229);
        const noise2 = this.createNoise(w, h, 3, 0.6, 20987);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const latFlow = Math.sin(lat * 3) * 0.15;
            const shiftOffset = (Math.floor(latFlow * w) + w) % w;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const shiftX = (x + shiftOffset) % w;
                const idx = rowBase + shiftX;
                const n = noise1[idx] * 0.6 + noise2[idx] * 0.4;
                const r = (220 + n * 35) | 0;
                const g = (180 + n * 45) | 0;
                const b = (110 + n * 40) | 0;
                const outIdx = rowBase + x;

                if (u32) {
                    u32[outIdx] = (255 << 24) | (b << 16) | (g << 8) | r;
                } else {
                    const p = outIdx * 4;
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                    data[p + 3] = 255;
                }
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
        const u32 = this.getUint32View(data, w * h);
        const noise = this.createNoise(w, h, 6, 0.55);

        const COL_ICE = (255 << 24) | (255 << 16) | (248 << 8) | 240;
        const COL_MTN = (255 << 24) | (120 << 16) | (145 << 8) | 165;
        const COL_DESERT = (255 << 24) | (110 << 16) | (170 << 8) | 195;
        const COL_FOREST = (255 << 24) | (45 << 16) | (115 << 8) | 45;
        const COL_COAST = (255 << 24) | (150 << 16) | (95 << 8) | 25;
        const COL_OCEAN = (255 << 24) | (105 << 16) | (40 << 8) | 10;

        for (let y = 0; y < h; y++) {
            const lat = (y / h); // 0 (North Pole) to 1 (South Pole)
            const isPolar = lat < 0.12 || lat > 0.88;
            const isSubPolar = lat < 0.18 || lat > 0.82;
            const isDesertLat = lat > 0.35 && lat < 0.55;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const n = noise[idx];

                if (u32) {
                    if (isPolar || (isSubPolar && n > 0.35)) {
                        u32[idx] = COL_ICE;
                    } else if (n > 0.52) {
                        u32[idx] = n > 0.68 ? COL_MTN : (isDesertLat && n > 0.58) ? COL_DESERT : COL_FOREST;
                    } else if (n > 0.49) {
                        u32[idx] = COL_COAST;
                    } else {
                        u32[idx] = COL_OCEAN;
                    }
                } else {
                    const p = idx * 4;
                    if (isPolar || (isSubPolar && n > 0.35)) {
                        data[p] = 240; data[p + 1] = 248; data[p + 2] = 255;
                    } else if (n > 0.52) {
                        if (n > 0.68) {
                            data[p] = 165; data[p + 1] = 145; data[p + 2] = 120;
                        } else if (isDesertLat && n > 0.58) {
                            data[p] = 195; data[p + 1] = 170; data[p + 2] = 110;
                        } else {
                            data[p] = 45; data[p + 1] = 115; data[p + 2] = 45;
                        }
                    } else if (n > 0.49) {
                        data[p] = 25; data[p + 1] = 95; data[p + 2] = 150;
                    } else {
                        data[p] = 10; data[p + 1] = 40; data[p + 2] = 105;
                    }
                    data[p + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawEarthClouds(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const u32 = this.getUint32View(data, w * h);
        const noise1 = this.createNoise(w, h, 6, 0.55, 31337);
        const noise2 = this.createNoise(w, h, 4, 0.65, 32993);
        const noise3 = this.createNoise(w, h, 2, 0.75, 34711);

        // Precompute longitude trig tables so Math.sin is not called 2M times in the inner pixel loop
        const sinLonLut = new Float32Array(w);
        const cosLonLut = new Float32Array(w);
        for (let x = 0; x < w; x++) {
            const angle = (x / w) * Math.PI * 8;
            sinLonLut[x] = Math.sin(angle);
            cosLonLut[x] = Math.cos(angle);
        }

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

            const latBias = itcz + midLatBelts - dryZones;
            const hasVorticity = midLatBelts > 0.05;
            const sinLat14 = hasVorticity ? Math.sin(lat * 14) * 0.07 : 0;
            const cosLat14 = hasVorticity ? Math.cos(lat * 14) * 0.07 : 0;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const cycloneVorticity = hasVorticity
                    ? (sinLonLut[x] * cosLat14 + cosLonLut[x] * sinLat14)
                    : 0;

                // Multi-scale cloud noise synthesis
                const rawN = (noise1[idx] * 0.52 + noise2[idx] * 0.33 + noise3[idx] * 0.15);
                const n = rawN + latBias + cycloneVorticity;

                if (n > 0.53) {
                    let alpha: number;
                    if (n > 0.58) {
                        alpha = Math.min(255, (210 + (n - 0.58) * 450) | 0);
                    } else {
                        const t = (n - 0.53) * 20;
                        alpha = (60 + t * 150) | 0;
                    }

                    if (u32) {
                        u32[idx] = (alpha << 24) | 0x00ffffff;
                    } else {
                        const p = idx * 4;
                        data[p] = 255;
                        data[p + 1] = 255;
                        data[p + 2] = 255;
                        data[p + 3] = alpha;
                    }
                } else if (u32) {
                    u32[idx] = 0x00ffffff;
                } else {
                    const p = idx * 4;
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
        const u32 = this.getUint32View(data, w * h);
        const noise = this.createNoise(w, h, 6, 0.52, 41519);
        const fineNoise = this.createNoise(w, h, 3, 0.6, 42899);
        const invW2Pi = (Math.PI * 2) / w;

        for (let y = 0; y < h; y++) {
            const lat = y / h; // 0 = North pole, 1 = South pole
            const nearNorthPole = lat < 0.08;
            const nearSouthPole = lat > 0.92;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const n = noise[idx];

                // Base Martian iron-oxide colors
                let r: number;
                let g: number;
                let b: number;

                if (n > 0.58) {
                    // Dark volcanic basaltic provinces (Syrtis Major, Acidalia, etc.)
                    r = (135 + n * 45) | 0;
                    g = (55 + n * 25) | 0;
                    b = (35 + n * 18) | 0;
                } else {
                    // Rusty reddish-ochre desert regolith & sand seas
                    r = (190 + n * 45) | 0;
                    g = (82 + n * 30) | 0;
                    b = (45 + n * 20) | 0;
                }

                // Natural organic polar ice caps with spiral pinwheel chasmata (Chasma Boreale)
                if (nearNorthPole) {
                    const lon = x * invW2Pi;
                    const northSpiral = Math.sin(lon * 3 + (1.0 - lat * 15)) * 0.008;
                    const northCapEdge = 0.035 + (n * 0.015) + northSpiral;

                    if (lat < northCapEdge + 0.02) {
                        const fn = fineNoise[idx];
                        const frostFactor = Math.min(1, Math.max(0, (northCapEdge + 0.02 - lat) / 0.025 * (0.6 + fn * 0.4)));
                        const iceR = 230 + ((fn * 20) | 0);
                        const iceG = 220 + ((fn * 20) | 0);
                        const iceB = 210 + ((fn * 25) | 0);

                        r = (r * (1 - frostFactor) + iceR * frostFactor) | 0;
                        g = (g * (1 - frostFactor) + iceG * frostFactor) | 0;
                        b = (b * (1 - frostFactor) + iceB * frostFactor) | 0;
                    }
                } else if (nearSouthPole) {
                    const lon = x * invW2Pi;
                    const southSpiral = Math.sin(lon * 2 + (lat * 15)) * 0.006;
                    const southCapEdge = 0.965 - (n * 0.012) + southSpiral;

                    if (lat > southCapEdge - 0.02) {
                        const fn = fineNoise[idx];
                        const frostFactor = Math.min(1, Math.max(0, (lat - (southCapEdge - 0.02)) / 0.025 * (0.6 + fn * 0.4)));
                        const iceR = 230 + ((fn * 20) | 0);
                        const iceG = 220 + ((fn * 20) | 0);
                        const iceB = 210 + ((fn * 25) | 0);

                        r = (r * (1 - frostFactor) + iceR * frostFactor) | 0;
                        g = (g * (1 - frostFactor) + iceG * frostFactor) | 0;
                        b = (b * (1 - frostFactor) + iceB * frostFactor) | 0;
                    }
                }

                const cr = r > 255 ? 255 : r;
                const cg = g > 255 ? 255 : g;
                const cb = b > 255 ? 255 : b;
                if (u32) {
                    u32[idx] = (255 << 24) | (cb << 16) | (cg << 8) | cr;
                } else {
                    const p = idx * 4;
                    data[p] = cr;
                    data[p + 1] = cg;
                    data[p + 2] = cb;
                    data[p + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);

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
            this.drawWrappedCrater(ctx, w, cx, cy, cr, (x, y, rad) => {
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }
    }

    private static drawJupiter(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const u32 = this.getUint32View(data, w * h);
        const noise = this.createNoise(w, h, 5, 0.5);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            // Characteristic horizontal band turbulence
            const bandBase = (Math.sin(lat * 16) * 0.5 + Math.sin(lat * 32) * 0.2 + 0.7) * 0.5;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const n = noise[idx];
                const combined = bandBase + n * 0.3;
                let r: number;
                let g: number;
                let b: number;

                // Belts and zones (russet, ochre, cream, and white)
                if (combined > 0.65) {
                    r = 185 + ((n * 35) | 0);
                    g = 105 + ((n * 30) | 0);
                    b = 65 + ((n * 20) | 0);
                } else if (combined > 0.45) {
                    r = 215 + ((n * 30) | 0);
                    g = 165 + ((n * 30) | 0);
                    b = 120 + ((n * 25) | 0);
                } else {
                    r = 240 + ((n * 15) | 0);
                    g = 220 + ((n * 20) | 0);
                    b = 190 + ((n * 25) | 0);
                }

                if (u32) {
                    u32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
                } else {
                    const p = idx * 4;
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                    data[p + 3] = 255;
                }
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
        const u32 = this.getUint32View(data, w * h);
        const noise = this.createNoise(w, h, 4, 0.45);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const band = Math.sin(lat * 20) * 0.25 + Math.sin(lat * 8) * 0.4;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const v = band + noise[idx] * 0.2;
                const r = (220 + v * 30) | 0;
                const g = (195 + v * 35) | 0;
                const b = (145 + v * 30) | 0;

                if (u32) {
                    u32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
                } else {
                    const p = idx * 4;
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                    data[p + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawUranus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const u32 = this.getUint32View(data, w * h);
        const noise = this.createNoise(w, h, 3, 0.4);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const polarGlow = Math.cos(lat) * 0.15;
            const baseR = 145 + polarGlow * 30;
            const baseG = 215 + polarGlow * 20;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const n = noise[idx] * 0.1;
                const r = (baseR + n * 20) | 0;
                const g = (baseG + n * 15) | 0;
                const b = (235 + n * 15) | 0;

                if (u32) {
                    u32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
                } else {
                    const p = idx * 4;
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                    data[p + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawNeptune(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const u32 = this.getUint32View(data, w * h);
        const noise = this.createNoise(w, h, 4, 0.5);

        for (let y = 0; y < h; y++) {
            const lat = (y / h) * Math.PI;
            const band = Math.sin(lat * 14) * 0.2;
            const rowBase = y * w;

            for (let x = 0; x < w; x++) {
                const idx = rowBase + x;
                const n = noise[idx];
                const bn = band + n;
                const r = (35 + bn * 30) | 0;
                const g = (80 + bn * 45) | 0;
                const b = (210 + n * 35) | 0;

                if (u32) {
                    u32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
                } else {
                    const p = idx * 4;
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                    data[p + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawPluto(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 6, 0.55);

        for (let idx = 0; idx < total; idx++) {
            const base = 120 + noise[idx] * 80;
            const r = (base + 35) | 0;
            const g = (base * 0.75) | 0;
            const b = (base * 0.6) | 0;
            if (u32) {
                u32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
            } else {
                const p = idx * 4;
                data[p] = r;
                data[p + 1] = g;
                data[p + 2] = b;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawMoon(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 6, 0.55);

        if (u32) {
            for (let idx = 0; idx < total; idx++) {
                const n = noise[idx];
                const base = (n < 0.45 ? 65 + n * 60 : 140 + n * 90) | 0;
                u32[idx] = 0xFF000000 | (base << 16) | (base << 8) | base;
            }
        } else {
            for (let idx = 0; idx < total; idx++) {
                const n = noise[idx];
                const p = idx * 4;
                const base = (n < 0.45 ? 65 + n * 60 : 140 + n * 90) | 0;
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

            this.drawWrappedCrater(ctx, w, cx, cy, r, (x, y, rad) => {
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
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
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 4, 0.5);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const r = (180 + noise[i] * 65) | 0;
                const g = r + 10 > 255 ? 255 : r + 10;
                const b = r + 15 > 255 ? 255 : r + 15;
                u32[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                const b = 180 + n * 65;
                data[p] = b;
                data[p + 1] = b + 10;
                data[p + 2] = b + 15;
                data[p + 3] = 255;
            }
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
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 5, 0.5);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const r = (180 + n * 50) | 0;
                const g = (100 + n * 40) | 0;
                const b = (70 + n * 30) | 0;
                u32[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                data[p] = (180 + n * 50) | 0;     // Reddish brown
                data[p + 1] = (100 + n * 40) | 0;
                data[p + 2] = (70 + n * 30) | 0;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawIo(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 5, 0.5);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const r = (220 + n * 35) | 0;
                const g = (190 + n * 40) | 0;
                const b = (40 + n * 30) | 0;
                u32[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                data[p] = (220 + n * 35) | 0;     // Sulfur yellow & orange
                data[p + 1] = (190 + n * 40) | 0;
                data[p + 2] = (40 + n * 30) | 0;
                data[p + 3] = 255;
            }
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
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 4, 0.4);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const r = (220 + noise[i] * 35) | 0;
                const b = r + 5 > 255 ? 255 : r + 5;
                u32[i] = 0xFF000000 | (b << 16) | (r << 8) | r;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                const b = 220 + n * 35;
                data[p] = b;
                data[p + 1] = b;
                data[p + 2] = b + 5;
                data[p + 3] = 255;
            }
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
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 5, 0.5);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const b = (110 + noise[i] * 80) | 0;
                u32[i] = 0xFF000000 | (b << 16) | ((b + 5) << 8) | (b + 10);
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                const b = 110 + n * 80;
                data[p] = b + 10;
                data[p + 1] = b + 5;
                data[p + 2] = b;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawCallisto(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 6, 0.55);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const b = (70 + noise[i] * 65) | 0;
                u32[i] = 0xFF000000 | (b << 16) | (b << 8) | b;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                const b = 70 + n * 65;
                data[p] = b;
                data[p + 1] = b;
                data[p + 2] = b;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawTitan(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 3, 0.4);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const r = (220 + n * 25) | 0;
                const g = (140 + n * 30) | 0;
                const b = (40 + n * 20) | 0;
                u32[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                data[p] = (220 + n * 25) | 0;     // Deep orange photochemical haze
                data[p + 1] = (140 + n * 30) | 0;
                data[p + 2] = (40 + n * 20) | 0;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawEnceladus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 4, 0.4);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const b = (240 + noise[i] * 15) | 0;
                const c = b > 255 ? 255 : b;
                u32[i] = 0xFF000000 | (c << 16) | (c << 8) | c;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                const b = 240 + n * 15;
                data[p] = b;
                data[p + 1] = b;
                data[p + 2] = b;
                data[p + 3] = 255;
            }
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
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 5, 0.5);

        if (u32) {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const r = (205 + n * 35) | 0;
                const g = (215 + n * 30) | 0;
                const b = (220 + n * 30) | 0;
                u32[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const n = noise[i];
                const p = i * 4;
                data[p] = (205 + n * 35) | 0;     // Cantaloupe terrain & nitrogen frost
                data[p + 1] = (215 + n * 30) | 0;
                data[p + 2] = (220 + n * 30) | 0;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    private static drawIapetus(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);

        const noiseFine = this.createNoise(w, h, 6, 0.55, 81817);
        const noiseBroad = this.createNoise(w, h, 4, 0.5, 82997);

        // Precompute longitude cosine table once per width
        const cosLonLut = new Float32Array(w);
        const twoPiOverW = (Math.PI * 2) / w;
        for (let x = 0; x < w; x++) {
            cosLonLut[x] = Math.cos(x * twoPiOverW - Math.PI);
        }

        for (let y = 0; y < h; y++) {
            const lat = (0.5 - y / h) * Math.PI; // -PI/2 (south) to PI/2 (north)
            const cosLat = Math.cos(lat);
            const absNy = Math.abs(Math.sin(lat));
            const latFalloff = Math.max(0, 1.0 - Math.pow(absNy / 0.68, 2.2));
            const cosLatFalloff = cosLat * latFalloff;
            const polarBoost = absNy > 0.62 ? (absNy - 0.62) * 65 : 0;

            const absLat = Math.abs(lat);
            const hasRidge = absLat < 0.035;
            let ridgeR = 0, ridgeG = 0, ridgeB = 0;
            if (hasRidge) {
                const ridgeProximity = 1.0 - absLat / 0.035;
                const ridgeHighlight = ridgeProximity * ridgeProximity * 45;
                ridgeR = (ridgeHighlight * 1.2) | 0;
                ridgeG = ridgeR;
                ridgeB = (ridgeHighlight * 1.3) | 0;
            }

            const rowOffset = y * w;
            for (let x = 0; x < w; x++) {
                const idx = rowOffset + x;
                const nf = noiseFine[idx];
                const nb = noiseBroad[idx];

                // Cassini Regio is centered on leading hemisphere (nx > 0) and equatorial latitudes
                const leadingDot = cosLatFalloff * cosLonLut[x];

                // Organic fractal transition edge between dark and bright hemispheres
                const edgeNoise = (nb - 0.5) * 0.45 + (nf - 0.5) * 0.18;
                const terrainValue = leadingDot + edgeNoise;

                let r: number, g: number, b: number;

                if (terrainValue > 0.08) {
                    // Deep Cassini Regio: coal-dark, organic-rich carbonaceous tholin terrain
                    const baseDark = (26 + nf * 22) | 0;
                    r = baseDark + 8;
                    g = baseDark + 4;
                    b = baseDark;
                } else if (terrainValue < -0.08) {
                    // Roncevaux Terra / Saragossa Terra & Polar Caps: bright, reflective water ice
                    const baseIce = 210 + nf * 38 + polarBoost;
                    r = Math.min(255, baseIce | 0);
                    g = Math.min(255, (baseIce + 4) | 0);
                    b = Math.min(255, (baseIce + 10) | 0);
                } else {
                    // High-contrast transition zone with thermal segregation
                    const t = (terrainValue + 0.08) / 0.16;
                    const smoothT = t * t * (3 - 2 * t);
                    const frostMask = (nf * 0.7 + (1.0 - smoothT) * 0.6) > 0.55;

                    if (frostMask) {
                        r = Math.min(255, (215 + nf * 35) | 0);
                        g = Math.min(255, (218 + nf * 35) | 0);
                        b = Math.min(255, (225 + nf * 30) | 0);
                    } else {
                        const darkBase = (32 + nf * 20) | 0;
                        r = darkBase + 6;
                        g = darkBase + 3;
                        b = darkBase;
                    }
                }

                // Equatorial ridge highlight on texture
                if (hasRidge) {
                    r = Math.min(255, r + ridgeR);
                    g = Math.min(255, g + ridgeG);
                    b = Math.min(255, b + ridgeB);
                }

                if (u32) {
                    u32[idx] = 0xFF000000 | (b << 16) | (g << 8) | r;
                } else {
                    const p = idx * 4;
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                    data[p + 3] = 255;
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Major Impact Basins (drawn with soft natural radial gradients instead of artificial circles)
        const drawBasin = (cx: number, cy: number, r: number, isDarkTerrain: boolean) => {
            // Elevated crater rim with subtle lighting
            const rimGrad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, r * 0.65, cx, cy, r * 1.12);
            rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
            rimGrad.addColorStop(0.75, isDarkTerrain ? 'rgba(75, 65, 55, 0.45)' : 'rgba(255, 255, 255, 0.6)');
            rimGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.12, 0, Math.PI * 2);
            ctx.fill();

            // Depressed crater floor with soft shadow
            const floorGrad = ctx.createRadialGradient(cx + r * 0.1, cy + r * 0.1, 0, cx, cy, r * 0.85);
            floorGrad.addColorStop(0, isDarkTerrain ? 'rgba(18, 14, 12, 0.55)' : 'rgba(165, 175, 190, 0.35)');
            floorGrad.addColorStop(0.85, isDarkTerrain ? 'rgba(24, 20, 16, 0.3)' : 'rgba(195, 205, 215, 0.15)');
            floorGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = floorGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
            ctx.fill();

            // Central peak for large basins
            if (r > w * 0.035) {
                const peakGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.22);
                peakGrad.addColorStop(0, isDarkTerrain ? 'rgba(80, 70, 60, 0.6)' : 'rgba(255, 255, 255, 0.8)');
                peakGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = peakGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // Engelier Basin (~504 km diameter in southern bright Roncevaux Terra)
        drawBasin(w * 0.82, h * 0.66, w * 0.085, false);

        // Gerin Basin (~445 km diameter)
        drawBasin(w * 0.74, h * 0.42, w * 0.075, false);

        // Malun Basin (~121 km) near the transition boundary
        drawBasin(w * 0.28, h * 0.46, w * 0.045, false);

        // Roland Basin (~144 km in northern Roncevaux Terra)
        drawBasin(w * 0.86, h * 0.28, w * 0.05, false);

        // Degraded ancient basins in Cassini Regio
        drawBasin(w * 0.42, h * 0.45, w * 0.065, true);
        drawBasin(w * 0.55, h * 0.58, w * 0.055, true);
        drawBasin(w * 0.48, h * 0.32, w * 0.048, true);
    }

    private static drawMimas(ctx: CanvasRenderingContext2D, w: number, h: number) {
        // Mimas is heavily cratered grey icy body dominated by the colossal Herschel crater
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 6, 0.55);

        if (u32) {
            for (let idx = 0; idx < total; idx++) {
                const b = (140 + noise[idx] * 70) | 0;
                u32[idx] = 0xFF000000 | ((b + 4) << 16) | (b << 8) | b;
            }
        } else {
            for (let idx = 0; idx < total; idx++) {
                const p = idx * 4;
                const b = (140 + noise[idx] * 70) | 0;
                data[p] = b;
                data[p + 1] = b;
                data[p + 2] = b + 4;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Add standard impact craters
        let seed = 1789;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

        ctx.fillStyle = 'rgba(70, 70, 75, 0.4)';
        ctx.strokeStyle = 'rgba(230, 230, 235, 0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 300; i++) {
            const cx = rand() * w;
            const cy = (0.05 + rand() * 0.9) * h;
            const r = 2 + rand() * 14;
            this.drawWrappedCrater(ctx, w, cx, cy, r, (x, y, rad) => {
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }

        // Herschel Crater: colossal impact crater spanning ~139 km (almost 1/3 of Mimas' diameter!)
        const hx = w * 0.42;
        const hy = h * 0.5;
        const hr = w * 0.09;

        // Outer elevated crater rim
        const rimGrad = ctx.createRadialGradient(hx, hy, hr * 0.8, hx, hy, hr * 1.25);
        rimGrad.addColorStop(0, 'rgba(245, 245, 250, 0.9)');
        rimGrad.addColorStop(0.5, 'rgba(210, 210, 220, 0.7)');
        rimGrad.addColorStop(1, 'rgba(160, 160, 170, 0.0)');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 1.25, 0, Math.PI * 2);
        ctx.fill();

        // Deep crater floor depression
        const floorGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr * 0.85);
        floorGrad.addColorStop(0, 'rgba(80, 80, 85, 0.95)');
        floorGrad.addColorStop(0.8, 'rgba(50, 50, 55, 0.95)');
        floorGrad.addColorStop(1, 'rgba(40, 40, 45, 0.95)');
        ctx.fillStyle = floorGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Prominent central peak (rises ~6 km from the crater floor)
        const peakGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr * 0.3);
        peakGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        peakGrad.addColorStop(0.6, 'rgba(200, 200, 210, 0.8)');
        peakGrad.addColorStop(1, 'rgba(90, 90, 95, 0.0)');
        ctx.fillStyle = peakGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    private static drawGenericPlanet(ctx: CanvasRenderingContext2D, w: number, h: number, name: string) {
        const imgData = this.safeCreateImageData(ctx, w, h);
        if (!imgData) return;
        const data = imgData.data;
        const total = w * h;
        const u32 = this.getUint32View(data, total);
        const noise = this.createNoise(w, h, 4, 0.5, this.hashSeed(name));

        if (u32) {
            for (let i = 0; i < total; i++) {
                const b = (120 + noise[i] * 80) | 0;
                u32[i] = 0xFF000000 | (b << 16) | (b << 8) | b;
            }
        } else {
            for (let i = 0; i < total; i++) {
                const p = i * 4;
                const b = (120 + noise[i] * 80) | 0;
                data[p] = b;
                data[p + 1] = b;
                data[p + 2] = b;
                data[p + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    /**
     * Radial ring texture generator (Cassini division, A/B/C rings, Encke gap)
     * Uses 1024x4 resolution with full trilinear mipmaps + anisotropic filtering so grazing-angle
     * ring planes never shimmer or alias.
     */
    static getRingTexture(name: string): THREE.CanvasTexture {
        const key = `${name}_Rings`;
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const width = 1024;
        const height = 4;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = TextureGenerator.maxAnisotropy;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        this.cache.set(key, texture);

        if (!ctx) return texture;

        const imgData = this.safeCreateImageData(ctx, width, height);
        if (!imgData) return texture;
        const data = imgData.data;

        for (let x = 0; x < width; x++) {
            const t = x / width; // 0 at inner radius, 1 at outer radius
            let r = 215, g = 195, b = 155, alpha = 0;

            if (name === 'Saturn') {
                // C Ring (inner, translucent dusty charcoal-amber): 0.0 to 0.25
                if (t < 0.25) {
                    const cWave = Math.sin(t * 260) * 14;
                    alpha = Math.max(0, Math.min(255, Math.floor(t * 4 * 115 + cWave)));
                    r = 164; g = 148; b = 126;
                }
                // B Ring (main, bright, high optical depth with fine Cassini ringlets): 0.25 to 0.63
                else if (t < 0.63) {
                    const ringlet = Math.sin(t * 210) * 18 + Math.sin(t * 590) * 9;
                    alpha = Math.min(250, Math.floor(232 + Math.sin(t * 95) * 14));
                    r = Math.min(255, Math.floor(228 + ringlet));
                    g = Math.min(255, Math.floor(208 + ringlet));
                    b = Math.min(255, Math.floor(168 + ringlet));
                }
                // Cassini Division (Huygens gap): 0.63 to 0.71
                else if (t < 0.71) {
                    alpha = 12;
                    r = 58; g = 48; b = 40;
                }
                // A Ring (outer bright icy ring with Encke & Keeler gaps): 0.71 to 0.98
                else if (t < 0.98) {
                    if (t > 0.895 && t < 0.915) {
                        // Encke Gap
                        alpha = 8;
                    } else if (t > 0.962 && t < 0.968) {
                        // Keeler Gap
                        alpha = 14;
                    } else {
                        const aWave = Math.sin(t * 280) * 12;
                        alpha = Math.floor(188 + aWave * 0.5);
                        r = Math.min(255, Math.floor(212 + aWave));
                        g = Math.min(255, Math.floor(192 + aWave));
                        b = Math.min(255, Math.floor(158 + aWave));
                    }
                }
                // Faint F-ring / outer feathering
                else {
                    alpha = Math.max(0, Math.floor((1.0 - t) * 50 * 48));
                }
            } else {
                // Uranus / Neptune / ice-giant narrow ringlets
                const band1 = (t > 0.24 && t < 0.34) ? 120 : 0;
                const band2 = (t > 0.45 && t < 0.58) ? 145 : 0;
                const epsilon = (t > 0.74 && t < 0.88) ? 185 : 0;
                alpha = Math.max(band1, band2, epsilon);
                r = 182; g = 206; b = 228;
            }

            for (let y = 0; y < height; y++) {
                const p = (y * width + x) * 4;
                data[p] = r;
                data[p + 1] = g;
                data[p + 2] = b;
                data[p + 3] = alpha;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        return texture;
    }
}
