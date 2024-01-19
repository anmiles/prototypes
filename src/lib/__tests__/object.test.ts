import '../object';

describe('src/lib/object', () => {
	describe('fill', () => {
		it('should create an object with specified keys and specified default values', () => {
			const keys  = [ 'key1', 'key2', 'key3' ] as const;
			const value = { name : 'value' };

			const obj = Object.fill(keys, () => value);

			expect(obj).toEqual({
				key1 : { name : 'value' },
				key2 : { name : 'value' },
				key3 : { name : 'value' },
			});
		});

		it('should calculate default values from keys', () => {
			const keys     = [ 'key1', 'key2', 'key3' ] as const;
			const getValue = (key: typeof keys[number]) => ({ name : 'value', key });

			const obj = Object.fill(keys, getValue);

			expect(obj).toEqual({
				key1 : { name : 'value', key : 'key1' },
				key2 : { name : 'value', key : 'key2' },
				key3 : { name : 'value', key : 'key3' },
			});
		});
	});

	describe('ownKeys', () => {
		it('should return strictly typed keys of an object with defined set of keys', () => {
			const data = {
				a : 10,
				b : 'str',
				c : 3,
			} as const;

			const targetKeys = [ 'a', 'b' ] as const;

			const targetObj: { [ K in typeof targetKeys[number]]: typeof data[K] } = data;

			const ownKeys = Object.ownKeys(targetObj, [ 'a', 'b' ]);
			expect(ownKeys).toEqual([ 'a', 'b' ]);
		});

		it('should return only sub-set of keys that has been explicitly requested', () => {
			const data = {
				a : 10,
				b : 'str',
				c : 3,
			} as const;

			const targetKeys = [ 'a', 'b' ] as const;

			const targetObj: { [ K in typeof targetKeys[number]]: typeof data[K] } = data;

			const ownKeys = Object.ownKeys(targetObj, [ 'b' ]);
			expect(ownKeys).toEqual([ 'b' ]);
		});
	});

	describe('ownEntries', () => {
		it('should return array of strictly typed entries of an object with defined set of keys', () => {
			const data = {
				a : 10,
				b : 'str',
				c : 3,
			} as const;

			const targetKeys = [ 'a', 'b' ] as const;

			const targetObj: { [ K in typeof targetKeys[number]]: typeof data[K] } = data;

			const ownEntries = Object.ownEntries(targetObj, [ 'a', 'b' ]);
			expect(ownEntries).toEqual([ [ 'a', 10 ], [ 'b', 'str' ] ]);
		});

		it('should return only sub-set of entries if not all requested keys actually present', () => {
			const data = {
				a : 10,
				b : 'str',
				c : 3,
			} as const;

			const targetKeys = [ 'a', 'b' ] as const;

			const targetObj: { [ K in typeof targetKeys[number]]: typeof data[K] } = data;

			const ownEntries = Object.ownEntries(targetObj, [ 'b' ]);
			expect(ownEntries).toEqual([ [ 'b', 'str' ] ]);
		});
	});
});
