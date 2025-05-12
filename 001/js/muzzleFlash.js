import * as THREE from 'three';

/**
 * Creates a sphere to represent the muzzle flash with animation capabilities.
 * @returns {object} An object containing the mesh, a play method, and an update method.
 */
export function createMuzzleFlash() {
    // Animation Variables
    const totalFrames = 5;
    const frameWidth = 1 / totalFrames;
    let currentFrame = 0;
    let isPlaying = false;
    let frameTimer = 0;
    const frameDuration = 60; // ms per frame

    // Load Texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("./sprites/muzzleflash.png");
    texture.repeat.set(frameWidth, 1);

    // Create a sphere Geometry
    const muzzleFlashGeometry = new THREE.SphereGeometry(4, 10, 10); // Radius, Height, Radial Segments
    const muzzleFlashMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, // Ensure transparency if the texture has an alpha channel
        side: THREE.DoubleSide, // Render both sides of the sphere
    });
    const muzzleFlashMesh = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial);

    // Set initial position and rotation
    muzzleFlashMesh.position.set(0, 2, 9); // Adjusted position
    muzzleFlashMesh.rotation.set(Math.PI / 20, Math.PI / 1.8, 0); // Adjusted rotation

    muzzleFlashMesh.visible = false; // Start invisible

    function play() {
        isPlaying = true;
        currentFrame = 0;
        frameTimer = 0;
        muzzleFlashMesh.visible = true;
        muzzleFlashMaterial.map.offset.x = 0;
    }

    // Call this in your main render loop, passing delta time in ms
    function update(delta) {
        if (!isPlaying) return;
        frameTimer += delta;
        if (frameTimer >= frameDuration) {
            frameTimer -= frameDuration;
            currentFrame++;
            if (currentFrame < totalFrames) {
                muzzleFlashMaterial.map.offset.x = currentFrame * frameWidth;
            } else {
                muzzleFlashMesh.visible = false;
                isPlaying = false;
            }
        }
    }

    return {
        mesh: muzzleFlashMesh,
        play,
        update
    };
}
