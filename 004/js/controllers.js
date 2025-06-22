import * as THREE from 'three';
import { setCubeColor } from './cube.js';

function createReticle(scene) {
    const reticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    reticle.visible = false;
    scene.add(reticle);
    return reticle;
}

function createPointerLine(rightController) {
    // 1 meter long, semi-transparent, matches three-mesh-ui
    const pointerGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const pointerLine = new THREE.Line(
        pointerGeom,
        new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2, // Note: linewidth is ignored in most browsers
            transparent: true,
            opacity: 0.5
        })
    );
    pointerLine.frustumCulled = false;
    rightController.add(pointerLine);
    return pointerLine;
}

function updateMenuHighlight({ rightController, menu, reticle, tempMatrix, raycaster, intersectedRef, pointerLine }) {
    let reticleVisible = false;
    tempMatrix.identity().extractRotation(rightController.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(rightController.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const intersects = raycaster.intersectObjects(menu.children);
    if (intersects.length > 0) {
        const hit = intersects[0];
        if (intersectedRef.current !== hit.object) {
            if (intersectedRef.current) {
                intersectedRef.current.material.color.set(intersectedRef.current.userData.dull);
                intersectedRef.current.scale.set(1, 1, 1);
            }
            intersectedRef.current = hit.object;
            intersectedRef.current.material.color.set(intersectedRef.current.userData.neon);
            intersectedRef.current.scale.set(1.2, 1.2, 1.2);
        }
        reticle.position.copy(hit.point);
        reticle.visible = true;
        reticleVisible = true;
        // Set pointer line length to intersection distance
        if (pointerLine) pointerLine.scale.z = hit.distance;
    } else {
        if (intersectedRef.current) {
            intersectedRef.current.material.color.set(intersectedRef.current.userData.dull);
            intersectedRef.current.scale.set(1, 1, 1);
        }
        intersectedRef.current = null;
        reticle.visible = false;
        // Default pointer line length
        if (pointerLine) pointerLine.scale.z = 1;
    }
    if (!reticleVisible) reticle.visible = false;
}

function onSelectStart({ intersectedRef, cube }) {
    if (intersectedRef.current && intersectedRef.current.userData.color) {
        setCubeColor(cube, intersectedRef.current.userData.color);
    }
}

export function setupControllers({ scene, leftController, rightController, menu, cube }) {
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    const intersectedRef = { current: null };

    // Attach menu to left controller (if not already attached)
    if (!leftController.children.includes(menu)) {
        leftController.add(menu);
        menu.position.set(0, 0.1, -0.15);
    }

    const reticle = createReticle(scene);
    const pointerLine = createPointerLine(rightController);

    // Bind the highlight and selection logic
    const highlightParams = { rightController, menu, reticle, tempMatrix, raycaster, intersectedRef, pointerLine };
    const highlightFn = () => updateMenuHighlight(highlightParams);
    rightController.addEventListener('selectstart', () => onSelectStart({ intersectedRef, cube }));

    return {
        leftController,
        rightController,
        pointerLine,
        reticle,
        updateMenuHighlight: highlightFn
    };
}
