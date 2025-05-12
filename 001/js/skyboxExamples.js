// Load a JPG skybox as background only
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// JPG skybox
new THREE.TextureLoader()
    .setPath('img/')
    .load('clearnight_8k.jpg', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        // scene.environment = null; // Not recommended for reflections
    });

// HDR skybox
new RGBELoader()
    .setPath('img/')
    .load('skybox_2k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
