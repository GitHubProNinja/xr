import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export function setupABButtonMovement(renderer, scene, cameraHolder) {
    let rightController, rightControllerGrip;
    const controllerModelFactory = new XRControllerModelFactory();

    // Right controller
    rightController = renderer.xr.getController(0);
    scene.add(rightController);
    rightControllerGrip = renderer.xr.getControllerGrip(0);
    rightControllerGrip.add(controllerModelFactory.createControllerModel(rightControllerGrip));
    scene.add(rightControllerGrip);

    // Listen for gamepad button presses (A = 0, B = 1)
    renderer.setAnimationLoop(() => {
        if (rightController && rightController.gamepad) {
            const buttons = rightController.gamepad.buttons;
            // Button A (index 0): move forward
            if (buttons[0] && buttons[0].pressed) {
                cameraHolder.translateZ(-0.1);
            }
            // Button B (index 1): move backward
            if (buttons[1] && buttons[1].pressed) {
                cameraHolder.translateZ(0.1);
            }
        }
    });
}
