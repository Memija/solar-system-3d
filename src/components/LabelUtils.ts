import * as THREE from 'three';

export function createSpriteLabel(text: string): THREE.Sprite | null {
    if (!text) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const fontSize = 64;
    context.font = `bold ${fontSize}px Arial, sans-serif`;

    const metrics = context.measureText(text);
    const textWidth = Math.ceil(metrics.width);

    const paddingX = 20;
    const paddingY = 10;

    canvas.width = textWidth + paddingX * 2;
    canvas.height = fontSize + paddingY * 2;

    context.font = `bold ${fontSize}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.fillStyle = 'white';
    context.shadowColor = 'black';
    context.shadowBlur = 8;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);

    const aspectRatio = canvas.width / canvas.height;
    sprite.scale.set(aspectRatio, 1, 1);

    return sprite;
}

export function createInfoLabel(speedText: string, distText: string): THREE.Sprite | null {
    if (!speedText && !distText) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const fontSize = 32;
    context.font = `${fontSize}px Arial, sans-serif`;

    const metrics1 = context.measureText(speedText);
    const metrics2 = context.measureText(distText);
    const textWidth = Math.max(metrics1.width, metrics2.width);

    const paddingX = 16;
    const paddingY = 8;
    const lineHeight = fontSize * 1.2;

    canvas.width = textWidth + paddingX * 2;
    canvas.height = (lineHeight * 2) + paddingY * 2;

    context.font = `${fontSize}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.fillStyle = '#a0a0a0';
    context.shadowColor = 'black';
    context.shadowBlur = 4;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;

    context.fillText(speedText, canvas.width / 2, paddingY + lineHeight / 2);
    context.fillText(distText, canvas.width / 2, paddingY + lineHeight + lineHeight / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        opacity: 0.8
    });

    const sprite = new THREE.Sprite(spriteMaterial);

    const aspectRatio = canvas.width / canvas.height;
    sprite.scale.set(aspectRatio * 0.8, 0.8, 1);

    return sprite;
}
