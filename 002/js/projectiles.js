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
    const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    const projectile = new THREE.Mesh(geometry, material);
    let start, forward;
    // If model is a VR controller, spawn at its tip and shoot in its forward direction
    if (model && model.parent && model.parent.type === 'Scene') {
        // Controller: use its world position and orientation
        model.updateMatrixWorld();
        // Tip offset (slightly in front of controller)
        start = new THREE.Vector3(0, 0, -0.1).applyMatrix4(model.matrixWorld);
        forward = new THREE.Vector3(0, 0, -1).applyQuaternion(model.getWorldQuaternion(new THREE.Quaternion())).normalize();
    } else {
        // Camera fallback: use old logic
        start = new THREE.Vector3(0, 1.1, -0.3).applyMatrix4(model.matrixWorld);
        forward = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion).normalize();
    }
    projectile.position.copy(start);
    scene.add(projectile);
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
