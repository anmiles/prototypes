import '../array';

describe('src/lib/array', () => {
	describe('unique', () => {
		it('should remove duplicates', () => {
			expect([ 1, '2', 3, '2', 1 ].unique()).toEqual([ 1, '2', 3 ]);
		});

		it('should be type-sensitive', () => {
			expect([ 1, '2', 3, 2, 1 ].unique()).toEqual([ 1, '2', 3, 2 ]);
			expect([ 1, '2', 3, 2, 1 ].unique()).not.toEqual([ 1, '2', 3 ]);
		});
	});

	describe('equals', () => {
		it('should return false on different length', () => {
			expect([ 1, '2', 3 ].equals([ 1, '2' ])).toEqual(false);
		});

		it('should return false on different items', () => {
			expect([ 1, '2', 3 ].equals([ 1, '2', 4 ])).toEqual(false);
			expect([ 1, '2', 3 ].equals([ 1, '2', '3' ])).toEqual(false);
		});

		it('should return true on equal items', () => {
			expect([ 1, '2', 3 ].equals([ 1, '2', 3 ])).toEqual(true);
		});
	});

	describe('indexFieldOf', () => {
		it('should search the array of objects for an object which field equals to specified term', () => {
			expect([ { a: 2 }, { a: 3 }, { a: 5 }, { a: 3 } ].indexFieldOf('a', 3)).toEqual(1);
		});

		it('should skip specified number of array elements', () => {
			expect([ { a: 'b' }, { a: 'c' }, { a: 'd' }, { a: 'c' } ].indexFieldOf('a', 'c', 2)).toEqual(3);
		});

		it('should work with chain of fields', () => {
			expect([ { a: { n: true } }, { b: 0 }, { a: { n: false } }, { a: { m: true } } ].indexFieldOf([ 'a', 'n' ], false)).toEqual(2);
		});

		it('should return -1 if nothing found', () => {
			expect([ { a: { n: true } }, { b: 0 }, { a: { n: false } }, { a: { m: true } } ].indexFieldOf([ 'a', 'm' ], false)).toEqual(-1);
		});
	});

	describe('sum', () => {
		it('should sum all values of array', () => {
			expect([ 1, 2, 4, 8 ].sum()).toEqual(15);
		});
	});

	describe('sort', () => {
		it('should sort array using default sort function', () => {
			expect([ 1, 4, 6, 2, 5, 7 ].sort()).toEqual([ 1, 2, 4, 5, 6, 7 ]);
		});

		it('should sort array using default sort function if argument is function', () => {
			expect([ 1, 4, 6, 2, 5, 7 ].sort(function sort(a: number, b: number) {
				if (a % 2 === 0 && b % 2 !== 0) {
					return 1;
				}

				if (a % 2 !== 0 && b % 2 === 0) {
					return -1;
				}

				return 0;
			})).toEqual([ 1, 5, 7, 4, 6, 2 ]);
		});

		it('should sort array alphabetically ascending if no arguments specified', () => {
			expect([ 'banana', 'orange', 'apple' ].sort()).toEqual([ 'apple', 'banana', 'orange' ]);
		});

		it('should sort array alphabetically ascending if true specified', () => {
			expect([ 'banana', 'orange', 'apple' ].sort(true)).toEqual([ 'apple', 'banana', 'orange' ]);
		});

		it('should sort array alphabetically descending if false specified', () => {
			expect([ 'banana', 'orange', 'apple' ].sort(false)).toEqual([ 'orange', 'banana', 'apple' ]);
		});

		it('should sort array of objects by field', () => {
			expect([
				{ a: 4, b: 2 },
				{ a: 2, b: 4 },
				{ a: 3, b: 4 },
				{ a: 2, b: 2 },
			].sort('b')).toEqual([
				{ a: 4, b: 2 },
				{ a: 2, b: 2 },
				{ a: 2, b: 4 },
				{ a: 3, b: 4 },
			]);
		});

		it('should sort array of objects by multiple fields', () => {
			expect([
				{ a: 4, b: 2 },
				{ a: 2, b: 4 },
				{ a: 3, b: 4 },
				{ a: 2, b: 2 },
			].sort([ 'a', 'b' ])).toEqual([
				{ a: 2, b: 2 },
				{ a: 2, b: 4 },
				{ a: 3, b: 4 },
				{ a: 4, b: 2 },
			]);
		});

		it('should sort array of objects by stringified field if it points to an object-like property', () => {
			expect([
				{ a: 4, b: { c: 2 } },
				{ a: 2, b: { c: 4 } },
				{ a: 3, b: { c: 4 } },
				{ a: 2, b: { c: 2 } },
			].sort('b')).toEqual([
				{ a: 4, b: { c: 2 } },
				{ a: 2, b: { c: 2 } },
				{ a: 2, b: { c: 4 } },
				{ a: 3, b: { c: 4 } },
			]);
		});

		it('should treat dot-containing path as field name if it exists', () => {
			expect([
				{ 'a': 4, 'b.c': 2 },
				{ 'a': 2, 'b.c': 4 },
				{ 'a': 3, 'b.c': 4 },
				{ 'a': 2, 'b.c': 2 },
			].sort([ 'a', 'b.c' ])).toEqual([
				{ 'a': 2, 'b.c': 2 },
				{ 'a': 2, 'b.c': 4 },
				{ 'a': 3, 'b.c': 4 },
				{ 'a': 4, 'b.c': 2 },
			]);
		});

		it('should treat dot-containing path as combined path if it does not exist', () => {
			expect([
				{ a: 4, b: { c: 2 } },
				{ a: 2, b: { c: 4 } },
				{ a: 3, b: { c: 4 } },
				{ a: 2, b: { c: 2 } },
			].sort([ 'a', 'b.c' ])).toEqual([
				{ a: 2, b: { c: 2 } },
				{ a: 2, b: { c: 4 } },
				{ a: 3, b: { c: 4 } },
				{ a: 4, b: { c: 2 } },
			]);
		});

		it('should sort array of objects by multiple fields with direction', () => {
			expect([
				{ a: 4, b: 2 },
				{ a: 2, b: 4 },
				{ a: 3, b: 4 },
				{ a: 2, b: 2 },
			].sort({ b: false, a: true })).toEqual([
				{ a: 2, b: 4 },
				{ a: 3, b: 4 },
				{ a: 2, b: 2 },
				{ a: 4, b: 2 },
			]);
		});

		it('should sort different cases if arguments are strings', () => {
			expect([
				{ a: 'D', b: 'd' },
				{ a: 'D', b: 'D' },
				{ a: 'c', b: 'd' },
				{ a: 'B', b: 'B' },
			].sort({ b: false, a: true })).toEqual([
				{ a: 'D', b: 'd' },
				{ a: 'c', b: 'd' },
				{ a: 'D', b: 'D' },
				{ a: 'B', b: 'B' },
			]);
		});

		it('should not be affected by empty options', () => {
			expect([
				{ a: 'D', b: 'd' },
				{ a: 'D', b: 'D' },
				{ a: 'c', b: 'd' },
				{ a: 'B', b: 'B' },
			].sort({ b: false, a: true }, {})).toEqual([
				{ a: 'D', b: 'd' },
				{ a: 'c', b: 'd' },
				{ a: 'D', b: 'D' },
				{ a: 'B', b: 'B' },
			]);
		});

		it('should treat null as empty string if arguments are strings or nullish', () => {
			expect([
				{ a: 'D', b: 'd' },
				{ a: 'D', b: null },
				{ a: null, b: 'd' },
				{ a: 'B', b: 'B' },
			].sort({ b: false, a: true })).toEqual([
				{ a: null, b: 'd' },
				{ a: 'D', b: 'd' },
				{ a: 'B', b: 'B' },
				{ a: 'D', b: null },
			]);
		});

		it('should treat undefined as empty string if arguments are strings or nullish', () => {
			expect([
				{ a: 'D', b: 'd' },
				{ a: 'D', b: undefined },
				{ a: undefined, b: 'd' },
				{ a: 'B', b: 'B' },
			].sort({ b: false, a: true })).toEqual([
				{ a: undefined, b: 'd' },
				{ a: 'D', b: 'd' },
				{ a: 'B', b: 'B' },
				{ a: 'D', b: undefined },
			]);
		});

		it('should sort different cases with ignoreCase', () => {
			expect([
				{ a: 'D', b: 'b' },
				{ a: 'D', b: 'D' },
				{ a: 'c', b: 'd' },
				{ a: 'B', b: 'B' },
			].sort({ b: false, a: true }, { ignoreCase: true })).toEqual([
				{ a: 'c', b: 'd' },
				{ a: 'D', b: 'D' },
				{ a: 'B', b: 'B' },
				{ a: 'D', b: 'b' },
			]);
		});

		it('should treat null or undefined as empty string with ignoreCase', () => {
			expect([
				{ a: undefined, b: 'b' },
				{ a: 'D', b: null },
				{ a: 'c', b: 'd' },
				{ a: 'B', b: 'B' },
			].sort({ b: false, a: true }, { ignoreCase: true })).toEqual([
				{ a: 'c', b: 'd' },
				{ a: undefined, b: 'b' },
				{ a: 'B', b: 'B' },
				{ a: 'D', b: null },
			]);
		});

		it('should use find and replace', () => {
			expect([
				{ a: 'a2', b: 'b2' },
				{ a: 'a2', b: 'b1' },
				{ a: 'a1', b: 'b2' },
				{ a: 'a1', b: 'b1' },
			].sort({ b: false, a: true }, { find: '1', replace: '3' })).toEqual([
				{ a: 'a2', b: 'b1' },
				{ a: 'a1', b: 'b1' },
				{ a: 'a2', b: 'b2' },
				{ a: 'a1', b: 'b2' },
			]);
		});

		it('should replace with an empty string if `replace` option is not specified', () => {
			expect([
				{ a: 'a2', b: 'b2' },
				{ a: 'a2', b: 'b1' },
				{ a: 'a1', b: 'b2' },
				{ a: 'a1', b: 'b1' },
			].sort({ b: false, a: true }, { find: '2' })).toEqual([
				{ a: 'a2', b: 'b1' },
				{ a: 'a1', b: 'b1' },
				{ a: 'a2', b: 'b2' },
				{ a: 'a1', b: 'b2' },
			]);
		});

		it('should treat null or undefined as empty string when find and replace', () => {
			expect([
				{ a: 'a2', b: 'b2' },
				{ a: 'a2', b: 'b1' },
				{ a: 'a1', b: null },
				{ a: undefined, b: 'b1' },
			].sort({ b: false, a: true }, { find: '1', replace: '3' })).toEqual([
				{ a: undefined, b: 'b1' },
				{ a: 'a2', b: 'b1' },
				{ a: 'a2', b: 'b2' },
				{ a: 'a1', b: null },
			]);
		});

		it('should throw error when trying to access a key in a non-object value', () => {
			expect(() => [
				{ a: 4 },
				{ a: 2 },
				{ a: 3 },
				{ a: 2 },
				'not an object',
			].sort('a'))
				.toThrow(new Error('Failed to access a key or key sequence \'a\' in a non-object value: "not an object"'));
		});

		it('should throw error when trying to a key sequence in a non-object value', () => {
			expect(() => [
				{ b: { c: 2 } },
				{ b: { c: 4 } },
				'not an object',
			].sort([ 'b.c' ]))
				.toThrow(new Error('Failed to access a key or key sequence \'b.c\' in a non-object value: "not an object"'));
		});

		it('should throw error when trying to access a nested key in a nested non-object value', () => {
			expect(() => [
				{ b: { c: 2 } },
				{ b: { c: 4 } },
				{ b: 'not an object' },
			].sort([ 'b.c' ]))
				.toThrow(new Error('Failed to access a key or key sequence \'c\' in a nested non-object value: "not an object"'));
		});

		it('should throw error when trying to access an unknown key', () => {
			expect(() => [
				{ b: { c: 2 } },
				{ b: { c: 4 } },
			].sort([ 'a' ]))
				.toThrow(new Error('Failed to access an unknown key \'a\' in an object: {"b":{"c":4}}'));
		});

		it('should throw error when trying to access an unknown key as a part of sequence', () => {
			expect(() => [
				{ b: { c: 2 } },
				{ b: { c: 4 } },
			].sort([ 'b.d' ]))
				.toThrow(new Error('Failed to access an unknown key \'d\' as a part of sequence \'b.d\' in an object: {"c":4}'));
		});

		it('should throw when applying `ignoreCase` option to a non-string value', () => {
			expect(() => [
				{ a: 'a2', b: 'b2' },
				{ a: 'a2', b: 1 },
			].sort({ b: false }, { ignoreCase: true }))
				.toThrow(new Error('Cannot use \'ignoreCase\' or \'find\' options on non-string value: 1'));
		});

		it('should throw when applying `find` option to a non-string value', () => {
			expect(() => [
				{ a: 'a2', b: 'b2' },
				{ a: 'a2', b: 2 },
			].sort({ b: false, a: true }, { find: 'a', replace: 'c' }))
				.toThrow(new Error('Cannot use \'ignoreCase\' or \'find\' options on non-string value: 2'));
		});
	});

	describe('forEachAsync', () => {
		it('should asynchronously iterate an array with applying asynchronous callback function to each item', async () => {
			const array = [
				{ value: 1 },
				{ value: 2 },
				{ value: 3 },
			];

			const spy = jest.fn();

			const func = async (item: { value: number }): Promise<void> => new Promise((resolve) => {
				setTimeout(() => {
					spy(item.value);
					resolve();
				}, 0);
			});

			await array.forEachAsync(func);

			expect(spy.mock.calls).toEqual([ [ 1 ], [ 2 ], [ 3 ] ]);
		});
	});

	describe('mapAsync', () => {
		it('should asynchronously iterate an array with applying asynchronous callback function to each item and return array of applied items', async () => {
			const array = [
				{ value: 1 },
				{ value: 2 },
				{ value: 3 },
			];

			const func = async (item: { value: number }): Promise<string> => new Promise((resolve) => {
				setTimeout(() => {
					resolve(String(item.value));
				}, 0);
			});

			const result = await array.mapAsync(func);

			expect(result).toEqual([ '1', '2', '3' ]);
		});
	});

	describe('toTuple', () => {
		it('should return tuple that equals to array if array length is expected', () => {
			const array = [
				{ value: 1 },
				{ value: 2 },
				{ value: 3 },
			];

			const tuple = array.toTuple(3);

			expect(tuple).toEqual(array);
		});
		it('should throw if array length is not expected', () => {
			const array = [
				{ value: 1 },
				{ value: 2 },
				{ value: 3 },
			];

			expect(() => array.toTuple(2)).toThrow(new Error('Expected array to have length 2 in order to be casted to the tuple, but received length 3'));
		});
	});
});
