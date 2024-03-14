declare global {
	interface Number {
		case(zero: string, one: string, two: string): string;
		pad(before: number, after?: number): string;
	}
}

export {};

Number.prototype.case = function _case(this: number, zero: string, one: string, two: string): string {
	let num = Math.abs(this);
	num    %= 100;

	if (num >= 5 && num <= 20) {
		return zero;
	}

	num %= 10;

	if (num === 1) {
		return one;
	}

	if (num >= 2 && num <= 4) {
		return two;
	}

	return zero;
};

Number.prototype.pad = function pad(this: number, before: number, after?: number): string {
	const arr     = this.toString().split('.');
	let leftPart  = arr[0]!;
	let rightPart = arr[1] ?? '';

	for (let i = leftPart.length; i < before; i++) {
		leftPart = `0${leftPart}`;
	}

	if (typeof after !== 'undefined') {
		for (let i = rightPart.length; i < after; i++) {
			rightPart = `${rightPart}0`;
		}
	}

	if (rightPart.length > 0) {
		rightPart = `.${rightPart}`;
	}

	return leftPart + rightPart;
};
