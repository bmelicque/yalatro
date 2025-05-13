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

export function makeDice(): [THREE.Mesh, CANNON.Body] {
	const geometry = new THREE.IcosahedronGeometry(1).toNonIndexed();
	geometry.setAttribute("texPos", new THREE.BufferAttribute(Float32Array.from(texturePositions()), 2));

	const cubeMat = new THREE.ShaderMaterial({
		uniforms: {
			tex: { value: new THREE.TextureLoader().load("/tex.png") },
		},
		vertexShader: `
        attribute vec2 texPos;
    
        varying vec2 vUv;
        varying vec2 vTexPos;
    
        void main() {
          vUv = uv;
          vTexPos = texPos;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
        `,
		fragmentShader: `
        uniform sampler2D tex;
    
        varying vec2 vUv;
        varying vec2 vTexPos;
    
        void main() {
          float x = floor((1.-vUv.x)*100.);
          float r = 0.;
          if (vTexPos.x < 0.25 && vTexPos.y < 0.2) { r = 1.; }
          gl_FragColor = texture2D(tex, vec2(.98094-vTexPos.x, 1. - vTexPos.y));
          if (gl_FragColor.w < .5) { gl_FragColor = vec4(1.); }
        }
        `,
	});
	const mesh = new THREE.Mesh(geometry, cubeMat);
	mesh.position.y = 3;

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
	body.position.set(0, 3, 0);
	const angle = 2 * Math.PI * Math.random();
	const speed = 10 + 5 * Math.random();
	body.velocity.set(speed * Math.cos(angle), 0, speed * Math.sin(angle));
	const q = new CANNON.Quaternion(Math.random(), Math.random(), Math.random(), Math.random()).normalize();
	body.quaternion.set(q.x, q.y, q.z, q.w);

	return [mesh, body];
}
