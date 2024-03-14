declare global {
	interface ErrorConstructor {
		parse(arg: unknown): Error;
	}
}

export {};

Error.parse = function parse(arg: unknown): Error {
	if (arg === null || arg === undefined) {
		return new Error('');
	}

	if (typeof arg === 'string') {
		return new Error(arg);
	}

	if (arg instanceof Error) {
		return arg;
	}

	if (typeof arg === 'object') {
		if ('message' in arg && typeof arg.message === 'string') {
			return new Error(arg.message);
		}

		if ('error' in arg && typeof arg.error === 'string') {
			return new Error(arg.error);
		}
	}

	return new Error(JSON.stringify(arg));
};
