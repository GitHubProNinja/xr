import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { loadAJModelWithAnimations } from './modelLoader.js';
import { setupKeyboardControls } from './keyboardControls.js';
import { spawnProjectile, updateProjectiles, getActiveProjectiles } from './projectiles.js';
import { spawnZombie, updateZombies, checkZombieHits, setDebugCylindersVisible } from './zombies.js';

let scene, renderer, camera, stats;
let dirLight;
let ambientLight;
let ajModel = null;
let keyboardController = null;
let params = { speed: 0.015 };
let animationUpdate = null;
let animationParams = { walkSpeed: 1, shootingSpeed: 1 };
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
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 4); // Start behind the model, looking forward (Z negative)
    camera.lookAt(new THREE.Vector3(0, 1.2, 0)); // Look at model's head
    scene.add(camera);

    const controls = new OrbitControls(camera, renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    createGUI();

    // Load AJ model
    loadAJModelWithAnimations(scene).then(async ({ model, actions, mixer, playAnimation }) => {
        ajModel = model;
        ajModel.userData.actions = actions;
        // Make AJ model invisible (step 1 for dying animation logic)
        ajModel.visible = false;
        keyboardController = setupKeyboardControls(model, params.speed);

        // --- Spacebar shooting animation trigger and projectile spawn ---
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                playAnimation('Shooting');
                if (ajModel) {
                    spawnProjectile(scene, ajModel);
                }
            }
        });

        // Set initial shooting animation speed
        if (actions['Shooting']) actions['Shooting'].timeScale = animationParams.shootingSpeed;

        animationUpdate = (delta) => {
            // Animation switching based on movement
            const moving = keyboardController && keyboardController.getDirection ? keyboardController.getDirection() : 0;
            const moveX = keyboardController && keyboardController.getRight ? keyboardController.getRight() : 0;
            const isMoving = (moving !== 0 || moveX !== 0);
            // Remove shooting check: always allow animation switching
            if (isMoving) {
                playAnimation('Walking');
                // Optionally adjust timeScale for backward/reverse
                let walkDir = 1;
                if (moving < 0) walkDir = -1;
                const mag = Math.sqrt(moving * moving + moveX * moveX) || 1;
                actions['Walking'].timeScale = walkDir * mag * animationParams.walkSpeed;
            } else {
                playAnimation('Idle');
            }
            mixer.update(delta);
        };

        // Add model visibility checkbox after model is loaded
        if (window._ajGui) {
            window._ajGui.add(ajModel, 'visible').name('Model Visible');
        }
        // Spawn zombies only once after AJ is loaded
        if (!zombiesSpawned) {
            // Use random spawn positions in front of the player
            const { getRandomZombieSpawnPosition } = await import('./zombies.js');
            for (let i = 0; i < 2; i++) {
                await spawnZombie('Mutant', scene, getRandomZombieSpawnPosition(ajModel));
            }
            // Spawn 3 Yaku zombies at random positions
            for (let i = 0; i < 5; i++) {
                await spawnZombie('Yaku', scene, getRandomZombieSpawnPosition(ajModel));
            }
            // Spawn 2 Parasite zombies at random positions
            for (let i = 0; i < 3; i++) {
                await spawnZombie('Parasite', scene, getRandomZombieSpawnPosition(ajModel));
            }
            zombiesSpawned = true;
        }
    });

    animate();
}

function animate() {
    const delta = renderer.clock ? renderer.clock.getDelta() : (1 / 60);
    if (keyboardController && ajModel) keyboardController.update();
    if (animationUpdate) animationUpdate(delta);

    // --- 3rd person camera follow logic ---
    if (ajModel) {
        const cameraHeight = 2;
        const cameraDistance = 4;
        const playerPos = new THREE.Vector3();
        ajModel.getWorldPosition(playerPos);

        // Get the model's world forward direction
        const forward = new THREE.Vector3();
        ajModel.getWorldDirection(forward);

        // Place camera behind the model (opposite to forward)
        const desiredCamPos = playerPos.clone()
            .add(new THREE.Vector3(0, cameraHeight, 0))
            .add(forward.clone().multiplyScalar(-cameraDistance));

        camera.position.lerp(desiredCamPos, 0.1);

        // Look at the player's head (slightly above for better view)
        const lookAtPos = playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
        camera.lookAt(lookAtPos);
    }

    // --- Move projectiles ---
    if (ajModel) updateProjectiles(scene, ajModel);
    // --- Zombie logic ---
    if (ajModel) {
        updateZombies(ajModel.position, delta);
        checkZombieHits(scene, getActiveProjectiles);
    }
    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
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

    // Add speed slider
    gui.add(params, 'speed', 0.001, 0.1, 0.001).name('Move Speed').onChange((value) => {
        if (keyboardController) keyboardController.setSpeed(value);
    });

    // Add animation speed slider
    gui.add(animationParams, 'walkSpeed', 0.1, 2, 0.01).name('Walk Anim Speed').onChange((value) => {
        if (animationUpdate && animationUpdate.setWalkSpeed) animationUpdate.setWalkSpeed(value);
    });
    // Add shooting animation speed slider
    gui.add(animationParams, 'shootingSpeed', 0.1, 4, 0.01).name('Shooting Anim Speed').onChange((value) => {
        // If actions is available, update shooting animation speed
        if (ajModel && ajModel.userData && ajModel.userData.actions && ajModel.userData.actions['Shooting']) {
            ajModel.userData.actions['Shooting'].timeScale = value;
        }
    });

    // Add checkbox for debug cylinder visibility
    const debugObj = { showDebugCylinders: true };
    gui.add(debugObj, 'showDebugCylinders')
        .name('Show Debug Cylinders')
        .onChange(setDebugCylindersVisible);
}

/**
 * Spawns a projectile in front of the model, moving in the direction the model is facing.
 * @param {THREE.Object3D} model
 */