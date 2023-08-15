import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import '../fs';

jest.mock<Partial<typeof fs>>('fs', () => ({
	existsSync : jest.fn().mockImplementation(() => exists),
	lstatSync  : jest.fn().mockImplementation(() => ({
		isFile      : () => isFile,
		isDirectory : () => !isFile,
	})),
	readdirSync   : jest.fn(),
	readFileSync  : jest.fn().mockImplementation(() => content),
	mkdirSync     : jest.fn(),
	writeFileSync : jest.fn().mockImplementation((file: any, data: string) => {
		content = Buffer.from(data);
	}),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join    : jest.fn().mockImplementation((...paths: string[]) => paths.join('/')),
	dirname : jest.fn().mockImplementation((arg) => arg.split('/').slice(0, -1).join('/')),
}));

const dirPath  = 'dirPath';
const filePath = 'dirPath/filePath';
let content: Buffer;
let exists: boolean;
let isFile: boolean;

describe('src/lib/fs', function() {
	describe('ensureDir', () => {
		beforeEach(() => {
			isFile = false;
		});

		it('should create empty dir if not exists', () => {
			exists = false;

			fs.ensureDir(dirPath);

			expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive : true });
		});

		it('should throw if not exists and throwIfNotExists is true', () => {
			exists = false;

			const func = () => fs.ensureDir(dirPath, true);

			expect(func).toThrow(`${dirPath} does not exist`);
		});

		it('should not create empty dir if already exists', () => {
			exists = true;

			fs.ensureDir(dirPath);

			expect(fs.mkdirSync).not.toHaveBeenCalled();
		});

		it('should throw if existing is a file', () => {
			exists = true;
			isFile = true;

			expect(() => fs.ensureDir(dirPath)).toThrow('dirPath is a file, not a directory');
		});

		it('should return dirPath', () => {
			const result = fs.ensureDir(dirPath);

			expect(result).toEqual(dirPath);
		});
	});

	describe('ensureFile', () => {
		let ensureDirSpy: jest.SpyInstance;

		beforeAll(() => {
			ensureDirSpy = jest.spyOn(fs, 'ensureDir');
		});

		beforeEach(() => {
			ensureDirSpy.mockImplementation();
			isFile = true;
		});

		afterAll(() => {
			ensureDirSpy.mockRestore();
		});

		it('should ensure parent dir', () => {
			exists = false;

			fs.ensureFile(filePath);

			expect(fs.ensureDir).toHaveBeenCalledWith('dirPath');
		});

		it('should create empty file if not exists', () => {
			exists = false;

			fs.ensureFile(filePath);

			expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, '');
		});

		it('should throw if not exists and throwIfNotExists is true', () => {
			exists = false;

			const func = () => fs.ensureFile(filePath, true);

			expect(func).toThrow(`${filePath} does not exist`);
		});

		it('should not create empty file if already exists', () => {
			exists = true;

			fs.ensureFile(filePath);

			expect(fs.writeFileSync).not.toHaveBeenCalled();
		});

		it('should throw if existing is a file', () => {
			exists = true;
			isFile = false;

			expect(() => fs.ensureFile(filePath)).toThrow('dirPath/filePath is a directory, not a file');
			expect(fs.writeFileSync).not.toHaveBeenCalled();
		});

		it('should return filePath', () => {
			const result = fs.ensureFile(filePath);

			expect(result).toEqual(filePath);
		});
	});

	describe('readJSON', function() {
		it('should read json from file', () => {
			content      = Buffer.from('{"key1": "value", "key2": 5}', 'utf8');
			const result = fs.readJSON(filePath);

			expect(result).toEqual({ key1 : 'value', key2 : 5 });
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});
	});

	describe('writeJSON', function() {
		it('should write json to file with BOM', () => {
			const json = { key1 : 'value', key2 : 5 };

			fs.writeJSON(filePath, json);

			expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, '\ufeff{\n    "key1": "value",\n    "key2": 5\n}');
		});

		it('should read written json back', () => {
			const json = { key1 : 'value', key2 : 5 };

			fs.writeJSON(filePath, json);
			const result = fs.readJSON(filePath);

			expect(result).toEqual(json);
		});
	});

	describe('getJSON', () => {
		const json         = { key : 'value' };
		const jsonString   = JSON.stringify(json, null, '    ');
		const fallbackJSON = { fallbackKey : 'fallbackValue' };

		const validateCallback      = jest.fn();
		const validateCallbackAsync = jest.fn();

		const createCallback      = jest.fn();
		const createCallbackAsync = jest.fn();

		let readJSONSpy: jest.SpyInstance;
		let writeJSONSpy: jest.SpyInstance;

		beforeAll(() => {
			readJSONSpy  = jest.spyOn(fs, 'readJSON');
			writeJSONSpy = jest.spyOn(fs, 'writeJSON');
		});

		afterAll(() => {
			readJSONSpy.mockRestore();
			writeJSONSpy.mockRestore();
		});

		beforeEach(() => {
			content = iconv.encode(jsonString, 'utf8');

			validateCallback.mockReturnValue({ isValid : true });
			validateCallbackAsync.mockResolvedValue({ isValid : true });

			createCallback.mockReturnValue(fallbackJSON);
			createCallbackAsync.mockResolvedValue(fallbackJSON);
		});

		[ {
			block : 'sync',
			func  : async <T>(filename: string, createCallback: () => Exclude<T, Promise<any>>, validateCallback?: (json: T) => { isValid: boolean, validationError?: string }) => fs.getJSON(filename, createCallback, validateCallback),
			createCallback,
			validateCallback,
		}, {
			block            : 'async',
			func             : fs.getJSONAsync,
			createCallback   : createCallbackAsync,
			validateCallback : validateCallbackAsync,
		} ].forEach(({ block, func, createCallback, validateCallback }) => {
			describe(`${block}`, () => {
				it('should read json and validate it if file exists', async () => {
					exists = true;

					await func(filePath, createCallback, validateCallback);

					expect(readJSONSpy).toHaveBeenCalledWith(filePath);
					expect(validateCallback).toHaveBeenCalledWith(json);
				});

				it('should call createCallback if file exists but json is not valid', async () => {
					exists = true;
					validateCallback.mockReturnValueOnce({ isValid : false });

					await func(filePath, createCallback, validateCallback);

					expect(readJSONSpy).toHaveBeenCalledWith(filePath);
					expect(createCallback).toHaveBeenCalledWith();
				});

				it('should not call createCallback if file exists and validation function is not passed', async () => {
					exists = true;

					await func(filePath, createCallback);

					expect(readJSONSpy).toHaveBeenCalledWith(filePath);
					expect(createCallback).not.toHaveBeenCalled();
				});

				it('should call createCallback if file does not exist', async () => {
					exists = false;

					await func(filePath, createCallback, validateCallback);

					expect(readJSONSpy).not.toHaveBeenCalled();
					expect(createCallback).toHaveBeenCalledWith();
				});

				it('should not write fallback JSON back if file exists and json is valid', async () => {
					exists = true;

					await func(filePath, createCallback, validateCallback);

					expect(writeJSONSpy).not.toHaveBeenCalled();
				});

				it('should write fallback JSON back if file exists but json is not valid', async () => {
					exists = true;
					validateCallback.mockReturnValueOnce({ isValid : false });

					await func(filePath, createCallback, validateCallback);

					expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
				});

				it('should write fallback JSON back if file not exists', async () => {
					exists = false;

					await func(filePath, createCallback, validateCallback);

					expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
				});

				it('should return JSON if file exists and json is valid', async () => {
					exists = true;

					const result = await func(filePath, createCallback, validateCallback);

					expect(result).toEqual(json);
				});

				it('should return fallback JSON if file exists but json is not valid', async () => {
					exists = true;
					validateCallback.mockReturnValueOnce({ isValid : false });

					const result = await func(filePath, createCallback, validateCallback);

					expect(result).toEqual(fallbackJSON);
				});

				it('should return fallback JSON if file not exists', async () => {
					exists = false;

					const result = await func(filePath, createCallback, validateCallback);

					expect(result).toEqual(fallbackJSON);
				});

				it('should throw if file exists but json is not valid and created json is not valid too', async () => {
					exists = false;
					validateCallback.mockReturnValue({ isValid : false });

					await expect(() => func(filePath, createCallback, validateCallback)).rejects.toEqual('JSON created for dirPath/filePath is not valid');

					expect(writeJSONSpy).not.toHaveBeenCalled();
				});

				it('should throw with validation error if file exists but json is not valid and created json is not valid too', async () => {
					exists = false;
					validateCallback.mockReturnValue({ isValid : false, validationError : 'validation error' });

					await expect(() => func(filePath, createCallback, validateCallback)).rejects.toEqual('JSON created for dirPath/filePath is not valid: validation error');

					expect(writeJSONSpy).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe('readTSV', function() {
		it('should read tsv from file with cp1251 encoding', () => {
			content = iconv.encode('first name\tage\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest\r\n', 'cp1251');

			const result = fs.readTSV(filePath);

			expect(result).toEqual([
				{ 'first name' : 'Alice', 'age' : '25', 'description' : 'Entertainer' },
				{ 'first name' : 'John', 'age' : '40', 'description' : 'Special guest' },
			]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});

		it('should return empty array if file contains only headers', () => {
			content = iconv.encode('first name\tage\tdescription\r\n', 'cp1251');

			const result = fs.readTSV(filePath);

			expect(result).toEqual([]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});

		it('should return empty array if file is empty', () => {
			content = iconv.encode('', 'cp1251');

			const result = fs.readTSV(filePath);

			expect(result).toEqual([]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});
	});

	describe('writeTSV', function() {
		it('should write tsv buffer into file with cp1251 encoding', () => {

			const data = [
				{ 'first name' : 'Alice', 'age' : '25', 'description' : 'Entertainer' },
				{ 'first name' : 'John', 'age' : '40', 'description' : 'Special guest' },
			];

			fs.writeTSV(filePath, data);

			expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, iconv.encode('first name\tage\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest', 'cp1251'));
		});

		it('should write empty buffer into file if no data', () => {
			const data: Record<string, any>[] = [];

			fs.writeTSV(filePath, data);

			expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, iconv.encode('', 'cp1251'));
		});
	});

	describe('recurse', function() {

		type FSItem = { name: string, fullName: string, type: keyof Parameters<typeof fs.recurse>[1] };
		type FSFile = FSItem & { type: 'file', size: number };
		type FSLink = FSItem & { type: 'link', target: string };
		type FSDir = FSItem & { type: 'dir', items?: (FSDir | FSFile | FSLink)[] };

		const fsTree: FSDir = {
			name     : 'C:',
			type     : 'dir',
			fullName : '',
			items    : [
				{ name     : 'ProgramData',
					type     : 'dir',
					fullName : '',
					items    : [
						{ name     : 'MySoftware',
							type     : 'dir',
							fullName : '',
							items    : [
								{ name : 'errors.log', size : 10, type : 'file', fullName : '' },
								{ name : 'profile.dat', size : 20, type : 'file', fullName : '' },
							] },
						{ name : 'Desktop', target : 'C:/Users/Public/Desktop', type : 'link', fullName : '' },
					] },
				{ name : 'System Volume Information', type : 'dir', fullName : '' },
				{ name     : 'Users',
					type     : 'dir',
					fullName : '',
					items    : [
						{ name     : 'Public',
							type     : 'dir',
							fullName : '',
							items    : [
								{ name : 'Desktop', type : 'dir', fullName : '' },
								{ name     : 'Downloads',
									type     : 'dir',
									fullName : '',
									items    : [
										{ name : 'install.zip', size : 30, type : 'file', fullName : '' },
										{ name : 'image.jpg', size : 40, type : 'file', fullName : '' },
									] },
								{ name : 'desktop.ini', size : 50, type : 'file', fullName : '' },
								{ name : 'ntuser.dat', size : 60, type : 'file', fullName : '' },
							] },
						{ name : 'AllUsers', target : 'C:/ProgramData', type : 'link', fullName : '' },
					] },
				{ name : 'pagefile.sys', size : 70, type : 'file', fullName : '' },
				{ name : 'Documents and Settings', target : 'C:/Users', type : 'link', fullName : '' },
			],
		};

		const callbacks = {
			file : jest.fn(),
			dir  : jest.fn(),
			link : jest.fn(),
		};

		const allFiles: Record<string, FSFile | FSDir | FSLink> = {};

		function processItem<TItem extends FSFile | FSDir | FSLink>(item: TItem, prefix?: string): void {
			const fullName = prefix ? `${prefix}/${item.name}` : item.name;
			item.fullName  = fullName;

			if (item.type === 'dir') {
				item.items?.map((childItem) => processItem(childItem, item.fullName));
			}

			allFiles[fullName] = item;
		}

		processItem(fsTree);

		let readdirSyncSpy: jest.SpyInstance;
		let existsSyncSpy: jest.SpyInstance;

		beforeAll(() => {
			readdirSyncSpy = jest.spyOn(fs, 'readdirSync');
			existsSyncSpy  = jest.spyOn(fs, 'existsSync');
		});

		beforeEach(() => {
			readdirSyncSpy.mockImplementation((fullName: string, options?: { withFileTypes?: boolean }) => {
				const fsDir = allFiles[fullName];

				return fsDir.type !== 'dir'
					? []
					: fsDir.items?.map((item) => options?.withFileTypes ? {
						name           : item.name,
						isFile         : () => allFiles[item.fullName].type === 'file',
						isDirectory    : () => allFiles[item.fullName].type === 'dir',
						isSymbolicLink : () => allFiles[item.fullName].type === 'link',
					} : item.name) || [];
			});

			existsSyncSpy.mockImplementation((fullName: string) => Object.keys(allFiles).includes(fullName));
		});

		afterAll(() => {
			readdirSyncSpy.mockRestore();
			existsSyncSpy.mockRestore();
		});

		describe('recurse', () => {
			describe('processAllFiles', () => {
				it('should correctly build list of all files', () => {
					expect(allFiles).toEqual({
						'C:' : expect.objectContaining({
							type : 'dir', fullName : 'C:', name : 'C:',
						}),
						'C:/Documents and Settings' : expect.objectContaining({
							type : 'link', fullName : 'C:/Documents and Settings', name : 'Documents and Settings', target : 'C:/Users',
						}),
						'C:/ProgramData' : expect.objectContaining({
							type : 'dir', fullName : 'C:/ProgramData', name : 'ProgramData',
						}),
						'C:/ProgramData/Desktop' : expect.objectContaining({
							type : 'link', fullName : 'C:/ProgramData/Desktop', name : 'Desktop', target : 'C:/Users/Public/Desktop',
						}),
						'C:/ProgramData/MySoftware' : expect.objectContaining({
							type : 'dir', fullName : 'C:/ProgramData/MySoftware', name : 'MySoftware',
						}),
						'C:/ProgramData/MySoftware/errors.log' : expect.objectContaining({
							type : 'file', fullName : 'C:/ProgramData/MySoftware/errors.log', name : 'errors.log', size : 10,
						}),
						'C:/ProgramData/MySoftware/profile.dat' : expect.objectContaining({
							type : 'file', fullName : 'C:/ProgramData/MySoftware/profile.dat', name : 'profile.dat', size : 20,
						}),
						'C:/System Volume Information' : expect.objectContaining({
							type : 'dir', fullName : 'C:/System Volume Information', name : 'System Volume Information',
						}),
						'C:/Users' : expect.objectContaining({
							type : 'dir', fullName : 'C:/Users', name : 'Users',
						}),
						'C:/Users/AllUsers' : expect.objectContaining({
							type : 'link', fullName : 'C:/Users/AllUsers', name : 'AllUsers', target : 'C:/ProgramData',
						}),
						'C:/Users/Public' : expect.objectContaining({
							type : 'dir', fullName : 'C:/Users/Public', name : 'Public',
						}),
						'C:/Users/Public/Desktop' : expect.objectContaining({
							type : 'dir', fullName : 'C:/Users/Public/Desktop', name : 'Desktop',
						}),
						'C:/Users/Public/Downloads' : expect.objectContaining({
							type : 'dir', fullName : 'C:/Users/Public/Downloads', name : 'Downloads',
						}),
						'C:/Users/Public/Downloads/install.zip' : expect.objectContaining({
							type : 'file', fullName : 'C:/Users/Public/Downloads/install.zip', name : 'install.zip', size : 30,
						}),
						'C:/Users/Public/Downloads/image.jpg' : expect.objectContaining({
							type : 'file', fullName : 'C:/Users/Public/Downloads/image.jpg', name : 'image.jpg', size : 40,
						}),
						'C:/Users/Public/desktop.ini' : expect.objectContaining({
							type : 'file', fullName : 'C:/Users/Public/desktop.ini', name : 'desktop.ini', size : 50,
						}),
						'C:/Users/Public/ntuser.dat' : expect.objectContaining({
							type : 'file', fullName : 'C:/Users/Public/ntuser.dat', name : 'ntuser.dat', size : 60,
						}),
						'C:/pagefile.sys' : expect.objectContaining({
							type : 'file', fullName : 'C:/pagefile.sys', name : 'pagefile.sys', size : 70,
						}),
					});
				});
			});

			it('should do nothing if root does not exist', () => {
				fs.recurse('C:/wrongpath', callbacks.file);

				expect(callbacks.file).not.toHaveBeenCalled();
				expect(readdirSyncSpy).not.toHaveBeenCalled();
			});

			it('should recursively apply the only callback to all nested entities except itself', () => {
				fs.recurse('C:/ProgramData', callbacks.file);

				expect(callbacks.file).toHaveBeenCalledTimes(4);
				expect(callbacks.file).toHaveBeenCalledWith('C:/ProgramData/Desktop', 'Desktop', expect.anything());
				expect(callbacks.file).toHaveBeenCalledWith('C:/ProgramData/MySoftware', 'MySoftware', expect.anything());
				expect(callbacks.file).toHaveBeenCalledWith('C:/ProgramData/MySoftware/errors.log', 'errors.log', expect.anything());
				expect(callbacks.file).toHaveBeenCalledWith('C:/ProgramData/MySoftware/profile.dat', 'profile.dat', expect.anything());
			});

			it('should not apply callback to itself', () => {
				fs.recurse('C:/ProgramData', callbacks.file);

				expect(callbacks.file).not.toHaveBeenCalledWith('C:/ProgramData', 'ProgramData', expect.anything());
			});

			it('should recursively read all nested directories', () => {
				fs.recurse('C:', callbacks.file);

				expect(readdirSyncSpy).toHaveBeenCalledTimes(7);
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/ProgramData', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/ProgramData/MySoftware', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users/Public', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users/Public/Desktop', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users/Public/Downloads', { withFileTypes : true });
			});

			it('should not process System Volume Information', () => {
				fs.recurse('C:', callbacks.file);

				expect(readdirSyncSpy).not.toHaveBeenCalledWith('C:/System Volume Information');
			});

			it('should recursively apply callbacks of each type', () => {
				fs.recurse('C:/ProgramData', callbacks);

				expect(callbacks.dir).toHaveBeenCalledTimes(1);
				expect(callbacks.dir).toHaveBeenCalledWith('C:/ProgramData/MySoftware', 'MySoftware', expect.anything());

				expect(callbacks.link).toHaveBeenCalledTimes(1);
				expect(callbacks.link).toHaveBeenCalledWith('C:/ProgramData/Desktop', 'Desktop', expect.anything());

				expect(callbacks.file).toHaveBeenCalledTimes(2);
				expect(callbacks.file).toHaveBeenCalledWith('C:/ProgramData/MySoftware/errors.log', 'errors.log', expect.anything());
				expect(callbacks.file).toHaveBeenCalledWith('C:/ProgramData/MySoftware/profile.dat', 'profile.dat', expect.anything());
			});

			it('should not apply callbacks of non-existing types', () => {
				fs.recurse('C:/Users/Public', callbacks);

				expect(callbacks.dir).toHaveBeenCalled();
				expect(callbacks.file).toHaveBeenCalled();
				expect(callbacks.link).not.toHaveBeenCalled();
			});

			it('should not apply any callbacks if no any nested entities', () => {
				fs.recurse('C:/Users/Public/Desktop', callbacks);

				expect(callbacks.dir).not.toHaveBeenCalled();
				expect(callbacks.file).not.toHaveBeenCalled();
				expect(callbacks.link).not.toHaveBeenCalled();
			});

			it('should limit entities to current level if depth is 1', () => {
				fs.recurse('C:/Users', callbacks, 1);

				expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users', { withFileTypes : true });

				expect(callbacks.dir).toHaveBeenCalledTimes(1);
				expect(callbacks.dir).toHaveBeenCalledWith('C:/Users/Public', 'Public', expect.anything());

				expect(callbacks.file).not.toHaveBeenCalled();

				expect(callbacks.link).toHaveBeenCalledTimes(1);
				expect(callbacks.link).toHaveBeenCalledWith('C:/Users/AllUsers', 'AllUsers', expect.anything());
			});

			it('should limit entities to specified level if depth is positive number', () => {
				fs.recurse('C:', callbacks, 2);

				expect(readdirSyncSpy).toHaveBeenCalledTimes(3);
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/ProgramData', { withFileTypes : true });
				expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users', { withFileTypes : true });

				expect(callbacks.dir).toHaveBeenCalledTimes(4);
				expect(callbacks.dir).toHaveBeenCalledWith('C:/ProgramData', 'ProgramData', expect.anything());
				expect(callbacks.dir).toHaveBeenCalledWith('C:/ProgramData/MySoftware', 'MySoftware', expect.anything());
				expect(callbacks.dir).toHaveBeenCalledWith('C:/Users', 'Users', expect.anything());
				expect(callbacks.dir).toHaveBeenCalledWith('C:/Users/Public', 'Public', expect.anything());

				expect(callbacks.file).toHaveBeenCalledTimes(1);
				expect(callbacks.file).toHaveBeenCalledWith('C:/pagefile.sys', 'pagefile.sys', expect.anything());

				expect(callbacks.link).toHaveBeenCalledTimes(3);
				expect(callbacks.link).toHaveBeenCalledWith('C:/Documents and Settings', 'Documents and Settings', expect.anything());
				expect(callbacks.link).toHaveBeenCalledWith('C:/ProgramData/Desktop', 'Desktop', expect.anything());
			});
		});

		describe('size', () => {
			let lstatSyncSpy: jest.SpyInstance;

			beforeAll(() => {
				lstatSyncSpy = jest.spyOn(fs, 'lstatSync');
			});

			beforeEach(() => {
				lstatSyncSpy.mockImplementation((filepath) => {
					const item = allFiles[filepath];
					return { size : item.type === 'file' ? item.size : 0 };
				});
			});

			afterAll(() => {
				lstatSyncSpy.mockRestore();
			});

			it('should calculate size', () => {
				expect(fs.size('C:')).toEqual(280);
			});

			it('should calculate size without ignored files', () => {
				expect(fs.size('C:', [ 'install.zip', 'profile.dat' ])).toEqual(230);
			});

			it('should calculate size without ignored directories', () => {
				expect(fs.size('C:', [ 'Downloads', 'MySoftware' ])).toEqual(180);
			});
		});
	});
});
