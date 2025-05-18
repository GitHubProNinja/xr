// animationHandler.js
// Handles all zombie animation logic and transitions
import * as THREE from 'three';

/**
 * Play the specified animation on the zombie, with optional cross-fade.
 * @param {THREE.AnimationMixer} mixer
 * @param {THREE.AnimationClip} fromClip
 * @param {THREE.AnimationClip} toClip
 * @param {number} fadeDuration
 */
export function crossFadeAnimation(mixer, fromClip, toClip, fadeDuration = 0.3) {
    const fromAction = mixer.clipAction(fromClip);
    const toAction = mixer.clipAction(toClip);
    toAction.reset();
    toAction.play();
    if (fromAction && fromAction.isRunning()) {
        fromAction.crossFadeTo(toAction, fadeDuration, false);
    } else {
        toAction.play();
    }
}

/**
 * Play a single animation (no cross-fade)
 * @param {THREE.AnimationMixer} mixer
 * @param {THREE.AnimationClip} clip
 */
export function playAnimation(mixer, clip) {
    const action = mixer.clipAction(clip);
    action.reset();
    action.play();
    return action;
}

/**
 * Stop all animations on the mixer
 * @param {THREE.AnimationMixer} mixer
 */
export function stopAllAnimations(mixer) {
    mixer.stopAllAction();
}
