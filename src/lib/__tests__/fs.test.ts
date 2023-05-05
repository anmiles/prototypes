import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import '../fs';

jest.mock<Partial<typeof fs>>('fs', () => ({
	existsSync    : jest.fn(),
	lstatSync     : jest.fn(),
	readdirSync   : jest.fn(),
	readFileSync  : jest.fn().mockImplementation(() => content),
	writeFileSync : jest.fn(),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join : jest.fn().mockImplementation((...paths: string[]) => paths.join('/')),
}));

const filename = 'filename';
let content: Buffer;

describe('src/lib/fs', function() {
	describe('readJSON', function() {
		it('should read json from file', () => {
			content      = Buffer.from('{"key1": "value", "key2": 5}', 'utf8');
			const result = fs.readJSON(filename);
			expect(result).toEqual({ key1 : 'value', key2 : 5 });
			expect(fs.readFileSync).toHaveBeenCalledWith(filename);
		});
	});

	describe('writeJSON', function() {
		it('should write json to file with BOM', () => {
			const json = { key1 : 'value', key2 : 5 };
			fs.writeJSON(filename, json);
			expect(fs.writeFileSync).toHaveBeenCalledWith(filename, '\ufeff{\n    "key1": "value",\n    "key2": 5\n}');
		});
	});

	describe('readTSV', function() {
		it('should read tsv from file with cp1251 encoding', () => {
			content      = iconv.encode('first name\tage\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest\r\n', 'cp1251');
			const result = fs.readTSV(filename);
			expect(result).toEqual([
				{ 'first name' : 'Alice', 'age' : '25', 'description' : 'Entertainer' },
				{ 'first name' : 'John', 'age' : '40', 'description' : 'Special guest' },
			]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filename);
		});

		it('should return empty array if file contains only headers', () => {
			content      = iconv.encode('first name\tage\tdescription\r\n', 'cp1251');
			const result = fs.readTSV(filename);
			expect(result).toEqual([]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filename);
		});

		it('should return empty array if file is empty', () => {
			content      = iconv.encode('', 'cp1251');
			const result = fs.readTSV(filename);
			expect(result).toEqual([]);
			expect(fs.readFileSync).toHaveBeenCalledWith(filename);
		});
	});

	describe('writeTSV', function() {
		it('should write tsv buffer into file with cp1251 encoding', () => {

			const data = [
				{ 'first name' : 'Alice', 'age' : '25', 'description' : 'Entertainer' },
				{ 'first name' : 'John', 'age' : '40', 'description' : 'Special guest' },
			];

			fs.writeTSV(filename, data);
			expect(fs.writeFileSync).toHaveBeenCalledWith(filename, iconv.encode('first name\tage\tdescription\r\nAlice\t25\tEntertainer\r\nJohn\t40\tSpecial guest', 'cp1251'));
		});

		it('should write empty buffer into file if no data', () => {
			const data: Record<string, any>[] = [];
			fs.writeTSV(filename, data);
			expect(fs.writeFileSync).toHaveBeenCalledWith(filename, iconv.encode('', 'cp1251'));
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
