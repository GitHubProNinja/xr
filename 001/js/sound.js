// sound.js
// Handles loading and playing of game sounds (gun and explosion)
import * as THREE from 'three';

let listener = null;
let gunSound = null;
let explosionSoundBuffer = { buffer: null };
let scene = null;

export function initSound(_camera, _scene) {
    scene = _scene;
    listener = new THREE.AudioListener();
    _camera.add(listener);

    const audioLoader = new THREE.AudioLoader();

    // Gun sound
    gunSound = new THREE.Audio(listener);
    audioLoader.load('sounds/gun.wav', (buffer) => {
        gunSound.setBuffer(buffer);
        gunSound.setVolume(0.5);
    });

    // Explosion sound
    audioLoader.load('sounds/explosion.mp3', (buffer) => {
        explosionSoundBuffer.buffer = buffer;
    });
}

export function playGunSound() {
    if (!gunSound) return;
    if (gunSound.isPlaying) gunSound.stop();
    gunSound.play();
}

export function playExplosionSound(position) {
    if (!explosionSoundBuffer.buffer || !listener || !scene) return;
    const sound = new THREE.PositionalAudio(listener);
    sound.setBuffer(explosionSoundBuffer.buffer);
    sound.setRefDistance(5);
    sound.setVolume(1.0);
    sound.position.copy(position);
    scene.add(sound);
    sound.play();
    sound.source.onended = () => {
        scene.remove(sound);
        sound.disconnect();
    };
}
