/* eslint-env node */
const {series, parallel} = require('gulp');
const spawn = require('child_process').spawn;
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
function runProcess(command, prefix, color, cwd, shell) {
    return new Promise(function (resolve) {
        let resultData = '';
        const chunks = command.split(' ');
        console.log(chalk[color](`${prefix} Running: ${command}`));
        const process = spawn(chunks[0], chunks.slice(1), {cwd, shell});
        process.stderr.on('data', function (data) {
            data
                .toString()
                .split('\n')
                .map((i) => i.trim())
                .filter((i) => i !== '')
                .map(stripAnsi)
                .forEach((line) => console.log(chalk[color](`${prefix} ${line}`)));
        });
        process.stdout.on('data', function (data) {
            resultData += data.toString();
            data
                .toString()
                .split('\n')
                .map((i) => i.trim())
                .filter((i) => i !== '')
                .map(stripAnsi)
                .forEach((line) => console.log(chalk[color](`${prefix} ${line}`)));
        });
        process.on('exit', function (code) {
            if (code !== 0) {
                console.log(
                    chalk[color](
                        `${prefix} child process exited with code ${code.toString()}`,
                    ),
                );
            }
            resolve(resultData);
        });
    });
}

async function runServiceManagerBackend() {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await runProcess(
        `cp .env.example .env`,
        '[BACKEND]',
        'green',
        `./server`,
    );
    await runProcess(
        `${command} run dev`,
        '[BACKEND]',
        'green',
        `./server`,
    );
}

async function runServiceManagerFrontend() {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await runProcess(
        `${command} run dev`,
        '[FRONTEND]',
        'blue',
        `./client`,
    );
}

/******************************************************************************
 * GULP
 * ***************************************************************************/
exports.runServiceManager = parallel(runServiceManagerBackend, runServiceManagerFrontend);

