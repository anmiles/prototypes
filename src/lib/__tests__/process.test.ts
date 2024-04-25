import '../process';
import type path from 'path';
import childProcess from 'child_process';
import EventEmitter from 'events';

const pathOriginal = jest.requireActual<typeof path>('path');
jest.mock<Partial<typeof path>>('path', () => ({
	resolve : jest.fn().mockImplementation(() => '/cwd'),
	dirname : (_path: string) => pathOriginal.dirname(_path),
}));

jest.mock<Partial<typeof childProcess>>('child_process', () => ({
	spawn : jest.fn().mockImplementation(() => spawn()),
}));

let spawned   : ReturnType<typeof childProcess.spawn>;
let hasStdout : boolean;
let hasStderr : boolean;

const stdout = jest.fn();
const stderr = jest.fn();

function spawn(): childProcess.ChildProcess {
	const instance = new EventEmitter() as ReturnType<typeof childProcess.spawn>;

	if (hasStdout) {
		instance.stdout = new EventEmitter() as ReturnType<typeof childProcess.spawn>['stdout'];
	}

	if (hasStderr) {
		instance.stderr = new EventEmitter() as ReturnType<typeof childProcess.spawn>['stderr'];
	}

	return spawned = instance;
}

beforeEach(() => {
	hasStdout = true;
	hasStderr = true;
});

describe('src/lib/process', () => {
	describe('start', () => {
		describe('spawn', () => {
			it('should call cmd to execute command with default working directory', async () => {
				const promise = process.start('command');
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/cwd', 'command' ], { cwd : '/cwd' });
			});

			it('should call cmd to execute command with default working directory if options are empty', async () => {
				const promise = process.start('command', [], {});
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/cwd', 'command' ], { cwd : '/cwd' });
			});

			it('should call cmd to execute command with custom working directory', async () => {
				const promise = process.start('command', [], { cwd : '/custom' });
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/custom', 'command' ], { cwd : '/custom' });
			});

			it('should call cmd to execute command with parameters and default working directory', async () => {
				const promise = process.start('command', [ 'arg1', 'arg2' ]);
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/cwd', 'command', 'arg1', 'arg2' ], { cwd : '/cwd' });
			});

			it('should call cmd to execute command with parameters and custom working directory', async () => {
				const promise = process.start('command', [ 'arg1', 'arg2' ], { cwd : '/custom' });
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/custom', 'command', 'arg1', 'arg2' ], { cwd : '/custom' });
			});

			it('should call cmd to execute file with parameters and default working directory', async () => {
				const promise = process.start('/path/to/exec', [ 'arg1', 'arg2' ]);
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/path/to', '/path/to/exec', 'arg1', 'arg2' ], { cwd : '/path/to' });
			});

			it('should call cmd to execute file with parameters and custom working directory', async () => {
				const promise = process.start('/path/to/exec', [ 'arg1', 'arg2' ], { cwd : '/custom' });
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('cmd', [ '/c', 'start', '/D', '/custom', '/path/to/exec', 'arg1', 'arg2' ], { cwd : '/custom' });
			});

			it('should call executable file with parameters and default working directory', async () => {
				const promise = process.start('/path/to/exec.exe', [ 'arg1', 'arg2' ]);
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('/path/to/exec.exe', [ 'arg1', 'arg2' ], { cwd : '/path/to' });
			});

			it('should call  executable file with parameters and custom working directory', async () => {
				const promise = process.start('/path/to/exec.exe', [ 'arg1', 'arg2' ], { cwd : '/custom' });
				spawned.emit('exit');
				await promise;
				expect(childProcess.spawn).toHaveBeenCalledWith('/path/to/exec.exe', [ 'arg1', 'arg2' ], { cwd : '/custom' });
			});
		});

		describe('stdout', () => {
			let logSpy: jest.SpyInstance;

			beforeAll(() => {
				logSpy = jest.spyOn(console, 'log').mockImplementation();
			});

			beforeEach(() => {
				logSpy.mockImplementation();
			});

			afterAll(() => {
				logSpy.mockRestore();
			});

			it('should be output with console.log by default', async () => {
				const promise = process.start('command', [ 'arg1', 'arg2' ]);
				spawned.stdout?.emit('data', 'the data');
				spawned.emit('exit');
				await promise;
				expect(logSpy).toHaveBeenCalledWith('the data');
			});

			it('should not be output with console.log if process does not have stdout', async () => {
				hasStdout     = false;
				const promise = process.start('command', [ 'arg1', 'arg2' ]);
				spawned.stdout?.emit('data', 'the data');
				spawned.emit('exit');
				await promise;
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('should be output with console.log if stdout option is true', async () => {
				const promise = process.start('command', [ 'arg1', 'arg2' ], {}, { stdout : true });
				spawned.stdout?.emit('data', 'the data');
				spawned.emit('exit');
				await promise;
				expect(logSpy).toHaveBeenCalledWith('the data');
			});

			it('should not be output with console.log if stdout option is false', async () => {
				const promise = process.start('command', [ 'arg1', 'arg2' ], {}, { stdout : false });
				spawned.stdout?.emit('data', 'the data');
				spawned.emit('exit');
				await promise;
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('should be passed into stdout option if it is a function', async () => {
				const promise = process.start('command', [ 'arg1', 'arg2' ], {}, { stdout });
				spawned.stdout?.emit('data', 'the data');
				spawned.emit('exit');
				await promise;
				expect(logSpy).not.toHaveBeenCalled();
				expect(stdout).toHaveBeenCalledWith('the data');
			});
		});
	});

	describe('stderr', () => {
		let errorSpy: jest.SpyInstance;

		beforeAll(() => {
			errorSpy = jest.spyOn(console, 'error').mockImplementation();
		});

		beforeEach(() => {
			errorSpy.mockImplementation();
		});

		afterAll(() => {
			errorSpy.mockRestore();
		});

		it('should be output with console.error by default', async () => {
			const promise = process.start('command', [ 'arg1', 'arg2' ]);
			spawned.stderr?.emit('data', 'the data');
			spawned.emit('exit');
			await promise;
			expect(errorSpy).toHaveBeenCalledWith('the data');
		});

		it('should not be output with console.error if process does not have stderr', async () => {
			hasStderr     = false;
			const promise = process.start('command', [ 'arg1', 'arg2' ]);
			spawned.stderr?.emit('data', 'the data');
			spawned.emit('exit');
			await promise;
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should be output with console.error if stderr option is true', async () => {
			const promise = process.start('command', [ 'arg1', 'arg2' ], {}, { stderr : true });
			spawned.stderr?.emit('data', 'the data');
			spawned.emit('exit');
			await promise;
			expect(errorSpy).toHaveBeenCalledWith('the data');
		});

		it('should not be output with console.error if stderr option is false', async () => {
			const promise = process.start('command', [ 'arg1', 'arg2' ], {}, { stderr : false });
			spawned.stderr?.emit('data', 'the data');
			spawned.emit('exit');
			await promise;
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('should be passed into stderr option if it is a function', async () => {
			const promise = process.start('command', [ 'arg1', 'arg2' ], {}, { stderr });
			spawned.stderr?.emit('data', 'the data');
			spawned.emit('exit');
			await promise;
			expect(errorSpy).not.toHaveBeenCalled();
			expect(stderr).toHaveBeenCalledWith('the data');
		});
	});
});
