import '../error';

describe('src/lib/error', () => {
	describe('parse', () => {
		it('should return empty string if argument is null', () => {
			const arg           = null;
			const expectedError = new Error('');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return empty string if argument is undefined', () => {
			const arg           = undefined;
			const expectedError = new Error('');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return argument if it is of type string', () => {
			const arg           = 'test error';
			const expectedError = new Error('test error');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return stringified argument if it is of type number', () => {
			const arg           = 10;
			const expectedError = new Error('10');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return stringified argument if it is of type boolean', () => {
			const arg           = true;
			const expectedError = new Error('true');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return property "message" if argument is an instance of Error', () => {
			const arg           = new Error('test error');
			const expectedError = new Error('test error');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return property "message" if argument is an object and has that property', () => {
			const arg           = { message: 'test error' };
			const expectedError = new Error('test error');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return property "error" if argument is an object and has that property', () => {
			const arg           = { error: 'test error' };
			const expectedError = new Error('test error');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return stringified JSON if argument is an object', () => {
			const arg           = { key: 'value' };
			const expectedError = new Error('{"key":"value"}');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return stringified JSON if argument is an object with a non-string property "message"', () => {
			const arg           = { message: 10 };
			const expectedError = new Error('{"message":10}');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});

		it('should return stringified JSON if argument is an object with a non-string property "error"', () => {
			const arg           = { error: true };
			const expectedError = new Error('{"error":true}');

			const error = Error.parse(arg);
			expect(error).toEqual(expectedError);
		});
	});
});
