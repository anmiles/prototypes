import { expectTypeOf } from 'expect-type';
import '../object';

describe('src/lib/object', function() {
	describe('ownKeys', function() {
		it('should return all keys of an object declared with const assertion', function() {
			const objType = {
				a : 1,
				b : 2,
				c : 3,
			} as const;

			const keys = Object.ownKeys(objType);
			expect(keys).toEqual([ 'a', 'b', 'c' ]);
			expectTypeOf(keys).toEqualTypeOf<Array<keyof typeof objType>>();
		});

		it('should return filtered keys of an object casted to previously declared type', function() {
			const objType = {
				a : 1,
				b : 2,
				c : 3,
			} as const;

			const obj = {
				a : 1,
				b : 2,
				c : 3,
				d : 4,
			} as typeof objType;

			const keys = Object.ownKeys(obj, Object.keys(objType) as Array<keyof typeof objType>);
			expect(keys).toEqual([ 'a', 'b', 'c' ]);
			expectTypeOf(keys).toEqualTypeOf<Array<keyof typeof objType>>();
		});
	});
});
