import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneManager } from './src/components/SceneManager';
import * as THREE from 'three';
import { JSDOM } from 'jsdom';

const domWindow = new JSDOM('<!DOCTYPE html><div id="app"></div>');
global.window = domWindow.window as any;
global.document = domWindow.window.document as any;

const app = document.getElementById('app')!;
const sm = new SceneManager(app);

// ... mock WebGL
sm.renderer = { setSize: () => {}, setPixelRatio: () => {}, domElement: document.createElement('canvas') } as any;
sm.composer = { render: () => {}, setSize: () => {}, addPass: () => {} } as any;
// ...
