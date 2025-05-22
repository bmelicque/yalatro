import * as CANNON from "cannon-es";
import * as THREE from "three";
import { Dice, FACES } from ".";

const faceIndices = FACES.map((_, i) => FACES.indexOf(i + 1));

// index is topFace-1
const angles: (number | undefined)[] = [
	(-Math.PI * 3) / 8, // 1
	-Math.PI * (1 / 3 - 1 / 20), // 2
	(Math.PI * 7) / 8, // 3
	-Math.PI / 2, // 4
	Math.PI / 3, // 5
	(-Math.PI * 7) / 8, //6
	(-Math.PI * 5) / 6, // 7
	(-Math.PI * 2) / 3, // 8
	-Math.PI * (2 / 3 + 1 / 20), // 9
	Math.PI / 8, // 10
	(Math.PI * 3) / 8, // 11
	(Math.PI * 19) / 20, // 12
	0, // 13
	-Math.PI * (5 / 6), // 14
	Math.PI * 0.705, // 15
	Math.PI, // 16
	-Math.PI / 2, // 17
	Math.PI * (5 / 8), //18
	Math.PI / 20, // 19
	Math.PI * 1.205, // 20
];

export function getDieRotation(die: Dice) {
	const index = faceIndices[die.topFace - 1];
	const shape = die.body.shapes[0] as CANNON.ConvexPolyhedron;
	const face = shape.faces[index];
	const vertices = shape.vertices;
	const v0 = vertices[face[0]];
	const v1 = vertices[face[1]];
	const v2 = vertices[face[2]];
	const edge1 = v1.vsub(v0);
	const edge2 = v2.vsub(v0);
	const localNormal = edge1.cross(edge2);
	localNormal.normalize();

	const q = new THREE.Quaternion().setFromUnitVectors(
		localNormal as unknown as THREE.Vector3,
		new THREE.Vector3(0, 1, 0)
	);

	const angle = angles[die.topFace - 1] ?? 0;
	const p = new THREE.Quaternion(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));

	return p.multiply(q);
}
