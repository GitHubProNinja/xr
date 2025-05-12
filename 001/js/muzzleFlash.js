import * as THREE from 'three';

/**
 * Creates a sphere to represent the muzzle flash.
 * @returns {THREE.Mesh} The sphere mesh.
 */
export function createMuzzleFlash() {

    // Animation Variables
    const totalFrames = 5;
    const frameWidth = 1 / totalFrames;

    // Load Texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("./sprites/muzzleflash.png");
    texture.repeat.set(frameWidth, 1);

    // Create a sphere Geometry
    const sphereGeometry = new THREE.SphereGeometry(4, 10, 10); // Radius, Height, Radial Segments
    const sphereMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, // Ensure transparency if the texture has an alpha channel
        side: THREE.DoubleSide, // Render both sides of the sphere
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Set initial position and rotation
    sphere.position.set(0, 2, 9); // Adjusted position
    sphere.rotation.set(Math.PI / 20, Math.PI / 1.8, 0); // Adjusted rotation

    return sphere;
}
