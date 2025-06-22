# Pointer (Controller Ray) — Simple Documentation

The pointer in this project is a short white line (ray) that extends from the right XR controller. At the tip of the ray, a small white dot (reticle) appears when the pointer is aimed at a menu button.

- The pointer line is always 0.25 meters long and is attached to the right controller.
- The reticle (dot) is only visible when the pointer intersects a menu button. It is positioned at the intersection point.
- Both the pointer line and reticle are created and managed in `js/controllers.js`.
- The main animation loop updates the reticle's position and visibility every frame.

**Key functions:**

- `createPointerLine(rightController)`: Adds the pointer line to the right controller.
- `createReticle(scene)`: Adds the reticle (dot) to the scene.
- `updateMenuHighlight(...)`: Updates the reticle's position and shows/hides it based on intersection with the menu.

**Usage:**

- The pointer and reticle are set up automatically when you call `setupControllers` from your main script.

---

## Pointer-Related Code (`js/controllers.js`)

```js
import * as THREE from "three";
import { setCubeColor } from "./cube.js";

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
	const pointerGeom = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(0, 0, -0.25),
	]);
	const pointerLine = new THREE.Line(
		pointerGeom,
		new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 })
	);
	rightController.add(pointerLine);
	return pointerLine;
}

function updateMenuHighlight({
	rightController,
	menu,
	reticle,
	tempMatrix,
	raycaster,
	intersectedRef,
}) {
	let reticleVisible = false;
	tempMatrix.identity().extractRotation(rightController.matrixWorld);
	raycaster.ray.origin.setFromMatrixPosition(rightController.matrixWorld);
	raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
	const intersects = raycaster.intersectObjects(menu.children);
	if (intersects.length > 0) {
		const hit = intersects[0];
		if (intersectedRef.current !== hit.object) {
			if (intersectedRef.current) {
				intersectedRef.current.material.color.set(
					intersectedRef.current.userData.dull
				);
				intersectedRef.current.scale.set(1, 1, 1);
			}
			intersectedRef.current = hit.object;
			intersectedRef.current.material.color.set(
				intersectedRef.current.userData.neon
			);
			intersectedRef.current.scale.set(1.2, 1.2, 1.2);
		}
		reticle.position.copy(hit.point);
		reticle.visible = true;
		reticleVisible = true;
	} else {
		if (intersectedRef.current) {
			intersectedRef.current.material.color.set(
				intersectedRef.current.userData.dull
			);
			intersectedRef.current.scale.set(1, 1, 1);
		}
		intersectedRef.current = null;
		reticle.visible = false;
	}
	if (!reticleVisible) reticle.visible = false;
}

export function setupControllers({
	scene,
	leftController,
	rightController,
	menu,
	cube,
}) {
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
	const highlightParams = {
		rightController,
		menu,
		reticle,
		tempMatrix,
		raycaster,
		intersectedRef,
	};
	const highlightFn = () => updateMenuHighlight(highlightParams);
	rightController.addEventListener("selectstart", () =>
		onSelectStart({ intersectedRef, cube })
	);

	return {
		leftController,
		rightController,
		pointerLine,
		reticle,
		updateMenuHighlight: highlightFn,
	};
}
```
