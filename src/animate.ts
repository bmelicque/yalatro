import { Quaternion, Vector3 } from "three";
import type { Dice } from "./dice";

type AnimatePositionParams = {
	die: Dice;
	to: Vector3;
	duration: number;
	delay?: number;
};

export function animateDiePosition(params: AnimatePositionParams) {
	const { die, to, duration, delay = 0 } = params;
	const from = die.position.clone();
	const position = new Vector3(from.x, from.y, from.z);
	const start = performance.now();

	const animate = () => {
		const elapsed = Math.max(0, performance.now() - start - delay);

		const rate = elapsed / duration;
		const easedRate = rate * rate * (3 - 2 * rate);
		position.lerpVectors(from, to, easedRate);
		die.setPosition(position.x, position.y, position.z);

		if (elapsed < duration) requestAnimationFrame(animate);
	};
	animate();
}

type AnimateQuaternionParams = {
	die: Dice;
	to: Quaternion;
	duration: number;
	delay?: number;
};

export function animateDieQuaternion(params: AnimateQuaternionParams) {
	const { die, to, duration, delay = 0 } = params;
	const from = die.quaternion.clone();
	const q = die.quaternion.clone();
	const start = performance.now();

	const animate = () => {
		const elapsed = Math.max(0, performance.now() - start - delay);

		const rate = Math.min(1, elapsed / duration);
		const easedRate = rate * rate * (3 - 2 * rate);
		q.slerpQuaternions(from, to, easedRate);
		die.setQuaternion(q.x, q.y, q.z, q.w);

		if (elapsed < duration) requestAnimationFrame(animate);
	};
	animate();
}
