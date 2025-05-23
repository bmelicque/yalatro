import { Vector3 } from "three";
import { HEIGHT, width } from "./arena";
import type { Dice } from "./dice";
import { getDieRotation } from "./dice/quaternion";
import { animateDiePosition, animateDieQuaternion, oscillateDie } from "./animate";

type ZoneRow = "bottom" | "top";

const zone = {
	get margin() {
		return 0.02 * width();
	},

	get left() {
		return -0.46 * width() + zone.margin;
	},

	get right() {
		return 0.25 * width() - zone.margin;
	},

	get bottomRow() {
		return HEIGHT * 0.37;
	},

	get topRow() {
		return HEIGHT * 0.28;
	},
};

export type MoveToZoneParams = {
	row: ZoneRow;
	duration: number;
	delay?: number;
};

/**
 * Move die at given index to the correct place in the given tow of the zone
 * @param dice list of all the dice
 * @param index index of the die to move in the list
 * @param row
 */
export function moveToZone(dice: Dice[], index: number, params: MoveToZoneParams) {
	const { row, duration, delay = 0 } = params;
	const die = dice[index];
	const step = (zone.right - zone.left) / dice.length;
	const position = new Vector3(
		zone.left + step * (index + 0.5),
		die.position.y,
		row === "bottom" ? zone.bottomRow : zone.topRow
	);
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

export function storeDice(dice: Dice[]) {
	dice.sort((a, b) => b.topFace - a.topFace);
	dice.forEach((_, i) => {
		moveToZone(dice, i, {
			row: "bottom",
			duration: 300,
			delay: 20 * i,
		});
	});
}
