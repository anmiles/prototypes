import { expectTypeOf } from 'expect-type';
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
		it('should return all keys of an object declared with const assertion', () => {
			const obj = {
				a : 1,
				b : 2,
				c : 3,
			} as const;

			const keys = Object.ownKeys(obj);
			expect(keys).toEqual([ 'a', 'b', 'c' ]);
			expectTypeOf(keys).toEqualTypeOf<Array<keyof typeof obj>>();
		});

		it('should return filtered keys of an object casted to previously declared type', () => {
			const obj = {
				a : 1,
				b : 2,
				c : 3,
			} as const;

			const declaredKeys = [ 'a', 'b' ] as const;

			const keys = Object.ownKeys(obj, declaredKeys);
			expect(keys).toEqual([ 'a', 'b' ]);
			expectTypeOf(keys).toEqualTypeOf<Array<'a' | 'b'>>();
		});

		it('should return actual keys in partial object', () => {
			const obj = {
				a : 1,
				b : 2,
			} as const;

			const declaredKeys = [ 'a', 'b', 'c' ] as const;

			const keys = Object.ownKeys(obj, declaredKeys);
			expect(keys).toEqual([ 'a', 'b' ]);
			expectTypeOf(keys).toEqualTypeOf<Array<'a' | 'b' | 'c'>>();
		});
	});
});
