Original source from Projects3D\WebXR\__ARTemplate

To modift any project to an VR project:

1- import VRButton
    import { VRButton } from 'three/addons/webxr/VRButton.js';

2- Add VRButton to document.body - at end of init()
    document.body.appendChild(VRButton.createButton(renderer));

3- enable XR - where renderer is initialized
    renderer.xr.enabled = true;

4- use setAnimationLoop instead of requestAnimationFrame
    renderer.setAnimationLoop(animate);

NOTE: After the above changes, your eyes/head/goggle is placed at position (0, 0, 0) of the scene (not the camera)


To MOVE the camera
------------------

- DO NOT position the camera on the scene (it just does not work)
- DO NOT add camera to the scene
-   Create an Object3D
    Add camera to it
    Add that object to the scene
    position that object anywhere

Example from Projects3D\WebXR\NL\VR\Complete\3.7 MOVE
"lines 136 to 139"
    dolly = new THREE.Object3D();
    dolly.position.z = 5;
    dolly.add(this.camera);
    scene.add(this.dolly);