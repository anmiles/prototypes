import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import '../fs';

jest.mock<Partial<typeof fs>>('fs', () => ({
	existsSync : jest.fn().mockImplementation(() => fsExists),
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
	sep     : jest.requireActual('path').sep,
}));

const dirPath  = 'dirPath';
const filePath = 'dirPath/filePath';
let content: Buffer;
let fsExists: boolean;
let isFile: boolean;

const separators = [
	{ ns : 'posix', sep : '/' },
	{ ns : 'win32', sep : '\\' },
	{ ns : null, sep : path.sep },
] as const;

describe('src/lib/fs', function() {
	describe('ensureDir', () => {
		beforeEach(() => {
			isFile = false;
		});

		it('should create empty dir if not exists', () => {
			fsExists = false;

			const { created, exists } = fs.ensureDir(dirPath);

			expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive : true });
			expect(created).toBe(true);
			expect(exists).toBe(true);
		});

		it('should not create empty dir if not exists and create option is false', () => {
			fsExists = false;

			const { created, exists } = fs.ensureDir(dirPath, { create : false });

			expect(fs.mkdirSync).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(false);
		});

		it('should not create empty dir if already exists', () => {
			fsExists = true;

			const { created, exists } = fs.ensureDir(dirPath);

			expect(fs.mkdirSync).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(true);
		});

		it('should throw if existing is a file', () => {
			fsExists = true;
			isFile   = true;

			expect(() => fs.ensureDir(dirPath)).toThrow('dirPath is a file, not a directory');
			expect(fs.mkdirSync).not.toHaveBeenCalled();
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

		[ undefined, {}, { create : true }, { create : false } ].forEach((options) => {
			it(`should call ensureDir to ensure parent dir and pass ${JSON.stringify(options)} options`, () => {
				fsExists = false;

				fs.ensureFile(filePath, options);

				expect(fs.ensureDir).toHaveBeenCalledWith('dirPath', options);
			});
		});

		it('should create empty file if not exists', () => {
			fsExists = false;

			const { created, exists } = fs.ensureFile(filePath);

			expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, '');
			expect(created).toBe(true);
			expect(exists).toBe(true);
		});

		it('should not create empty files if not exists and create option is false', () => {
			fsExists = false;

			const { created, exists } = fs.ensureFile(filePath, { create : false });

			expect(fs.writeFileSync).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(false);
		});

		it('should not create empty file if already exists', () => {
			fsExists = true;

			const { created, exists } = fs.ensureFile(filePath);

			expect(fs.writeFileSync).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(true);
		});

		it('should throw if existing is a directory', () => {
			fsExists = true;
			isFile   = false;

			expect(() => fs.ensureFile(filePath)).toThrow('dirPath/filePath is a directory, not a file');
			expect(fs.writeFileSync).not.toHaveBeenCalled();
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
					fsExists = true;

					await func(filePath, createCallback, validateCallback);

					expect(readJSONSpy).toHaveBeenCalledWith(filePath);
					expect(validateCallback).toHaveBeenCalledWith(json);
				});

				it('should call createCallback if file exists but json is not valid', async () => {
					fsExists = true;
					validateCallback.mockReturnValueOnce({ isValid : false });

					await func(filePath, createCallback, validateCallback);

					expect(readJSONSpy).toHaveBeenCalledWith(filePath);
					expect(createCallback).toHaveBeenCalledWith();
				});

				it('should not call createCallback if file exists and validation function is not passed', async () => {
					fsExists = true;

					await func(filePath, createCallback);

					expect(readJSONSpy).toHaveBeenCalledWith(filePath);
					expect(createCallback).not.toHaveBeenCalled();
				});

				it('should call createCallback if file does not exist', async () => {
					fsExists = false;

					await func(filePath, createCallback, validateCallback);

					expect(readJSONSpy).not.toHaveBeenCalled();
					expect(createCallback).toHaveBeenCalledWith();
				});

				it('should not write fallback JSON back if file exists and json is valid', async () => {
					fsExists = true;

					await func(filePath, createCallback, validateCallback);

					expect(writeJSONSpy).not.toHaveBeenCalled();
				});

				it('should write fallback JSON back if file exists but json is not valid', async () => {
					fsExists = true;
					validateCallback.mockReturnValueOnce({ isValid : false });

					await func(filePath, createCallback, validateCallback);

					expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
				});

				it('should write fallback JSON back if file not exists', async () => {
					fsExists = false;

					await func(filePath, createCallback, validateCallback);

					expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
				});

				it('should return JSON if file exists and json is valid', async () => {
					fsExists = true;

					const result = await func(filePath, createCallback, validateCallback);

					expect(result).toEqual(json);
				});

				it('should return fallback JSON if file exists but json is not valid', async () => {
					fsExists = true;
					validateCallback.mockReturnValueOnce({ isValid : false });

					const result = await func(filePath, createCallback, validateCallback);

					expect(result).toEqual(fallbackJSON);
				});

				it('should return fallback JSON if file not exists', async () => {
					fsExists = false;

					const result = await func(filePath, createCallback, validateCallback);

					expect(result).toEqual(fallbackJSON);
				});

				it('should throw if file exists but json is not valid and created json is not valid too', async () => {
					fsExists = false;
					validateCallback.mockReturnValue({ isValid : false });

					await expect(() => func(filePath, createCallback, validateCallback)).rejects.toEqual('JSON created for dirPath/filePath is not valid');

					expect(writeJSONSpy).not.toHaveBeenCalled();
				});

				it('should throw with validation error if file exists but json is not valid and created json is not valid too', async () => {
					fsExists = false;
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

	describe('joinPath', () => {
		describe('default', () => {
			it('should return two parts joined by default separator', () => {
				expect(fs.joinPath('C:', 'path')).toEqual(`C:${path.sep}path`);
			});

			separators.map(({ sep }) => {
				it(`should return two parts joined by explicitly passed ${sep} separator`, () => {
					expect(fs.joinPath('C:', 'path', { sep })).toEqual(`C:${sep}path`);
				});
			});
		});

		separators.map(({ ns, sep }) => {
			if (ns !== null) {
				describe(`${ns}`, () => {
					it(`should return two parts joined by ${sep} separator`, () => {
						expect(fs[ns].joinPath('C:', 'path')).toEqual(`C:${sep}path`);
					});
				});
			}
		});
	});

	describe('recurse', function() {
		type FSItem = { name: string, fullName: string, type: keyof Parameters<typeof fs.recurse>[1] };
		type FSFile = FSItem & { type: 'file', size: number };
		type FSLink = FSItem & { type: 'link', target: string };
		type FSDir = FSItem & { type: 'dir', items?: (FSDir | FSFile | FSLink)[] };

		const callbacks = {
			file : jest.fn(),
			dir  : jest.fn(),
			link : jest.fn(),
		};

		type AllFiles = Record<string, FSFile | FSDir | FSLink>;

		function processItem<TItem extends FSFile | FSDir | FSLink>(item: TItem, sep: typeof path.sep, prefix?: string, allFiles: AllFiles = {}): AllFiles {
			const fullName = prefix ? `${prefix}${sep}${item.name}` : item.name;
			item.fullName  = fullName;

			if (item.type === 'dir') {
				item.items?.map((childItem) => processItem(childItem, sep, item.fullName, allFiles));
			}

			allFiles[fullName] = item;
			return allFiles;
		}

		separators.map(({ ns, sep }) => {
			const recurse      = ns ? fs[ns].recurse : fs.recurse;
			const describeSpec = [ 'fs', ns ].filter((s) => s).join('.');

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
							{ name : 'Desktop', target : `C:${sep}Users${sep}Public${sep}Desktop`, type : 'link', fullName : '' },
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
							{ name : 'AllUsers', target : `C:${sep}ProgramData`, type : 'link', fullName : '' },
						] },
					{ name : 'pagefile.sys', size : 70, type : 'file', fullName : '' },
					{ name : 'Documents and Settings', target : `C:${sep}Users`, type : 'link', fullName : '' },
				],
			};

			describe(`${describeSpec}`, () => {
				let allFiles: AllFiles;

				let readdirSyncSpy: jest.SpyInstance;
				let existsSyncSpy: jest.SpyInstance;

				beforeAll(() => {
					readdirSyncSpy = jest.spyOn(fs, 'readdirSync');
					existsSyncSpy  = jest.spyOn(fs, 'existsSync');
				});

				beforeEach(() => {
					readdirSyncSpy.mockImplementation((fullName: string, options?: { withFileTypes?: boolean }) => {
						const fsDir = allFiles[fullName];

						const result = fsDir.type !== 'dir'
							? []
							: fsDir.items?.map((item) => options?.withFileTypes ? {
								name           : item.name,
								isFile         : () => allFiles[item.fullName].type === 'file',
								isDirectory    : () => allFiles[item.fullName].type === 'dir',
								isSymbolicLink : () => allFiles[item.fullName].type === 'link',
							} : item.name) || [];

						return result;
					});

					existsSyncSpy.mockImplementation((fullName: string) => Object.keys(allFiles).includes(fullName));

					allFiles = processItem(fsTree, sep);
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
								[`C:${sep}Documents and Settings`] : expect.objectContaining({
									type : 'link', fullName : `C:${sep}Documents and Settings`, name : 'Documents and Settings', target : `C:${sep}Users`,
								}),
								[`C:${sep}ProgramData`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}ProgramData`, name : 'ProgramData',
								}),
								[`C:${sep}ProgramData${sep}Desktop`] : expect.objectContaining({
									type : 'link', fullName : `C:${sep}ProgramData${sep}Desktop`, name : 'Desktop', target : `C:${sep}Users${sep}Public${sep}Desktop`,
								}),
								[`C:${sep}ProgramData${sep}MySoftware`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}ProgramData${sep}MySoftware`, name : 'MySoftware',
								}),
								[`C:${sep}ProgramData${sep}MySoftware${sep}errors.log`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}ProgramData${sep}MySoftware${sep}errors.log`, name : 'errors.log', size : 10,
								}),
								[`C:${sep}ProgramData${sep}MySoftware${sep}profile.dat`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, name : 'profile.dat', size : 20,
								}),
								[`C:${sep}System Volume Information`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}System Volume Information`, name : 'System Volume Information',
								}),
								[`C:${sep}Users`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}Users`, name : 'Users',
								}),
								[`C:${sep}Users${sep}AllUsers`] : expect.objectContaining({
									type : 'link', fullName : `C:${sep}Users${sep}AllUsers`, name : 'AllUsers', target : `C:${sep}ProgramData`,
								}),
								[`C:${sep}Users${sep}Public`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}Users${sep}Public`, name : 'Public',
								}),
								[`C:${sep}Users${sep}Public${sep}Desktop`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}Users${sep}Public${sep}Desktop`, name : 'Desktop',
								}),
								[`C:${sep}Users${sep}Public${sep}Downloads`] : expect.objectContaining({
									type : 'dir', fullName : `C:${sep}Users${sep}Public${sep}Downloads`, name : 'Downloads',
								}),
								[`C:${sep}Users${sep}Public${sep}Downloads${sep}install.zip`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}Users${sep}Public${sep}Downloads${sep}install.zip`, name : 'install.zip', size : 30,
								}),
								[`C:${sep}Users${sep}Public${sep}Downloads${sep}image.jpg`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}Users${sep}Public${sep}Downloads${sep}image.jpg`, name : 'image.jpg', size : 40,
								}),
								[`C:${sep}Users${sep}Public${sep}desktop.ini`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}Users${sep}Public${sep}desktop.ini`, name : 'desktop.ini', size : 50,
								}),
								[`C:${sep}Users${sep}Public${sep}ntuser.dat`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}Users${sep}Public${sep}ntuser.dat`, name : 'ntuser.dat', size : 60,
								}),
								[`C:${sep}pagefile.sys`] : expect.objectContaining({
									type : 'file', fullName : `C:${sep}pagefile.sys`, name : 'pagefile.sys', size : 70,
								}),
							});
						});
					});

					it('should do nothing if root does not exist', () => {
						recurse(`C:${sep}wrongpath`, callbacks.file);

						expect(callbacks.file).not.toHaveBeenCalled();
						expect(readdirSyncSpy).not.toHaveBeenCalled();
					});

					it('should recursively apply the only callback to all nested entities except itself', () => {
						recurse(`C:${sep}ProgramData`, callbacks.file);

						expect(callbacks.file).toHaveBeenCalledTimes(4);
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}Desktop`, 'Desktop', expect.anything());
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware`, 'MySoftware', expect.anything());
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware${sep}errors.log`, 'errors.log', expect.anything());
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, 'profile.dat', expect.anything());
					});

					it('should not apply callback to itself', () => {
						recurse(`C:${sep}ProgramData`, callbacks.file);

						expect(callbacks.file).not.toHaveBeenCalledWith(`C:${sep}ProgramData`, 'ProgramData', expect.anything());
					});

					it('should recursively read all nested directories', () => {
						recurse('C:', callbacks.file);

						expect(readdirSyncSpy).toHaveBeenCalledTimes(7);
						expect(readdirSyncSpy).toHaveBeenCalledWith('C:', { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}ProgramData`, { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware`, { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}Users`, { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}Users${sep}Public`, { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}Users${sep}Public${sep}Desktop`, { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}Users${sep}Public${sep}Downloads`, { withFileTypes : true });
					});

					it('should not process System Volume Information', () => {
						recurse('C:', callbacks.file);

						expect(readdirSyncSpy).not.toHaveBeenCalledWith(`C:${sep}System Volume Information`);
					});

					it('should recursively apply callbacks of each type', () => {
						recurse(`C:${sep}ProgramData`, callbacks);

						expect(callbacks.dir).toHaveBeenCalledTimes(1);
						expect(callbacks.dir).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware`, 'MySoftware', expect.anything());

						expect(callbacks.link).toHaveBeenCalledTimes(1);
						expect(callbacks.link).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}Desktop`, 'Desktop', expect.anything());

						expect(callbacks.file).toHaveBeenCalledTimes(2);
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware${sep}errors.log`, 'errors.log', expect.anything());
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, 'profile.dat', expect.anything());
					});

					it('should not apply callbacks of non-existing types', () => {
						recurse(`C:${sep}Users${sep}Public`, callbacks);

						expect(callbacks.dir).toHaveBeenCalled();
						expect(callbacks.file).toHaveBeenCalled();
						expect(callbacks.link).not.toHaveBeenCalled();
					});

					it('should not apply any callbacks if no any nested entities', () => {
						recurse(`C:${sep}Users${sep}Public${sep}Desktop`, callbacks);

						expect(callbacks.dir).not.toHaveBeenCalled();
						expect(callbacks.file).not.toHaveBeenCalled();
						expect(callbacks.link).not.toHaveBeenCalled();
					});

					it('should limit entities to current level if depth is 1', () => {
						recurse(`C:${sep}Users`, callbacks, { depth : 1 });

						expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}Users`, { withFileTypes : true });

						expect(callbacks.dir).toHaveBeenCalledTimes(1);
						expect(callbacks.dir).toHaveBeenCalledWith(`C:${sep}Users${sep}Public`, 'Public', expect.anything());

						expect(callbacks.file).not.toHaveBeenCalled();

						expect(callbacks.link).toHaveBeenCalledTimes(1);
						expect(callbacks.link).toHaveBeenCalledWith(`C:${sep}Users${sep}AllUsers`, 'AllUsers', expect.anything());
					});

					it('should limit entities to specified level if depth is positive number', () => {
						recurse('C:', callbacks, { depth : 2 });

						expect(readdirSyncSpy).toHaveBeenCalledTimes(3);
						expect(readdirSyncSpy).toHaveBeenCalledWith('C:', { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}ProgramData`, { withFileTypes : true });
						expect(readdirSyncSpy).toHaveBeenCalledWith(`C:${sep}Users`, { withFileTypes : true });

						expect(callbacks.dir).toHaveBeenCalledTimes(4);
						expect(callbacks.dir).toHaveBeenCalledWith(`C:${sep}ProgramData`, 'ProgramData', expect.anything());
						expect(callbacks.dir).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware`, 'MySoftware', expect.anything());
						expect(callbacks.dir).toHaveBeenCalledWith(`C:${sep}Users`, 'Users', expect.anything());
						expect(callbacks.dir).toHaveBeenCalledWith(`C:${sep}Users${sep}Public`, 'Public', expect.anything());

						expect(callbacks.file).toHaveBeenCalledTimes(1);
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}pagefile.sys`, 'pagefile.sys', expect.anything());

						expect(callbacks.link).toHaveBeenCalledTimes(3);
						expect(callbacks.link).toHaveBeenCalledWith(`C:${sep}Documents and Settings`, 'Documents and Settings', expect.anything());
						expect(callbacks.link).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}Desktop`, 'Desktop', expect.anything());
					});

					it('should limit entities to specified extension', () => {
						recurse('C:', callbacks, { ext : '.dat' });

						expect(callbacks.file).toHaveBeenCalledTimes(2);
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, 'profile.dat', expect.anything());
						expect(callbacks.file).toHaveBeenCalledWith(`C:${sep}Users${sep}Public${sep}ntuser.dat`, 'ntuser.dat', expect.anything());
					});
				});

				if (!ns) {
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
				}
			});
		});
	});
});
