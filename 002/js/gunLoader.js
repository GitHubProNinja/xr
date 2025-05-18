import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let gunModel = null;

/**
 * Loads and returns the gun model (gun.glb) from the assets folder.
 * Caches the model after first load.
 * The returned model is pre-rotated and offset for VR controller grip.
 * @returns {Promise<THREE.Object3D>} The loaded and oriented gun model.
 */
export async function loadGunModel() {
    if (gunModel) return gunModel;
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./assets/gun.glb');
    gunModel = gltf.scene;
    gunModel.scale.set(0.4, 0.4, 0.4);
    // Fix orientation: rotate so gun points forward in controller
    gunModel.rotation.set(0, Math.PI, 0, 'XYZ');
    // Move the gun a little bit forward in the hand (increase z offset)
    gunModel.position.set(0, -0.03, 0.09); // was 0.05, now 0.07
    return gunModel;
}
