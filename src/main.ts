import * as CANNON from "cannon-es";
import * as THREE from "three";
import { buildArena, HEIGHT } from "./arena";
import { ShaderBackground } from "./background/background";
import { Dice } from "./dice";
import { moveToZone } from "./dice-zone";
import { DieDetector } from "./mouse";

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

type State = "throwing" | "idle";
let state: State = "throwing";
const selected: Dice[] = [];

const dieDetector = new DieDetector({ renderer, camera, dice });
document.body.addEventListener("mousemove", (e) => {
	const hovered = dieDetector.findHovered(e);
	document.body.style.cursor = hovered && state === "idle" ? "pointer" : "auto";
	if (state === "idle") {
	}
});
document.body.addEventListener("click", (e) => {
	const hovered = dieDetector.findHovered(e);
	if (!hovered?.isFrozen) return;
	if (selected.includes(hovered)) {
		const index = selected.indexOf(hovered);
		selected.splice(index, 1);
		moveToZone(dice, dice.indexOf(hovered), {
			row: "bottom",
			duration: 100,
		});
	} else if (selected.length < 5) {
		selected.push(hovered);
		selected.sort((a, b) => b.topFace - a.topFace);
		moveToZone(dice, dice.indexOf(hovered), {
			row: "top",
			duration: 50,
		});
	}
});

function animate() {
	requestAnimationFrame(animate);

	world.step(1 / 60);
	dice.forEach((die) => (die.sync(), die.isMoving() || die.freeze()));
	if (state === "throwing" && !dice.find((die) => die.isMoving())) {
		storeDice();
		state = "idle";
	}

	renderer.render(scene, camera);
}
animate();

function storeDice() {
	dice.sort((a, b) => b.topFace - a.topFace);
	dice.forEach((_, i) => {
		moveToZone(dice, i, {
			row: "bottom",
			duration: 300,
			delay: 20 * i,
		});
	});
}
