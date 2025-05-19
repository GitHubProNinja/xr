import * as THREE from 'three';

// Simple sound manager for loading and playing short sounds
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
const soundCache = {};

/**
 * Attach the AudioListener to the camera (call once after camera is created)
 * @param {THREE.Camera} camera 
 */
export function attachListener(camera) {
    if (!camera.children.includes(listener)) {
        camera.add(listener);
    }
}

/**
 * Preload a sound file and cache it
 * @param {string} url - Path to the sound file
 * @returns {Promise<THREE.AudioBuffer>}
 */
export function preloadSound(url) {
    return new Promise((resolve, reject) => {
        if (soundCache[url]) return resolve(soundCache[url]);
        audioLoader.load(url, buffer => {
            soundCache[url] = buffer;
            resolve(buffer);
        }, undefined, reject);
    });
}

/**
 * Play a sound at the listener (non-positional, for UI/gunshot etc)
 * @param {string} url - Path to the sound file
 * @param {number} [volume=1]
 */
export function playSound(url, volume = 1) {
    preloadSound(url).then(buffer => {
        const sound = new THREE.Audio(listener);
        sound.setBuffer(buffer);
        // Ensure volume is finite and in [0,1]
        let safeVolume = Number(volume);
        if (!isFinite(safeVolume) || isNaN(safeVolume)) safeVolume = 0.5;
        safeVolume = Math.max(0, Math.min(1, safeVolume));
        sound.setVolume(safeVolume);
        sound.play();
    });
}

/**
 * Play a positional sound at a given object (for zombie hit/dying etc)
 * @param {string} url - Path to the sound file
 * @param {THREE.Object3D} object - The object to attach the sound to
 * @param {number} [volume=1]
 */
export function playPositionalSound(url, object, volume = 1) {
    preloadSound(url).then(buffer => {
        const sound = new THREE.PositionalAudio(listener);
        sound.setBuffer(buffer);
        sound.setRefDistance(2);
        // Ensure volume is finite and in [0,1]
        let safeVolume = Number(volume);
        if (!isFinite(safeVolume) || isNaN(safeVolume)) safeVolume = 1;
        safeVolume = Math.max(0, Math.min(1, safeVolume));
        sound.setVolume(safeVolume);
        object.add(sound);
        sound.play();
        sound.onEnded = () => { object.remove(sound); };
    });
}
