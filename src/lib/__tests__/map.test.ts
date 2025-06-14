import '../map';

describe('src/lib/map', () => {
	describe('forEachAsync', () => {
		it('should asynchronously iterate a map with applying asynchronous callback function to each entry', async () => {
			const map = new Map<string, number>([
				[ 'key1', 1 ],
				[ 'key2', 2 ],
				[ 'key3', 3 ],
			]);

			const spy = jest.fn();

			const func = async (value: number, key: string, map: Map<string, number>): Promise<void> => new Promise((resolve) => {
				setTimeout(() => {
					spy(value, key, map);
					resolve();
				}, 0);
			});

			await map.forEachAsync(func);

			expect(spy.mock.calls).toEqual([ [ 1, 'key1', map ], [ 2, 'key2', map ], [ 3, 'key3', map ] ]);
		});
	});

	describe('getOrCreate', () => {
		it('should return value if key exists', () => {
			const map = new Map<string, number>([
				[ 'key1', 1 ],
				[ 'key2', 2 ],
				[ 'key3', 3 ],
			]);

			const value = map.getOrCreate('key2', 4);

			expect(value).toEqual(2);
		});

		it('should return default value if key not exists', () => {
			const map = new Map<string, number>([
				[ 'key1', 1 ],
				[ 'key2', 2 ],
				[ 'key3', 3 ],
			]);

			const value = map.getOrCreate('key4', 4);

			expect(value).toEqual(4);

			expect(map).toEqual(new Map<string, number>([
				[ 'key1', 1 ],
				[ 'key2', 2 ],
				[ 'key3', 3 ],
				[ 'key4', 4 ],
			]));
		});
	});
});
