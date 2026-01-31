declare global {
	interface Map<K, V> {
		forEachAsync(this: Map<K, V>, func: (value: V, key: K, map: Map<K, V>) => Promise<void>): Promise<void>;
		getOrCreate(this: Map<K, V>, key: K, defaultValue: V): V;
	}
}

Map.prototype.forEachAsync = async function forEachAsync<K, V>(this: Map<K, V>, func: (value: V, key: K, map: Map<K, V>) => Promise<void>): Promise<void> {
	for (const [ key, value ] of this.entries()) {
		await func(value, key, this);
	}
};

Map.prototype.getOrCreate = function getOrCreate<K, V>(this: Map<K, V>, key: K, defaultValue: V): V {
	if (this.has(key)) {
		return this.get(key)!;
	}

	this.set(key, defaultValue);
	return defaultValue;
};

export {};
