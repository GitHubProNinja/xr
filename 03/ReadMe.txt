Original source from Projects3D\__TEST Interesting Projects\__Template

To modift any project to an AR project:

1- import ARButton
    import { ARButton } from 'three/addons/webxr/ARButton.js';

2- Add ARButton to document.body - at end of init()
    document.body.appendChild(ARButton.createButton(renderer));

3- enable XR - where renderer is initialized
    renderer.xr.enabled = true;

4- use setAnimationLoop instead of requestAnimationFrame
    renderer.setAnimationLoop(animate);

