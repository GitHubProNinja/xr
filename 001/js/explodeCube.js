import * as THREE from 'three';
import { playExplosionSound } from './sound.js';

let explosionPieces = [];
let explosionTime = 0;
let explosionFinishedCallback = null;

/**
 * Explodes a cube mesh into 27 smaller pieces with a dramatic spinning and fading effect.
 * @param {THREE.Mesh} cube - The cube mesh to explode.
 * @param {THREE.Scene} scene - The Three.js scene.
 */
export function explodeCube(cube, scene) {
    if (cube.userData.exploded) return;
    cube.userData.exploded = true;
    playExplosionSound(cube.position);
    scene.remove(cube);
    if (cube.geometry) cube.geometry.dispose();
    if (cube.material) cube.material.dispose();
    const pieceSize = cube.geometry.parameters.width / 3;
    const half = pieceSize * 1.5;
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                const pieceGeo = new THREE.BoxGeometry(pieceSize, pieceSize, pieceSize);
                const pieceMat = cube.material.clone();
                pieceMat.transparent = true;
                pieceMat.opacity = 1;
                // Assign a random vibrant neon color or the original cube color
                // These are bright, highly saturated colors that stand out visually and are often used for glowing or cyberpunk effects.
                // Each value is a 24-bit color (0xRRGGBB) chosen for its vibrancy and visual impact.
                const neonColors = [
                    0xff073a, // Neon Red
                    0xff00de, // Neon Pink
                    0xff00ff, // Neon Magenta
                    0xc800ff, // Electric Purple
                    0xff1493, // Deep Pink
                    0xda70d6, // Orchid
                    0xe040fb, // Neon Violet
                    cube.material.color.getHex() // Original cube color
                ];
                pieceMat.color.setHex(neonColors[Math.floor(Math.random() * neonColors.length)]);
                const piece = new THREE.Mesh(pieceGeo, pieceMat);
                piece.position.set(
                    cube.position.x + (x * pieceSize - half + pieceSize / 2),
                    cube.position.y + (y * pieceSize - half + pieceSize / 2),
                    cube.position.z + (z * pieceSize - half + pieceSize / 2)
                );
                piece.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2 + 0.1,
                    (Math.random() - 0.5) * 0.2
                );
                piece.userData.angularVelocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 10 + (Math.random() < 0.5 ? 40 : -40),
                    (Math.random() - 0.5) * 10 + (Math.random() < 0.5 ? 40 : -40),
                    (Math.random() - 0.5) * 10 + (Math.random() < 0.5 ? 40 : -40)
                );
                scene.add(piece);
                explosionPieces.push(piece);
            }
        }
    }
    explosionTime = 0;
}

/**
 * Animates and cleans up explosion pieces each frame.
 * Calls the explosionFinishedCallback when the animation is done.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {number} delta - Time since last frame (in seconds).
 */
export function updateExplosionPieces(scene, delta) {
    if (explosionPieces.length === 0) return;
    explosionTime += delta;
    for (const p of explosionPieces) {
        p.position.add(p.userData.velocity);
        p.rotation.x += p.userData.angularVelocity.x * delta;
        p.rotation.y += p.userData.angularVelocity.y * delta;
        p.rotation.z += p.userData.angularVelocity.z * delta;
        p.material.opacity = Math.max(0, 1 - explosionTime / 0.75);
    }
    if (explosionTime >= 0.75) {
        for (const p of explosionPieces) {
            scene.remove(p);
            p.geometry.dispose();
            p.material.dispose();
        }
        explosionPieces = [];
        if (explosionFinishedCallback) explosionFinishedCallback();
    }
}

/**
 * Registers a callback to be called when the explosion animation is finished.
 * @param {Function} cb - The callback function.
 */
export function setExplosionFinishedCallback(cb) {
    explosionFinishedCallback = cb;
}