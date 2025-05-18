import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { spawnProjectile, updateProjectiles, getActiveProjectiles } from './projectiles.js';
import { spawnZombie, updateZombies, checkZombieHits } from './zombies.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

let scene, renderer, camera, stats;
let dirLight;
let ambientLight;
let zombiesSpawned = false;

let controller1, controller2, controllerGrip1, controllerGrip2;

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
    renderer.xr.enabled = true; // Enable WebXR
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 4);
    camera.lookAt(new THREE.Vector3(0, 1.2, 0));
    scene.add(camera);

    const controls = new OrbitControls(camera, renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    createGUI();

    // Spawn zombies at random positions in front of the camera
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

    // VR Controllers
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    // VR controller shooting
    function onSelectStart() {
        spawnProjectile(scene, this);
    }
    controller1.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectstart', onSelectStart);

    // Spacebar shooting for desktop fallback (optional)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            spawnProjectile(scene, camera);
        }
    });

    renderer.setAnimationLoop(animate);
}

function animate() {
    const delta = renderer.clock ? renderer.clock.getDelta() : (1 / 60);
    // --- Move projectiles ---
    updateProjectiles(scene, camera);
    // --- Zombie logic ---
    updateZombies(camera.position, delta);
    checkZombieHits(scene, getActiveProjectiles);
    renderer.render(scene, camera);
    stats.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createGUI() {
    const gui = new GUI();
    window._ajGui = gui;

    gui.addColor(scene, 'background');

    gui.add(ambientLight, 'intensity', 0, 5, 0.1).name('Ambient Light Intensity');

    const dirLightFolder = gui.addFolder('Directional Light');
    dirLightFolder.add(dirLight, 'intensity', 0, 10, 0.1);
    dirLightFolder.add(dirLight.position, 'x', -5, 5, 0.1).name('position x')
    dirLightFolder.add(dirLight.position, 'y', 0, 3, 0.1).name('position y')
    dirLightFolder.add(dirLight.position, 'z', -5, 5, 0.1).name('position z')
}

/**
 * Spawns a projectile in front of the model, moving in the direction the model is facing.
 * @param {THREE.Object3D} model
 */