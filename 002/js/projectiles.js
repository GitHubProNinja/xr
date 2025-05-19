import * as THREE from 'three';
import { playSound } from './sound.js';

// Internal array to manage active projectiles
const activeProjectiles = [];

/**
 * Spawns a projectile in front of the model, moving in the direction the model is facing.
 * @param {THREE.Scene} scene - The scene to add the projectile to.
 * @param {THREE.Object3D} model - The model to shoot from.
 * @param {number} [speed=0.25] - The speed of the projectile.
 */
export function spawnProjectile(scene, model, speed = 0.25) {
    const geometry = new THREE.SphereGeometry(0.04, 4, 4);
    // Set projectile color to random neon color using HSL (high saturation, high lightness)
    // HSL hue reference (0-1):
    // 0 or 1   = Red
    // 0.08     = Orange
    // 0.16     = Yellow
    // 0.33     = Green
    // 0.5      = Cyan
    // 0.66     = Blue
    // 0.83     = Magenta/Pink
    // 0.91     = Rose
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    const material = new THREE.MeshStandardMaterial({
        wireframe: true,
        color: color,
        emissive: color,
        emissiveIntensity: 10,
        metalness: 0.5,
        roughness: 0.1
    });
    const projectile = new THREE.Mesh(geometry, material);
    // VR controller: spawn from tip (0, 0, -0.06) in controller local space
    let start;
    if (model && model.matrixWorld) {
        start = new THREE.Vector3(0, 0, -0.06).applyMatrix4(model.matrixWorld);
    } else {
        // Fallback: in front of model (e.g. camera)
        start = new THREE.Vector3(0, 1.1, -0.3);
        if (model && model.matrixWorld) start.applyMatrix4(model.matrixWorld);
    }
    projectile.position.copy(start);
    scene.add(projectile);
    // Play gunshot sound (non-positional, no extra args)
    playSound('assets/Sounds/gunshot.wav');
    // Get forward direction (controller -Z in world space)
    let forward;
    if (model && model.matrixWorld) {
        forward = new THREE.Vector3(0, 0, -1).applyQuaternion(model.getWorldQuaternion(new THREE.Quaternion())).normalize();
    } else {
        forward = new THREE.Vector3(0, 0, -1);
    }
    projectile.userData.velocity = forward.multiplyScalar(speed);
    activeProjectiles.push({ mesh: projectile, origin: start.clone() });
}

/**
 * Updates all projectiles (move and remove if too far).
 * Call this once per frame.
 * @param {THREE.Scene} scene
 * @param {THREE.Object3D} model - The model to use as origin for distance check
 */
export function updateProjectiles(scene, model) {
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const proj = activeProjectiles[i];
        proj.mesh.position.add(proj.mesh.userData.velocity);
        // Remove if too far from origin
        if (proj.mesh.position.distanceTo(model.position) > 20) {
            scene.remove(proj.mesh);
            if (proj.mesh.geometry) proj.mesh.geometry.dispose();
            if (proj.mesh.material) {
                if (Array.isArray(proj.mesh.material)) {
                    proj.mesh.material.forEach(m => m.dispose && m.dispose());
                } else {
                    proj.mesh.material.dispose();
                }
            }
            activeProjectiles.splice(i, 1);
        }
    }
}

/**
 * Remove all projectiles from the scene.
 * @param {THREE.Scene} scene
 */
export function clearProjectiles(scene) {
    for (const proj of activeProjectiles) {
        scene.remove(proj.mesh);
        if (proj.mesh.geometry) proj.mesh.geometry.dispose();
        if (proj.mesh.material) {
            if (Array.isArray(proj.mesh.material)) {
                proj.mesh.material.forEach(m => m.dispose && m.dispose());
            } else {
                proj.mesh.material.dispose();
            }
        }
    }
    activeProjectiles.length = 0;
}

/**
 * Returns the array of active projectiles (for collision detection).
 * @returns {Array<{mesh: THREE.Mesh, origin: THREE.Vector3}>}
 */
export function getActiveProjectiles() {
    return activeProjectiles;
}
