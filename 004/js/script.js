import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let scene, renderer, camera, stats;
let dirLight, dirLightHelper;
let gridHelper, axesHelper;
let ground, ambientLight, pointLight;
let cube;
let leftController, rightController;
let menu, raycaster = new THREE.Raycaster(), tempMatrix = new THREE.Matrix4();
let intersected = null;
let reticle = null;
const neonColors = [0x39ff14, 0xff073a, 0x00f0ff, 0xfffb00, 0xff00ea]; // neon green, red, blue, yellow, magenta

let pointerLine = null;

init();

function init() {

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x001951);
    scene.background = new THREE.Color('gray');

    ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    // pointLight = new THREE.PointLight(0xffffff, 100);

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
    camera.position.set(2, 4, 12);
    scene.add(camera);
    // camera.add(pointLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enablePan = false;
    // controls.enableZoom = false;
    // controls.target.set(0, 1, 5);
    // controls.update();

    document.body.appendChild(ARButton.createButton(renderer));

    stats = new Stats();
    document.body.appendChild(stats.dom);

    // Add a cube to interact with
    cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: neonColors[0] })
    );
    cube.position.set(0, 0.25, -1.5); // Place cube 1.5 meters in front of player
    scene.add(cube);

    // XR Controllers
    leftController = renderer.xr.getController(0);
    scene.add(leftController);
    rightController = renderer.xr.getController(1);
    scene.add(rightController);

    // Create and attach menu to left controller
    menu = createColorMenu();
    menu.position.set(0, 0.1, -0.15);
    leftController.add(menu);

    // Create reticle (small sphere) for menu intersection
    reticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffff00 })
    );
    reticle.visible = false;
    scene.add(reticle);

    // Create pointer line for right controller
    const pointerGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -0.25)
    ]);
    pointerLine = new THREE.Line(
        pointerGeom,
        new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 6 })
    );
    rightController.add(pointerLine);

    // Raycaster for right controller
    rightController.addEventListener('selectstart', onSelectStart);
    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(animate);
}

function animate() {
    let reticleVisible = false;
    // Raycast from right controller to menu
    if (rightController && menu) {
        tempMatrix.identity().extractRotation(rightController.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(rightController.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        const intersects = raycaster.intersectObjects(menu.children);
        if (intersects.length > 0) {
            const hit = intersects[0];
            if (intersected !== hit.object) {
                if (intersected) {
                    intersected.material.emissiveIntensity = 1;
                    intersected.scale.set(1, 1, 1);
                }
                intersected = hit.object;
                intersected.material.emissiveIntensity = 3;
                intersected.scale.set(1.2, 1.2, 1.2);
            }
            // Show reticle at intersection point
            reticle.position.copy(hit.point);
            reticle.visible = true;
            reticleVisible = true;
        } else {
            if (intersected) {
                intersected.material.emissiveIntensity = 1;
                intersected.scale.set(1, 1, 1);
            }
            intersected = null;
            reticle.visible = false;
        }
    }
    if (!reticleVisible) reticle.visible = false;
    renderer.render(scene, camera);
    if (stats) stats.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createColorMenu() {
    const group = new THREE.Group();
    for (let i = 0; i < neonColors.length; i++) {
        const btn = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.02),
            new THREE.MeshStandardMaterial({ color: neonColors[i], emissive: neonColors[i], emissiveIntensity: 1 })
        );
        btn.position.set(0, 0.18 - i * 0.09, 0);
        btn.userData = { color: neonColors[i] };
        group.add(btn);
    }
    return group;
}

function onSelectStart() {
    if (intersected && intersected.userData.color) {
        cube.material.color.set(intersected.userData.color);
        cube.material.emissive.set(intersected.userData.color);
    }
}

function createGUI() {
    const params = {
        // 'backgroundColor': scene.background.getHex()
        //     'autoRotate': false,
        //     'rotationSpeedY': 0.005
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
    // gui.addColor(params, 'backgroundColor').onChange((value) => {
    //     scene.background.set(value);
    // });

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


    // ambientLightsFolder.add(pointLight, 'intensity', 0, 100, 1).name('Point Light Intensity')

    const helpersFolder = gui.addFolder('Helpers');
    // helpersFolder.add(dirLightHelper, 'visible').name('directional light');
    // helpersFolder.add(hemLightHelper, 'visible').name('hemisphere light');

    helpersFolder.add(gridHelper, 'visible').name('grid');
    helpersFolder.add(axesHelper, 'visible').name('axes');
    helpersFolder.add(dirLightHelper, 'visible').name('Directional Light')
    // helpersFolder.close();

    // const scaleFolder = gui.addFolder('Scale');
    // scaleFolder.add(model.scale, 'x', -5, 5, 0.1);
    // scaleFolder.add(model.scale, 'y', -5, 5, 0.1);
    // scaleFolder.add(model.scale, 'z', -5, 5, 0.1);

    // const positionFolder = gui.addFolder('Position');
    // positionFolder.add(camera.position, 'x', -10, 10, 0.1).name('Position X');
    // positionFolder.add(camera.position, 'y', -10, 10, 0.1).name('Position Y');
    // positionFolder.add(camera.position, 'z', -10, 10, 0.1).name('Position Z');

    // const rotationFolder = gui.addFolder('Rotation');
    // rotationFolder.add(model.rotation, 'x', -Math.PI, Math.PI, 0.1).name('Rotate X');
    // rotationFolder.add(model.rotation, 'y', -Math.PI, Math.PI, 0.1).name('Rotate Y');
    // rotationFolder.add(model.rotation, 'z', -Math.PI, Math.PI, 0.1).name('Rotate Z');

    // gui.add(params, 'autoRotate');
    // gui.add(params, 'rotationSpeedY', 0.001, 0.1, 0.001);
}