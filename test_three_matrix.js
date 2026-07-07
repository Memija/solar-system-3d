import * as THREE from 'three';

const scene = new THREE.Scene();
const parent = new THREE.Group();
const child = new THREE.Group();
parent.add(child);
scene.add(parent);

// initially render to compute matrices
scene.updateMatrixWorld(true);

// Move parent
parent.position.set(10, 0, 0);

// Just update child matrix world
child.updateMatrixWorld(true);

const childPos = new THREE.Vector3();
child.getWorldPosition(childPos);

console.log("Child pos:", childPos); // If it's (0,0,0), then child's getWorldPosition didn't see parent's update!
