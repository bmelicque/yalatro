import * as THREE from "three";
import { HEIGHT, width } from "../arena";
import vertexShader from "./background.vert?raw";
import fragmentShader from "./background.frag?raw";

function makeCamera() {
	const camera = new THREE.OrthographicCamera(-width() / 2, width() / 2, HEIGHT / 2, -HEIGHT / 2);
	camera.position.set(0, 10, 0);
	camera.rotateX(-Math.PI / 2);
	return camera;
}

export class ShaderBackground extends HTMLElement {
	#scene: THREE.Scene;
	#camera: THREE.OrthographicCamera;
	#renderer: THREE.WebGLRenderer;
	#uniforms: { [uniform: string]: THREE.IUniform };
	#nextFrame!: number;

	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });

		this.#scene = new THREE.Scene();
		this.#camera = makeCamera();
		this.#renderer = new THREE.WebGLRenderer();
		this.#renderer.setSize(window.innerWidth, window.innerHeight);

		this.#uniforms = {
			time: { value: performance.now() / 1000 },
			aspect: { value: innerWidth / innerHeight },
		};
		const groundGeo = new THREE.BoxGeometry(HEIGHT * 2, 1, HEIGHT);
		const groundMat = new THREE.ShaderMaterial({
			uniforms: this.#uniforms,
			vertexShader,
			fragmentShader,
		});
		const groundMesh = new THREE.Mesh(groundGeo, groundMat);
		this.#scene.add(groundMesh);

		shadow.appendChild(this.#renderer.domElement);
	}

	connectedCallback() {
		const animate = () => {
			this.#nextFrame = requestAnimationFrame(animate);
			this.#uniforms.time.value = performance.now() / 1000;
			this.#uniforms.aspect.value = innerWidth / innerHeight;
			this.#renderer.render(this.#scene, this.#camera);
		};
		animate();
	}

	disconnectedCallback() {
		cancelAnimationFrame(this.#nextFrame);
	}
}
