// projectile.js
import * as THREE from 'three';
import { getRandomNeonColor } from './neonColors.js';
import { playGunSound } from './sound.js';

const projectiles = [];
const projectileSpeed = 0.2;

// Add a reference to the cube for hit detection
let targetCube = null;
export function setExplosionTargetCube(cube) {
    targetCube = cube;
}

// Add a callback for when a cube is exploded
let onCubeExploded = null;
export function setOnCubeExplodedCallback(cb) {
    onCubeExploded = cb;
}

/**
 * Creates a projectile (small sphere), sets its initial position and velocity, and adds it to the scene.
 * @param {THREE.Vector3} origin - The world position where the projectile starts (e.g., the tip of the gun/cylinder).
 * @param {THREE.Vector3} direction - The normalized direction vector the projectile should travel in.
 * @param {THREE.Scene} scene - The scene to add the projectile to.
 */
function createProjectile(origin, direction, scene) {
    playGunSound();
    const geometry = new THREE.SphereGeometry(0.03, 6, 6);
    // The 'emissive' property makes the projectile appear to glow with its own color, independent of scene lighting.
    // The 'emissiveIntensity' property controls how bright this glow effect is.
    // This is useful for creating neon or glowing effects, making the projectile stand out even in dark scenes.
    const material = new THREE.MeshStandardMaterial({ color: getRandomNeonColor(), emissive: getRandomNeonColor(), emissiveIntensity: 0.9, wireframe: true });
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(origin);
    projectile.userData.velocity = direction.clone().multiplyScalar(projectileSpeed);
    scene.add(projectile);
    projectiles.push(projectile);
}

/**
 * Checks if a projectile's bounding box intersects with the cube's bounding box (collision detection)
 * @param {THREE.Mesh} projectile - The projectile mesh.
 * @param {THREE.Mesh} cube - The target cube mesh.
 * @returns {boolean} - True if the projectile intersects with the cube, false otherwise.
 */
function isProjectileHittingCube(projectile, cube) {
    projectile.geometry.computeBoundingBox();
    cube.geometry.computeBoundingBox();
    if (cube.userData.exploded) return false; // Don't hit exploded cubes
    const projBox = projectile.geometry.boundingBox.clone().applyMatrix4(projectile.matrixWorld);
    const cubeBox = cube.geometry.boundingBox.clone().applyMatrix4(cube.matrixWorld);
    return projBox.intersectsBox(cubeBox);
}

/**
 * Updates the position of all active projectiles each frame, moving them forward.
 * Removes projectiles from the scene if they travel too far.
 * @param {THREE.Scene} scene - The scene containing the projectiles.
 */
export function updateProjectiles(scene) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.position.add(p.userData.velocity);
        // Check for collision with the target cube
        if (targetCube && isProjectileHittingCube(p, targetCube)) {
            if (!targetCube.userData.exploded) {
                import('./explodeCube.js').then(mod => {
                    mod.explodeCube(targetCube, scene);
                });
                if (onCubeExploded) onCubeExploded();
            }
            scene.remove(p);
            if (p.geometry) p.geometry.dispose();
            if (p.material) p.material.dispose();
            projectiles.splice(i, 1);
            continue;
        }
        // If the projectile has traveled too far, remove it from the scene and free its resources
        if (p.position.length() > 100) {
            scene.remove(p); // Remove the projectile mesh from the scene
            if (p.geometry) p.geometry.dispose(); // Dispose of the geometry to free GPU memory
            if (p.material) p.material.dispose(); // Dispose of the material to free GPU memory
            projectiles.splice(i, 1); // Remove the projectile from the projectiles array
        }
    }
}

/**
 * Sets up the event listener for shooting projectiles from the right controller in VR.
 * When the right controller trigger is pressed, a projectile is spawned and launched forward.
 * @param {THREE.WebGLRenderer} renderer - The renderer with XR enabled.
 * @param {THREE.Scene} scene - The scene to add projectiles to.
 */
export function setupProjectileShooting(renderer, scene) {
    renderer.xr.addEventListener('sessionstart', () => {
        function handleShoot(controllerGrip) {
            const tip = new THREE.Vector3(0, 0, -0.09);
            controllerGrip.updateMatrixWorld();
            const worldTip = tip.clone().applyMatrix4(controllerGrip.matrixWorld);
            // Shoot straight forward
            const forward = new THREE.Vector3(0, -Math.sin(Math.PI / 4), -1)
                .applyQuaternion(controllerGrip.getWorldQuaternion(new THREE.Quaternion()))
                .normalize();
            createProjectile(worldTip, forward, scene);
        }
        // Right controller shooting
        const rightControllerGrip = renderer.xr.getControllerGrip(1);
        rightControllerGrip.addEventListener('selectstart', () => handleShoot(rightControllerGrip));
        // Left controller shooting
        const leftControllerGrip = renderer.xr.getControllerGrip(0);
        leftControllerGrip.addEventListener('selectstart', () => handleShoot(leftControllerGrip));
    });
}
