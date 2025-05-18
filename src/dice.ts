import * as THREE from "three";
import * as CANNON from "cannon-es";

function texturePositions() {
	const positions = [];
	const dx = 0.4 / Math.sqrt(3);
	const dy = 0.2;
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 4; j++) {
			const x = j / 4;
			const y = i / 5;
			positions.push(x, y + dy, x + dx / 2, y, x + dx, y + dy);
		}
	}
	return positions;
}

const FACES = [15, 5, 13, 1, 7, 18, 12, 17, 19, 11, 20, 8, 16, 6, 14, 2, 10, 3, 9, 4];

export class Dice {
	#mesh: THREE.Mesh;
	#body: CANNON.Body;

	constructor() {
		this.#mesh = Dice.#makeMesh();
		this.#body = Dice.#makeBody(this.#mesh.geometry);
		this.#mesh.geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(this.normals), 3));
	}

	static #makeMesh() {
		const geometry = new THREE.IcosahedronGeometry(1).toNonIndexed();
		geometry.setAttribute("texPos", new THREE.BufferAttribute(Float32Array.from(texturePositions()), 2));

		const cubeMat = new THREE.ShaderMaterial({
			uniforms: {
				tex: { value: new THREE.TextureLoader().load("/tex.png") },
			},
			vertexShader: `
        attribute vec2 texPos;
    
        varying vec2 vTexPos;
        varying vec3 vNormal;
    
        void main() {
          vTexPos = texPos;
          vNormal = normal;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
        `,
			fragmentShader: `
        uniform sampler2D tex;
    
        varying vec2 vTexPos;
        varying vec3 vNormal;
    
        void main() {
          gl_FragColor = texture2D(tex, vec2(.98094-vTexPos.x, 1. - vTexPos.y));
          if (gl_FragColor.w < .5) { gl_FragColor = vec4(0.3+0.7*vec3(vNormal.y), 1.); }
        }
        `,
		});
		return new THREE.Mesh(geometry, cubeMat);
	}

	static #makeBody(geometry: THREE.BufferGeometry) {
		const cannonVertices: CANNON.Vec3[] = [];
		const positionAttr = geometry.getAttribute("position");
		for (let i = 0; i < positionAttr.count; i++) {
			const x = positionAttr.getX(i);
			const y = positionAttr.getY(i);
			const z = positionAttr.getZ(i);
			cannonVertices.push(new CANNON.Vec3(x, y, z));
		}
		const cannonFaces: number[][] = [];
		for (let i = 0; i < positionAttr.count; i += 3) {
			cannonFaces.push([i, i + 1, i + 2]);
		}

		const body = new CANNON.Body({
			mass: 1,
			shape: new CANNON.ConvexPolyhedron({
				vertices: cannonVertices,
				faces: cannonFaces,
			}),
		});
		return body;
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
		const up = new CANNON.Vec3(0, 1, 0); // Positive Y-axis
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

	setPosition(x: number, y: number, z: number) {
		this.#body.position.set(x, y, z);
		this.#mesh.position.copy(this.#body.position as unknown as THREE.Vector3);
	}

	setVelocity(x: number, y: number, z: number) {
		this.#body.velocity.set(x, y, z);
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

	freeze() {
		this.#body.sleep();
	}

	thaw() {
		this.#body.wakeUp();
	}
}
