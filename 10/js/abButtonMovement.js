import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

let rightController;

export function setupABButtonMovement(renderer, scene, cameraHolder) {
    const controllerModelFactory = new XRControllerModelFactory();

    // Right controller
    rightController = renderer.xr.getController(1);
    scene.add(rightController);
    const rightControllerGrip = renderer.xr.getControllerGrip(1);
    rightControllerGrip.add(controllerModelFactory.createControllerModel(rightControllerGrip));
    scene.add(rightControllerGrip);
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
