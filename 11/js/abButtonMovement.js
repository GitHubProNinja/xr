import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

let rightController;

export function setupABButtonMovement(renderer, scene, cameraHolder) {
    const controllerModelFactory = new XRControllerModelFactory();

    // Listen for controller connection and assign rightController by handedness
    function onControllerConnected(event) {
        const handedness = event.data.handedness;
        if (handedness === 'right') {
            rightController = event.target;
        }
    }

    // Add both controllers and listen for 'connected' event
    for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        controller.addEventListener('connected', onControllerConnected);
        scene.add(controller);
        const controllerGrip = renderer.xr.getControllerGrip(i);
        controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
        scene.add(controllerGrip);
    }
}

export function updateABButtonMovement(cameraHolder) {
    if (!rightController) return;
    const inputSource = rightController.inputSource;
    if (!inputSource || !inputSource.gamepad) return;
    const buttons = inputSource.gamepad.buttons;
    // Button A (index 0): move forward
    if (buttons[0] && buttons[0].pressed) {
        cameraHolder.translateZ(-0.1);
    }
    // Button B (index 1): move backward
    if (buttons[1] && buttons[1].pressed) {
        cameraHolder.translateZ(0.1);
    }
}
