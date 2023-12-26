import { expectTypeOf } from 'expect-type';
import '../object';

describe('src/lib/object', function() {
	describe('fill', () => {
		it('should create an object with specified keys and specified default values', function() {
			const keys  = [ 'key1', 'key2', 'key3' ] as const;
			const value = { name : 'value' };

			const obj = Object.fill(keys, () => value);

			expect(obj).toEqual({
				key1 : { name : 'value' },
				key2 : { name : 'value' },
				key3 : { name : 'value' },
			});
		});

		it('should calculate default values from keys', function() {
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
