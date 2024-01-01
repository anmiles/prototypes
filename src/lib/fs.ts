import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import iconv from 'iconv-lite';

declare module 'fs' {
	export function ensureDir(dirPath: string, options?: { create?: boolean }): { created: boolean, exists: boolean };
	export function ensureFile(dirPath: string, options?: { create?: boolean }): { created: boolean, exists: boolean };

	export function readJSON<T = any>(filename: string): T;
	export function writeJSON<T = any>(filename: string, json: T): void;

	export function getJSON<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback?: (json: T) => { isValid: boolean, validationError?: string }): T;
	export function getJSONAsync<T = any>(filename: string, createCallback: () => Promise<T>, validateCallback?: (json: T) => Promise<{ isValid: boolean, validationError?: string }>): Promise<T>;

	export function readTSV(filename: string): Array<Record<string, any>>;
	export function writeTSV(filename: string, data: Array<Record<string, any>>): void;

	export function joinPath<
		T1 extends string,
		T2 extends string,
		TSep extends typeof path.sep = typeof path.sep
	>(parent: T1, child: T2, options?: { sep?: TSep }): `${T1}${TSep}${T2}`;

	export function recurse<T extends string, TSep extends typeof path.sep = typeof path.sep>(
		root: T,
		callback: RecurseCallback<T, TSep>,
		options?: { depth?: number, ext?: string, sep?: TSep }
	): void;
	export function recurse<T extends string, TSep extends typeof path.sep = typeof path.sep>(
		root: T,
		callbacks: { dir?: RecurseCallback<T, TSep>, file?: RecurseCallback<T, TSep>, link?: RecurseCallback<T, TSep> },
		options?: { depth?: number, ext?: string, sep?: TSep }
	): void;

	export function size(root: string, ignores?: string[]): number;

	export namespace posix {
		export function joinPath<T1 extends string, T2 extends string>(parent: T1, child: T2): `${T1}${'/'}${T2}`;

		export function recurse<T extends string>(
			root: T,
			callback: RecurseCallback<T, '/'>,
			options?: { depth?: number, ext?: string }
		): void;
		export function recurse<T extends string>(
			root: T,
			callbacks: { dir?: RecurseCallback<T, '/'>, file?: RecurseCallback<T, '/'>, link?: RecurseCallback<T, '/'> },
			options?: { depth?: number, ext?: string }
		): void;
	}

	export namespace win32 {
		export function joinPath<T1 extends string, T2 extends string>(parent: T1, child: T2): `${T1}${'\\'}${T2}`;

		export function recurse<T extends string>(
			root: T,
			callback: RecurseCallback<T, '\\'>,
			options?: { depth?: number, ext?: string }
		): void;
		export function recurse<T extends string>(
			root: T,
			callbacks: { dir?: RecurseCallback<T, '\\'>, file?: RecurseCallback<T, '\\'>, link?: RecurseCallback<T, '\\'> },
			options?: { depth?: number, ext?: string }
		): void;
	}
}

declare module 'fs/promises' {
	export function ensureDir(dirPath: string, options?: { create?: boolean }): { created: boolean, exists: boolean };
	export function ensureFile(dirPath: string, options?: { create?: boolean }): { created: boolean, exists: boolean };

	export function readJSON<T = any>(filename: string): T;
	export function writeJSON<T = any>(filename: string, json: T): void;

	export function getJSON<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback?: (json: T) => { isValid: boolean, validationError?: string }): T;
	export function getJSONAsync<T = any>(filename: string, createCallback: () => Promise<T>, validateCallback?: (json: T) => Promise<{ isValid: boolean, validationError?: string }>): Promise<T>;

	export function readTSV(filename: string): Array<Record<string, any>>;
	export function writeTSV(filename: string, data: Array<Record<string, any>>): void;

	export function joinPath<
		T1 extends string,
		T2 extends string,
		TSep extends typeof path.sep = typeof path.sep
	>(parent: T1, child: T2, options?: { sep?: TSep }): `${T1}${TSep}${T2}`;

	export function recurse<T extends string, TSep extends typeof path.sep = typeof path.sep>(
		root: T,
		callback: RecurseCallback<T, TSep>,
		options?: { depth?: number, ext?: string, sep?: TSep }
	): void;
	export function recurse<T extends string, TSep extends typeof path.sep = typeof path.sep>(
		root: T,
		callbacks: { dir?: RecurseCallback<T, TSep>, file?: RecurseCallback<T, TSep>, link?: RecurseCallback<T, TSep> },
		options?: { depth?: number, ext?: string, sep?: TSep }
	): void;

	export function size(root: string, ignores?: string[]): number;

	export namespace posix {
		export function joinPath<T1 extends string, T2 extends string>(parent: T1, child: T2): `${T1}${'/'}${T2}`;

		export function recurse<T extends string>(
			root: T,
			callback: RecurseCallback<T, '/'>,
			options?: { depth?: number, ext?: string }
		): void;
		export function recurse<T extends string>(
			root: T,
			callbacks: { dir?: RecurseCallback<T, '/'>, file?: RecurseCallback<T, '/'>, link?: RecurseCallback<T, '/'> },
			options?: { depth?: number, ext?: string }
		): void;
	}

	export namespace win32 {
		export function joinPath<T1 extends string, T2 extends string>(parent: T1, child: T2): `${T1}${'\\'}${T2}`;

		export function recurse<T extends string>(
			root: T,
			callback: RecurseCallback<T, '\\'>,
			options?: { depth?: number, ext?: string }
		): void;
		export function recurse<T extends string>(
			root: T,
			callbacks: { dir?: RecurseCallback<T, '\\'>, file?: RecurseCallback<T, '\\'>, link?: RecurseCallback<T, '\\'> },
			options?: { depth?: number, ext?: string }
		): void;
	}
}

fs.ensureDir = fsPromises.ensureDir = function ensureDir(dirPath: string, options?: { create?: boolean }): { created: boolean, exists: boolean } {
	const { create } = { create : true, ...options };

	if (!fs.existsSync(dirPath)) {
		if (create) {
			fs.mkdirSync(dirPath, { recursive : true });
			return { created : true, exists : true };
		} else {
			return { created : false, exists : false };
		}
	} else {
		if (fs.lstatSync(dirPath).isFile()) {
			throw `${dirPath} is a file, not a directory`;
		}

		return { created : false, exists : true };
	}
};

fs.ensureFile = fsPromises.ensureFile = function ensureFile(filePath: string, options?: { create?: boolean }): { created: boolean, exists: boolean } {
	const { create } = { create : true, ...options };

	fs.ensureDir(path.dirname(filePath), options);

	if (!fs.existsSync(filePath)) {
		if (create) {
			fs.writeFileSync(filePath, '');
			return { created : true, exists : true };
		} else {
			return { created : false, exists : false };
		}
	} else {
		if (fs.lstatSync(filePath).isDirectory()) {
			throw `${filePath} is a directory, not a file`;
		}

		return { created : false, exists : true };
	}
};

fs.readJSON = fsPromises.readJSON = function<T = any>(filename: string): T {
	return JSON.parse(fs.readFileSync(filename).toString().replace('\ufeff', ''));
};

fs.writeJSON = fsPromises.writeJSON = function<T = any>(filename: string, json: T): void {
	fs.writeFileSync(filename, `\ufeff${JSON.stringify(json, null, '    ')}`);
};

fs.getJSON = fsPromises.getJSON = function<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback: (json: T) => { isValid: boolean, validationError?: string } = () => ({ isValid : true })): T {
	if (fs.existsSync(filename)) {
		const json        = fs.readJSON<T>(filename);
		const { isValid } = validateCallback(json);

		if (isValid) {
			return json;
		}
	}

	const json                         = createCallback();
	const { isValid, validationError } = validateCallback(json);

	if (isValid) {
		fs.writeJSON(filename, json);
		return json;
	}

	const err = `JSON created for ${filename} is not valid`;
	throw [ err, validationError ].filter((s) => s).join(': ');
};

fs.getJSONAsync = fsPromises.getJSONAsync = async function<T>(filename: string, createCallback: () => Promise<T>, validateCallback: (json: T) => Promise<{ isValid: boolean, validationError?: string }> = async () => ({ isValid : true })): Promise<T> {
	if (fs.existsSync(filename)) {
		const json        = fs.readJSON<T>(filename);
		const { isValid } = await validateCallback(json);

		if (isValid) {
			return json;
		}
	}

	const json                         = await createCallback();
	const { isValid, validationError } = await validateCallback(json);

	if (isValid) {
		fs.writeJSON(filename, json);
		return json;
	}

	const err = `JSON created for ${filename} is not valid`;
	throw [ err, validationError ].filter((s) => s).join(': ');
};

fs.readTSV = fsPromises.readTSV = function readTSV(filename: string): Array<Record<string, any>> {
	const tsv     = iconv.decode(fs.readFileSync(filename), 'cp1251');
	const lines   = tsv.trim().split('\r\n').map((line) => line.split('\t'));
	const headers = lines.shift() as string[];
	const arr     = lines.map((line) => line.reduce((obj, value, key) => {
		obj[headers[key]] = value; return obj;
	}, {} as Record<string, any>));
	return arr;
};

fs.writeTSV = fsPromises.writeTSV = function writeTSV(filename: string, data: Array<Record<string, any>>): void {
	let tsv = '';

	if (data.length > 0) {
		const headers = Object.keys(data[0]);
		const lines   = data.map((item) => headers.map((field) => item[field]));
		lines.unshift(headers);
		tsv = lines.map((line) => line.join('\t')).join('\r\n');
	}

	fs.writeFileSync(filename, iconv.encode(tsv, 'cp1251'));
};

fs.joinPath = function<
	T1 extends string,
	T2 extends string,
	TSep extends typeof path.sep = typeof path.sep
>(parent: T1, child: T2, options?: { sep?: TSep }): `${T1}${TSep}${T2}` {
	return `${parent}${options?.sep ?? path.sep as TSep}${child}`;
};

type RecurseCallback<T extends string, TSep extends typeof path.sep> = (filepath: `${T}${TSep}${string}`, filename: string, dirent: fs.Dirent) => void;

function recurse<T extends string, TSep extends typeof path.sep = typeof path.sep>(
	root: T,
	callback: RecurseCallback<T, TSep>,
	options?: { depth?: number, ext?: string, sep?: TSep }
): void;
function recurse<T extends string, TSep extends typeof path.sep = typeof path.sep>(
	root: T,
	callbacks: { dir?: RecurseCallback<T, TSep>, file?: RecurseCallback<T, TSep>, link?: RecurseCallback<T, TSep> },
	options?: { depth?: number, ext?: string, sep?: TSep }
): void;
function recurse<T extends string, TSep extends typeof path.sep>(
	root: T,
	arg: RecurseCallback<T, TSep> | { dir?: RecurseCallback<T, TSep>, file?: RecurseCallback<T, TSep>, link?: RecurseCallback<T, TSep> },
	options: { depth?: number, ext?: string, sep?: TSep } = {},
): void {
	if (!fs.existsSync(root)) {
		return;
	}

	const { depth, ext, sep } = { depth : 0, ext : '', sep : path.sep as TSep, ...options };

	if (typeof arg === 'function') {
		return recurse(root, { dir : arg, file : arg, link : arg }, options);
	}

	for (const dirent of fs.readdirSync(root, { withFileTypes : true })) {
		const fullName = fs.joinPath<typeof root, string, TSep>(root, dirent.name, { sep });

		if (dirent.name === 'System Volume Information') {
			continue;
		}

		if (dirent.isDirectory()) {
			arg.dir && arg.dir(fullName, dirent.name, dirent);

			if (!(depth === 1)) {
				recurse(fullName, arg, { depth : depth - 1, ext, sep });
			}
		} else if (dirent.isSymbolicLink()) {
			arg.link && arg.link(fullName, dirent.name, dirent);
		} else if (dirent.isFile()) {
			arg.file && (!ext || fullName.endsWith(ext)) && arg.file(fullName, dirent.name, dirent);
		}
	}
}

fs.recurse = fsPromises.recurse = recurse;

fs.size = fsPromises.size = function size(root: string, ignores?: string[]): number {
	let size = 0;

	fs.recurse(root, {
		dir : (filepath: string, filename: string) => {
			if (ignores?.includes(filename)) {
				return;
			}

			size += fs.size(filepath, ignores);
		},
		file : (filepath: string, filename: string) => {
			if (ignores?.includes(filename)) {
				return;
			}

			size += fs.lstatSync(filepath).size;
		},
	}, { depth : 1 });

	return size;
};

fs.posix = fs.posix || {};

fs.posix.joinPath = function<T1 extends string, T2 extends string>(parent: T1, child: T2): `${T1}${'/'}${T2}` {
	return fs.joinPath(parent, child, { sep : '/' });
};

function posixRecurse<T extends string>(
	root: T,
	callback: RecurseCallback<T, '/'>,
	options?: { depth?: number, ext?: string }
): void;
function posixRecurse<T extends string>(
	root: T,
	callbacks: { dir?: RecurseCallback<T, '/'>, file?: RecurseCallback<T, '/'>, link?: RecurseCallback<T, '/'> },
	options?: { depth?: number, ext?: string }
): void;
function posixRecurse<T extends string>(
	root: T,
	arg: RecurseCallback<T, '/'> | { dir?: RecurseCallback<T, '/'>, file?: RecurseCallback<T, '/'>, link?: RecurseCallback<T, '/'> },
	options: { depth?: number, ext?: string } = {},
): void {
	if (typeof arg === 'function') {
		fs.recurse<T, '/'>(root, arg, { ...options, sep : '/' });
	} else {
		fs.recurse<T, '/'>(root, arg, { ...options, sep : '/' });
	}
}

fs.posix.recurse = posixRecurse;

fs.win32 = fs.win32 || {};

fs.win32.joinPath = function<T1 extends string, T2 extends string>(parent: T1, child: T2): `${T1}${'\\'}${T2}` {
	return fs.joinPath(parent, child, { sep : '\\' });
};

function win32Recurse<T extends string>(
	root: T,
	callback: RecurseCallback<T, '\\'>,
	options?: { depth?: number, ext?: string }
): void;
function win32Recurse<T extends string>(
	root: T,
	callbacks: { dir?: RecurseCallback<T, '\\'>, file?: RecurseCallback<T, '\\'>, link?: RecurseCallback<T, '\\'> },
	options?: { depth?: number, ext?: string }
): void;
function win32Recurse<T extends string>(
	root: T,
	arg: RecurseCallback<T, '\\'> | { dir?: RecurseCallback<T, '\\'>, file?: RecurseCallback<T, '\\'>, link?: RecurseCallback<T, '\\'> },
	options: { depth?: number, ext?: string } = {},
): void {
	if (typeof arg === 'function') {
		fs.recurse<T, '\\'>(root, arg, { ...options, sep : '\\' });
	} else {
		fs.recurse<T, '\\'>(root, arg, { ...options, sep : '\\' });
	}
}

fs.win32.recurse = win32Recurse;

export {};
