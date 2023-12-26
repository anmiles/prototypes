declare global {
    interface Array<T> {
        filter<S extends T>(
            predicate: (this: void, value: T, index: number, obj: T[]) => value is S,
            thisArg?: any
        ): S[];
    }

    interface Object {
        fill: <K extends string, V>(keys: readonly K[], value: V) => Record<K, V>;
        ownKeys: <K extends string, V>(obj: Record<K, V>, allKeys?: readonly K[]) => K[],
    }
}

export {};

Object.fill = <K extends string, V>(keys: readonly K[], value: V): Record<K, V> => {
	const obj = {} as Record<K, V>;

	for (const key of keys) {
		obj[key] = value;
	}

	return obj;
};

Object.ownKeys = <K extends string, V>(obj: Record<K, V>, allKeys?: readonly K[]): K[] => {
	function isOwnKey(key: keyof any): key is K {
		return allKeys?.includes(key as K) ?? true;
	}

	return Object.keys(obj).filter<K>(isOwnKey);
};
