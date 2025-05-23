import { OrthographicCamera, Raycaster, Vector2, WebGLRenderer } from "three";
import type { Dice } from "./dice";

type DieDetectorParams = {
	renderer: WebGLRenderer;
	camera: OrthographicCamera;
	dice: Dice[];
};

export class DieDetector {
	#renderer: WebGLRenderer;
	#camera: OrthographicCamera;
	#dice: Dice[];

	constructor(params: DieDetectorParams) {
		this.#renderer = params.renderer;
		this.#camera = params.camera;
		this.#dice = params.dice;
	}

	findHovered(e: MouseEvent) {
		const mousePos = new Vector2(
			(e.clientX / this.#renderer.domElement.clientWidth) * 2 - 1,
			-(e.clientY / this.#renderer.domElement.clientHeight) * 2 + 1
		);

		const raycaster = new Raycaster();
		raycaster.setFromCamera(mousePos, this.#camera);

		const intersects = raycaster.intersectObjects(this.#dice.map((die) => die.mesh));
		return this.#dice.find((die) => die.mesh === intersects[0]?.object);
	}
}
