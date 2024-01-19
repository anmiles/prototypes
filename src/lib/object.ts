declare global {
    interface Array<T> {
        filter<S extends T>(
            predicate: (this: void, value: T, index: number, obj: T[]) => value is S,
            thisArg?: any,
        ): S[];
    }

    interface Object {
        fill: <K extends string, V>(keys: readonly K[], getValue: (key: K) => V) => Record<K, V>;
        ownKeys: <K extends string, V>(obj: Record<K, V>, allKeys: string[] | readonly K[]) => K[];
    }
}

export {};

Object.fill = <K extends string, V>(keys: readonly K[], getValue: (key: K) => V): Record<K, V> => {
	const obj = {} as Record<K, V>;

	for (const key of keys) {
		obj[key] = getValue(key);
	}

	return obj;
};

Object.ownKeys = <K extends string, V>(obj: Record<K, V>, allKeys: K[]): K[] => {
	function isOwnKey(key: keyof any): key is K {
		return allKeys.includes(key as K);
	}

	return Object.keys(obj).filter<K>(isOwnKey);
};
