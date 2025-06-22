import * as THREE from 'three';
import { neonColors, dullColors } from './colors.js';

// Create the color menu as a group of buttons
export function createColorMenu() {
    const group = new THREE.Group();
    for (let i = 0; i < neonColors.length; i++) {
        const btn = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.02),
            new THREE.MeshStandardMaterial({ color: dullColors[i] })
        );
        btn.position.set(0, 0.18 - i * 0.09, 0);
        btn.userData = { color: neonColors[i], dull: dullColors[i], neon: neonColors[i] };
        group.add(btn);
    }
    return group;
}
