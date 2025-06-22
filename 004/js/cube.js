import * as THREE from 'three';
import { neonColors } from './colors.js';

// Create the interactive cube
export function createCube() {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: neonColors[0] })
    );
    cube.position.set(0, 0.25, -1.5);
    return cube;
}

// Update the cube's color
export function setCubeColor(cube, color) {
    cube.material.color.set(color);
}
