import chalk from "chalk";
import {spawn} from "child_process";
import stripAnsi from "strip-ansi";
import {access} from "fs/promises";


/**
 * Executes a command as a child process.
 *
 * @param {string} command - The command to run.
 * @param {string} logsPrefix - The logsPrefix to prepend to log messages.
 * @param {string} color - The color to use for log messages.
 * @param {string} cwd - The working directory for the child process.
 * @returns {Promise<string>} - A promise that resolves with the output of the command.
 */
const runProcess = (command: string, logsPrefix: string, color:string, cwd: string = './') : Promise<string> => {
    return new Promise(function (resolve) {
        let resultData = '';
        const chunks = command.split(' ');
        console.log(`${logsPrefix} Running: ${chalk.italic(command)}`);
        const process = spawn(chunks[0], chunks.slice(1), {cwd});
        process.stderr.on('data', function (data) {
            data
                .toString()
                .split('\n')
                .map((i:string) => i.trim())
                .filter((i:string) => i !== '')
                .map(stripAnsi)
                .forEach((line:string) => console.log(chalk[color](`${logsPrefix} ${line}`)));
        });

        process.stdout.on('data', function (data) {
            resultData += data.toString();
            data
                .toString()
                .split('\n')
                .map((i:string) => i.trim())
                .filter((i:string) => i !== '')
                .map(stripAnsi)
                .forEach((line: string) => console.log(chalk[color](`${logsPrefix} ${line}`)));
        });

        process.on('exit', function (code) {
            if (code !== 0) {
                console.log(
                    chalk.red(
                        `${logsPrefix} child process exited with code ${code?.toString()}`,
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
 * Retrieves the appropriate npm command for the current platform.
 *
 * @returns {string} The npm command for the current platform.
 */
const getMultiPlatformNpmCommand = (): string => process.platform === 'win32' ? 'npm.cmd' : 'npm';

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
    await runProcess(
        `${getMultiPlatformNpmCommand()} run dev`,
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
    const args = (await fileExists('/.dockerenv')) ? '--host 0.0.0.0' : '';
    await runProcess(
        `${getMultiPlatformNpmCommand()} run dev -- ${args}`,
        '[CLIENT]',
        'blue',
        `./client`,
    );
}

const copyEnvFiles = async (): Promise<void> => {
    await runProcess(
        `cp .env ./server/.env`,
        '[COPY_ENV]',
        'white',
    );

    await runProcess(
        `cp .env ./client/.env`,
        '[COPY_ENV]',
        'white',
    );
}

/**
 * Runs the main application function.
 * This function initializes and starts both the backend and frontend service managers.
 *
 * @function main
 * @returns {void}
 */
const main = async (): Promise<void> => {
    await copyEnvFiles();
    runServiceManagerBackend();
    runServiceManagerFrontend();
};

main();