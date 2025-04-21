export function handleABButtonMovement(rightController, cameraHolder) {
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
}
