/**
 * Off-main-thread encoder for the procedural planet texture IndexedDB cache.
 *
 * Receives a transferred ImageBitmap snapshot of a synthesized texture canvas, encodes it to
 * WebP through an OffscreenCanvas and stores the resulting Blob. Doing this on the main thread
 * (`HTMLCanvasElement.toBlob`) costs ~35 ms per 2048x1024 map and visibly janks the render loop
 * right after the first visit's loading screen.
 */
interface TextureEncodeRequest {
    key: string;
    bitmap: ImageBitmap;
    dbName: string;
    storeName: string;
    quality: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openTextureCacheDB(dbName: string, storeName: string): Promise<IDBDatabase | null> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
        try {
            const req = indexedDB.open(dbName, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
    return dbPromise;
}

self.onmessage = async (event: MessageEvent<TextureEncodeRequest>) => {
    const { key, bitmap, dbName, storeName, quality } = event.data;
    try {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(bitmap, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
        const db = await openTextureCacheDB(dbName, storeName);
        if (!db) return;
        db.transaction(storeName, 'readwrite').objectStore(storeName).put(blob, key);
    } catch {
        // Ignore encoding, quota or private-browsing errors; the texture is simply re-synthesized next visit
    } finally {
        bitmap.close();
    }
};

export {};

