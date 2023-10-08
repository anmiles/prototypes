import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

declare module 'fs' {
	export function ensureDir(dirPath: string, throwIfNotExists?: boolean): string;
	export function ensureFile(dirPath: string, throwIfNotExists?: boolean): string;

	export function readJSON<T = any>(filename: string): T;
	export function writeJSON<T = any>(filename: string, json: T): void;

	export function getJSON<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback?: (json: T) => { isValid: boolean, validationError?: string }): T;
	export function getJSONAsync<T = any>(filename: string, createCallback: () => Promise<T>, validateCallback?: (json: T) => Promise<{ isValid: boolean, validationError?: string }>): Promise<T>;

	export function readTSV(filename: string): Array<Record<string, any>>;
	export function writeTSV(filename: string, data: Array<Record<string, any>>): void;

	export function recurse(root: string, callback: FSCallback, options?: { depth?: number, ext?: string }): void;
	export function recurse(root: string, callbacks: { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, options?: { depth?: number, ext?: string }): void;

	export function size(root: string, ignores?: string[]): number;
}

fs.ensureDir = function(dirPath: string, throwIfNotExists = false): string {
	if (!fs.existsSync(dirPath)) {
		if (throwIfNotExists) {
			throw `${dirPath} does not exist`;
		}

		fs.mkdirSync(dirPath, { recursive : true });
	} else {
		if (fs.lstatSync(dirPath).isFile()) {
			throw `${dirPath} is a file, not a directory`;
		}
	}
	return dirPath;
};

fs.ensureFile = function(filePath: string, throwIfNotExists = false): string {
	fs.ensureDir(path.dirname(filePath));

	if (!fs.existsSync(filePath)) {
		if (throwIfNotExists) {
			throw `${filePath} does not exist`;
		}

		fs.writeFileSync(filePath, '');
	} else {
		if (fs.lstatSync(filePath).isDirectory()) {
			throw `${filePath} is a directory, not a file`;
		}
	}
	return filePath;
};

fs.readJSON = function<T = any>(filename: string): T {
	return JSON.parse(fs.readFileSync(filename).toString().replace('\ufeff', ''));
};

fs.writeJSON = function<T = any>(filename: string, json: T): void {
	fs.writeFileSync(filename, `\ufeff${JSON.stringify(json, null, '    ')}`);
};

fs.getJSON = function<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback: (json: T) => { isValid: boolean, validationError?: string } = () => ({ isValid : true })): T {
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

fs.getJSONAsync = async function<T>(filename: string, createCallback: () => Promise<T>, validateCallback: (json: T) => Promise<{ isValid: boolean, validationError?: string }> = async () => ({ isValid : true })): Promise<T> {
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

fs.readTSV = function(filename: string): Array<Record<string, any>> {
	const tsv     = iconv.decode(fs.readFileSync(filename), 'cp1251');
	const lines   = tsv.trim().split('\r\n').map((line) => line.split('\t'));
	const headers = lines.shift() as string[];
	const arr     = lines.map((line) => line.reduce((obj, value, key) => {
		obj[headers[key]] = value; return obj;
	}, {} as Record<string, any>));
	return arr;
};

fs.writeTSV = function(filename: string, data: Array<Record<string, any>>): void {
	let tsv = '';

	if (data.length > 0) {
		const headers = Object.keys(data[0]);
		const lines   = data.map((item) => headers.map((field) => item[field]));
		lines.unshift(headers);
		tsv = lines.map((line) => line.join('\t')).join('\r\n');
	}

	fs.writeFileSync(filename, iconv.encode(tsv, 'cp1251'));
};

type FSCallback = (filepath: string, filename: string, dirent: fs.Dirent) => void;

function recurse(root: string, callback: FSCallback, options?: { depth?: number, ext?: string }): void;
function recurse(root: string, callbacks: { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, options?: { depth?: number, ext?: string }): void;
function recurse(root: string, arg: FSCallback | { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, { depth = 0, ext = '' }: { depth?: number, ext?: string } = {}): void {
	if (!fs.existsSync(root)) {
		return;
	}

	if (typeof arg === 'function') {
		return recurse(root, { dir : arg, file : arg, link : arg });
	}

	for (const dirent of fs.readdirSync(root, { withFileTypes : true })) {
		const fullName = path.join(root, dirent.name);

		if (dirent.name === 'System Volume Information') {
			continue;
		}

		if (dirent.isDirectory()) {
			arg.dir && arg.dir(fullName, dirent.name, dirent);

			if (!(depth === 1)) {
				recurse(fullName, arg, { depth : depth - 1, ext });
			}
		} else if (dirent.isSymbolicLink()) {
			arg.link && arg.link(fullName, dirent.name, dirent);
		} else if (dirent.isFile()) {
			arg.file && (!ext || fullName.endsWith(ext)) && arg.file(fullName, dirent.name, dirent);
		}
	}
}

fs.recurse = recurse;

fs.size = function(root: string, ignores?: string[]): number {
	let size = 0;

	fs.recurse(root, {
		dir : (filepath, filename) => {
			if (ignores?.includes(filename)) {
				return;
			}

			size += fs.size(filepath, ignores);
		},
		file : (filepath, filename) => {
			if (ignores?.includes(filename)) {
				return;
			}

			size += fs.lstatSync(filepath).size;
		},
	}, { depth : 1 });

	return size;
};

export {};
