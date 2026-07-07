import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><div id="app"></div>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };

import { SceneManager } from './src/components/SceneManager.ts'; // We can't actually do this easily
