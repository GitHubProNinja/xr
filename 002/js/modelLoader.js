import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/**
 * Loads a 3D model (FBX) and adds it to the scene.
 * @param {string} url - Path to the FBX file.
 * @param {THREE.Scene} scene - The Three.js scene to add the model to.
 * @param {function(THREE.Object3D):void} onLoaded - Callback with the loaded model.
 */
export function loadFBXModel(url, scene, onLoaded) {
    const loader = new FBXLoader();
    loader.load(url, (object) => {
        object.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(object);
        if (onLoaded) onLoaded(object);
    }, undefined, (error) => {
        console.error('Error loading FBX model:', error);
    });
}

/**
 * Loads and prepares the AJ model, including position, scale, and animation actions.
 * Returns an object with the model, actions, mixer, and a playAnimation function.
 * Keyboard controls and update logic should be handled elsewhere (e.g., in a controller module).
 * @param {THREE.Scene} scene - The Three.js scene to add the model to.
 * @returns {Promise<{model: THREE.Object3D, actions: Object, mixer: THREE.AnimationMixer, playAnimation: Function}>}
 */
export async function loadAJModelWithAnimations(scene) {
    const loader = new FBXLoader();
    const model = await loader.loadAsync('./assets/AJ/AJ.fbx');
    model.position.set(0, 0, 0);
    model.scale.set(0.01, 0.01, 0.01);
    model.rotation.y = Math.PI;
    scene.add(model);

    // Load all animations as an object keyed by name using await
    const animations = {
        Walking: await loader.loadAsync('./assets/AJ/Walking.fbx'),
        Idle: await loader.loadAsync('./assets/AJ/Idle.fbx'),
        Shooting: await loader.loadAsync('./assets/AJ/Shooting.fbx'),
    };
    const actions = {};
    let currentAnimation = null;
    const mixer = new THREE.AnimationMixer(model);
    Object.entries(animations).forEach(([name, anim]) => {
        actions[name] = mixer.clipAction(anim.animations[0]);
        if (name === 'Shooting') {
            actions[name].loop = THREE.LoopOnce;
            actions[name].clampWhenFinished = true;
        }
    });
    // Start with Idle animation by default
    currentAnimation = actions['Idle'];
    currentAnimation.reset().fadeIn(0.5).play();

    /**
     * Switches to the specified animation with fade in/out.
     * @param {string} name - Animation name to play.
     */
    function playAnimation(name, once = false) {
        const newAnimation = actions[name];
        if (newAnimation && newAnimation !== currentAnimation) {
            if (currentAnimation) currentAnimation.fadeOut(0.5);
            newAnimation.reset().fadeIn(0.2).play();
            currentAnimation = newAnimation;
        }
        // If playing shooting, force it to play from start
        if (name === 'Shooting') {
            newAnimation.reset().play();
        }
    }

    return { model, actions, mixer, playAnimation };
}
