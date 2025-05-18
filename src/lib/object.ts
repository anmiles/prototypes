declare global {
	interface Array<T> {
		filter<S extends T>(
			predicate: (this: T[], value: T, index: number, obj: T[])=> value is S,
			thisArg?: unknown,
		): S[];
	}

	interface Object {
		fill: <K extends string, V>(keys: readonly K[], getValue: (key: K)=> V)=> Record<K, V>;
		typedKeys: <K extends string, V>(obj: Record<K, V>, allKeys: string[] | readonly string[])=> K[];
		typedEntries: <K extends string, V>(obj: Record<K, V>, allKeys: string[] | readonly string[])=> [K, V][];
	}
}

Object.fill = <K extends string, V>(keys: readonly K[], getValue: (key: K)=> V): Record<K, V> => {
	const obj = {} as Record<K, V>; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

	for (const key of keys) {
		obj[key] = getValue(key);
	}

	return obj;
};

Object.typedKeys = <K extends string, V>(obj: Record<K, V>, allKeys: string[] | readonly string[]): K[] => {
	function isOwnKey(key: number | string | symbol): key is K {
		return allKeys.includes(String(key));
	}

	return Object.keys(obj).filter<K>(isOwnKey);
};

Object.typedEntries = <K extends string, V>(
	obj: Record<K, V>,
	allKeys: string[] | readonly string[],
): [K, V][] => Object
	.typedKeys(obj, allKeys)
	.map((key) => [ key, obj[key] ]);

export {};

