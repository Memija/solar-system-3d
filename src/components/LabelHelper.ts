import * as THREE from 'three';

export function createSpriteLabel(name: string): THREE.Sprite | null {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = 256;
    canvas.height = 64;

    context.font = 'Bold 32px Arial';
    context.fillStyle = 'rgba(255, 255, 255, 1)';
    context.textAlign = 'center';
    context.fillText(name, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    return new THREE.Sprite(material);
}
