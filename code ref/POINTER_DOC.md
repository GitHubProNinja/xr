# Pointer (Controller Ray) — Documentation

This project uses a VR controller pointer (ray and dot) to interact with 3D UI buttons and objects in both VR and desktop modes. The pointer is visualized as a white ray extending from the controller, with a small dot at the intersection point when hovering over interactive elements.

## How the Pointer Works

- **VR Mode:**

  - Each controller gets a white ray and a dot (sprite) attached to it.
  - The ray is a thin, semi-transparent box mesh, and the dot is a sprite with a circular texture.
  - The pointer's direction is updated every frame to match the controller's orientation.
  - When the ray intersects a UI button, the dot is positioned at the intersection point and made visible.
  - Button states (hovered, selected) are updated based on intersection and controller input.

- **Desktop Mode:**

  - The mouse position is used to cast a ray from the camera.
  - Button states are updated based on mouse intersection and clicks.

- **Pointer Logic Location:**
  - All controller pointer creation and logic is in `utils/VRControl.js`.
  - The main script (`interactive_button.js`) uses the pointer for raycasting and UI interaction.

---

## Pointer-Related Code

### `utils/VRControl.js`

```js
import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

export default function VRControl(renderer) {
	const controllers = [];
	const controllerGrips = [];
	const controllerModelFactory = new XRControllerModelFactory();

	// Ray (line) mesh
	const material = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		alphaMap: new THREE.CanvasTexture(generateRayTexture()),
		transparent: true,
	});
	const geometry = new THREE.BoxGeometry(0.004, 0.004, 0.35);
	geometry.translate(0, 0, -0.15);
	// ...UV setup omitted for brevity...
	const linesHelper = new THREE.Mesh(geometry, material);
	linesHelper.renderOrder = Infinity;

	// Dot (sprite) mesh
	const spriteMaterial = new THREE.SpriteMaterial({
		map: new THREE.CanvasTexture(generatePointerTexture()),
		sizeAttenuation: false,
		depthTest: false,
	});
	const pointer = new THREE.Sprite(spriteMaterial);
	pointer.scale.set(0.015, 0.015, 1);
	pointer.renderOrder = Infinity;

	// Attach ray and dot to controllers
	const controller1 = renderer.xr.getController(0);
	const controller2 = renderer.xr.getController(1);
	controller1.name = "controller-right";
	controller2.name = "controller-left";
	const controllerGrip1 = renderer.xr.getControllerGrip(0);
	const controllerGrip2 = renderer.xr.getControllerGrip(1);
	if (controller1) controllers.push(controller1);
	if (controller2) controllers.push(controller2);
	if (controllerGrip1) controllerGrips.push(controllerGrip1);
	if (controllerGrip2) controllerGrips.push(controllerGrip2);
	controllers.forEach((controller) => {
		const ray = linesHelper.clone();
		const point = pointer.clone();
		controller.add(ray, point);
		controller.ray = ray;
		controller.point = point;
	});
	controllerGrips.forEach((controllerGrip) => {
		controllerGrip.add(
			controllerModelFactory.createControllerModel(controllerGrip)
		);
	});

	// Pointer update functions
	const dummyMatrix = new THREE.Matrix4();
	function setFromController(controllerID, ray) {
		const controller = controllers[controllerID];
		dummyMatrix.identity().extractRotation(controller.matrixWorld);
		ray.origin.setFromMatrixPosition(controller.matrixWorld);
		ray.direction.set(0, 0, -1).applyMatrix4(dummyMatrix);
	}
	function setPointerAt(controllerID, vec) {
		const controller = controllers[controllerID];
		const localVec = controller.worldToLocal(vec);
		controller.point.position.copy(localVec);
		controller.point.visible = true;
	}
	return {
		controllers,
		controllerGrips,
		setFromController,
		setPointerAt,
	};
}
// ...generateRayTexture and generatePointerTexture omitted for brevity...
```

### `interactive_button.js` (Pointer Usage)

```js
// ...existing code...
vrControl = VRControl(renderer, camera, scene);
scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);

// In the animation loop:
function updateButtons() {
	let intersect;
	if (renderer.xr.isPresenting) {
		vrControl.setFromController(0, raycaster.ray);
		intersect = raycast();
		// Position the little white dot at the end of the controller pointing ray
		if (intersect) vrControl.setPointerAt(0, intersect.point);
	} else if (mouse.x !== null && mouse.y !== null) {
		raycaster.setFromCamera(mouse, camera);
		intersect = raycast();
	}
	// ...button state logic...
}
```

---

## Summary

- The pointer is a ray and dot attached to each VR controller, created in `VRControl.js`.
- The main script updates the pointer's direction and intersection every frame.
- The dot is only visible when the pointer ray hits a UI element.
- Button states are updated based on pointer intersection and input.
