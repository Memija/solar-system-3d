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
    const sprite = new THREE.Sprite(material);
    sprite.userData = { canvas, context, texture };
    return sprite;
}

export function createInfoLabel(speed: string, distance: string): THREE.Sprite | null {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = 256;
    canvas.height = 64;

    context.font = '16px Arial';
    context.fillStyle = 'rgba(200, 200, 255, 1)';
    context.textAlign = 'center';
    context.fillText(`Speed: ${speed}`, 128, 24);
    context.fillText(`Dist: ${distance}`, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.userData = { canvas, context, texture };
    return sprite;
}

export function updateInfoLabel(sprite: THREE.Sprite, speed: string, distance: string) {
    const { canvas, context, texture } = sprite.userData;
    if (!canvas || !context || !texture) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '16px Arial';
    context.fillStyle = 'rgba(200, 200, 255, 1)';
    context.textAlign = 'center';
    context.fillText(`Speed: ${speed}`, 128, 24);
    context.fillText(`Dist: ${distance}`, 128, 48);

    texture.needsUpdate = true;
}
