import { Vector3 } from "three";
import { animateDiePosition, animateDieQuaternion, oscillateDie } from "./animate";
import { HEIGHT, width } from "./arena";
import type { Dice } from "./dice";
import { getDieRotation } from "./dice/quaternion";

const zone = {
	get left() {
		return -0.2 * width();
	},

	get right() {
		return 0.2 * width();
	},

	get z() {
		return -0.05 * HEIGHT;
	},
};

export type MoveToScoreParams = {
	duration: number;
	delay?: number;
};

/**
 * Move die at given index to the correct place in the given tow of the zone
 * @param dice list of all the dice
 * @param index index of the die to move in the list
 * @param row
 */
export function moveToScore(dice: Dice[], index: number, params: MoveToScoreParams) {
	const { duration, delay = 0 } = params;
	const die = dice[index];
	const step = (zone.right - zone.left) / dice.length;
	const position = new Vector3(zone.left + step * (index + 0.5), die.position.y, zone.z);
	die.animate(() => {
		const stopQ = animateDieQuaternion({ die, to: getDieRotation(die), duration, delay });
		const stopP = animateDiePosition({
			die,
			to: position,
			duration,
			delay,
			then: (die) => die.animate(oscillateDie),
		});
		return () => stopP() && stopQ();
	});
}

export function scoreDice(dice: Dice[]) {
	dice.sort((a, b) => b.topFace - a.topFace);
	dice.forEach((_, i) => {
		moveToScore(dice, i, {
			duration: 200,
			delay: 20 * i,
		});
	});
}
