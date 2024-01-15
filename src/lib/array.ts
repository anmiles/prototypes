declare global {
	interface Array<T> {
		unique(this: Array<T>): Array<T>;
		equals(this: Array<T>, array: Array<T>): boolean;
		indexFieldOf<T extends Record<string, any>>(this: Array<T>, fields: string | string[], searchTerm: any, skip?: number): number;
		sum<T extends number>(this: Array<T>): number;
		sort(this: Array<T>, compareFn?: ((a: T, b: T) => number) | undefined): Array<T>;
		sort(this: Array<T>, direction: boolean, options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
		sort(this: Array<T>, field: string, options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
		sort(this: Array<T>, fields: string[], options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
		sort(this: Array<T>, fields: Record<string, boolean>, options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
	}
}

export {};

Array.prototype.unique = function unique<T>(this: Array<T>): Array<T> {
	return this.filter(function(value: T, index: number, array: T[]) {
		return array.indexOf(value) === index;
	});
};

Array.prototype.equals = function equals<T>(this: Array<T>, array: Array<T>): boolean {
	if (this.length !== array.length) {
		return false;
	}

	for (let i = 0; i < this.length; ++i) {
		if (this[i] !== array[i]) {
			return false;
		}
	}

	return true;
};

Array.prototype.indexFieldOf = function indexFieldOf<T extends Record<string, any>>(this: Array<T>, fields: string | string[], searchTerm: any, skip: number = 0): number {
	if (typeof fields === 'string') {
		fields = [ fields ];
	}

	for (let i = Math.max(0, skip); i < this.length; i++) {
		let val = this[i];

		for (const field of fields) {
			val = val?.[field];

			if (typeof val === 'undefined') {
				break;
			}
		}

		if (val === searchTerm) {
			return i;
		}
	}

	return -1;
};

Array.prototype.sum = function sum<T extends number>(this: Array<T>): number {
	return this.reduce(function(a: number, b: number) {
		return a + b;
	}, 0);
};

type OriginalSort<T> = (this: Array<T>, compareFn?: (a: T, b: T) => number) => T[];

(<T>(originalSort: OriginalSort<T>) => {
	function bothAreStringLike(val1: any, val2: any) {
		return (typeof val1 === 'string' || val1 === null || val1 === undefined) && (typeof val2 === 'string' || val2 === null || val2 === undefined);
	}

	function sort(this: Array<T>, compareFn?: ((a: T, b: T) => number) | undefined): Array<T>;
	function sort(this: Array<T>, direction: boolean, options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
	function sort(this: Array<T>, field: string, options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
	function sort(this: Array<T>, fields: string[], options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
	function sort(this: Array<T>, fields: Record<string, boolean>, options?: { ignoreCase?: boolean, find?: string, replace?: string }): Array<T>;
	function sort(this: Array<T>, arg: ((a: T, b: T) => number) | boolean | string | string[] | Record<string, boolean> | undefined, options: { ignoreCase?: boolean, find?: string, replace?: string } = {}): Array<T> {
		const array = this as Array<T>;

		if (typeof arg === 'undefined') {
			return originalSort.call(this);
		}

		if (typeof arg === 'function') {
			return originalSort.call(this, arg);
		}

		if (typeof arg === 'boolean') {
			return array.sort({ '' : arg }, options);
		}

		if (typeof arg === 'string') {
			return array.sort({ [arg] : true }, options);
		}

		if (Array.isArray(arg)) {
			const fields: Record<string, boolean> = {};
			arg.forEach((field) => fields[field] = true);
			return array.sort(fields, options);
		}

		return originalSort.call(array, function(item1: T, item2: T) {
			for (const field in arg) {
				const direction = arg[field];
				let val1: any   = item1;
				let val2: any   = item2;

				if (field.includes('.') && !(field in val1)) {
					for (const fieldPath of field.split('.')) {
						val1 = val1[fieldPath];
						val2 = val2[fieldPath];
					}
				} else if (field) {
					val1 = val1[field];
					val2 = val2[field];
				}

				if (bothAreStringLike(val1, val2) || options.ignoreCase || options.find) {
					val1 = (val1 || '').toString();
					val2 = (val2 || '').toString();
				}

				if (options.ignoreCase) {
					val1 = val1.toLowerCase();
					val2 = val2.toLowerCase();
				}

				if (options.find) {
					val1 = val1.replace(options.find, options.replace);
					val2 = val2.replace(options.find, options.replace);
				}

				if (val2 < val1) {
					return direction ? 1 : -1;
				}

				if (val2 > val1) {
					return direction ? -1 : 1;
				}
			}

			return 0;
		});
	}

	Array.prototype.sort = sort;
})(Array.prototype.sort);
