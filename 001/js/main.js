// Import three
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
// Import the default VRButton
import { VRButton } from "three/addons/webxr/VRButton.js";
import { setupProjectileShooting, updateProjectiles } from './projectile.js';
import { setupGunHands } from './gunHand.js';
import { updateExplosionPieces, setExplosionFinishedCallback } from './explodeCube.js';
import { spawnCube, initGameLogic, getCurrentCube, startGame } from './gameLogic.js';
import { initSound } from './sound.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Make a new scene
let scene = new THREE.Scene();
// Set background color of the scene to gray
scene.background = new THREE.Color(0x505050);

// JPG skybox
new THREE.TextureLoader()
    .setPath('img/')
    .load('cave.jpg', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        // scene.environment = null; // Not recommended for reflections
    });

// Add lights to the scene so models are visible
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3); // Bright directional light
// Position the light above and in front of the player
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// Make a camera. note that far is set to 100, which is better for realworld sized environments
let camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 1.6, 3);
scene.add(camera);

// --- Audio setup ---
// (Audio logic is now handled in sound.js)

// Initialize game logic with scene and camera
initGameLogic(scene, camera);
// Initialize sound system
initSound(camera, scene);

// Make a renderer that fills the screen
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
renderer.xr.enabled = true;
// Set animation loop
renderer.setAnimationLoop(render);
// Add canvas to the page
document.body.appendChild(renderer.domElement);
// Add a button to enter/exit vr to the page
document.body.appendChild(VRButton.createButton(renderer));

// Use gun model hands
setupGunHands(renderer, scene);
setupProjectileShooting(renderer, scene);

// For AR instead, import ARButton at the top
//    import { ARButton } from 'https://unpkg.com/three/examples/jsm/webxr/ARButton.js';
// then create the button
//  document.body.appendChild(ARButton.createButton(renderer));

// Handle browser resize
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Projectile logic ---
// (All projectile logic is now handled in projectile.js)

function updateMuzzleFlashes(delta) {
    for (let i = 0; i < 2; i++) {
        const grip = renderer.xr.getControllerGrip(i);
        if (grip.children[0] && grip.children[0].userData.muzzleFlash) {
            grip.children[0].userData.muzzleFlash.update(delta);
        }
    }
}

let lastTime = 0;
function render(time) {
    const delta = (time - lastTime);
    lastTime = time;
    // Rotate the cube if it exists and not exploded
    const cube = getCurrentCube();
    if (cube && !cube.userData.exploded) {
        cube.rotation.y = time / 1000;
    }
    // Update projectiles (handled in projectile.js)
    updateProjectiles(scene);
    // Update explosion pieces (handled in explodeCube.js)
    updateExplosionPieces(scene, delta / 1000);

    // Update muzzle flashes for all controllers
    updateMuzzleFlashes(delta);

    // Draw everything
    renderer.render(scene, camera);
}

// Start the game (spawns first cube and sets up respawn logic)
startGame();
