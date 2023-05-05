import '../array';

describe('src/lib/array', function() {
	describe('unique', function() {
		it('should remove duplicates', function() {
			expect([ 1, '2', 3, '2', 1 ].unique()).toEqual([ 1, '2', 3 ]);
		});

		it('should be type-sensitive', function() {
			expect([ 1, '2', 3, 2, 1 ].unique()).toEqual([ 1, '2', 3, 2 ]);
			expect([ 1, '2', 3, 2, 1 ].unique()).not.toEqual([ 1, '2', 3 ]);
		});
	});

	describe('equals', function() {
		it('should return false on different length', function() {
			expect([ 1, '2', 3 ].equals([ 1, '2' ])).toEqual(false);
		});

		it('should return false on different items', function() {
			expect([ 1, '2', 3 ].equals([ 1, '2', 4 ])).toEqual(false);
			expect([ 1, '2', 3 ].equals([ 1, '2', '3' ])).toEqual(false);
		});

		it('should return true on equal items', function() {
			expect([ 1, '2', 3 ].equals([ 1, '2', 3 ])).toEqual(true);
		});
	});

	describe('indexFieldOf', function() {
		it('should search the array of objects for an object which field equals to specified term', function() {
			expect([ { a : 2 }, { a : 3 }, { a : 5 }, { a : 3 } ].indexFieldOf('a', 3)).toEqual(1);
		});

		it('should skip specified number of array elements', function() {
			expect([ { a : 'b' }, { a : 'c' }, { a : 'd' }, { a : 'c' } ].indexFieldOf('a', 'c', 2)).toEqual(3);
		});

		it('should work with chain of fields', function() {
			expect([ { a : { n : true } }, { b : 0 }, { a : { n : false } }, { a : { m : true } } ].indexFieldOf([ 'a', 'n' ], false)).toEqual(2);
		});

		it('should return -1 if nothing found', function() {
			expect([ { a : { n : true } }, { b : 0 }, { a : { n : false } }, { a : { m : true } } ].indexFieldOf([ 'a', 'm' ], false)).toEqual(-1);
		});
	});

	describe('sum', function() {
		it('should sum all values of array', function() {
			expect([ 1, 2, 4, 8 ].sum()).toEqual(15);
		});
	});

	describe('sort', function() {
		it('should sort array using default sort function', function() {
			expect([ 1, 4, 6, 2, 5, 7 ].sort()).toEqual([ 1, 2, 4, 5, 6, 7 ]);
		});

		it('should sort array using default sort function if argument is function', function() {
			expect([ 1, 4, 6, 2, 5, 7 ].sort(function(a: number, b: number) {
				if (a % 2 === 0 && b % 2 !== 0) {
					return 1;
				}

				if (a % 2 !== 0 && b % 2 === 0) {
					return -1;
				}

				return 0;
			})).toEqual([ 1, 5, 7, 4, 6, 2 ]);
		});

		it('should sort array alphabetically ascending if no arguments specified', function() {
			expect([ 'banana', 'orange', 'apple' ].sort()).toEqual([ 'apple', 'banana', 'orange' ]);
		});

		it('should sort array alphabetically ascending if true specified', function() {
			expect([ 'banana', 'orange', 'apple' ].sort(true)).toEqual([ 'apple', 'banana', 'orange' ]);
		});

		it('should sort array alphabetically descending if false specified', function() {
			expect([ 'banana', 'orange', 'apple' ].sort(false)).toEqual([ 'orange', 'banana', 'apple' ]);
		});

		it('should sort array of objects by field', function() {
			expect([
				{ a : 4, b : 2 },
				{ a : 2, b : 4 },
				{ a : 3, b : 4 },
				{ a : 2, b : 2 },
			].sort('b')).toEqual([
				{ a : 4, b : 2 },
				{ a : 2, b : 2 },
				{ a : 2, b : 4 },
				{ a : 3, b : 4 },
			]);
		});

		it('should sort array of objects by multiple fields', function() {
			expect([
				{ a : 4, b : 2 },
				{ a : 2, b : 4 },
				{ a : 3, b : 4 },
				{ a : 2, b : 2 },
			].sort([ 'a', 'b' ])).toEqual([
				{ a : 2, b : 2 },
				{ a : 2, b : 4 },
				{ a : 3, b : 4 },
				{ a : 4, b : 2 },
			]);
		});

		it('should treat dot-containing path as field name if it exists', function() {
			expect([
				{ 'a' : 4, 'b.c' : 2 },
				{ 'a' : 2, 'b.c' : 4 },
				{ 'a' : 3, 'b.c' : 4 },
				{ 'a' : 2, 'b.c' : 2 },
			].sort([ 'a', 'b.c' ])).toEqual([
				{ 'a' : 2, 'b.c' : 2 },
				{ 'a' : 2, 'b.c' : 4 },
				{ 'a' : 3, 'b.c' : 4 },
				{ 'a' : 4, 'b.c' : 2 },
			]);
		});

		it('should treat dot-containing path as combined path if it does not exist', function() {
			expect([
				{ a : 4, b : { c : 2 } },
				{ a : 2, b : { c : 4 } },
				{ a : 3, b : { c : 4 } },
				{ a : 2, b : { c : 2 } },
			].sort([ 'a', 'b.c' ])).toEqual([
				{ a : 2, b : { c : 2 } },
				{ a : 2, b : { c : 4 } },
				{ a : 3, b : { c : 4 } },
				{ a : 4, b : { c : 2 } },
			]);
		});

		it('should sort array of objects by multiple fields with direction', function() {
			expect([
				{ a : 4, b : 2 },
				{ a : 2, b : 4 },
				{ a : 3, b : 4 },
				{ a : 2, b : 2 },
			].sort({ b : false, a : true })).toEqual([
				{ a : 2, b : 4 },
				{ a : 3, b : 4 },
				{ a : 2, b : 2 },
				{ a : 4, b : 2 },
			]);
		});

		it('should sort different cases if arguments are strings', function() {
			expect([
				{ a : 'D', b : 'd' },
				{ a : 'D', b : 'D' },
				{ a : 'c', b : 'd' },
				{ a : 'B', b : 'B' },
			].sort({ b : false, a : true })).toEqual([
				{ a : 'D', b : 'd' },
				{ a : 'c', b : 'd' },
				{ a : 'D', b : 'D' },
				{ a : 'B', b : 'B' },
			]);
		});

		it('should not be affected by empty options', function() {
			expect([
				{ a : 'D', b : 'd' },
				{ a : 'D', b : 'D' },
				{ a : 'c', b : 'd' },
				{ a : 'B', b : 'B' },
			].sort({ b : false, a : true }, {})).toEqual([
				{ a : 'D', b : 'd' },
				{ a : 'c', b : 'd' },
				{ a : 'D', b : 'D' },
				{ a : 'B', b : 'B' },
			]);
		});

		it('should treat null as empty string if arguments are strings or nullish', function() {
			expect([
				{ a : 'D', b : 'd' },
				{ a : 'D', b : null },
				{ a : null, b : 'd' },
				{ a : 'B', b : 'B' },
			].sort({ b : false, a : true })).toEqual([
				{ a : null, b : 'd' },
				{ a : 'D', b : 'd' },
				{ a : 'B', b : 'B' },
				{ a : 'D', b : null },
			]);
		});

		it('should treat undefined as empty string if arguments are strings or nullish', function() {
			expect([
				{ a : 'D', b : 'd' },
				{ a : 'D', b : undefined },
				{ a : undefined, b : 'd' },
				{ a : 'B', b : 'B' },
			].sort({ b : false, a : true })).toEqual([
				{ a : undefined, b : 'd' },
				{ a : 'D', b : 'd' },
				{ a : 'B', b : 'B' },
				{ a : 'D', b : undefined },
			]);
		});

		it('should sort different cases with ignoreCase', function() {
			expect([
				{ a : 'D', b : 'b' },
				{ a : 'D', b : 'D' },
				{ a : 'c', b : 'd' },
				{ a : 'B', b : 'B' },
			].sort({ b : false, a : true }, { ignoreCase : true })).toEqual([
				{ a : 'c', b : 'd' },
				{ a : 'D', b : 'D' },
				{ a : 'B', b : 'B' },
				{ a : 'D', b : 'b' },
			]);
		});

		it('should treat null or undefined as empty string with ignoreCase', function() {
			expect([
				{ a : undefined, b : 'b' },
				{ a : 'D', b : null },
				{ a : 'c', b : 'd' },
				{ a : 'B', b : 'B' },
			].sort({ b : false, a : true }, { ignoreCase : true })).toEqual([
				{ a : 'c', b : 'd' },
				{ a : undefined, b : 'b' },
				{ a : 'B', b : 'B' },
				{ a : 'D', b : null },
			]);
		});

		it('should use find and replace', function() {
			expect([
				{ a : 'a2', b : 'b2' },
				{ a : 'a2', b : 'b1' },
				{ a : 'a1', b : 'b2' },
				{ a : 'a1', b : 'b1' },
			].sort({ b : false, a : true }, { find : '1', replace : '3' })).toEqual([
				{ a : 'a2', b : 'b1' },
				{ a : 'a1', b : 'b1' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a1', b : 'b2' },
			]);
		});

		it('should treat null or undefined as empty string when find and replace', function() {
			expect([
				{ a : 'a2', b : 'b2' },
				{ a : 'a2', b : 'b1' },
				{ a : 'a1', b : null },
				{ a : undefined, b : 'b1' },
			].sort({ b : false, a : true }, { find : '1', replace : '3' })).toEqual([
				{ a : undefined, b : 'b1' },
				{ a : 'a2', b : 'b1' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a1', b : null },
			]);
		});
	});
});
