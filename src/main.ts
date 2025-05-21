import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { buildArena, HEIGHT } from "./arena";
import { Dice } from "./dice";
import { ShaderBackground } from "./background/background";

customElements.define("shader-background", ShaderBackground);

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
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "game";
document.body.appendChild(renderer.domElement);
const controls = makeControls(camera, renderer);
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -100, 0),
});

buildArena(world);

const dice: Dice[] = [];
for (let i = 0; i < 3; i++) {
	for (let j = 0; j < 3; j++) {
		const die = new Dice();
		const angle = 2 * Math.PI * Math.random();
		const speed = 20 + 5 * Math.random();
		die.setPosition(5 * (i - 1), 1, 5 * (j - 1));
		die.setVelocity(speed * Math.cos(angle), 0, speed * Math.sin(angle));
		const q = new CANNON.Quaternion(Math.random(), Math.random(), Math.random(), Math.random()).normalize();
		die.setQuaternion(q.x, q.y, q.z, q.w);
		scene.add(die.mesh);
		world.addBody(die.body);
		dice.push(die);
	}
}

function animate() {
	requestAnimationFrame(animate);

	world.step(1 / 60);
	dice.forEach((die) => (die.sync(), die.isMoving() || die.freeze()));
	if (!dice.find((die) => die.isMoving())) {
		storeDice();
	}
	controls.update();

	renderer.render(scene, camera);
}
animate();

function storeDice() {
	dice.sort((a, b) => b.topFace - a.topFace);
	const margin = 0.02 * width();
	const startX = -0.24 * width() + margin;
	const endX = 0.48 * width() - margin;
	const step = (endX - startX) / dice.length;
	dice.forEach((die, i) => die.setPosition(startX + step * (i + 0.5), die.position.y, HEIGHT * 0.25));
}
