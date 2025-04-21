import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export function setupMovementControllers(renderer, scene, cameraHolder) {
    let rightController, rightControllerGrip;
    let leftController, leftControllerGrip;
    const controllerModelFactory = new XRControllerModelFactory();

    // Right controller
    rightController = renderer.xr.getController(0);
    scene.add(rightController);
    rightControllerGrip = renderer.xr.getControllerGrip(0);
    rightControllerGrip.add(controllerModelFactory.createControllerModel(rightControllerGrip));
    scene.add(rightControllerGrip);
    // Add event listener for right controller button press (move forward)
    rightController.addEventListener('selectstart', () => {
        cameraHolder.translateZ(-0.1);
    });

    // Left controller
    leftController = renderer.xr.getController(1);
    scene.add(leftController);
    leftControllerGrip = renderer.xr.getControllerGrip(1);
    leftControllerGrip.add(controllerModelFactory.createControllerModel(leftControllerGrip));
    scene.add(leftControllerGrip);
    // Add event listener for left controller button press (move backward)
    leftController.addEventListener('selectstart', () => {
        cameraHolder.translateZ(0.1);
    });
}