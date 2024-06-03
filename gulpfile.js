/* eslint-env node */
const { parallel} = require('gulp');
const spawn = require('child_process').spawn;
const access = require('fs/promises').access;
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

async function fileExists(path) {
    try {
        await access(path);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        } else {
            throw err;
        }
    }
}

async function runServiceManagerBackend() {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await runProcess(
        `${command} run dev`,
        '[SERVER]',
        'green',
        `./server`,
    );
}

async function runServiceManagerFrontend() {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = (await fileExists('/.dockerenv')) ? '--host 0.0.0.0' : '';
    await runProcess(
        `${command} run dev -- ${args}`,
        '[CLIENT]',
        'blue',
        `./client`,
    );
}

/******************************************************************************
 * GULP
 * ***************************************************************************/
exports.runServiceManager = parallel(runServiceManagerBackend, runServiceManagerFrontend);

