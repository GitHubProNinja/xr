import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone as SkeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { crossFadeAnimation, playAnimation, stopAllAnimations } from './animationHandler.js';
import { playPositionalSound } from './sound.js';

// Generalized zombie configuration for future extensibility
const ZOMBIE_TYPES = {
    Mutant: {
        type: 'Mutant',
        modelPath: './assets/Mutant/Mutant.glb',
        animations: {
            Walking: './assets/Mutant/Walking.fbx',
            Dying: './assets/Mutant/Dying.fbx',
        },
        scale: [1, 1, 1],
        hitPoints: 3,
        partialDyingDuration: 1.0,
        speed: 0.015,
        collision: { radius: 0.5, height: 1.5, yOffset: 0.75 },
    },
    Yaku: {
        type: 'Yaku',
        modelPath: './assets/Yaku/Yaku.glb',
        animations: {
            Walking: './assets/Yaku/Walking.fbx',
            Dying: './assets/Yaku/Dying.fbx',
        },
        scale: [0.01, 0.01, 0.01], // 1% scale
        hitPoints: 1,
        partialDyingDuration: 1.0,
        speed: 0.015,
        collision: { radius: 0.35, height: 1.75, yOffset: 0.75 }, // height and yOffset increased
    },
    Parasite: {
        type: 'Parasite',
        modelPath: './assets/Parasite/Parasite.glb',
        animations: {
            Walking: './assets/Parasite/Walking.fbx',
            Dying: './assets/Parasite/Dying.fbx',
        },
        scale: [0.01, 0.01, 0.01], // 1% scale
        hitPoints: 2,
        partialDyingDuration: 1.0,
        speed: 0.015,
        collision: { radius: 0.35, height: 2.4, yOffset: 0.55 }, // height and yOffset increased
    },
    // Add more types here in the future
};

const zombies = [];
const zombieAssets = {}; // Cache for loaded models/animations

/**
 * Loads and caches the base model and animations for a zombie type.
 * @param {string} type - Zombie type key
 * @returns {Promise<{model: THREE.Object3D, animations: Object}>}
 */
async function loadZombieAssets(type) {
    if (zombieAssets[type]) return zombieAssets[type];
    const def = ZOMBIE_TYPES[type];
    if (!def) throw new Error('Unknown zombie type: ' + type);
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();
    // Load model
    const gltf = await gltfLoader.loadAsync(def.modelPath);
    const baseModel = gltf.scene;
    baseModel.scale.set(...def.scale);
    baseModel.rotation.x = -Math.PI / 2;
    // Load animations
    const animations = {};
    for (const [name, path] of Object.entries(def.animations)) {
        animations[name] = (await fbxLoader.loadAsync(path)).animations[0];
    }
    zombieAssets[type] = { model: baseModel, animations };
    return zombieAssets[type];
}

/**
 * Spawns a zombie of the given type at the given position.
 * @param {string} type - Zombie type key
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Vector3} position - Spawn position
 * @returns {Promise<Object>} - Resolves to the zombie object
 */
export async function spawnZombie(type, scene, position) {
    const def = ZOMBIE_TYPES[type];
    const { model: baseModel, animations } = await loadZombieAssets(type);
    // --- PIVOT FIX FOR ORIENTATION ---
    const pivot = new THREE.Object3D();
    pivot.position.copy(position);
    baseModel.rotation.x = -Math.PI / 2;
    pivot.add(SkeletonClone(baseModel));
    scene.add(pivot);
    // Draw debug collision cylinder for each zombie (world scale, not affected by model scale)
    const { radius, height, yOffset } = def.collision;
    const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 16, 1, true);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const debugCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    debugCylinder.visible = showDebugCylinders;
    debugCylinder.matrixAutoUpdate = false;
    scene.add(debugCylinder);
    pivot.userData.debugCylinder = debugCylinder;
    pivot.userData.collision = def.collision;
    const mixer = new THREE.AnimationMixer(pivot.children[0]);
    playAnimation(mixer, animations.Walking);
    // Per-zombie state
    pivot.userData.hitCount = 0;
    pivot.userData.dyingTimer = 0;
    pivot.userData.dyingAction = null;
    pivot.userData.resuming = false;
    const zombie = {
        type,
        model: pivot,
        mixer,
        animations,
        alive: true,
        dying: false,
        speed: def.speed,
        config: def,
    };
    zombies.push(zombie);
    return zombie;
}

/**
 * Updates all zombies: movement, animation, partial dying, respawn.
 * @param {THREE.Vector3} targetPos - The position zombies should move toward
 * @param {number} delta - Time delta
 */
export function updateZombies(targetPos, delta) {
    for (const zombie of zombies) {
        const def = zombie.config;
        // Update debug collision cylinder position to match zombie's world position
        if (zombie.model.userData.debugCylinder) {
            zombie.model.updateMatrixWorld();
            const worldPos = new THREE.Vector3();
            zombie.model.getWorldPosition(worldPos);
            // Center the cylinder vertically on the zombie (raise by yOffset)
            const { yOffset = 0 } = zombie.model.userData.collision || {};
            zombie.model.userData.debugCylinder.position.copy(worldPos);
            zombie.model.userData.debugCylinder.position.y += yOffset;
            zombie.model.userData.debugCylinder.updateMatrix();
        }
        if (zombie.dying && zombie.model.userData.dyingTimer > 0) {
            zombie.model.userData.dyingTimer -= delta;
            if (zombie.model.userData.dyingTimer <= 0 && zombie.model.userData.resuming) {
                zombie.dying = false;
                zombie.alive = true;
                const dyingAction = zombie.model.userData.dyingAction;
                const walkClip = zombie.animations.Walking;
                if (dyingAction) {
                    crossFadeAnimation(zombie.mixer, zombie.animations.Dying, walkClip, 0.3);
                    zombie.model.userData.dyingAction = null;
                } else {
                    playAnimation(zombie.mixer, walkClip);
                }
                zombie.model.userData.resuming = false;
            }
        }
        if (!zombie.alive && !zombie.dying) continue;
        if (zombie.alive) {
            if (!zombie.model.userData.hasPassedPlayer) {
                const dir = new THREE.Vector3().subVectors(targetPos, zombie.model.position);
                dir.y = 0;
                const dist = dir.length();
                if (dist > 0.1) {
                    dir.normalize();
                    zombie.model.position.addScaledVector(dir, zombie.speed);
                    // Use lookAt to orient zombie toward the player (fixes roll/tilt issue)
                    const lookTarget = zombie.model.position.clone().add(dir);
                    zombie.model.lookAt(lookTarget);
                } else {
                    zombie.model.userData.hasPassedPlayer = true;
                    if (!zombie.model.userData.moveDir) {
                        dir.normalize();
                        zombie.model.userData.moveDir = dir.clone();
                    }
                }
            } else {
                const moveDir = zombie.model.userData.moveDir;
                if (moveDir && moveDir.lengthSq() > 0) {
                    zombie.model.position.addScaledVector(moveDir, zombie.speed);
                    const toZombie = new THREE.Vector3().subVectors(zombie.model.position, targetPos);
                    const distPast = toZombie.dot(moveDir);
                    if (distPast > 2) {
                        const spawnPos = getRandomZombieSpawnPosition(targetPos);
                        zombie.model.position.copy(spawnPos);
                        zombie.model.visible = true;
                        zombie.model.userData.hasPassedPlayer = false;
                        zombie.model.userData.moveDir = null;
                        zombie.model.userData.hasSetRotation = false;
                        zombie.model.userData.hitCount = 0;
                        zombie.model.userData.dyingTimer = 0;
                        zombie.model.userData.dyingAction = null;
                        zombie.model.userData.resuming = false;
                    }
                }
            }
        }
        zombie.mixer.update(delta);
    }
}

/**
 * Checks for collisions between zombies and projectiles. Handles multi-hit and dying logic.
 * @param {THREE.Scene} scene - The scene
 * @param {Function} getProjectiles - Function returning array of { mesh }
 * @returns {number} - Number of zombies hit
 */
export function checkZombieHits(scene, getProjectiles) {
    let hits = 0;
    const zombiesCopy = zombies.slice();
    const projectiles = getProjectiles();
    for (let i = zombiesCopy.length - 1; i >= 0; i--) {
        const zombie = zombiesCopy[i];
        const def = zombie.config;
        if (!zombie.alive) continue;
        const zombiePos = zombie.model.position;
        // Cylinder collision parameters (per-type)
        const { radius: cylRadius, height: cylHeight, yOffset: cylYOffset } = zombie.model.userData.collision || { radius: 0.5, height: 1.5, yOffset: 0.75 };
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const proj = projectiles[j];
            const projPos = proj.mesh.position;
            const projRadius = 0.08; // Only projectile is a sphere
            // Cylinder collision: check horizontal (XZ) distance and vertical (Y) overlap
            const dx = projPos.x - zombiePos.x;
            const dz = projPos.z - zombiePos.z;
            const distXZ = Math.sqrt(dx * dx + dz * dz);
            // Cylinder vertical bounds
            const cylMinY = zombiePos.y + cylYOffset - cylHeight / 2;
            const cylMaxY = zombiePos.y + cylYOffset + cylHeight / 2;
            // Projectile vertical bounds
            const projMinY = projPos.y - projRadius;
            const projMaxY = projPos.y + projRadius;
            // Check horizontal (XZ) and vertical (Y) overlap
            const horizontalHit = distXZ < cylRadius + projRadius;
            const verticalHit = projMaxY > cylMinY && projMinY < cylMaxY;
            if (horizontalHit && verticalHit) {
                if (zombie.animations && zombie.animations.Dying) {
                    if (typeof zombie.model.userData.hitCount !== 'number') zombie.model.userData.hitCount = 0;
                    if (typeof zombie.model.userData.dyingTimer !== 'number') zombie.model.userData.dyingTimer = 0;
                    const hitCount = ++zombie.model.userData.hitCount;
                    // Play zombie hit sound (per type)
                    if (def.type === 'Mutant') {
                        playPositionalSound('assets/sounds/mutant_hit.mp3', zombie.model);
                    } else if (def.type === 'Parasite') {
                        playPositionalSound('assets/sounds/parasite_hit.mp3', zombie.model);
                    }
                    // Remove projectile
                    scene.remove(proj.mesh);
                    if (proj.mesh.geometry) proj.mesh.geometry.dispose();
                    if (proj.mesh.material) {
                        if (Array.isArray(proj.mesh.material)) {
                            proj.mesh.material.forEach(m => m.dispose && m.dispose());
                        } else {
                            proj.mesh.material.dispose();
                        }
                    }
                    projectiles.splice(j, 1);
                    if (hitCount < def.hitPoints) {
                        if (!zombie.dying) {
                            zombie.alive = false;
                            zombie.dying = true;
                            zombie.model.userData.resuming = true;
                            stopAllAnimations(zombie.mixer);
                            const dyingAction = playAnimation(zombie.mixer, zombie.animations.Dying);
                            zombie.model.userData.dyingTimer = def.partialDyingDuration;
                            zombie.model.userData.dyingAction = dyingAction;
                        }
                    } else {
                        if (!zombie.dying) {
                            zombie.alive = false;
                            zombie.dying = true;
                            zombie.model.userData.resuming = false;
                            stopAllAnimations(zombie.mixer);
                            const dyingAction = playAnimation(zombie.mixer, zombie.animations.Dying);
                            dyingAction.setLoop(THREE.LoopOnce, 1);
                            dyingAction.clampWhenFinished = true;
                            // Play zombie dying sound (per type)
                            if (def.type === 'Mutant') {
                                playPositionalSound('assets/sounds/mutant_dying.mp3', zombie.model);
                            } else if (def.type === 'Parasite') {
                                playPositionalSound('assets/sounds/parasite_dying.mp3', zombie.model);
                            } else if (def.type === 'Yaku') {
                                playPositionalSound('assets/sounds/yaku_dying.mp3', zombie.model);
                            }
                            const onDyingFinished = (event) => {
                                if (event.action === dyingAction) {
                                    zombie.mixer.removeEventListener('finished', onDyingFinished);
                                    const playerPos = scene.userData.playerPosition || new THREE.Vector3(0, 0, 0);
                                    const spawnPos = getRandomZombieSpawnPosition(playerPos);
                                    zombie.model.position.copy(spawnPos);
                                    zombie.model.visible = true;
                                    zombie.model.userData.hasPassedPlayer = false;
                                    zombie.model.userData.moveDir = null;
                                    zombie.model.userData.hasSetRotation = false;
                                    zombie.model.userData.hitCount = 0;
                                    zombie.model.userData.dyingTimer = 0;
                                    zombie.model.userData.dyingAction = null;
                                    zombie.alive = true;
                                    zombie.dying = false;
                                    playAnimation(zombie.mixer, zombie.animations.Walking);
                                }
                            };
                            zombie.mixer.addEventListener('finished', onDyingFinished);
                        }
                    }
                    hits++;
                    break;
                }
            }
        }
    }
    return hits;
}

// --- Update loop patch: handle partial dying animation for Mutant zombies ---
// Call this from your main game loop after updateZombies()
export function updateZombieStates(delta, scene) {
    for (const zombie of zombies) {
        if (zombie.type === 'Mutant' && zombie.dying && !zombie.alive && zombie.model.userData.dyingTimer) {
            zombie.model.userData.dyingTimer -= delta;
            if (zombie.model.userData.dyingTimer <= 0) {
                // Stop dying animation, resume walking
                const dyingAction = zombie.model.userData.dyingAction;
                if (dyingAction) dyingAction.stop();
                // Resume walking
                playAnimation(zombie.mixer, zombie.animations.Walking);
                zombie.alive = true;
                zombie.dying = false;
                zombie.model.userData.dyingTimer = 0;
                zombie.model.userData.dyingAction = null;
            }
        }
    }
}

// Utility to generate a random spawn position in front of the player
/**
 * Returns a random Vector3 between 10 and 30 units in front of the player, with lateral spread.
 * @param {THREE.Object3D|THREE.Vector3} player - The player model or position
 * @returns {THREE.Vector3}
 */
export function getRandomZombieSpawnPosition(player) {
    // Get player position and facing direction
    let pos, dir;
    if (player.position && player.getWorldDirection) {
        pos = player.position.clone();
        dir = new THREE.Vector3();
        player.getWorldDirection(dir);
    } else if (player instanceof THREE.Vector3) {
        pos = player.clone();
        dir = new THREE.Vector3(0, 0, -1); // Default facing -Z
    } else {
        pos = new THREE.Vector3(0, 0, 0);
        dir = new THREE.Vector3(0, 0, -1);
    }
    // Random distance 10-30 units
    const dist = 10 + Math.random() * 20;
    // Random lateral spread -10 to +10 units
    const spread = (Math.random() - 0.5) * 20;
    // Compute right vector for lateral offset
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    // Final spawn position
    const spawnPos = pos.clone().add(dir.clone().multiplyScalar(dist)).add(right.multiplyScalar(spread));
    spawnPos.y = 0; // Ground level
    return spawnPos;
}

// In your main script (likely script.js), replace hardcoded spawn positions with random ones
// Example usage:
// import { getRandomZombieSpawnPosition } from './zombies.js';
// ...
// Instead of:
// await spawnZombie('Mutant', scene, new THREE.Vector3(0, 0, -10));
// await spawnZombie('Mutant', scene, new THREE.Vector3(5, 0, -12));
// await spawnZombie('Mutant', scene, new THREE.Vector3(-5, 0, -8));
// Use:
// for (let i = 0; i < 3; i++) {
//     await spawnZombie('Mutant', scene, getRandomZombieSpawnPosition(ajModel));
// }
// For future: add hit detection, attack/death logic, and support for more types

let showDebugCylinders = false;

export function setDebugCylindersVisible(visible) {
    showDebugCylinders = visible;
    for (const zombie of zombies) {
        if (zombie.model.userData.debugCylinder) {
            zombie.model.userData.debugCylinder.visible = visible;
        }
    }
}
