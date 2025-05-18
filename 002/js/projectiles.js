import * as THREE from 'three';

// Internal array to manage active projectiles
const activeProjectiles = [];

/**
 * Spawns a projectile in front of the model, moving in the direction the model is facing.
 * @param {THREE.Scene} scene - The scene to add the projectile to.
 * @param {THREE.Object3D} model - The model to shoot from.
 * @param {number} [speed=0.25] - The speed of the projectile.
 */
export function spawnProjectile(scene, model, speed = 0.25) {
    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    // Generate a random neon color (HSV: high saturation, high value, random hue)
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 1, 0.5); // vivid color
    const material = new THREE.MeshStandardMaterial({
        wireframe: true,
        color: color,
        emissive: color,
        emissiveIntensity: 10, // very bright
        metalness: 0.5,
        roughness: 0.1
    });
    const projectile = new THREE.Mesh(geometry, material);
    // Start at the model's hand/gun position (approximate: in front of chest)
    const start = new THREE.Vector3(0, 1.1, -0.3); // adjust as needed for hand position
    start.applyMatrix4(model.matrixWorld);
    projectile.position.copy(start);
    scene.add(projectile);
    // Get forward direction
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion).normalize();
    projectile.userData.velocity = forward.multiplyScalar(speed);
    activeProjectiles.push({ mesh: projectile, origin: model.position.clone() });
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
