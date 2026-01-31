import fs from 'fs';
import path from 'path';

import iconv from 'iconv-lite';
import mockFS from 'mock-fs';

import '../fs';

const mkdirSyncSpy     = jest.spyOn(fs, 'mkdirSync');
const readdirSyncSpy   = jest.spyOn(fs, 'readdirSync');
const readFileSyncSpy  = jest.spyOn(fs, 'readFileSync');
const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

const separators = [
	{ ns: null, sep: path.sep },
	{ ns: 'posix', sep: '/' },
	{ ns: 'win32', sep: '\\' },
] as const;

const dirPath  = 'TEST:/dirPath';
const filePath = 'TEST:/dirPath/filePath';

beforeEach(() => {
	mockFS({ 'TEST:': {
		'dirPath': {
			'filePath': '',
		},
	} });
});

describe('src/lib/fs', () => {
	describe('ensureDir', () => {

		it('should create empty dir if not exists', () => {
			mockFS({});

			const { created, exists } = fs.ensureDir(dirPath);

			expect(mkdirSyncSpy).toHaveBeenCalledWith(dirPath, { recursive: true });
			expect(created).toBe(true);
			expect(exists).toBe(true);
		});

		it('should not create empty dir if not exists and create option is false', () => {
			mockFS({});

			const { created, exists } = fs.ensureDir(dirPath, { create: false });

			expect(mkdirSyncSpy).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(false);
		});

		it('should not create empty dir if already exists', () => {
			const { created, exists } = fs.ensureDir(dirPath);

			expect(mkdirSyncSpy).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(true);
		});

		it('should throw if existing is a file', () => {
			mockFS({ [dirPath]: '' });

			expect(() => fs.ensureDir(dirPath)).toThrow(`${dirPath} is a file, not a directory`);
			expect(mkdirSyncSpy).not.toHaveBeenCalled();
		});
	});

	describe('ensureFile', () => {
		[ undefined, {}, { create: true }, { create: false } ].forEach((options) => {
			it(`should call ensureDir to ensure parent dir and pass ${JSON.stringify(options)} options`, () => {
				const ensureDirSpy = jest.spyOn(fs, 'ensureDir');

				fs.ensureFile(filePath, options);

				expect(ensureDirSpy).toHaveBeenCalledWith(dirPath, options);

				ensureDirSpy.mockRestore();
			});
		});

		it('should create empty file if not exists', () => {
			mockFS({});

			const { created, exists } = fs.ensureFile(filePath);

			expect(writeFileSyncSpy).toHaveBeenCalledWith(filePath, '');
			expect(created).toBe(true);
			expect(exists).toBe(true);
		});

		it('should not create empty files if not exists and create option is false', () => {
			mockFS({});

			const { created, exists } = fs.ensureFile(filePath, { create: false });

			expect(writeFileSyncSpy).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(false);
		});

		it('should not create empty file if already exists', () => {
			mockFS({ [filePath]: '' });

			const { created, exists } = fs.ensureFile(filePath);

			expect(writeFileSyncSpy).not.toHaveBeenCalled();
			expect(created).toBe(false);
			expect(exists).toBe(true);
		});

		it('should throw if existing is a directory', () => {
			mockFS({ [filePath]: {} });

			expect(() => fs.ensureFile(filePath)).toThrow(`${filePath} is a directory, not a file`);
			expect(writeFileSyncSpy).not.toHaveBeenCalled();
		});
	});

	describe('readJSON', () => {
		it('should read json from file', () => {
			mockFS({ [filePath]: Buffer.from('{"key1": "value", "key2": 5}', 'utf8') });

			const result = fs.readJSON(filePath);

			expect(result).toEqual({ key1: 'value', key2: 5 });
			expect(readFileSyncSpy).toHaveBeenCalledWith(filePath);
		});
	});

	describe('writeJSON', () => {
		it('should write json to file with BOM', () => {
			const json = { key1: 'value', key2: 5 };

			fs.writeJSON(filePath, json);

			expect(writeFileSyncSpy).toHaveBeenCalledWith(filePath, '\ufeff{\n    "key1": "value",\n    "key2": 5\n}');
		});

		it('should call ensureDir to ensure parent dir', () => {
			const ensureDirSpy = jest.spyOn(fs, 'ensureDir');
			const json         = { key1: 'value', key2: 5 };

			fs.writeJSON(filePath, json);

			expect(ensureDirSpy).toHaveBeenCalledWith(dirPath, { create: true });

			ensureDirSpy.mockRestore();
		});

		it('should read written json back', () => {
			const json = { key1: 'value', key2: 5 };

			fs.writeJSON(filePath, json);
			const result = fs.readJSON(filePath);

			expect(result).toEqual(json);
		});
	});

	describe('getJSON', () => {
		const json         = { key: 'value' };
		const jsonString   = JSON.stringify(json, null, '    ');
		const fallbackJSON = { fallbackKey: 'fallbackValue' };

		const encodedJSON = iconv.encode(jsonString, 'utf8');

		const validateCallback      = jest.mocked(jest.fn());
		const validateCallbackAsync = jest.mocked(jest.fn());

		const createCallback      = jest.mocked(jest.fn());
		const createCallbackAsync = jest.mocked(jest.fn());

		let readJSONSpy: jest.SpyInstance;
		let writeJSONSpy: jest.SpyInstance;

		beforeAll(() => {
			readJSONSpy  = jest.spyOn(fs, 'readJSON');
			writeJSONSpy = jest.spyOn(fs, 'writeJSON').mockImplementation();
		});

		afterAll(() => {
			readJSONSpy.mockRestore();
			writeJSONSpy.mockRestore();
		});

		beforeEach(() => {
			mockFS({ [filePath]: encodedJSON });

			validateCallback.mockReturnValue({ isValid: true });
			validateCallbackAsync.mockResolvedValue({ isValid: true });

			createCallback.mockReturnValue(fallbackJSON);
			createCallbackAsync.mockResolvedValue(fallbackJSON);
		});

		describe('getJSON', () => {
			it('should read json and validate it if file exists', () => {
				fs.getJSON(filePath, createCallback, validateCallback);

				expect(readJSONSpy).toHaveBeenCalledWith(filePath);
				expect(validateCallback).toHaveBeenCalledWith(json);
			});

			it('should call createCallback if file exists but json is not valid', () => {
				validateCallback.mockReturnValueOnce({ isValid: false });

				fs.getJSON(filePath, createCallback, validateCallback);

				expect(readJSONSpy).toHaveBeenCalledWith(filePath);
				expect(createCallback).toHaveBeenCalledWith();
			});

			it('should not call createCallback if file exists and validation function is not passed', () => {
				fs.getJSON(filePath, createCallback);

				expect(readJSONSpy).toHaveBeenCalledWith(filePath);
				expect(createCallback).not.toHaveBeenCalled();
			});

			it('should call createCallback if file does not exist', () => {
				mockFS({});

				fs.getJSON(filePath, createCallback, validateCallback);

				expect(readJSONSpy).not.toHaveBeenCalled();
				expect(createCallback).toHaveBeenCalledWith();
			});

			it('should not write fallback JSON back if file exists and json is valid', () => {
				fs.getJSON(filePath, createCallback, validateCallback);

				expect(writeJSONSpy).not.toHaveBeenCalled();
			});

			it('should write fallback JSON back if file exists but json is not valid', () => {
				validateCallback.mockReturnValueOnce({ isValid: false });

				fs.getJSON(filePath, createCallback, validateCallback);

				expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
			});

			it('should write fallback JSON back if file not exists', () => {
				mockFS({});

				fs.getJSON(filePath, createCallback, validateCallback);

				expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
			});

			it('should return JSON if file exists and json is valid', () => {
				const result = fs.getJSON(filePath, createCallback, validateCallback);

				expect(result).toEqual(json);
			});

			it('should return fallback JSON if file exists but json is not valid', () => {
				validateCallback.mockReturnValueOnce({ isValid: false });

				const result = fs.getJSON(filePath, createCallback, validateCallback);

				expect(result).toEqual(fallbackJSON);
			});

			it('should return fallback JSON if file not exists', () => {
				mockFS({});

				const result = fs.getJSON(filePath, createCallback, validateCallback);

				expect(result).toEqual(fallbackJSON);
			});

			it('should throw if file exists but json is not valid and created json is not valid too', () => {
				mockFS({});
				validateCallback.mockReturnValue({ isValid: false });

				expect(() => fs.getJSON(filePath, createCallback, validateCallback))
					.toThrow(new Error(`JSON created for ${filePath} is not valid`));

				expect(writeJSONSpy).not.toHaveBeenCalled();
			});

			it('should throw with validation error if file exists but json is not valid and created json is not valid too', () => {
				mockFS({});
				validateCallback.mockReturnValue({ isValid: false, validationError: 'validation error' });

				expect(() => fs.getJSON(filePath, createCallback, validateCallback))
					.toThrow(new Error(`JSON created for ${filePath} is not valid: validation error`));

				expect(writeJSONSpy).not.toHaveBeenCalled();
			});
		});

		describe('getJSONAsync', () => {
			it('should read json and validate it if file exists', async () => {
				await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(readJSONSpy).toHaveBeenCalledWith(filePath);
				expect(validateCallbackAsync).toHaveBeenCalledWith(json);
			});

			it('should call createCallback if file exists but json is not valid', async () => {
				validateCallbackAsync.mockResolvedValueOnce({ isValid: false });

				await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(readJSONSpy).toHaveBeenCalledWith(filePath);
				expect(createCallbackAsync).toHaveBeenCalledWith();
			});

			it('should not call createCallback if file exists and validation function is not passed', async () => {
				await fs.getJSONAsync(filePath, createCallbackAsync);

				expect(readJSONSpy).toHaveBeenCalledWith(filePath);
				expect(createCallbackAsync).not.toHaveBeenCalled();
			});

			it('should call createCallback if file does not exist', async () => {
				mockFS({});

				await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(readJSONSpy).not.toHaveBeenCalled();
				expect(createCallbackAsync).toHaveBeenCalledWith();
			});

			it('should not write fallback JSON back if file exists and json is valid', async () => {
				await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(writeJSONSpy).not.toHaveBeenCalled();
			});

			it('should write fallback JSON back if file exists but json is not valid', async () => {
				validateCallbackAsync.mockResolvedValueOnce({ isValid: false });

				await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
			});

			it('should write fallback JSON back if file not exists', async () => {
				mockFS({});

				await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(writeJSONSpy).toHaveBeenCalledWith(filePath, fallbackJSON);
			});

			it('should return JSON if file exists and json is valid', async () => {
				const result = await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(result).toEqual(json);
			});

			it('should return fallback JSON if file exists but json is not valid', async () => {
				validateCallbackAsync.mockResolvedValueOnce({ isValid: false });

				const result = await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(result).toEqual(fallbackJSON);
			});

			it('should return fallback JSON if file not exists', async () => {
				mockFS({});

				const result = await fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync);

				expect(result).toEqual(fallbackJSON);
			});

			it('should throw if file exists but json is not valid and created json is not valid too', async () => {
				mockFS({});
				validateCallbackAsync.mockResolvedValue({ isValid: false });

				await expect(fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync))
					.rejects.toEqual(new Error(`JSON created for ${filePath} is not valid`));

				expect(writeJSONSpy).not.toHaveBeenCalled();
			});

			it('should throw with validation error if file exists but json is not valid and created json is not valid too', async () => {
				mockFS({});
				validateCallbackAsync.mockResolvedValue({ isValid: false, validationError: 'validation error' });

				await expect(fs.getJSONAsync(filePath, createCallbackAsync, validateCallbackAsync))
					.rejects.toEqual(new Error(`JSON created for ${filePath} is not valid: validation error`));

				expect(writeJSONSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('readTSV', () => {
		const tsv               = iconv.encode('first name\tage\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest\r\n', 'cp1251');
		const tsvHeaders        = iconv.encode('first name\tage\tdescription\r\n', 'cp1251');
		const tsvHeadersMissing = iconv.encode('first name\tage\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest\r\n', 'cp1251');
		const tsvEmptyHeader    = iconv.encode('first name\t\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest\r\n', 'cp1251');
		const emptyFile         = iconv.encode('', 'cp1251');

		it('should read tsv from file with cp1251 encoding', () => {
			mockFS({ [filePath]: tsv });

			const result = fs.readTSV(filePath);

			expect(result).toEqual([
				{ 'first name': 'Alice', 'age': '25', 'description': 'Entertainer' },
				{ 'first name': 'John', 'age': '40', 'description': 'Special guest' },
			]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});

		it('should return empty array if file contains only headers', () => {
			mockFS({ [filePath]: tsvHeaders });

			const result = fs.readTSV(filePath);

			expect(result).toEqual([]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});

		it('should return empty array if file is empty', () => {
			mockFS({ [filePath]: emptyFile });

			const result = fs.readTSV(filePath);

			expect(result).toEqual([]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
		});

		it('should throw if amount of headers is less than amount of columns', () => {
			mockFS({ [filePath]: tsvHeadersMissing });

			expect(() => fs.readTSV(filePath)).toThrow('Cannot index header for row #3 because only 2 headers detected');
		});

		it('should throw if header is empty', () => {
			mockFS({ [filePath]: tsvEmptyHeader });

			expect(() => fs.readTSV(filePath)).toThrow('Header #2 is empty');
		});
	});

	describe('writeTSV', () => {
		it('should write tsv buffer into file with cp1251 encoding', () => {

			const data = [
				{ 'first name': 'Alice', 'age': '25', 'description': 'Entertainer' },
				{ 'first name': 'John', 'age': '40', 'description': 'Special guest' },
			];

			fs.writeTSV(filePath, data);

			expect(writeFileSyncSpy).toHaveBeenCalledWith(
				filePath,
				iconv.encode('first name\tage\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest', 'cp1251'),
			);
		});

		it('should call ensureDir to ensure parent dir', () => {
			const ensureDirSpy                    = jest.spyOn(fs, 'ensureDir');
			const data: Record<string, unknown>[] = [];

			fs.writeTSV(filePath, data);

			expect(ensureDirSpy).toHaveBeenCalledWith(dirPath, { create: true });

			ensureDirSpy.mockRestore();
		});

		it('should write empty buffer into file if no data', () => {
			const data: Record<string, unknown>[] = [];

			fs.writeTSV(filePath, data);

			expect(writeFileSyncSpy).toHaveBeenCalledWith(filePath, iconv.encode('', 'cp1251'));
		});
	});

	describe('joinPath', () => {
		describe('default', () => {
			it('should return two parts joined by default separator', () => {
				expect(fs.joinPath('TEST:', 'path')).toEqual(`TEST:${path.sep}path`);
			});

			separators.map(({ sep }) => {
				it(`should return two parts joined by explicitly passed ${sep} separator`, () => {
					expect(fs.joinPath('TEST:', 'path', { sep })).toEqual(`TEST:${sep}path`);
				});
			});
		});

		separators.map(({ ns, sep }) => {
			if (ns !== null) {
				describe(ns, () => {
					it(`should return two parts joined by ${sep} separator`, () => {
						expect(fs[ns].joinPath('TEST:', 'path')).toEqual(`TEST:${sep}path`);
					});
				});
			}
		});
	});

	describe('recurse', () => {
		const callbacks = {
			file: jest.fn(),
			dir : jest.fn(),
			link: jest.fn(),
		};

		separators.map(({ ns, sep }) => {
			const recurse      = ns ? fs[ns].recurse : fs.recurse;
			const describeSpec = [ 'fs', ns ].filter((s) => s).join('.');

			beforeEach(() => {
				mockFS({
					'TEST:': {
						'ProgramData': {
							'MySoftware': {
								'errors.log' : '0'.repeat(10),
								'profile.dat': '0'.repeat(20),
							},
							'Desktop': mockFS.symlink({ path: `TEST:${sep}Users${sep}Public${sep}Desktop` }),
						},
						'System Volume Information': {},
						'Users'                    : {
							'Public': {
								'Desktop'  : {},
								'Downloads': {
									'install.zip': '0'.repeat(30),
									'image.jpg'  : '0'.repeat(40),
								},
								'desktop.ini': '0'.repeat(50),
								'ntuser.dat' : '0'.repeat(60),
							},
							'AllUsers': mockFS.symlink({ path: `TEST:${sep}ProgramData` }),
						},
						'pagefile.sys'          : '0'.repeat(70),
						'Documents and Settings': mockFS.symlink({ path: `TEST:${sep}Users` }),
					},
				});
			});

			afterEach(() => {
				mockFS.restore();
			});

			describe(describeSpec, () => {
				describe('recurse', () => {
					// fs supports backslash separators only in win32
					if (sep === '\\' && process.platform !== 'win32') {
						it('should not find files in path separated by backslashes in non-win32 systems', () => {
							recurse(`TEST:${sep}ProgramData`, callbacks.file);
							recurse(`TEST:${sep}ProgramData`, callbacks);

							expect(callbacks.file).not.toHaveBeenCalled();
							expect(readdirSyncSpy).not.toHaveBeenCalled();
						});
					} else {
						it('should find files in path separated by slashes or in win32 systems', () => {
							recurse(`TEST:${sep}ProgramData`, callbacks.file);
							recurse(`TEST:${sep}ProgramData`, callbacks);

							expect(callbacks.file).toHaveBeenCalled();
							expect(readdirSyncSpy).toHaveBeenCalled();
						});

						it('should do nothing if root does not exist', () => {
							recurse(`TEST:${sep}wrong${sep}path`, callbacks.file);

							expect(callbacks.file).not.toHaveBeenCalled();
							expect(readdirSyncSpy).not.toHaveBeenCalled();
						});

						it('should recursively apply the only callback to all nested entities except itself', () => {
							recurse(`TEST:${sep}ProgramData`, callbacks.file);

							expect(callbacks.file).toHaveBeenCalledTimes(4);
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}Desktop`, 'Desktop', expect.anything());
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware`, 'MySoftware', expect.anything());
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware${sep}errors.log`, 'errors.log', expect.anything());
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, 'profile.dat', expect.anything());
						});

						it('should not apply callback to itself', () => {
							recurse(`TEST:${sep}ProgramData`, callbacks.file);

							expect(callbacks.file).not.toHaveBeenCalledWith(`TEST:${sep}ProgramData`, 'ProgramData', expect.anything());
						});

						it('should recursively read all nested directories', () => {
							recurse('TEST:', callbacks.file);

							expect(readdirSyncSpy).toHaveBeenCalledTimes(7);
							expect(readdirSyncSpy).toHaveBeenCalledWith('TEST:', { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}ProgramData`, { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware`, { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}Users`, { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}Users${sep}Public`, { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}Users${sep}Public${sep}Desktop`, { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}Users${sep}Public${sep}Downloads`, { withFileTypes: true });
						});

						it('should not process System Volume Information', () => {
							recurse('TEST:', callbacks.file);

							expect(readdirSyncSpy).not.toHaveBeenCalledWith(`TEST:${sep}System Volume Information`);
						});

						it('should recursively apply callbacks of each type', () => {
							recurse(`TEST:${sep}ProgramData`, callbacks);

							expect(callbacks.dir).toHaveBeenCalledTimes(1);
							expect(callbacks.dir).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware`, 'MySoftware', expect.anything());

							expect(callbacks.link).toHaveBeenCalledTimes(1);
							expect(callbacks.link).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}Desktop`, 'Desktop', expect.anything());

							expect(callbacks.file).toHaveBeenCalledTimes(2);
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware${sep}errors.log`, 'errors.log', expect.anything());
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, 'profile.dat', expect.anything());
						});

						it('should not apply callbacks of non-existing types', () => {
							recurse(`TEST:${sep}Users${sep}Public`, callbacks);

							expect(callbacks.dir).toHaveBeenCalled();
							expect(callbacks.file).toHaveBeenCalled();
							expect(callbacks.link).not.toHaveBeenCalled();
						});

						it('should not apply any callbacks if no any nested entities', () => {
							recurse(`TEST:${sep}Users${sep}Public${sep}Desktop`, callbacks);

							expect(callbacks.dir).not.toHaveBeenCalled();
							expect(callbacks.file).not.toHaveBeenCalled();
							expect(callbacks.link).not.toHaveBeenCalled();
						});

						it('should limit entities to current level if depth is 1', () => {
							recurse(`TEST:${sep}Users`, callbacks, { depth: 1 });

							expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}Users`, { withFileTypes: true });

							expect(callbacks.dir).toHaveBeenCalledTimes(1);
							expect(callbacks.dir).toHaveBeenCalledWith(`TEST:${sep}Users${sep}Public`, 'Public', expect.anything());

							expect(callbacks.file).not.toHaveBeenCalled();

							expect(callbacks.link).toHaveBeenCalledTimes(1);
							expect(callbacks.link).toHaveBeenCalledWith(`TEST:${sep}Users${sep}AllUsers`, 'AllUsers', expect.anything());
						});

						it('should limit entities to specified level if depth is positive number', () => {
							recurse('TEST:', callbacks, { depth: 2 });

							expect(readdirSyncSpy).toHaveBeenCalledTimes(3);
							expect(readdirSyncSpy).toHaveBeenCalledWith('TEST:', { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}ProgramData`, { withFileTypes: true });
							expect(readdirSyncSpy).toHaveBeenCalledWith(`TEST:${sep}Users`, { withFileTypes: true });

							expect(callbacks.dir).toHaveBeenCalledTimes(4);
							expect(callbacks.dir).toHaveBeenCalledWith(`TEST:${sep}ProgramData`, 'ProgramData', expect.anything());
							expect(callbacks.dir).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware`, 'MySoftware', expect.anything());
							expect(callbacks.dir).toHaveBeenCalledWith(`TEST:${sep}Users`, 'Users', expect.anything());
							expect(callbacks.dir).toHaveBeenCalledWith(`TEST:${sep}Users${sep}Public`, 'Public', expect.anything());

							expect(callbacks.file).toHaveBeenCalledTimes(1);
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}pagefile.sys`, 'pagefile.sys', expect.anything());

							expect(callbacks.link).toHaveBeenCalledTimes(3);
							expect(callbacks.link).toHaveBeenCalledWith(`TEST:${sep}Documents and Settings`, 'Documents and Settings', expect.anything());
							expect(callbacks.link).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}Desktop`, 'Desktop', expect.anything());
						});

						it('should limit entities to specified extension', () => {
							recurse('TEST:', callbacks, { ext: '.dat' });

							expect(callbacks.file).toHaveBeenCalledTimes(2);
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}ProgramData${sep}MySoftware${sep}profile.dat`, 'profile.dat', expect.anything());
							expect(callbacks.file).toHaveBeenCalledWith(`TEST:${sep}Users${sep}Public${sep}ntuser.dat`, 'ntuser.dat', expect.anything());
						});
					}
				});

				if (!ns) {
					describe('size', () => {
						it('should calculate size', () => {
							expect(fs.size('TEST:')).toEqual(280);
						});

						it('should calculate size without ignored files', () => {
							expect(fs.size('TEST:', [ 'install.zip', 'profile.dat' ])).toEqual(230);
						});

						it('should calculate size without ignored directories', () => {
							expect(fs.size('TEST:', [ 'Downloads', 'MySoftware' ])).toEqual(180);
						});
					});
				}
			});
		});
	});
});
