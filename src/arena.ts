import * as CANNON from "cannon-es";
import * as THREE from "three";
import vertexShader from "./arena.vert?raw";
import fragmentShader from "./arena.frag?raw";

export const HEIGHT = 20;
const WALL_WIDTH = 1;

function width() {
	return (innerWidth / innerHeight) * HEIGHT;
}

function makeBody(shape: CANNON.Vec3, position: CANNON.Vec3) {
	const body = new CANNON.Body({
		mass: 0, // Static
		shape: new CANNON.Box(shape),
	});
	body.position.set(position.x, position.y, position.z);
	return body;
}

export function buildArena(scene: THREE.Scene, world: CANNON.World): () => void {
	const groundGeo = new THREE.BoxGeometry(HEIGHT * 2, 1, HEIGHT);
	const groundMat = new THREE.ShaderMaterial({
		uniforms: {
			time: { value: performance.now() / 1000 },
			aspect: { value: innerWidth / innerHeight },
		},
		vertexShader,
		fragmentShader,
	});
	const groundMesh = new THREE.Mesh(groundGeo, groundMat);
	groundMesh.position.y = -0.5;
	scene.add(groundMesh);

	world.addBody(makeBody(new CANNON.Vec3(100, 0.5, 100), new CANNON.Vec3(0, -0.5, 0)));
	world.addBody(makeBody(new CANNON.Vec3(1, 100, 100), new CANNON.Vec3(-width() / 2 - WALL_WIDTH, 0, 0)));
	world.addBody(makeBody(new CANNON.Vec3(1, 100, 100), new CANNON.Vec3(width() / 2 + WALL_WIDTH, 0, 0)));
	world.addBody(makeBody(new CANNON.Vec3(100, 100, 1), new CANNON.Vec3(0, 0, HEIGHT / 2 + WALL_WIDTH)));
	world.addBody(makeBody(new CANNON.Vec3(100, 100, 1), new CANNON.Vec3(0, 0, -HEIGHT / 2 - WALL_WIDTH)));

	return () => {
		groundMat.uniforms.time.value = performance.now() / 1000;
		groundMat.uniforms.aspect.value = innerWidth / innerHeight;
	};
}
