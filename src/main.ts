import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { buildArena } from "./arena";
import { Dice } from "./dice";

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
	gravity: new CANNON.Vec3(0, -100, 0),
});

const updateArena = buildArena(scene, world);
const dice = new Dice();
const angle = 2 * Math.PI * Math.random();
const speed = 20 + 5 * Math.random();
dice.setPosition(0, 1, 0);
dice.setVelocity(speed * Math.cos(angle), 0, speed * Math.sin(angle));
const q = new CANNON.Quaternion(Math.random(), Math.random(), Math.random(), Math.random()).normalize();
dice.setQuaternion(q.x, q.y, q.z, q.w);
scene.add(dice.mesh);
world.addBody(dice.body);

const result = document.createElement("div");
result.style.position = "absolute";
result.style.left = `${innerWidth / 2}px`;
result.style.top = `${innerHeight / 2}px`;
result.style.transform = "translate(-50%, -50%)";
result.style.fontSize = "15rem";
document.body.appendChild(result);
function animate() {
	requestAnimationFrame(animate);

	world.step(1 / 60);

	dice.sync();
	updateArena();

	controls.update();

	if (!dice.isMoving()) {
		result.innerText = `${dice.topFace}`;
		dice.freeze();
	}

	renderer.render(scene, camera);
}
animate();
