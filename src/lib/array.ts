declare global {
	interface Array<T> {
		unique(this: Array<T>): Array<T>;
		equals(this: Array<T>, array: Array<T>): boolean;
		indexFieldOf<T extends Record<string, unknown>>(this: Array<T>, fields: string[] | string, searchTerm: unknown, skip?: number): number;
		sum<T extends number>(this: Array<T>): number;
		sort(this: Array<T>, compareFn?: ((a: T, b: T)=> number) | undefined): Array<T>;
		sort(this: Array<T>, direction: boolean, options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
		sort(this: Array<T>, field: string, options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
		sort(this: Array<T>, fields: Record<string, boolean> | string[], options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
		forEachAsync(this: Array<T>, func: (item: T, index: number, array: T[])=> Promise<void>): Promise<void>;
		mapAsync<T2>(this: Array<T>, func: (item: T, index: number, array: T[])=> Promise<T2>): Promise<Array<T2>>;
	}
}

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

Array.prototype.indexFieldOf = function indexFieldOf<T extends Record<string, unknown>>(
	this: Array<T>,
	fields: string[] | string,
	searchTerm: unknown,
	skip = 0,
): number {
	if (typeof fields === 'string') {
		fields = [ fields ];
	}

	for (let i = Math.max(0, skip); i < this.length; i++) {
		let val = this[i];

		for (const field of fields) {
			val = val?.[field] as T | undefined; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

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

type OriginalSort<T> = (this: Array<T>, compareFn?: (a: T, b: T)=> number)=> T[];

(<T>(originalSort: OriginalSort<T>) => {
	function isRecord(obj: unknown): obj is Record<string, unknown> {
		return typeof obj === 'object' && obj !== null;
	}

	function getObjectField(obj: unknown, field: string): unknown {
		if (field === '') {
			return obj;
		}

		if (!isRecord(obj)) {
			throw new TypeError(`Failed to access a key or key sequence '${field}' in a non-object value: ${JSON.stringify(obj)}`);
		}

		if (field in obj) {
			return obj[field];
		}

		let value: unknown = obj;

		if (field.includes('.')) {
			for (const fieldPath of field.split('.')) {
				if (!isRecord(value)) {
					throw new TypeError(`Failed to access a key or key sequence '${fieldPath}' in a nested non-object value: ${JSON.stringify(value)}`);
				}
				if (fieldPath in value) {
					value = value[fieldPath];
				} else {
					throw new TypeError(`Failed to access an unknown key '${fieldPath}' as a part of sequence '${field}' in an object: ${JSON.stringify(value)}`);
				}
			}
		} else {
			throw new TypeError(`Failed to access an unknown key '${field}' in an object: ${JSON.stringify(value)}`);
		}

		return value;
	}

	function applyOptions(val: unknown, options?: { ignoreCase?: boolean; find?: string; replace?: string }): unknown {
		val = val ?? '';

		if (options?.ignoreCase ?? options?.find) {
			if (typeof val !== 'string') {
				throw new TypeError(`Cannot use 'ignoreCase' or 'find' options on non-string value: ${JSON.stringify(val)}`);
			}

			let str = val;

			if (options.ignoreCase) {
				str = str.toLowerCase();
			}

			if (options.find) {
				str = str.replace(options.find, options.replace ?? '');
			}

			return str;
		} else {
			return val;
		}
	}

	function normalize([ val1, val2 ]: [unknown, unknown]): [number, number] | [string, string] {
		if (typeof val1 === 'number' && typeof val2 === 'number') {
			return [ val1, val2 ];
		}

		if ((typeof val1 === 'number' || typeof val1 === 'string') && (typeof val2 === 'number' || typeof val2 === 'string')) {
			return [ val1.toString(), val2.toString() ];
		}

		return [ JSON.stringify(val1), JSON.stringify(val2) ];
	}

	function sort(this: Array<T>, compareFn?: ((a: T, b: T)=> number) | undefined): Array<T>;
	function sort(this: Array<T>, direction: boolean, options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
	function sort(this: Array<T>, field: string, options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
	function sort(this: Array<T>, fields: string[], options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
	function sort(this: Array<T>, fields: Record<string, boolean>, options?: { ignoreCase?: boolean; find?: string; replace?: string }): Array<T>;
	function sort(
		this: Array<T>,
		arg: Record<string, boolean> | string[] | boolean | string | ((a: T, b: T)=> number) | undefined,
		options: { ignoreCase?: boolean; find?: string; replace?: string } = {},
	): Array<T> {
		if (typeof arg === 'undefined') {
			return originalSort.call(this);
		}

		if (typeof arg === 'function') {
			return originalSort.call(this, arg);
		}

		if (typeof arg === 'boolean') {
			return this.sort({ '': arg }, options);
		}

		if (typeof arg === 'string') {
			return this.sort({ [arg]: true }, options);
		}

		if (Array.isArray(arg)) {
			const fields: Record<string, boolean> = {};
			arg.forEach((field) => fields[field] = true);
			return this.sort(fields, options);
		}

		return originalSort.call(this, function(item1: T, item2: T) {
			for (const field in arg) {
				const direction = arg[field];

				const val1 = applyOptions(getObjectField(item1, field), options);
				const val2 = applyOptions(getObjectField(item2, field), options);

				const [ n1, n2 ] = normalize([ val1, val2 ]);

				if (n2 < n1) {
					return direction ? 1 : -1;
				}

				if (n2 > n1) {
					return direction ? -1 : 1;
				}
			}

			return 0;
		});
	}

	Array.prototype.sort = sort;
})(Array.prototype.sort);

Array.prototype.forEachAsync = async function forEachAsync<T>(this: Array<T>, func: (item: T, index: number, array: T[])=> Promise<void>): Promise<void> {
	for (let index = 0; index < this.length; index++) {
		await func(this[index]!, index, this);
	}
};

Array.prototype.mapAsync = async function mapAsync<T, T2>(this: Array<T>, func: (item: T, index: number, array: T[])=> Promise<T2>): Promise<Array<T2>> {
	const result: Array<T2> = [];

	for (let index = 0; index < this.length; index++) {
		result.push(await func(this[index]!, index, this));
	}

	return result;
};

export {};
