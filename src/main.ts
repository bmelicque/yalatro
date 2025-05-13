import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { buildArena } from "./arena";
import { makeDice } from "./dice";

const HEIGHT = 12;

function width() {
	return (innerWidth / innerHeight) * HEIGHT;
}

function makeCamera() {
	const camera = new THREE.OrthographicCamera(-width() / 2, width() / 2, HEIGHT / 2, -HEIGHT / 2);
	camera.position.set(0, 10, 0);
	camera.rotateX(-Math.PI / 2);
	return camera;
}

function makeControls(camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true; // optional for smoother feel
	controls.dampingFactor = 0.1;
	controls.autoRotate = false;
	controls.target.set(0, 0, 0); // look at center
	controls.update();
	return controls;
}

const scene = new THREE.Scene();
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
const camera = makeCamera();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = makeControls(camera, renderer);
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.82, 0),
});

buildArena(scene, world);
const [mesh, body] = makeDice();
scene.add(mesh);
world.addBody(body);

function animate() {
	requestAnimationFrame(animate);

	world.step(1 / 60);

	// Sync Three.js mesh with Cannon body
	mesh.position.copy(body.position as unknown as THREE.Vector3);
	mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);

	controls.update();

	renderer.render(scene, camera);
}
animate();
