import * as THREE from 'three';

/**
 * Creates a sphere to represent the muzzle flash.
 * @returns {THREE.Mesh} The sphere mesh.
 */
export function createMuzzleFlash() {
    // Create a sphere geometry
    const sphereGeometry = new THREE.SphereGeometry(4, 10, 10); // Adjusted size
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }); // Red wireframe material
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Set initial position and rotation
    sphere.position.set(0, 2, 9); // Adjusted position
    sphere.rotation.set(-Math.PI / 2, 0, 0); // Adjusted rotation

    return sphere;
}
