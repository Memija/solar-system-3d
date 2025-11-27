import './style.scss'
import { SceneManager } from './components/SceneManager.js'
import { UIManager } from './components/UIManager.js'

const container = document.getElementById('app');
if (!container) {
  throw new Error("App container not found");
}

const sceneManager = new SceneManager(container);
const uiManager = new UIManager(sceneManager);

function animate() {
  requestAnimationFrame(animate);
  sceneManager.update();
}

animate();
