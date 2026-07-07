import * as THREE from 'three';

const scene = new THREE.Scene();
const group = new THREE.Group();
scene.add(group);
const mesh = new THREE.Mesh();
group.add(mesh);

// Test updateMatrixWorld
group.position.set(10, 0, 0);
mesh.rotation.y = Math.PI / 4; // 45 deg

scene.updateMatrixWorld(true);

const pos1 = new THREE.Vector3();
group.getWorldPosition(pos1);
const pos2 = new THREE.Vector3();
mesh.getWorldPosition(pos2);
console.log("Group pos:", pos1);
console.log("Mesh pos:", pos2); // Wait, rotation around its own center shouldn't change the center's world position!
