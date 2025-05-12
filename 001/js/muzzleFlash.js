import * as THREE from 'three';

/**
 * Creates a cone to represent the muzzle flash.
 * @returns {THREE.Mesh} The cone mesh.
 */
export function createMuzzleFlash() {
    // Create a cone geometry
    const coneGeometry = new THREE.ConeGeometry(3, 5, 32); // Adjusted size
    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }); // Red wireframe material
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);

    // Set initial position and rotation
    cone.position.set(0, 2, 7); // Adjusted position
    cone.rotation.set(-Math.PI / 2, 0, 0); // Adjusted rotation

    return cone;
}
