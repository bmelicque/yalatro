import * as CANNON from "cannon-es";

export const HEIGHT = 20;
const WALL_WIDTH = 1;

export function width() {
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

export function buildArena(world: CANNON.World) {
	world.addBody(makeBody(new CANNON.Vec3(100, 0.5, 100), new CANNON.Vec3(0, -0.5, 0)));
	world.addBody(makeBody(new CANNON.Vec3(1, 100, 100), new CANNON.Vec3(-width() / 2 - WALL_WIDTH, 0, 0)));
	world.addBody(makeBody(new CANNON.Vec3(1, 100, 100), new CANNON.Vec3(width() / 2 + WALL_WIDTH, 0, 0)));
	world.addBody(makeBody(new CANNON.Vec3(100, 100, 1), new CANNON.Vec3(0, 0, HEIGHT / 2 + WALL_WIDTH)));
	world.addBody(makeBody(new CANNON.Vec3(100, 100, 1), new CANNON.Vec3(0, 0, -HEIGHT / 2 - WALL_WIDTH)));
}
