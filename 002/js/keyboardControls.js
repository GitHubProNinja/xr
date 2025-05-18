import * as THREE from 'three';
/**
 * Sets up keyboard controls for moving a 3D model.
 * @param {THREE.Object3D} model - The model to move.
 * @param {number} speed - Movement speed.
 */
export function setupKeyboardControls(model, speed = 0.1) {
    // Movement intent state: -1, 0, or 1 for each axis
    const movement = { forward: 0, right: 0 };

    function onKeyDown(e) {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                movement.forward = 1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                movement.forward = -1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                movement.right = -1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                movement.right = 1;
                break;
        }
    }
    function onKeyUp(e) {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'ArrowDown':
            case 'KeyS':
                movement.forward = 0;
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'ArrowRight':
            case 'KeyD':
                movement.right = 0;
                break;
        }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function update() {
        if (!model) return;
        // Normalize diagonal movement
        let moveX = movement.right;
        let moveZ = -movement.forward; // negative because forward is -Z in Three.js
        if (moveX !== 0 && moveZ !== 0) {
            const norm = Math.sqrt(2) / 2;
            moveX *= norm;
            moveZ *= norm;
        }

        // --- Move in the direction the model is facing ---
        // Calculate local forward and right directions
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(model.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(model.quaternion);
        // Only move horizontally (ignore y)
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();
        // Move along local axes
        model.position.add(forward.clone().multiplyScalar(moveZ * speed));
        model.position.add(right.clone().multiplyScalar(moveX * speed));

        // Continuous rotation when holding left/right
        const ROTATE_SPEED = 0.05; // radians per frame, adjust as needed
        if (movement.right === 1) {
            model.rotation.y -= ROTATE_SPEED; // turn right
        } else if (movement.right === -1) {
            model.rotation.y += ROTATE_SPEED; // turn left
        }
    }
    function setSpeed(newSpeed) {
        speed = newSpeed;
    }
    function getDirection() {
        return movement.forward;
    }
    function getRight() {
        return movement.right;
    }
    return { update, setSpeed, getDirection, getRight };
}
