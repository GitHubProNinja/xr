// Import three
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
// Import the default VRButton
import { VRButton } from "three/addons/webxr/VRButton.js";
import { setupVRControls } from './vrControls.js';

// Make a new scene
let scene = new THREE.Scene();
// Set background color of the scene to gray
scene.background = new THREE.Color(0x505050);

// Make a camera. note that far is set to 100, which is better for realworld sized environments
let camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 1.6, 3);

// Make a renderer that fills the screen
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
renderer.xr.enabled = true;
// Add canvas to the page
document.body.appendChild(renderer.domElement);
// Add a button to enter/exit vr to the page
document.body.appendChild(VRButton.createButton(renderer));

// Set up VR controls and camera holder (after renderer is initialized)
const vr = setupVRControls(renderer, scene, camera);
const cameraHolder = vr.cameraHolder;

// Add some lights
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// Make a red cube
let cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: "red" })
);
cube.position.set(0, 1.5, -10);
scene.add(cube);

// Set animation loop
renderer.setAnimationLoop(render);

// For AR instead, import ARButton at the top
//    import { ARButton } from 'https://unpkg.com/three/examples/jsm/webxr/ARButton.js';
// then create the button
//  document.body.appendChild(ARButton.createButton(renderer));

// --- VR controller movement logic ---
// We'll use the right controller (index 0 or 1, depending on device)
let rightController = renderer.xr.getController(0); // 0 is usually right, but may be left on some devices
scene.add(rightController);

// Optionally, add a visible model for the controller (not required for movement)
// import { XRControllerModelFactory } from 'https://unpkg.com/three/examples/jsm/webxr/XRControllerModelFactory.js';
// const controllerModelFactory = new XRControllerModelFactory();
// let rightControllerGrip = renderer.xr.getControllerGrip(0);
// rightControllerGrip.add(controllerModelFactory.createControllerModel(rightControllerGrip));
// scene.add(rightControllerGrip);

// Movement speed factor
const moveSpeed = 0.05;

// Handle browser resize
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(time) {
    // Update VR movement (controller stick)
    vr.updateVRMovement();
    // Rotate the cube
    cube.rotation.y = time / 1000;
    // Draw everything
    renderer.render(scene, camera);
}
