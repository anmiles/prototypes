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
	writeFileSync : jest.fn(),
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
		type FSFile = { name : string, fullName?: string, type?: keyof Parameters<typeof fs.recurse>[1] };
		type FSDir = FSFile & { dirs?: FSDir[], files?: FSFile[], links?: FSLink[] };
		type FSLink = FSFile & { target: string };

		const fsTree: FSDir = {
			name : 'C:',
			dirs : [ {
				name : 'ProgramData',
				dirs : [ {
					name  : 'MySoftware',
					files : [ {
						name : 'errors.log',
					}, {
						name : 'profile.dat',
					} ],
				} ],
				links : [ {
					name   : 'Desktop',
					target : 'C:/Users/Public/Desktop',
				} ],
			}, {
				name : 'System Volume Information',
			}, {
				name : 'Users',
				dirs : [ {
					name : 'Public',
					dirs : [ {
						name : 'Desktop',
					}, {
						name  : 'Downloads',
						files : [ {
							name : 'install.zip',
						}, {
							name : 'image.jpg',
						} ],
					} ],
					files : [ {
						name : 'desktop.ini',
					}, {
						name : 'ntuser.dat',
					} ],
				} ],
				links : [ {
					name   : 'AllUsers',
					target : 'C:/ProgramData',
				} ],
			} ],
			files : [ {
				name : 'pagefile.sys',
			} ],
			links : [ {
				name   : 'Documents and Settings',
				target : 'C:/Users',
			} ],
		};

		const callbacks = {
			file : jest.fn(),
			dir  : jest.fn(),
			link : jest.fn(),
		};

		const allFiles: Record<string, FSFile | FSDir | FSLink> = {};

		function processFile(entity: FSFile | FSDir | FSLink, type: keyof Parameters<typeof fs.recurse>[1], prefix?: string) {
			entity.fullName           = prefix ? `${prefix}/${entity.name}` : entity.name;
			entity.type               = type;
			allFiles[entity.fullName] = entity;
		}

		function processAllFiles(root: FSDir, prefix?: string): void {
			processFile(root, 'dir', prefix);
			root.files?.map((file) => processFile(file, 'file', root.fullName));
			root.links?.map((link) => processFile(link, 'link', root.fullName));
			root.dirs?.map((dir) => processAllFiles(dir, root.fullName));
		}

		processAllFiles(fsTree);

		let readdirSyncSpy: jest.SpyInstance;
		let existsSyncSpy: jest.SpyInstance;
		let lstatSyncSpy: jest.SpyInstance;

		beforeAll(() => {
			readdirSyncSpy = jest.spyOn(fs, 'readdirSync');
			existsSyncSpy  = jest.spyOn(fs, 'existsSync');
			lstatSyncSpy   = jest.spyOn(fs, 'lstatSync');
		});

		beforeEach(() => {
			readdirSyncSpy.mockImplementation((fullName: string) => {
				const fsDir: FSDir = allFiles[fullName];

				return [
					...(fsDir.dirs || []),
					...(fsDir.files || []),
					...(fsDir.links || []),
				].map((item) => item.name);
			});

			existsSyncSpy.mockImplementation((fullName: string) => Object.keys(allFiles).includes(fullName));

			lstatSyncSpy.mockImplementation((fullName: string) => ({
				isFile         : () => allFiles[fullName].type === 'file',
				isDirectory    : () => allFiles[fullName].type === 'dir',
				isSymbolicLink : () => allFiles[fullName].type === 'link',
			}));
		});

		afterAll(() => {
			readdirSyncSpy.mockRestore();
			existsSyncSpy.mockRestore();
			lstatSyncSpy.mockRestore();
		});

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
						type : 'file', fullName : 'C:/ProgramData/MySoftware/errors.log', name : 'errors.log',
					}),
					'C:/ProgramData/MySoftware/profile.dat' : expect.objectContaining({
						type : 'file', fullName : 'C:/ProgramData/MySoftware/profile.dat', name : 'profile.dat',
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
					'C:/Users/Public/desktop.ini' : expect.objectContaining({
						type : 'file', fullName : 'C:/Users/Public/desktop.ini', name : 'desktop.ini',
					}),
					'C:/Users/Public/ntuser.dat' : expect.objectContaining({
						type : 'file', fullName : 'C:/Users/Public/ntuser.dat', name : 'ntuser.dat',
					}),
					'C:/Users/Public/Desktop' : expect.objectContaining({
						type : 'dir', fullName : 'C:/Users/Public/Desktop', name : 'Desktop',
					}),
					'C:/Users/Public/Downloads' : expect.objectContaining({
						type : 'dir', fullName : 'C:/Users/Public/Downloads', name : 'Downloads',
					}),
					'C:/Users/Public/Downloads/install.zip' : expect.objectContaining({
						type : 'file', fullName : 'C:/Users/Public/Downloads/install.zip', name : 'install.zip',
					}),
					'C:/Users/Public/Downloads/image.jpg' : expect.objectContaining({
						type : 'file', fullName : 'C:/Users/Public/Downloads/image.jpg', name : 'image.jpg',
					}),
					'C:/pagefile.sys' : expect.objectContaining({
						type : 'file', fullName : 'C:/pagefile.sys', name : 'pagefile.sys',
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
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/ProgramData');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/ProgramData/MySoftware');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users/Public');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users/Public/Desktop');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users/Public/Downloads');
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
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users');

			expect(callbacks.dir).toHaveBeenCalledTimes(1);
			expect(callbacks.dir).toHaveBeenCalledWith('C:/Users/Public', 'Public', expect.anything());

			expect(callbacks.file).not.toHaveBeenCalled();

			expect(callbacks.link).toHaveBeenCalledTimes(1);
			expect(callbacks.link).toHaveBeenCalledWith('C:/Users/AllUsers', 'AllUsers', expect.anything());
		});

		it('should limit entities to specified level if depth is positive number', () => {
			fs.recurse('C:', callbacks, 2);

			expect(readdirSyncSpy).toHaveBeenCalledTimes(3);
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/ProgramData');
			expect(readdirSyncSpy).toHaveBeenCalledWith('C:/Users');

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
});
