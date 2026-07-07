import * as THREE from 'three';
import { CelestialBody } from './src/components/CelestialBody.js';

// Setup mock parent
const parent = new THREE.Group();

const earthData = { name: "Earth", radius: 1, distance: 10, period: 1, color: 0xffffff };
const marsData = { name: "Mars", radius: 0.5, distance: 15, period: 1.88, color: 0xff0000 };

const earth = new CelestialBody(earthData, parent);
const mars = new CelestialBody(marsData, parent);

console.log("Initial Earth pos:", earth.orbitGroup.position);
console.log("Initial Mars pos:", mars.orbitGroup.position);

// Manually update
earth.update(0.1);
mars.update(0.1);

earth.orbitGroup.updateMatrixWorld(true);
mars.orbitGroup.updateMatrixWorld(true);

const posA = new THREE.Vector3();
const posB = new THREE.Vector3();

earth.orbitGroup.getWorldPosition(posA);
mars.orbitGroup.getWorldPosition(posB);

console.log("Earth pos A:", posA);
console.log("Mars pos B:", posB);
console.log("Distance:", posA.distanceTo(posB));

for(let i=0; i<10; i++) {
    earth.update(1000);
    mars.update(1000);
}

earth.orbitGroup.updateMatrixWorld(true);
mars.orbitGroup.updateMatrixWorld(true);

earth.orbitGroup.getWorldPosition(posA);
mars.orbitGroup.getWorldPosition(posB);

console.log("After time Earth pos A:", posA);
console.log("After time Mars pos B:", posB);
console.log("Distance:", posA.distanceTo(posB));
