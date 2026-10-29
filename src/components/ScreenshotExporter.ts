import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { i18n } from '../i18n';

/**
 * Renders the current observatory viewport with an unobtrusive telemetry watermark
 * and triggers a PNG download.
 */
export function exportObservatoryScreenshot(
    renderer: THREE.WebGLRenderer,
    composer: EffectComposer,
    rawTargetName: string,
    simDate: Date
): void {
    if (!renderer) return;

    composer.render();
    const srcCanvas = renderer.domElement;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = srcCanvas.width;
    exportCanvas.height = srcCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(srcCanvas, 0, 0);

    const w = exportCanvas.width;
    const h = exportCanvas.height;
    const badgeWidth = Math.min(380, w * 0.48);
    const badgeHeight = 52;
    const badgeX = w - badgeWidth - 24;
    const badgeY = h - badgeHeight - 24;

    const localizedTarget = i18n.getBodyName(rawTargetName) || rawTargetName || 'Solar System';
    const dateLabel = simDate ? simDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    ctx.save();
    ctx.fillStyle = 'rgba(6, 12, 26, 0.82)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
    } else {
        ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('SOLAR SYSTEM 3D OBSERVATORY', badgeX + 16, badgeY + 22);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText(`${localizedTarget}  •  UTC ${dateLabel}`, badgeX + 16, badgeY + 40);
    ctx.restore();

    try {
        exportCanvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const cleanName = (rawTargetName || 'solar-system').toLowerCase().replace(/\s+/g, '-');
            a.download = `${cleanName}-${dateLabel}.png`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    } catch (e) {
        console.warn('Screenshot capture failed:', e);
    }
}

