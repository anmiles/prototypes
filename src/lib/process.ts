import { spawn } from 'child_process';
import path from 'path';

declare global {
	namespace NodeJS {
		interface Process {
			start(executable: string, args?: string[], options?: Parameters<typeof spawn>[2], output?: { stdout?: boolean | ((data: string) => void), stderr?: boolean | ((data: string) => void)}): Promise<number>;
		}
	}
}

export {};

process.start = function start(command: string, args: string[] = [], options?: Parameters<typeof spawn>[2], output?: { stdout?: boolean | ((data: string) => void), stderr?: boolean | ((data: string) => void)}): Promise<number> {
	const cwd = command.includes('/') || command.includes('\\')
		? path.dirname(command)
		: path.resolve();

	if (!command.match(/\.exe$/)) {
		args    = [ '/c', 'start', '/D', options?.cwd as string || cwd, command, ...args ];
		command = 'cmd';
	}

	return new Promise((resolve) => {
		const spawned = spawn(command, args, { ...options, cwd : options?.cwd ||  cwd });

		if (!output || output.stdout) {
			spawned.stdout?.on('data', (data) => {
				(typeof output?.stdout === 'function' ? output.stdout : console.log)(data.toString());
			});
		}

		if (!output || output.stderr) {
			spawned.stderr?.on('data', (data) => {
				(typeof output?.stderr === 'function' ? output.stderr : console.error)(data.toString());
			});
		}

		spawned.on('exit', (code: number) => {
			resolve(code);
		});
	});
};
