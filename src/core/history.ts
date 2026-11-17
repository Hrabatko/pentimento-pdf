// Undo/Redo: whole document states in sequence. Simple and reliable —
// undoing just switches to an earlier state (spec 003).

export const MIN_UNDO_STEPS = 50;

export class History<T> {
	private readonly states: T[];
	private position = 0;
	private readonly limit: number;

	/** `limit` = how many steps back to remember (at least MIN_UNDO_STEPS). */
	constructor(initial: T, limit: number = MIN_UNDO_STEPS) {
		this.states = [initial];
		this.limit = Math.max(limit, MIN_UNDO_STEPS);
	}

	get current(): T {
		const state = this.states[this.position];
		if (state === undefined) {
			throw new Error("Historie je prázdná.");
		}
		return state;
	}

	get canUndo(): boolean {
		return this.position > 0;
	}

	get canRedo(): boolean {
		return this.position < this.states.length - 1;
	}

	/** A new state after an edit; discards everything that could be redone. */
	push(state: T): void {
		this.states.splice(this.position + 1);
		this.states.push(state);
		if (this.states.length > this.limit + 1) {
			this.states.shift();
		}
		this.position = this.states.length - 1;
	}

	undo(): T | null {
		if (!this.canUndo) {
			return null;
		}
		this.position--;
		return this.current;
	}

	redo(): T | null {
		if (!this.canRedo) {
			return null;
		}
		this.position++;
		return this.current;
	}
}
