import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { spawnProjectile, updateProjectiles, getActiveProjectiles } from './projectiles.js';
import { spawnZombie, updateZombies, checkZombieHits, setDebugCylindersVisible } from './zombies.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { loadGunModel } from './gunLoader.js';

let scene, renderer, camera;
let dirLight;
let ambientLight;
let params = { speed: 0.015 };
let zombiesSpawned = false;

init();

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('navy');

    ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(2, 2, 1);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Enable WebXR for VR
    document.body.appendChild(renderer.domElement);

    // Add VRButton to enable entering VR
    import('three/addons/webxr/VRButton.js').then(({ VRButton }) => {
        document.body.appendChild(VRButton.createButton(renderer));
    });

    // Use a VR-compatible camera (THREE.PerspectiveCamera is already VR-compatible)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 4);
    camera.lookAt(new THREE.Vector3(0, 1.2, 0));
    scene.add(camera); // Add camera to scene for VR sound compatibility

    // Attach AudioListener to camera at startup (no XR session event needed)
    import('./sound.js').then(({ attachListener }) => {
        attachListener(camera);
    });

    window.addEventListener('resize', onWindowResize);

    createGUI();

    // Spawn zombies only once
    if (!zombiesSpawned) {
        const { getRandomZombieSpawnPosition } = await import('./zombies.js');
        for (let i = 0; i < 2; i++) {
            await spawnZombie('Mutant', scene, getRandomZombieSpawnPosition(camera));
        }
        for (let i = 0; i < 5; i++) {
            await spawnZombie('Yaku', scene, getRandomZombieSpawnPosition(camera));
        }
        for (let i = 0; i < 3; i++) {
            await spawnZombie('Parasite', scene, getRandomZombieSpawnPosition(camera));
        }
        zombiesSpawned = true;
    }

    // --- VR Controller Support with Gun Model ---
    const controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', () => {
        // Shoot projectile from controller1 position/direction
        spawnProjectile(scene, controller1);
    });
    scene.add(controller1);

    const controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', () => {
        // Shoot projectile from controller2 position/direction
        spawnProjectile(scene, controller2);
    });
    scene.add(controller2);

    // Attach gun model to each controller grip
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    const gun1 = await loadGunModel();
    const gun2 = await loadGunModel();
    controllerGrip1.add(gun1.clone());
    controllerGrip2.add(gun2.clone());
    scene.add(controllerGrip1);
    scene.add(controllerGrip2);

    renderer.setAnimationLoop(animate);
}

function animate() {
    // --- Move projectiles (if any logic remains) ---
    updateProjectiles(scene, camera); // Use camera as fallback for player position
    // --- Zombie logic ---
    updateZombies(camera.position, 1 / 60); // Use camera as player position
    checkZombieHits(scene, getActiveProjectiles);
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createGUI() {
    const gui = new GUI();
    window._ajGui = gui;

    gui.add(ambientLight, 'intensity', 0, 5, 0.1).name('Ambient Light Intensity');

    const dirLightFolder = gui.addFolder('Directional Light');
    dirLightFolder.add(dirLight, 'intensity', 0, 10, 0.1);
    dirLightFolder.add(dirLight.position, 'x', -5, 5, 0.1).name('position x')
    dirLightFolder.add(dirLight.position, 'y', 0, 3, 0.1).name('position y')
    dirLightFolder.add(dirLight.position, 'z', -5, 5, 0.1).name('position z')

    // Add speed slider
    gui.add(params, 'speed', 0.001, 0.1, 0.001).name('Move Speed');

    // Add checkbox for debug cylinder visibility
    const debugObj = { showDebugCylinders: false };
    gui.add(debugObj, 'showDebugCylinders')
        .name('Show Debug Cylinders')
        .onChange(setDebugCylindersVisible);
}