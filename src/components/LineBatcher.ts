import * as THREE from 'three';

/**
 * Layer used to hide batched source lines from the camera. The source objects stay in the scene
 * graph (so visibility toggles, rebuilds and disposal keep working unchanged) but are drawn by
 * their batch instead of individually.
 */
export const BATCHED_SOURCE_LAYER = 31;

/** Mark a line so the LineBatcher merges it into a shared draw call. */
export function markLineBatchable(line: THREE.Line): void {
    line.userData.batchable = true;
    LineBatcher.invalidateTopology();
}

interface BatchSlot {
    line: THREE.Line;
    offset: number;
    capacity: number;
    count: number;
    visible: boolean;
    posVersion: number;
    matrix: Float32Array;
    color: THREE.Color;
    loop: boolean;
    segments: boolean;
    seen: boolean;
}

const _v = new THREE.Vector3();

/**
 * One merged draw call for every batchable line sharing the same material settings.
 * Vertices are stored in world space with per-vertex colours; an index buffer lists the
 * segments of currently visible sources only.
 */
class LineBatch {
    readonly object: THREE.LineSegments;
    readonly material: THREE.LineBasicMaterial;
    private geometry: THREE.BufferGeometry;
    private positions = new Float32Array(0);
    private colors = new Float32Array(0);
    private indices = new Uint32Array(0);
    private positionAttr!: THREE.BufferAttribute;
    private colorAttr!: THREE.BufferAttribute;
    private indexAttr!: THREE.BufferAttribute;
    readonly slots: BatchSlot[] = [];
    layoutDirty = true;
    indexDirty = true;
    private readonly origin = new THREE.Vector3();
    private originSet = false;

    constructor(template: THREE.LineBasicMaterial) {
        this.material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: template.transparent,
            opacity: template.opacity,
            blending: template.blending,
            depthTest: template.depthTest,
            depthWrite: template.depthWrite,
            toneMapped: template.toneMapped,
            fog: template.fog
        });
        this.geometry = new THREE.BufferGeometry();
        this.object = new THREE.LineSegments(this.geometry, this.material);
        this.object.name = 'LineBatch';
        this.object.frustumCulled = false;
        this.object.matrixAutoUpdate = false;
    }

    /** Reassign contiguous offsets and (re)allocate buffers after sources were added or removed. */
    private relayout(): void {
        let total = 0;
        for (const slot of this.slots) {
            slot.offset = total;
            total += slot.capacity;
        }
        const needed = Math.max(1, total);
        if (this.positions.length < needed * 3) {
            const capacity = Math.ceil(needed * 1.25);
            this.positions = new Float32Array(capacity * 3);
            this.colors = new Float32Array(capacity * 3);
            this.indices = new Uint32Array(capacity * 2 + 2 * Math.max(8, this.slots.length * 2));
            // GPU buffers cannot be resized in place: swap in a fresh geometry
            this.geometry.dispose();
            this.geometry = new THREE.BufferGeometry();
            this.positionAttr = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
            this.colorAttr = new THREE.BufferAttribute(this.colors, 3);
            this.indexAttr = new THREE.BufferAttribute(this.indices, 1).setUsage(THREE.DynamicDrawUsage);
            this.geometry.setAttribute('position', this.positionAttr);
            this.geometry.setAttribute('color', this.colorAttr);
            this.geometry.setIndex(this.indexAttr);
            // World-space data changes every frame; skip bounding-volume recomputation
            this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Number.MAX_SAFE_INTEGER);
            this.object.geometry = this.geometry;
        } else if (this.indices.length < needed * 2 + this.slots.length * 2) {
            this.indices = new Uint32Array(needed * 2 + 2 * Math.max(8, this.slots.length * 2));
            this.indexAttr = new THREE.BufferAttribute(this.indices, 1).setUsage(THREE.DynamicDrawUsage);
            this.geometry.setIndex(this.indexAttr);
        }
        for (const slot of this.slots) {
            slot.posVersion = -1; // force full rewrite
            this.writeColor(slot);
        }
        this.colorAttr.needsUpdate = true;
        this.layoutDirty = false;
        this.indexDirty = true;
    }

    private writeColor(slot: BatchSlot): void {
        const { r, g, b } = slot.color;
        const end = (slot.offset + slot.capacity) * 3;
        for (let i = slot.offset * 3; i < end; i += 3) {
            this.colors[i] = r;
            this.colors[i + 1] = g;
            this.colors[i + 2] = b;
        }
    }

    sync(origin: THREE.Vector3, rebaseThreshold: number): void {
        if (this.layoutDirty) this.relayout();

        // Floating origin: vertices are stored relative to a point near the camera so float32
        // precision holds up when zoomed onto tiny realistic-scale moons far from the Sun.
        let rebased = false;
        if (!this.originSet || this.origin.distanceTo(origin) > rebaseThreshold) {
            this.origin.copy(origin);
            this.originSet = true;
            this.object.matrix.makeTranslation(this.origin.x, this.origin.y, this.origin.z);
            this.object.matrixWorld.copy(this.object.matrix);
            rebased = true;
        }
        const ox = this.origin.x;
        const oy = this.origin.y;
        const oz = this.origin.z;

        for (const slot of this.slots) {
            const line = slot.line;
            const geometry = line.geometry as THREE.BufferGeometry;
            const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
            const material = line.material as THREE.LineBasicMaterial;

            let visible = line.visible && material.visible !== false && Boolean(position);
            for (let p = line.parent; visible && p; p = p.parent) {
                if (!p.visible) visible = false;
            }
            const start = geometry.drawRange.start;
            const rawCount = visible && position
                ? Math.max(0, Math.min(slot.capacity, position.count - start, geometry.drawRange.count))
                : 0;
            // A line with fewer than 2 vertices produces zero segments; treat it as empty until a 2nd vertex arrives
            const count = rawCount >= 2 ? rawCount : 0;

            if (visible !== slot.visible || count !== slot.count) {
                slot.visible = visible;
                slot.count = count;
                this.indexDirty = true;
                slot.posVersion = -1;
            }
            if (!visible || count === 0 || !position) continue;

            if (!slot.color.equals(material.color)) {
                slot.color.copy(material.color);
                this.writeColor(slot);
                this.colorAttr.needsUpdate = true;
            }

            // Rewrite vertices only when the source data or its world transform moved perceptibly (~0.2 px on screen)
            const m = line.matrixWorld.elements;
            const dxCam = m[12] - ox;
            const dyCam = m[13] - oy;
            const dzCam = m[14] - oz;
            const camDist = Math.sqrt(dxCam * dxCam + dyCam * dyCam + dzCam * dzCam);
            const transTol = Math.max(1e-4, camDist * 2e-4);
            let matrixChanged = false;
            for (let i = 0; i < 16; i++) {
                const diff = Math.abs(slot.matrix[i] - m[i]);
                const tol = (i >= 12 && i <= 14) ? transTol : 1e-4;
                if (!(diff <= tol)) {
                    matrixChanged = true;
                }
            }
            if (matrixChanged) {
                for (let i = 0; i < 16; i++) {
                    slot.matrix[i] = m[i];
                }
            }
            if (!matrixChanged && !rebased && slot.posVersion === position.version) continue;
            slot.posVersion = position.version;

            const src = position.array as ArrayLike<number>;
            const dst = this.positions;
            let d = slot.offset * 3;
            for (let i = start; i < start + count; i++) {
                const s = i * 3;
                _v.set(src[s], src[s + 1], src[s + 2]).applyMatrix4(line.matrixWorld);
                dst[d++] = _v.x - ox;
                dst[d++] = _v.y - oy;
                dst[d++] = _v.z - oz;
            }
            this.positionAttr.needsUpdate = true;
        }

        if (this.indexDirty) this.rebuildIndex();
    }

    private rebuildIndex(): void {
        const idx = this.indices;
        let n = 0;
        for (const slot of this.slots) {
            if (!slot.visible || slot.count < 2) continue;
            const o = slot.offset;
            if (slot.segments) {
                for (let i = 0; i + 1 < slot.count; i += 2) {
                    idx[n++] = o + i;
                    idx[n++] = o + i + 1;
                }
            } else {
                for (let i = 0; i + 1 < slot.count; i++) {
                    idx[n++] = o + i;
                    idx[n++] = o + i + 1;
                }
                if (slot.loop) {
                    idx[n++] = o + slot.count - 1;
                    idx[n++] = o;
                }
            }
        }
        this.geometry.setDrawRange(0, n);
        this.indexAttr.needsUpdate = true;
        this.object.visible = n > 0;
        this.indexDirty = false;
    }

    dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
        this.object.removeFromParent();
    }
}

/**
 * Merges many small `THREE.Line` objects (orbit paths, motion trails) into one draw call per
 * distinct material configuration. Each draw call has a fixed CPU cost in three.js (program and
 * uniform binding), which dominated frame time with ~60 individually drawn lines.
 *
 * Call `sync()` once per frame after `scene.updateMatrixWorld()` and before rendering.
 */
export class LineBatcher {
    private static topologyVersion = 1;
    static invalidateTopology(): void {
        LineBatcher.topologyVersion++;
    }

    private readonly batches = new Map<string, LineBatch>();
    private readonly slotBySource = new Map<THREE.Line, { batch: LineBatch; slot: BatchSlot }>();
    private readonly found: THREE.Line[] = [];
    private syncedTopologyVersion = -1;
    private static readonly _zero = new THREE.Vector3();

    constructor(private readonly scene: THREE.Scene) {}

    /** Number of merged draw calls currently maintained (for diagnostics/tests). */
    get batchCount(): number {
        return this.batches.size;
    }

    private static keyFor(material: THREE.LineBasicMaterial): string {
        return [
            material.transparent, material.opacity, material.blending,
            material.depthTest, material.depthWrite, material.toneMapped, material.fog
        ].join('|');
    }

    private collect(): void {
        const found = this.found;
        found.length = 0;
        this.scene.traverse(object => {
            if ((object as THREE.Line).isLine && object.userData.batchable === true) {
                found.push(object as THREE.Line);
            }
        });
    }

    private adopt(line: THREE.Line): void {
        const material = line.material as THREE.LineBasicMaterial;
        const position = (line.geometry as THREE.BufferGeometry).getAttribute('position');
        if (Array.isArray(line.material) || !(material as THREE.LineBasicMaterial).isLineBasicMaterial || !position) {
            return; // unsupported: leave it rendering on its own
        }
        const key = LineBatcher.keyFor(material);
        let batch = this.batches.get(key);
        if (!batch) {
            batch = new LineBatch(material);
            this.batches.set(key, batch);
            this.scene.add(batch.object);
        }
        const slot: BatchSlot = {
            line,
            offset: 0,
            capacity: position.count,
            count: 0,
            visible: false,
            posVersion: -1,
            matrix: new Float32Array(16).fill(NaN),
            color: material.color.clone(),
            loop: (line as THREE.LineLoop).isLineLoop === true,
            segments: (line as THREE.LineSegments).isLineSegments === true,
            seen: true
        };
        batch.slots.push(slot);
        batch.layoutDirty = true;
        this.slotBySource.set(line, { batch, slot });
        line.layers.set(BATCHED_SOURCE_LAYER);
    }

    private release(line: THREE.Line): void {
        const entry = this.slotBySource.get(line);
        if (!entry) return;
        const { batch, slot } = entry;
        const i = batch.slots.indexOf(slot);
        if (i >= 0) batch.slots.splice(i, 1);
        batch.layoutDirty = true;
        this.slotBySource.delete(line);
        line.layers.set(0);
    }

    /**
     * @param origin Point to keep vertex coordinates relative to (normally the camera position).
     * @param rebaseThreshold Distance the origin may drift before all vertices are re-based.
     */
    sync(origin: THREE.Vector3 = LineBatcher._zero, rebaseThreshold: number = Infinity): void {
        if (this.syncedTopologyVersion !== LineBatcher.topologyVersion) {
            this.syncedTopologyVersion = LineBatcher.topologyVersion;
            this.collect();

            for (const entry of this.slotBySource.values()) entry.slot.seen = false;
            for (const line of this.found) {
                const entry = this.slotBySource.get(line);
                const position = (line.geometry as THREE.BufferGeometry).getAttribute('position');
                if (!entry) {
                    this.adopt(line);
                } else if (!position || position.count !== entry.slot.capacity
                    || LineBatcher.keyFor(line.material as THREE.LineBasicMaterial) !== LineBatcher.keyFor(entry.batch.material)) {
                    // Geometry or material settings were replaced in place: re-slot the source
                    this.release(line);
                    this.adopt(line);
                } else {
                    entry.slot.seen = true;
                }
            }
            // Sources removed from the scene (e.g. orbit rebuilt on scale change)
            for (const [line, entry] of this.slotBySource) {
                if (!entry.slot.seen) this.release(line);
            }
        }

        for (const [key, batch] of this.batches) {
            if (batch.slots.length === 0) {
                batch.dispose();
                this.batches.delete(key);
                continue;
            }
            batch.sync(origin, rebaseThreshold);
        }
    }

    dispose(): void {
        for (const line of [...this.slotBySource.keys()]) this.release(line);
        for (const batch of this.batches.values()) batch.dispose();
        this.batches.clear();
    }
}
