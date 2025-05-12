// gameLogic.js
// Handles core game logic: spawning cubes, random positions, and cube respawn after explosion
import * as THREE from 'three';
import { setExplosionTargetCube } from './projectile.js';
import { setExplosionFinishedCallback } from './explodeCube.js';
import { getRandomNeonColor } from './neonColors.js';

let cube = null;
let scene = null;
let camera = null;

export function initGameLogic(_scene, _camera) {
    scene = _scene;
    camera = _camera;
}

export function getCurrentCube() {
    return cube;
}

export function spawnCube() {
    // Clean up previous cube if needed
    if (cube) {
        scene.remove(cube);
        if (cube.geometry) cube.geometry.dispose();
        if (cube.material) cube.material.dispose();
    }
    cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        // Use MeshStandardMaterial with neon color, emissive, and emissiveIntensity like projectiles
        new THREE.MeshStandardMaterial({
            color: getRandomNeonColor(),
            emissive: getRandomNeonColor(),
            emissiveIntensity: 0.9,
            wireframe: true
        })
    );
    cube.userData.exploded = false;
    cube.position.copy(getRandomCubePosition(camera));
    scene.add(cube);
    setExplosionTargetCube(cube);
}

export function startGame() {
    spawnCube();
    setExplosionFinishedCallback(() => {
        spawnCube();
    });
}

function getRandomCubePosition(camera) {
    // Distance: 5 to 25 units
    const distance = 5 + Math.random() * 20;
    // Horizontal angle: random between -37.5 and +37.5 degrees (in radians)
    const hAngle = (Math.random() - 0.5) * (75 * Math.PI / 180); // -37.5° to +37.5°
    // Vertical angle: random between -30 and +30 degrees (in radians)
    const vAngle = (Math.random() - 0.5) * (60 * Math.PI / 180); // -30° to +30°
    // Spherical to Cartesian
    const x = distance * Math.sin(hAngle) * Math.cos(vAngle);
    const y = distance * Math.sin(vAngle);
    const z = -distance * Math.cos(hAngle) * Math.cos(vAngle);
    const pos = new THREE.Vector3(x, y, z);
    pos.applyQuaternion(camera.quaternion);
    pos.add(camera.position);
    return pos;
}
