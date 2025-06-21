import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GamepadWrapper, XR_BUTTONS } from './gamepad-wrapper.module.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import gsap from 'https://esm.sh/gsap@3.12.5';

// --- Audio ---
let listener, laserSound, scoreSound;

function loadSounds(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const audioLoader = new THREE.AudioLoader();
    // Laser sound attached to blaster
    laserSound = new THREE.PositionalAudio(listener);
    audioLoader.load('assets/laser.ogg', (buffer) => {
        laserSound.setBuffer(buffer);
        laserSound.setVolume(0.5);
        blasterGroup.add(laserSound);
    });
    // Score sound attached to scoreboard
    scoreSound = new THREE.PositionalAudio(listener);
    audioLoader.load('assets/score.ogg', (buffer) => {
        scoreSound.setBuffer(buffer);
        scoreSound.setVolume(0.5);
        if (scoreMesh) scoreMesh.add(scoreSound);
    });
}

let scene, renderer, camera, stats;
let dirLight, dirLightHelper;
let gridHelper, axesHelper;
let ground, ambientLight, pointLight;

let controllers = {};
let bulletPrototype;

const blasterGroup = new THREE.Group();
const targets = [];

// --- Tutorial Chapter 3: Bullet animation constants and state ---
const forwardVector = new THREE.Vector3(0, 0, -1);
const bulletSpeed = 5;
const bulletTimeToLive = 4; // 5 units/sec * 4 sec = 20 units
const bullets = {};

// --- Scoreboard using canvas texture ---
let score = 0;
let scoreCanvas, scoreContext, scoreTexture, scoreMesh;

init();

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color('yellow');

    ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(2, 2, 1);
    scene.add(dirLight);

    dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 0.5);
    scene.add(dirLightHelper);

    ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial({ color: 0x505050 }));
    ground.rotation.x = - Math.PI / 2;
    ground.visible = false;
    scene.add(ground);

    gridHelper = new THREE.GridHelper(10, 10, new THREE.Color('#ffff00'), new THREE.Color('#ffff00'));
    scene.add(gridHelper);

    axesHelper = new THREE.AxesHelper(6);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Add both VR and AR buttons to the page
    const vrBtn = VRButton.createButton(renderer);
    const arBtn = ARButton.createButton(renderer);
    vrBtn.style.position = 'fixed';
    vrBtn.style.left = '20px';
    vrBtn.style.bottom = '20px';
    vrBtn.style.zIndex = '10';
    arBtn.style.position = 'fixed';
    arBtn.style.left = '20px';
    arBtn.style.bottom = '70px';
    arBtn.style.zIndex = '10';
    document.body.appendChild(vrBtn);
    document.body.appendChild(arBtn);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(2, 4, 12);
    scene.add(camera);

    loadSounds(camera);

    const controls = new OrbitControls(camera, renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    createGUI();
    createScoreboard();
    renderer.setAnimationLoop(animate);

    // --- Chapter 4: Load GLTF models ---
    const gltfLoader = new GLTFLoader();
    // Load the space station environment
    gltfLoader.load('assets/spacestation.glb', (gltf) => {
        scene.add(gltf.scene);
    });
    // Load the blaster model
    gltfLoader.load('assets/blaster.glb', (gltf) => {
        blasterGroup.add(gltf.scene);
    });
    // Load and clone the target models
    gltfLoader.load('assets/target.glb', (gltf) => {
        for (let i = 0; i < 3; i++) {
            const target = gltf.scene.clone();
            target.position.set(
                Math.random() * 10 - 5,
                i * 2 + 1,
                -Math.random() * 5 - 5,
            );
            scene.add(target);
            targets.push(target);
        }
    });

    // --- XR Controllers Setup ---
    function setupXRControllers(renderer, scene) {
        // Set up right controller ray (should be index 1 for right hand)
        const rightRay = renderer.xr.getController(1);
        scene.add(rightRay);
        // Set up right controller grip (for model)
        const controllerModelFactory = new XRControllerModelFactory();
        const rightGrip = renderer.xr.getControllerGrip(1);
        rightGrip.add(controllerModelFactory.createControllerModel(rightGrip));
        scene.add(rightGrip);
        controllers.right = {
            raySpace: rightRay,
            gripSpace: rightGrip,
            inputSource: null,
            gamepad: null
        };
        // Listen for controller connection to get inputSource and gamepad
        rightRay.addEventListener('connected', (event) => {
            controllers.right.inputSource = event.data;
            if (event.data && event.data.gamepad) {
                gamepadWrapper = new GamepadWrapper(event.data.gamepad);
            }
        });
        rightRay.addEventListener('disconnected', () => {
            controllers.right.inputSource = null;
            controllers.right.gamepad = null;
            gamepadWrapper = null;
        });
    }

    setupXRControllers(renderer, scene);

    // --- AR-only scene shift for comfortable content height ---
    renderer.xr.addEventListener('sessionstart', (event) => {
        const session = renderer.xr.getSession();
        if (session && session.mode === 'immersive-ar') {
            scene.position.y = -1.5; // Shift scene down in AR only
        }
    });
    renderer.xr.addEventListener('sessionend', (event) => {
        scene.position.y = 0; // Reset scene position for all modes
    });
}

let gamepadWrapper = null;
let lastTime = null;

function animate(time, xrFrame) {
    renderer.render(scene, camera);
    stats.update();
    // Calculate delta time in seconds
    let delta = 0.016;
    if (lastTime !== null) {
        delta = (time - lastTime) / 1000;
    }
    lastTime = time;
    onFrame(
        delta,
        time,
        { scene, camera, renderer, player: null, controllers }
    );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createGUI() {
    const params = {
        colorSpace: THREE.LinearSRGBColorSpace
    };

    const colorSpace = {
        "none": THREE.NoColorSpace,
        "srgb": THREE.SRGBColorSpace,
        "srgb-linear": THREE.LinearSRGBColorSpace
    }

    const gui = new GUI();

    gui.addColor(scene, 'background');
    gui.add(ground, 'visible').name('Ground');
    gui.add(ambientLight, 'intensity', 0, 5, 0.1).name('Ambient Light Intensity');

    const dirLightFolder = gui.addFolder('Directional Light');
    dirLightFolder.add(dirLight, 'intensity', 0, 10, 0.1);
    dirLightFolder.add(dirLight.position, 'x', -5, 5, 0.1).name('position x').onChange(() => {
        dirLightHelper.update();
    });
    dirLightFolder.add(dirLight.position, 'y', 0, 3, 0.1).name('position y').onChange(() => {
        dirLightHelper.update();
    });
    dirLightFolder.add(dirLight.position, 'z', -5, 5, 0.1).name('position z').onChange(() => {
        dirLightHelper.update();
    });
    const helpersFolder = gui.addFolder('Helpers');
    helpersFolder.add(gridHelper, 'visible').name('grid');
    helpersFolder.add(axesHelper, 'visible').name('axes');
    helpersFolder.add(dirLightHelper, 'visible').name('Directional Light')
}

function createScoreboard() {
    scoreCanvas = document.createElement('canvas');
    scoreCanvas.width = 256;
    scoreCanvas.height = 64;
    scoreContext = scoreCanvas.getContext('2d');
    scoreTexture = new THREE.Texture(scoreCanvas);
    scoreTexture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: scoreTexture, transparent: true });
    const geometry = new THREE.PlaneGeometry(1.5, 0.375); // Aspect ratio matches canvas
    scoreMesh = new THREE.Mesh(geometry, material);
    scoreMesh.position.set(0, 0.67, -1.44);
    scoreMesh.rotation.x = -Math.PI / 3.3;
    scene.add(scoreMesh);
    updateScoreDisplay();
    // Attach scoreSound if already loaded
    if (scoreSound && !scoreMesh.children.includes(scoreSound)) {
        scoreMesh.add(scoreSound);
    }
}

function updateScoreDisplay() {
    scoreContext.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    scoreContext.font = 'bold 48px Arial';
    scoreContext.textAlign = 'center';
    scoreContext.textBaseline = 'middle';
    scoreContext.fillStyle = '#ffa276';
    const clampedScore = Math.max(0, Math.min(9999, score));
    const displayScore = clampedScore.toString().padStart(4, '0');
    scoreContext.fillText(displayScore, scoreCanvas.width / 2, scoreCanvas.height / 2);
    scoreTexture.needsUpdate = true;
}

function onFrame(
    delta,
    time,
    { scene, camera, renderer, player, controllers },
) {
    // Update gamepad state before checking input
    if (gamepadWrapper) {
        gamepadWrapper.update();
    }
    if (controllers && controllers.right && gamepadWrapper && controllers.right.inputSource) {
        const { raySpace, gripSpace, inputSource } = controllers.right;
        // Attach the blaster to the right controller
        if (!raySpace.children.includes(blasterGroup)) {
            raySpace.add(blasterGroup);
            if (controllers.right.gripSpace && controllers.right.gripSpace.children.length > 0) {
                controllers.right.gripSpace.children[0].visible = false; // Hide the default controller model
            }
        }
        // Firing bullets
        if (gamepadWrapper.getButtonClick(XR_BUTTONS.TRIGGER)) {
            const bulletPrototype = blasterGroup.getObjectByName('bullet');
            if (bulletPrototype) {
                const bullet = bulletPrototype.clone();
                scene.add(bullet);
                bulletPrototype.getWorldPosition(bullet.position);
                bulletPrototype.getWorldQuaternion(bullet.quaternion);
                const directionVector = forwardVector.clone().applyQuaternion(bullet.quaternion);
                bullet.userData = {
                    velocity: directionVector.multiplyScalar(bulletSpeed),
                    timeToLive: bulletTimeToLive,
                };
                bullets[bullet.uuid] = bullet;
                // Play laser sound (stop if already playing)
                if (laserSound && laserSound.buffer) {
                    if (laserSound.isPlaying) laserSound.stop();
                    laserSound.play();
                }
                // Haptic feedback on fire
                try {
                    const gamepad = inputSource && inputSource.gamepad;
                    if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators[0]) {
                        gamepad.hapticActuators[0].pulse(0.6, 100);
                    } else if (gamepad && gamepad.getHapticActuator) {
                        gamepad.getHapticActuator(0).pulse(0.6, 100);
                    }
                } catch { }
            }
        }
    }
    // Update and remove bullets
    Object.values(bullets).forEach((bullet) => {
        if (bullet.userData.timeToLive < 0) {
            delete bullets[bullet.uuid];
            scene.remove(bullet);
            return;
        }
        const deltaVec = bullet.userData.velocity.clone().multiplyScalar(delta);
        bullet.position.add(deltaVec);
        bullet.userData.timeToLive -= delta;
        // Proximity-based hit detection for targets
        targets
            .filter((target) => target.visible)
            .forEach((target, idx) => {
                const distance = target.position.distanceTo(bullet.position);
                if (distance < 1) {
                    delete bullets[bullet.uuid];
                    scene.remove(bullet);
                    // Animate target scaling down, hide, respawn, and scale up
                    gsap.to(target.scale, {
                        duration: 0.3,
                        x: 0,
                        y: 0,
                        z: 0,
                        onComplete: () => {
                            target.visible = false;
                            setTimeout(() => {
                                target.visible = true;
                                target.position.x = Math.random() * 10 - 5;
                                target.position.z = -Math.random() * 5 - 5;
                                gsap.to(target.scale, {
                                    duration: 0.3,
                                    x: 1,
                                    y: 1,
                                    z: 1,
                                });
                            }, 1000);
                        },
                    });
                    score += 10;
                    updateScoreDisplay();
                    // Play score sound (stop if already playing)
                    if (scoreSound && scoreSound.buffer) {
                        if (scoreSound.isPlaying) scoreSound.stop();
                        scoreSound.play();
                    }
                }
            });
    });
    // --- GSAP ticker for animation sync ---
    gsap.ticker.tick(delta);
}