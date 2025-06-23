import * as THREE from 'three';
import { setCubeColor } from './cube.js';

// --- Pointer (Ray and Dot) Implementation ---

function generateRayTexture() {
    // Create a simple vertical gradient alpha texture for the ray
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, size);
    return canvas;
}

function generatePointerTexture() {
    // Create a circular white dot with soft edges
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2.5, 0, Math.PI * 2);
    ctx.closePath();
    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, size / 8,
        size / 2, size / 2, size / 2.5
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    return canvas;
}

function createPointerRay() {
    const geometry = new THREE.BoxGeometry(0.004, 0.004, 0.35);
    geometry.translate(0, 0, -0.15); // so it starts at controller tip
    const texture = new THREE.CanvasTexture(generateRayTexture());
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        alphaMap: texture,
        transparent: true,
        opacity: 1.0
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = Infinity;
    return mesh;
}

function createPointerDot() {
    const texture = new THREE.CanvasTexture(generatePointerTexture());
    const material = new THREE.SpriteMaterial({
        map: texture,
        sizeAttenuation: false,
        depthTest: false,
        transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.015, 0.015, 1);
    sprite.renderOrder = Infinity;
    sprite.visible = false;
    return sprite;
}

function setFromController(controller, ray) {
    const dummyMatrix = new THREE.Matrix4();
    dummyMatrix.identity().extractRotation(controller.matrixWorld);
    ray.origin.setFromMatrixPosition(controller.matrixWorld);
    ray.direction.set(0, 0, -1).applyMatrix4(dummyMatrix);
}

function setPointerAt(controller, point) {
    // Place the dot at the intersection point, in controller local space
    const localVec = controller.worldToLocal(point.clone());
    controller.pointerDot.position.copy(localVec);
    controller.pointerDot.visible = true;
}

function clearPointerDot(controller) {
    controller.pointerDot.visible = false;
}

function updateMenuHighlight({ rightController, menu, raycaster, intersectedRef }) {
    // Update raycaster from controller pose
    setFromController(rightController, raycaster.ray);
    // Hide dot by default
    clearPointerDot(rightController);
    // Raycast against menu
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
        setPointerAt(rightController, hit.point);
    } else {
        if (intersectedRef.current) {
            intersectedRef.current.material.color.set(intersectedRef.current.userData.dull);
            intersectedRef.current.scale.set(1, 1, 1);
        }
        intersectedRef.current = null;
    }
}

function onSelectStart({ intersectedRef, cube }) {
    if (intersectedRef.current && intersectedRef.current.userData.color) {
        setCubeColor(cube, intersectedRef.current.userData.color);
    }
}

export function setupControllers({ scene, leftController, rightController, menu, cube }) {
    const raycaster = new THREE.Raycaster();
    const intersectedRef = { current: null };

    // Attach menu to left controller (if not already attached)
    if (!leftController.children.includes(menu)) {
        leftController.add(menu);
        menu.position.set(0, 0.1, -0.15);
    }

    // --- Attach pointer ray and dot to right controller ---
    const pointerRay = createPointerRay();
    const pointerDot = createPointerDot();
    rightController.add(pointerRay);
    rightController.add(pointerDot);
    rightController.pointerRay = pointerRay;
    rightController.pointerDot = pointerDot;

    // Bind the highlight and selection logic
    const highlightParams = { rightController, menu, raycaster, intersectedRef };
    const highlightFn = () => updateMenuHighlight(highlightParams);
    rightController.addEventListener('selectstart', () => onSelectStart({ intersectedRef, cube }));

    return {
        leftController,
        rightController,
        pointerRay,
        pointerDot,
        updateMenuHighlight: highlightFn
    };
}
