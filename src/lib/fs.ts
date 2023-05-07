import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

declare module 'fs' {
	export function readJSON<T = any>(filename: string): T;
	export function writeJSON<T = any>(filename: string, json: T): void;

	export function readTSV(filename: string): Array<Record<string, any>>;
	export function writeTSV(filename: string, data: Array<Record<string, any>>): void;

	export function recurse(root: string, callback: FSCallback, depth?: number): void;
	export function recurse(root: string, callbacks: { dir?: FSCallback, file?: FSCallback, link?: FSCallback }, depth?: number): void;
}

fs.readJSON = function<T = any>(filename: string): T {
	return JSON.parse(fs.readFileSync(filename).toString());
};

fs.writeJSON = function<T = any>(filename: string, json: T): void {
	fs.writeFileSync(filename, `\ufeff${JSON.stringify(json, null, '    ')}`);
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
