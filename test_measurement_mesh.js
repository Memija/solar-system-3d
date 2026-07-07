import * as THREE from 'three';

const scene = new THREE.Scene();
const orbitGroup = new THREE.Group();
const tiltGroup = new THREE.Group();
const mesh = new THREE.Mesh();

scene.add(orbitGroup);
orbitGroup.add(tiltGroup);
tiltGroup.add(mesh);

orbitGroup.position.set(10, 0, 0);
mesh.rotation.y = Math.PI / 4;
// Mesh is at local 0,0,0 relative to tiltGroup, which is at local 0,0,0 to orbitGroup.
// So rotating mesh doesn't change mesh's world position.

scene.updateMatrixWorld(true);

const pos = new THREE.Vector3();
mesh.getWorldPosition(pos);
console.log("Mesh pos:", pos);

// In sceneManager:
// if ('orbitGroup' in this.measureTargetA) {
//     this.measureTargetA.orbitGroup.getWorldPosition(posA);
// } else {
//     this.measureTargetA.mesh.getWorldPosition(posA);
// }
// Both posA and posB will always return the center position!
