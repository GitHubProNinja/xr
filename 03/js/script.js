import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { handleABButtonMovement } from './abButtonMovement.js';

let scene, renderer, camera, stats;
let dirLight, dirLightHelper;
let gridHelper, axesHelper;
let ground, ambientLight;
let cameraHolder;
let rightController;

init();

function init() {

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x001951);
    scene.background = new THREE.Color('navy');

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

    //NOTE: the camera's "near" parameter make a BIG difference if changed from 1 to 0.1
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    // camera.position.set(2, 4, 12);
    // scene.add(camera);
    // camera.add(pointLight);

    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enablePan = false;
    // controls.enableZoom = false;
    // controls.target.set(0, 1, 5);
    // controls.update();

    document.body.appendChild(VRButton.createButton(renderer));

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    cameraHolder = new THREE.Object3D();
    cameraHolder.position.z = 5;
    cameraHolder.position.y = 2;
    cameraHolder.add(camera);
    scene.add(cameraHolder);

    rightController = renderer.xr.getController(0);
    scene.add(rightController);

    createGUI();
    renderer.setAnimationLoop(animate);
}

function animate() {
    handleABButtonMovement(rightController, cameraHolder);
    renderer.render(scene, camera);
    stats.update();

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
    // dirLightFolder.close();

    const helpersFolder = gui.addFolder('Helpers');
    // helpersFolder.add(dirLightHelper, 'visible').name('directional light');
    // helpersFolder.add(hemLightHelper, 'visible').name('hemisphere light');

    helpersFolder.add(gridHelper, 'visible').name('grid');
    helpersFolder.add(axesHelper, 'visible').name('axes');
    helpersFolder.add(dirLightHelper, 'visible').name('Directional Light')
    // helpersFolder.close();
}