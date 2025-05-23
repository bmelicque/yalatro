import * as CANNON from "cannon-es";
import * as THREE from "three";
import { buildArena, HEIGHT } from "./arena";
import { ShaderBackground } from "./background/background";
import { Dice } from "./dice";
import { DieDetector } from "./mouse";
import { StateMachine } from "./state";

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

const scene = new THREE.Scene();
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
const camera = makeCamera();
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "game";
document.body.appendChild(renderer.domElement);
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

const state = new StateMachine(dice);

const dieDetector = new DieDetector({ renderer, camera, dice });
document.body.addEventListener("mousemove", (e) => {
	const hovered = dieDetector.findHovered(e);
	document.body.style.cursor = hovered && state.state === "selecting" ? "pointer" : "auto";
});
document.body.addEventListener("click", (e) => {
	const hovered = dieDetector.findHovered(e);
	if (!hovered?.isFrozen) return;
	state.toggleSelect(hovered);
});
document.getElementById("discard")?.addEventListener("click", () => {
	state.discard();
});
document.getElementById("score")?.addEventListener("click", () => {
	state.score();
});

function animate() {
	requestAnimationFrame(animate);

	world.step(1 / 60);
	state.update();

	document.querySelectorAll(".action").forEach((btn) => ((btn as HTMLButtonElement).disabled = !state.hasSelection));

	renderer.render(scene, camera);
}
animate();
