import { Quaternion, Vector3 } from "three";
import type { Dice } from "./dice";

type AnimatePositionParams = {
	die: Dice;
	to: Vector3;
	duration: number;
	delay?: number;
	then?: (die: Dice) => void;
};

export function animateDiePosition(params: AnimatePositionParams) {
	const { die, to, duration, delay = 0, then } = params;
	const from = die.position.clone();
	const position = new Vector3(from.x, from.y, from.z);
	const start = performance.now();
	let stop = false;

	const animate = () => {
		const elapsed = Math.max(0, performance.now() - start - delay);

		const rate = elapsed / duration;
		const easedRate = rate * rate * (3 - 2 * rate);
		position.lerpVectors(from, to, easedRate);
		die.setPosition(position.x, position.y, position.z);

		if (elapsed < duration && !stop) requestAnimationFrame(animate);
		else then?.(die);
	};
	animate();

	return () => void (stop = true);
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
	let stop = false;

	const animate = () => {
		const elapsed = Math.max(0, performance.now() - start - delay);

		const rate = Math.min(1, elapsed / duration);
		const easedRate = rate * rate * (3 - 2 * rate);
		q.slerpQuaternions(from, to, easedRate);
		die.setQuaternion(q.x, q.y, q.z, q.w);

		if (elapsed < duration && !stop) requestAnimationFrame(animate);
	};
	animate();

	return () => void (stop = true);
}

function randomSign() {
	return Math.random() > 0.5 ? 1 : -1;
}

export function oscillateDie(die: Dice) {
	const start = performance.now();
	let frameHandle = 0;
	const position = die.position.clone();
	const quaternion = die.quaternion.clone();

	const dx = (randomSign() * (Math.random() + 1)) / 32;
	const dz = (randomSign() * (Math.random() + 1)) / 16;
	const wx = 1 + Math.random();
	const wz = 1 + Math.random();

	const x = (t: number) => dx * Math.cos((wx * Math.max(0, t - start)) / 1_000);
	const z = (t: number) => dz * Math.cos((wz * Math.max(0, t - start)) / 1_000);

	const animate = () => {
		const now = performance.now();

		const axis = new Vector3(x(now - 300), 0, z(now - 300)).normalize().cross(new Vector3(0, 1, 0));
		const angle = Math.sqrt(x(now - 300) ** 2 + z(now - 300) ** 2);
		const q3 = axis.multiplyScalar(Math.sin(angle / 2));
		const q = new Quaternion(q3.x, q3.y, q3.z, Math.cos(angle / 2)).multiply(quaternion);

		die.setPosition(position.x + x(now), position.y, position.z + z(now));
		die.setQuaternion(q.x, q.y, q.z, q.w);

		frameHandle = requestAnimationFrame(animate);
	};
	animate();

	return () => cancelAnimationFrame(frameHandle);
}
