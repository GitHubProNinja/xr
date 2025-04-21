// vrControls.js
// Module for handling WebXR VR controller movement in Three.js
// This module sets up a camera holder, controller detection, and stick-based movement for VR
//
// Usage:
//   import { setupVRControls } from './vrControls.js';
//   const cameraHolder = setupVRControls(renderer, scene, camera);
//   // Use cameraHolder in your render loop

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

export function setupVRControls(renderer, scene, camera) {
    // Make a camera holder (group) for VR movement
    const cameraHolder = new THREE.Group();
    cameraHolder.position.copy(camera.position);
    cameraHolder.add(camera);
    scene.add(cameraHolder);

    // Add a button to enter/exit VR to the page (moved from main.js)
    document.body.appendChild(VRButton.createButton(renderer));

    // Optionally, add a visible model for the controller (not required for movement)
    // import { XRControllerModelFactory } from 'https://unpkg.com/three/examples/jsm/webxr/XRControllerModelFactory.js';
    // const controllerModelFactory = new XRControllerModelFactory();
    // let rightControllerGrip = renderer.xr.getControllerGrip(0);
    // rightControllerGrip.add(controllerModelFactory.createControllerModel(rightControllerGrip));
    // scene.add(rightControllerGrip);

    // --- VR controller movement logic ---
    // We'll use the right controller (index 0 or 1, depending on device)
    let rightController = renderer.xr.getController(1); // 0 is usually right, but may be left on some devices
    scene.add(rightController);
    let rightGamepad = null;
    // Moved event listeners for 'connected' and 'disconnected' here from main.js
    rightController.addEventListener('connected', function (event) {
        // The gamepad property is only available after the controller is connected in a VR session
        // event.data.gamepad.axes is an array of axis values:
        //   - For Oculus/Meta Quest and most WebXR controllers:
        //     - axes[2] = right stick X (left/right)
        //     - axes[3] = right stick Y (forward/backward)
        //     - axes[0] = left stick X (left/right)
        //     - axes[1] = left stick Y (forward/backward)
        //   - Some devices may only provide axes[0] and axes[1] for a single stick
        rightGamepad = event.data && event.data.gamepad ? event.data.gamepad : null;
    });
    rightController.addEventListener('disconnected', function () {
        rightGamepad = null;
    });

    // Movement speed factor
    const moveSpeed = 0.05;

    // Return an object with the cameraHolder and a function to call in your render loop
    return {
        cameraHolder,
        updateVRMovement: function () {
            // --- VR controller stick movement ---
            // We want to move forward/backward using the right stick's Y axis
            // and left/right using the right stick's X axis
            // Oculus/Meta Quest: axes[2] is right stick X, axes[3] is right stick Y
            // We'll use the axis with the largest absolute value to support more devices
            if (rightGamepad && rightGamepad.axes) {
                const axes = rightGamepad.axes;
                let yAxis = 0;
                let xAxis = 0;
                if (axes.length >= 4) {
                    // axes[2]: right stick X (left/right)
                    // axes[3]: right stick Y (forward/backward)
                    // axes[0]: left stick X
                    // axes[1]: left stick Y
                    yAxis = Math.abs(axes[3]) > Math.abs(axes[1]) ? axes[3] : axes[1];
                    xAxis = Math.abs(axes[2]) > Math.abs(axes[0]) ? axes[2] : axes[0];
                } else if (axes.length >= 2) {
                    // Some controllers only have one stick: axes[0] is X, axes[1] is Y
                    xAxis = axes[0];
                    yAxis = axes[1];
                }
                // Deadzone to prevent drift
                if (Math.abs(yAxis) > 0.15) {
                    // Move cameraHolder forward/backward along its local Z axis
                    cameraHolder.translateZ(yAxis * moveSpeed);
                }
                if (Math.abs(xAxis) > 0.15) {
                    // Move cameraHolder left/right along its local X axis
                    cameraHolder.translateX(xAxis * moveSpeed);
                }
            }
        }
    };
}
