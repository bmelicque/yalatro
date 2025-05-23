import type { Dice } from "./dice";
import { moveToZone, storeDice } from "./dice-zone";

type State = "throwing" | "selecting";

export class StateMachine {
	#state: State = "throwing";
	#dice: Dice[];
	#selected: Dice[] = [];
	#thrownAt: number;

	constructor(dice: Dice[]) {
		this.#dice = dice;
		this.#thrownAt = performance.now();
	}

	get state() {
		return this.#state;
	}

	get hasSelection() {
		return this.#selected.length > 0;
	}

	toggleSelect(die: Dice) {
		this.#selected.includes(die) ? this.unselect(die) : this.select(die);
	}

	select(die: Dice) {
		if (this.#selected.length >= 5) return;
		this.#selected.push(die);
		this.#selected.sort((a, b) => b.topFace - a.topFace);
		moveToZone(this.#dice, this.#dice.indexOf(die), {
			row: "top",
			duration: 50,
		});
	}

	unselect(die: Dice) {
		const index = this.#selected.indexOf(die);
		this.#selected.splice(index, 1);
		moveToZone(this.#dice, this.#dice.indexOf(die), {
			row: "bottom",
			duration: 100,
		});
	}

	throw() {
		if (this.#selected.length === 0) return;
		this.#state = "throwing";
		this.#selected.forEach((die) => die.throw());
		this.#selected.length = 0;
		this.#thrownAt = performance.now();
	}

	update() {
		this.#dice.forEach((die) => (die.sync(), die.isMoving() || die.freeze()));
		if (this.#state === "selecting") return;
		const allFrozen = !this.#dice.find((die) => !die.isFrozen);
		const tooLong = performance.now() - this.#thrownAt > 1000;
		if (allFrozen || tooLong) {
			this.#dice.forEach((die) => die.freeze());
			storeDice(this.#dice);
			this.#state = "selecting";
		}
	}
}
