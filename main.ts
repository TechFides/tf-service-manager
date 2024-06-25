import chalk from "chalk";
import {spawn} from "child_process";
import stripAnsi from "strip-ansi";
import {access} from "fs/promises";


/**
 * Executes a command as a child process.
 *
 * @param {string} command - The command to run.
 * @param {string} prefix - The prefix to prepend to log messages.
 * @param {string} color - The color to use for log messages.
 * @param {string} cwd - The working directory for the child process.
 * @returns {Promise<string>} - A promise that resolves with the output of the command.
 */
const runProcess = (command: string, prefix: string, color:string, cwd: string) : Promise<string> => {
    return new Promise(function (resolve) {
        let resultData = '';
        const chunks = command.split(' ');
        console.log(chalk.green(`${prefix} Running: ${command}`));
        const process = spawn(chunks[0], chunks.slice(1), {cwd});
        process.stderr.on('data', function (data) {
            data
                .toString()
                .split('\n')
                .map((i:string) => i.trim())
                .filter((i:string) => i !== '')
                .map(stripAnsi)
                .forEach((line:string) => console.log(chalk[color](`${prefix} ${line}`)));
        });

        process.stdout.on('data', function (data) {
            resultData += data.toString();
            data
                .toString()
                .split('\n')
                .map((i:string) => i.trim())
                .filter((i:string) => i !== '')
                .map(stripAnsi)
                .forEach((line: string) => console.log(chalk[color](`${prefix} ${line}`)));
        });

        process.on('exit', function (code) {
            if (code !== 0) {
                console.log(
                    chalk.red(
                        `${prefix} child process exited with code ${code?.toString()}`,
                    ),
                );
            }
            resolve(resultData);
        });
    });
};

/**
 * Checks if a file exists at the specified path.
 * @param {string} path - The path to the file.
 * @returns {Promise<boolean>} - A promise that resolves to true if the file exists, or false if it doesn't.
 * @throws {Error} - Throws an error if there was a problem accessing the file.
 */
const fileExists = async (path:string): Promise<boolean> => {
    try {
        await access(path);
        return true;
    } catch (err) {
        // @ts-ignore
        if (err.code === 'ENOENT') {
            return false;
        } else {
            throw err;
        }
    }
};

/**
 * Run the Service Manager backend.
 * This function starts the backend server by running the "npm run dev" command.
 * If the current platform is Windows, it uses "npm.cmd", otherwise it uses "npm".
 * The output is logged using colors and a specific prefix.
 *
 * @async
 * @function runServiceManagerBackend
 * @returns {Promise<void>} A Promise that resolves when the backend server is started.
 */
const runServiceManagerBackend = async (): Promise<void> => {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await runProcess(
        `${command} run dev`,
        '[SERVER]',
        'green',
        `./server`,
    );
};

/**
 * Runs the Service Manager Frontend.
 *
 * @async
 * @return {Promise<void>} - A promise that resolves when the Service Manager Frontend has finished running.
 */
const runServiceManagerFrontend = async (): Promise<void> => {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = (await fileExists('/.dockerenv')) ? '--host 0.0.0.0' : '';
    await runProcess(
        `${command} run dev -- ${args}`,
        '[CLIENT]',
        'blue',
        `./client`,
    );
}

/**
 * Runs the main application function.
 * This function initializes and starts both the backend and frontend service managers.
 *
 * @function main
 * @returns {void}
 */
const main = (): void=> {
    runServiceManagerBackend();
    runServiceManagerFrontend();
};

main();