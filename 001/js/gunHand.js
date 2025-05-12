// gunHand.js
// Loads the Rick Gun model and attaches it to both VR controller grips as the hand model
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createMuzzleFlash } from './muzzleFlash.js';

let gunModel = null;

/**
 * Loads the Rick Gun model asynchronously and returns the loaded scene.
 * @returns {Promise<THREE.Object3D>} The loaded gun model scene.
 */
async function loadGunModel() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./model/watergun/watergun-v1.glb');
    gltf.scene.scale.set(0.03, 0.03, 0.03); // Scale the model down to fit the hand
    return gltf.scene;
}

/**
 * Attaches the Rick Gun model to the given controller grip.
 * @param {THREE.Object3D} controllerGrip - The controller grip to attach the gun to.
 */
function attachGunToControllerGrip(controllerGrip) {
    if (!gunModel) return;
    while (controllerGrip.children.length > 0) {
        controllerGrip.remove(controllerGrip.children[0]);
    }
    const gun = gunModel.clone(true);
    // Adjust gun position/orientation for proper grip if needed
    gun.position.set(0, 0, 0);
    // gun.rotation.set(-Math.PI / 6, -Math.PI / 2, 0); // for Rick Gun: Tilt 30 degrees downward (X), -90 degrees Y to point forward
    gun.rotation.set(-Math.PI / 6, -Math.PI, 0); // For watergun: Tilt 30 degrees downward (X), 180 degrees Y to point forward

    // Create and attach the muzzle flash
    const muzzleFlash = createMuzzleFlash();
    gun.add(muzzleFlash.mesh);
    gun.userData.muzzleFlash = muzzleFlash;

    controllerGrip.add(gun);
    // Removed debugging logs related to the cone
}

/**
 * Sets up the Rick Gun model as the hand for both VR controller grips.
 * @param {THREE.WebGLRenderer} renderer - The Three.js renderer with XR enabled.
 * @param {THREE.Scene} scene - The Three.js scene.
 */
export async function setupGunHands(renderer, scene) {
    gunModel = await loadGunModel();
    const controllerGrip0 = renderer.xr.getControllerGrip(0);
    const controllerGrip1 = renderer.xr.getControllerGrip(1);

    controllerGrip0.addEventListener('connected', () => {
        attachGunToControllerGrip(controllerGrip0);
    });
    controllerGrip1.addEventListener('connected', () => {
        attachGunToControllerGrip(controllerGrip1);
    });
    scene.add(controllerGrip0);
    scene.add(controllerGrip1);
}
