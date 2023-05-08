import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

declare module 'fs' {
	export function ensureDir(dirPath: string): string;
	export function ensureFile(dirPath: string): string;

	export function readJSON<T = any>(filename: string): T;
	export function writeJSON<T = any>(filename: string, json: T): void;

	export function getJSON<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback?: (json: T) => boolean): T;
	export function getJSONAsync<T = any>(filename: string, createCallback: () => Promise<T>, validateCallback?: (json: T) => Promise<boolean>): Promise<T>;

	export function readTSV(filename: string): Array<Record<string, any>>;
	export function writeTSV(filename: string, data: Array<Record<string, any>>): void;

	export function recurse(root: string, callback: FSCallback, depth?: number): void;
	export function recurse(root: string, callbacks: { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, depth?: number): void;
}

fs.ensureDir = function(dirPath: string): string {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive : true });
	} else {
		if (fs.lstatSync(dirPath).isFile()) {
			throw `${dirPath} is a file, not a directory`;
		}
	}
	return dirPath;
};

fs.ensureFile = function(filePath: string): string {
	fs.ensureDir(path.dirname(filePath));

	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, '');
	} else {
		if (fs.lstatSync(filePath).isDirectory()) {
			throw `${filePath} is a directory, not a file`;
		}
	}
	return filePath;
};

fs.readJSON = function<T = any>(filename: string): T {
	return JSON.parse(fs.readFileSync(filename).toString());
};

fs.writeJSON = function<T = any>(filename: string, json: T): void {
	fs.writeFileSync(filename, `\ufeff${JSON.stringify(json, null, '    ')}`);
};

fs.getJSON = function<T = any>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback: (json: T) => boolean = () => true): T {
	if (fs.existsSync(filename)) {
		const json = fs.readJSON<T>(filename);

		if (validateCallback(json)) {
			return json;
		}
	}

	const json = createCallback();

	if (validateCallback(json)) {
		fs.writeJSON(filename, json);
		return json;
	}

	throw `Failed validation check for json that just created json for ${filename}`;
};

fs.getJSONAsync = async function<T>(filename: string, createCallback: () => Promise<T>, validateCallback: (json: T) => Promise<boolean> = async () => true): Promise<T> {
	if (fs.existsSync(filename)) {
		const json = fs.readJSON<T>(filename);

		if (await validateCallback(json)) {
			return json;
		}
	}

	const json = await createCallback();

	if (await validateCallback(json)) {
		fs.writeJSON(filename, json);
		return json;
	}

	throw `Failed validation check for json that just created json for ${filename}`;
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

type FSCallback = (filepath: string, filename: string, stat: fs.Stats) => void;

function recurse(root: string, callback: FSCallback, depth?: number): void;
function recurse(root: string, callbacks: { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, depth?: number): void;
function recurse(root: string, arg: FSCallback | { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, depth = 0): void {
	if (!fs.existsSync(root)) {
		return;
	}

	if (typeof arg === 'function') {
		return recurse(root, { dir : arg, file : arg, link : arg });
	}

	for (const name of fs.readdirSync(root)) {
		const fullName = path.join(root, name);

		if (name === 'System Volume Information') {
			continue;
		}

		const stat = fs.lstatSync(fullName);

		if (stat.isDirectory()) {
			arg.dir && arg.dir(fullName, name, stat);
			depth === 1 || recurse(fullName, arg, depth - 1);
		} else if (stat.isSymbolicLink()) {
			arg.link && arg.link(fullName, name, stat);
		} else if (stat.isFile()) {
			arg.file && arg.file(fullName, name, stat);
		}
	}
}

fs.recurse = recurse;

export {};
