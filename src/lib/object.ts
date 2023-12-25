declare global {
    interface Array<T> {
        filter<S extends T>(
            predicate: (this: void, value: T, index: number, obj: T[]) => value is S,
            thisArg?: any
        ): S[];
    }

    interface Object {
        ownKeys: <K extends string, V>(obj: Record<K, V>, allKeys?: readonly K[]) => K[],
    }
}

export {};

Object.ownKeys = <K extends string, V>(obj: Record<K, V>, allKeys?: readonly K[]) => {
	function isOwnKey(key: keyof any): key is K {
		return allKeys?.includes(key as K) ?? true;
	}

	return Object.keys(obj).filter<K>(isOwnKey);
};
