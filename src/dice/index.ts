import * as CANNON from "cannon-es";
import * as THREE from "three";
import fragmentShader from "./dice.frag?raw";
import vertexShader from "./dice.vert?raw";

const _texturePositions: number[] = [];
function texturePositions() {
	if (_texturePositions.length > 0) return _texturePositions;
	const dx = 0.4 / Math.sqrt(3);
	const dy = 0.2;
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 4; j++) {
			const x = j / 4;
			const y = i / 5;
			_texturePositions.push(x, y + dy, x + dx / 2, y, x + dx, y + dy);
		}
	}
	return _texturePositions;
}

export const FACES = [15, 5, 13, 1, 7, 18, 12, 17, 19, 11, 20, 8, 16, 6, 14, 2, 10, 3, 9, 4];

const tex = new THREE.TextureLoader().load("/tex.png");
export class Dice {
	#stopAnimation: (() => void) | null = null;
	#mesh: THREE.Mesh;
	#body!: CANNON.Body;

	constructor() {
		this.#mesh = Dice.makeMesh();
		this.#body = new CANNON.Body({
			mass: 1,
			shape: cannonIcos(1),
		});
		this.#mesh.geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(this.normals), 3));
	}

	static makeMesh() {
		const geometry = new THREE.IcosahedronGeometry(1);
		geometry.setAttribute("texPos", new THREE.BufferAttribute(Float32Array.from(texturePositions()), 2));

		const cubeMat = new THREE.ShaderMaterial({
			uniforms: {
				tex: { value: tex },
			},
			vertexShader,
			fragmentShader,
		});
		return new THREE.Mesh(geometry, cubeMat);
	}

	get body() {
		return this.#body;
	}

	get mesh() {
		return this.#mesh;
	}

	get normals() {
		const shape = this.#body.shapes[0] as CANNON.ConvexPolyhedron;
		const faces = shape.faces;
		const vertices = shape.vertices;
		const normals = [];
		for (let i = 0; i < faces.length; i++) {
			const face = faces[i];
			const v0 = vertices[face[0]];
			const v1 = vertices[face[1]];
			const v2 = vertices[face[2]];
			const edge1 = v1.vsub(v0);
			const edge2 = v2.vsub(v0);
			let normal = edge1.cross(edge2);
			normal.normalize();
			normal = this.#body.quaternion.vmult(normal);
			for (let i = 0; i < 3; i++) normals.push(normal.x, normal.y, normal.z);
		}
		return normals;
	}

	get topFace() {
		const up = new CANNON.Vec3(0, 1, 0);
		let topFaceIndex = -1;
		let maxDot = -Infinity;

		const shape = this.#body.shapes[0] as CANNON.ConvexPolyhedron;
		const faces = shape.faces;
		const vertices = shape.vertices;
		for (let i = 0; i < faces.length; i++) {
			const face = faces[i];
			const v0 = vertices[face[0]];
			const v1 = vertices[face[1]];
			const v2 = vertices[face[2]];
			const edge1 = v1.vsub(v0);
			const edge2 = v2.vsub(v0);
			const normal = edge1.cross(edge2);
			normal.normalize();

			const worldNormal = this.#body.quaternion.vmult(normal);

			const dot = worldNormal.dot(up);
			if (dot > maxDot) {
				maxDot = dot;
				topFaceIndex = i;
			}
		}

		return FACES[topFaceIndex];
	}

	get position() {
		return this.#body.position;
	}

	setPosition(x: number, y: number, z: number) {
		this.#body.position.set(x, y, z);
		this.#mesh.position.copy(this.#body.position as unknown as THREE.Vector3);
	}

	setVelocity(x: number, y: number, z: number) {
		this.#body.velocity.set(x, y, z);
	}

	get quaternion() {
		return this.#mesh.quaternion;
	}

	setQuaternion(x: number, y: number, z: number, w: number) {
		this.#body.quaternion.set(x, y, z, w);
		this.#mesh.quaternion.copy(this.#body.quaternion as unknown as THREE.Quaternion);
	}

	isMoving(threshold = 0.1): boolean {
		const linearVelocity = this.#body.velocity.length();
		const angularVelocity = this.#body.angularVelocity.length();
		return linearVelocity > threshold || angularVelocity > threshold;
	}

	sync() {
		this.#mesh.position.copy(this.#body.position as unknown as THREE.Vector3);
		this.#mesh.quaternion.copy(this.#body.quaternion as unknown as THREE.Quaternion);
		this.#mesh.geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(this.normals), 3));
	}

	get isFrozen() {
		return this.#body.sleepState === CANNON.BODY_SLEEP_STATES.SLEEPING;
	}

	freeze() {
		this.#body.sleep();
		this.#body.mass = 0;
	}

	thaw() {
		this.#body.wakeUp();
		this.#body.mass = 1;
	}

	throw() {
		this.#stopAnimation?.();
		this.thaw();

		const velocity = new THREE.Vector2(-this.position.x, -this.position.z)
			.normalize()
			.add(new THREE.Vector2(Math.random() * 0.5, Math.random() * 0.5).normalize().multiplyScalar(0.5))
			.multiplyScalar(40 + 10 * Math.random());
		this.setVelocity(velocity.x, 0, velocity.y);
	}

	animate(predicate: (die: Dice) => () => void) {
		this.#stopAnimation?.();
		this.#stopAnimation = predicate(this);
	}
}

// THREE.BufferGeometry into CANNON.ConvexPolyhedron makes collisions crash...
// https://github.com/pmndrs/cannon-es/issues/200
function cannonIcos(radius = 1) {
	const t = (1 + Math.sqrt(5)) / 2;
	const scaleFactor = radius / Math.sqrt(1 + t * t);
	const verticesIcosa = [
		new CANNON.Vec3(-1, t, 0).scale(scaleFactor),
		new CANNON.Vec3(1, t, 0).scale(scaleFactor),
		new CANNON.Vec3(-1, -t, 0).scale(scaleFactor),
		new CANNON.Vec3(1, -t, 0).scale(scaleFactor),
		new CANNON.Vec3(0, -1, t).scale(scaleFactor),
		new CANNON.Vec3(0, 1, t).scale(scaleFactor),
		new CANNON.Vec3(0, -1, -t).scale(scaleFactor),
		new CANNON.Vec3(0, 1, -t).scale(scaleFactor),
		new CANNON.Vec3(t, 0, -1).scale(scaleFactor),
		new CANNON.Vec3(t, 0, 1).scale(scaleFactor),
		new CANNON.Vec3(-t, 0, -1).scale(scaleFactor),
		new CANNON.Vec3(-t, 0, 1).scale(scaleFactor),
	];

	// Faces
	const facesIcosa = [
		[0, 11, 5],
		[0, 5, 1],
		[0, 1, 7],
		[0, 7, 10],
		[0, 10, 11],
		[1, 5, 9],
		[5, 11, 4],
		[11, 10, 2],
		[10, 7, 6],
		[7, 1, 8],
		[3, 9, 4],
		[3, 4, 2],
		[3, 2, 6],
		[3, 6, 8],
		[3, 8, 9],
		[4, 9, 5],
		[2, 4, 11],
		[6, 2, 10],
		[8, 6, 7],
		[9, 8, 1],
	];

	// Create a ConvexPolyhedron shape from the vertices and faces
	return new CANNON.ConvexPolyhedron({
		vertices: verticesIcosa,
		faces: facesIcosa,
	});
}
