import { exec } from 'child_process';
import * as util from 'util';

export const awaitExec = util.promisify(exec);

export const runCommand = async (command: string, cwd: string) => {
  const { stdout } = await awaitExec(command, {
    cwd,
  });
  return stdout.trim();
};
