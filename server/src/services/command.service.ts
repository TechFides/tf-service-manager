import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { EventsGateway } from '../events.gateway';
import * as path from 'path';
import * as kill from 'tree-kill';
import * as fs from 'fs';

import type { BaseService } from './services.service';
import { ServiceRunStatus, ServicesService, Task } from './services.service';
import { TaskDto } from '../dto/service.dto';
import { BranchTaskDto } from 'src/dto/branch-task.dto';
import { runCommand } from 'src/utils/process';
import { ConfigService } from '@nestjs/config';

export enum DefaultTask {
  GIT_CLONE = 'GIT_CLONE',
  GIT_PULL = 'GIT_PULL',
  GIT_RESET = 'GIT_RESET',
  GIT_CHECKOUT = 'GIT_CHECKOUT',
  REMOVE_SERVICE = 'REMOVE_SERVICE',
  NPM_INSTALL = 'NPM_INSTALL',
  START_SERVICE = 'START_SERVICE',
  STOP_SERVICE = 'STOP_SERVICE',
}

export interface BaseBranchTask {
  name: DefaultTask;
  color: string; // see https://quasar.dev/style/color-palette#introduction
  icon: string; // see https://fonts.google.com/icons?icon.set=Material+Icons&icon.style=Rounded
  confirmText?: string;
}

export const branchTasks: BaseBranchTask[] = [
  {
    name: DefaultTask.GIT_PULL,
    color: 'grey-8',
    icon: 'file_download',
  },
  {
    name: DefaultTask.GIT_RESET,
    color: 'grey-8',
    icon: 'restart_alt',
    confirmText: 'Do you really want to reset current branch?',
  },
  {
    name: DefaultTask.GIT_CHECKOUT,
    color: 'grey-8',
    icon: 'alt_route',
  },
];

export const baseTasks: Task[] = [
  {
    name: DefaultTask.NPM_INSTALL,
    command: '',
    runIfNotCloned: false,
    runIfRunStatusIs: [ServiceRunStatus.STOPPED],
    color: 'grey-8',
    icon: 'info',
  },
  {
    name: DefaultTask.GIT_CLONE,
    command: '',
    runIfNotCloned: true,
    runIfRunStatusIs: [],
    color: 'grey-8',
    icon: 'download_for_offline',
  },
  {
    name: DefaultTask.REMOVE_SERVICE,
    command: '',
    runIfNotCloned: false,
    runIfRunStatusIs: [ServiceRunStatus.STOPPED],
    color: 'negative',
    icon: 'highlight_off',
  },
  {
    name: DefaultTask.START_SERVICE,
    command: '',
    runIfNotCloned: false,
    runIfRunStatusIs: [ServiceRunStatus.STOPPED],
    color: 'positive',
    icon: 'play_circle_outline',
  },
  {
    name: DefaultTask.STOP_SERVICE,
    command: '',
    runIfNotCloned: false,
    runIfRunStatusIs: [ServiceRunStatus.RUNNING, ServiceRunStatus.PENDING],
    color: 'orange-14',
    icon: 'pause_circle_outline',
  },
];

const ensureDirectory = (directory: string): boolean => {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
};

@Injectable()
export class CommandService {
  private readonly npmCommand: string;
  private readonly rmCommand: string;
  private readonly servicesDirectory: string;
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly servicesService: ServicesService,
    configService: ConfigService,
  ) {
    this.npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    this.rmCommand =
      process.platform === 'win32'
        ? `Remove-Item -Recurse -Force -Path`
        : `rm -rf`;
    let directory = configService.get<string>('services_directory');
    if (directory[0] === '.') {
      directory = `${__dirname}/${directory}`;
    }
    this.servicesDirectory = directory;
  }

  getTasks(): TaskDto[] {
    return baseTasks as TaskDto[];
  }

  getBranchTasks(): BranchTaskDto[] {
    return branchTasks;
  }

  runNpmScript(service: string, npmScript: string) {
    const cwd = this.servicesService.getServicePath(service);
    const command = `${this.npmCommand} run ${npmScript}`;
    this.servicesService.setServiceRunningNpmScript(service, npmScript);
    this.runProcess('__NPM_SCRIPT', command, '', service, cwd).then(() => {
      this.servicesService.setServiceRunningNpmScript(service, '');
      this.eventsGateway.sendStatusUpdateToClient();
    });
    return 'OK';
  }

  runTask(
    task: string,
    service: string,
    attributes: { [key: string]: string },
  ): string {
    let command = '';
    let cwd = this.servicesService.getServicePath(service);
    const shell = process.platform === 'win32' ? 'powershell.exe' : undefined;

    const serviceFolder = service.toLowerCase().split('_').join('-');
    const serviceObject = this.servicesService
      .getServices()
      .find((s) => s.name === service);
    this.servicesService.addRunningTask(service, task);

    this.servicesService.setServiceRunningTask(service, task);
    this.eventsGateway.sendStatusUpdateToClient();

    switch (task) {
      /**
       * NPM_INSTALL
       *******************************************************/
      case DefaultTask.NPM_INSTALL:
        command = `${this.npmCommand} i`;
        this.runProcess(task, command, '', service, cwd).then(() => {
          this.servicesService.setServiceRunningTask(service, '');
          this.eventsGateway.sendStatusUpdateToClient();
        });
        break;
      /**
       * START_SERVICE
       *******************************************************/
      case DefaultTask.START_SERVICE:
        this.servicesService.setServiceRunningTask(service, task);
        command = `${this.npmCommand} run ${serviceObject.npmRunLifecycle}`;
        this.servicesService.setServiceRunStatus(
          service,
          ServiceRunStatus.PENDING,
        );
        this.runProcess(task, command, '', service, cwd);
        this.servicesService.waitOnService(service).then(() => {
          this.servicesService.setServiceRunningTask(service, '');
          this.eventsGateway.sendStatusUpdateToClient();
        });
        break;
      /**
       * STOP_SERVICE
       *******************************************************/
      case DefaultTask.STOP_SERVICE:
        this.servicesService.setServiceRunStatus(
          service,
          ServiceRunStatus.STOPPED,
        );
        this.killProcess(service);
        break;
      /**
       * GIT_CLONE
       *******************************************************/
      case DefaultTask.GIT_CLONE:
        const serviceToClone = this.servicesService
          .getServices()
          .find((s) => s.name === service);
        let repoUrl: string;
        if (attributes.gitCheckoutType === 'ssh') {
          repoUrl = `git@${serviceToClone.gitUrl.replace(
            '/',
            ':',
          )}.git ${serviceFolder}`;
        } else if (attributes.gitCheckoutType === 'https') {
          repoUrl = `https://${serviceToClone.gitUrl}`;
        } else if (attributes.gitCheckoutType === 'https+basicauth') {
          repoUrl = `https://${attributes.basicAuth}@${serviceToClone.gitUrl}`;
        } else {
          throw new Error('Unknown gitCheckoutType :( ');
        }

        command = `git clone ${repoUrl}`;
        cwd = path.resolve(this.servicesDirectory);
        if (!ensureDirectory(this.servicesDirectory)) {
          break;
        }
        this.runProcess(task, command, '', service, cwd).then(() => {
          this.servicesService.setServiceRunningTask(service, '');
          this.eventsGateway.sendStatusUpdateToClient();
        });
        break;
      /**
       * SWITCH BRANCH
       *******************************************************/
      case DefaultTask.GIT_CHECKOUT:
        this.gitCheckout(service, attributes.branch, cwd);
        break;
      /**
       * REMOVE_SERVICE
       *******************************************************/
      case DefaultTask.REMOVE_SERVICE:
        command = `${this.rmCommand} ${serviceFolder}`;
        cwd = path.resolve(this.servicesDirectory);
        if (!ensureDirectory(this.servicesDirectory)) {
          break;
        }
        this.runProcess(task, command, '', service, cwd, shell, () => {
          const serviceToUpdate = this.servicesService
            .getServices()
            .find((s) => s.name === service);
          this.servicesService.resetServiceBranchStatus(serviceToUpdate);
        }).then(() => {
          this.servicesService.setServiceRunningTask(service, '');
          this.eventsGateway.sendStatusUpdateToClient();
        });
        break;
      /**
       * GIT_PULL
       *******************************************************/
      case DefaultTask.GIT_PULL:
        this.gitPull(service, cwd);
        break;
      /**
       * GIT_RESET
       *******************************************************/
      case DefaultTask.GIT_RESET:
        this.gitReset(service, cwd);
        break;
      default:
        const requestedTask = serviceObject.tasks.find((t) => t.name === task);
        if (serviceObject.genericTasks?.includes(task)) {
          this.performTask(
            serviceObject,
            this.servicesService.getGenericTasks().find((t) => t.name === task),
          );
        } else if (typeof requestedTask !== 'undefined') {
          this.performTask(serviceObject, requestedTask);
        } else {
          // we've added task before switch
          this.servicesService.removeRunningTask(service, task);
          this.servicesService.setServiceRunningTask(service, '');
          this.eventsGateway.sendStatusUpdateToClient();
          throw new Error(`Unknown task type: ${task}`);
        }
    }

    return 'OK';
  }

  performTask(service: BaseService, task: Task) {
    let command = task.command;
    command = command.replace('%{rm}', this.rmCommand);
    command = command.replace('%{npmCommand}', this.npmCommand);
    command = command.replace('%{service}', service.name);
    const cwd = this.servicesService.getServicePath(service.name);
    this.runProcess(task.name, command, '', service.name, cwd).then(() => {
      this.servicesService.setServiceRunningTask(service.name, '');
      this.eventsGateway.sendStatusUpdateToClient();
    });
  }

  killProcess(service: string) {
    const process = this.servicesService.getServiceProcess(service);
    if (process) {
      this.eventsGateway.sendLogsToClient(
        `Killing service (PID: ${process.pid})`,
        service,
        true,
      );

      kill(process.pid);
      this.servicesService.setServiceProcess(service, null);
      this.servicesService.setServiceRunningTask(service, '');
      this.eventsGateway.sendStatusUpdateToClient();
    }
  }

  async runProcess(
    taskName: string,
    command: string,
    prefix: string,
    service: string,
    cwd: string,
    shell?: string,
    callback: () => void = () => null,
  ) {
    this.logRunningCommand(command, service);

    this.eventsGateway.sendLogsToClient(`-> in path: "${cwd}"`, service, true);
    this.eventsGateway.sendStatusUpdateToClient();
    return new Promise((resolve) => {
      let resultData = '';
      const chunks = command.split(' ');
      console.log(`${prefix} Running: ${command}`);
      const process = spawn(chunks[0], chunks.slice(1), {
        cwd,
        shell,
      });

      this.servicesService.setServiceProcess(service, process);

      process.stderr.on('data', (data) => {
        this.logData(data, (line) => {
          console.log(`${prefix} ${line}`);
          this.eventsGateway.sendLogsToClient(line, service);
        });
      });
      process.stdout.on('data', (data) => {
        resultData += data.toString();
        this.logData(data, (line) => {
          console.log(`${prefix} ${line}`);
          this.eventsGateway.sendLogsToClient(line, service);
        });
      });
      process.on('exit', () => {
        callback();
        this.logCommandFinnished(command, service);
        this.servicesService.setServiceProcess(service, null);
        this.servicesService.removeRunningTask(service, taskName);
        this.eventsGateway.sendStatusUpdateToClient();
        resolve(resultData);
      });
    });
  }

  async gitPull(serviceName: string, cwd: string) {
    try {
      const service = this.servicesService
        .getServices()
        .find((s) => s.name === serviceName);
      if (service) {
        await this.runCommandWithLog(`git pull --ff-only`, serviceName, cwd);

        const change = await this.updateServiceStatus(service, cwd);
        if (change) {
          this.servicesService.setServiceRunningTask(service.name, '');
          this.eventsGateway.sendStatusUpdateToClient();
        }
      }
    } catch (error) {
      this.logError(serviceName, error);
    }
    this.servicesService.removeRunningTask(serviceName, DefaultTask.GIT_PULL);
    this.servicesService.setServiceRunningTask(serviceName, '');
    this.eventsGateway.sendStatusUpdateToClient();
  }

  async gitReset(serviceName: string, cwd: string) {
    try {
      const service = this.servicesService
        .getServices()
        .find((s) => s.name === serviceName);
      if (!service || !this.servicesService.serviceHasBranch(service)) {
        return;
      }

      const remoteBranch = await this.runCommandWithLog(
        `git for-each-ref --format='%(upstream:short)' "$(git symbolic-ref -q HEAD)"`,
        serviceName,
        cwd,
      );
      if (!remoteBranch || !this.servicesService.serviceHasBranch(service)) {
        this.servicesService.removeRunningTask(
          serviceName,
          DefaultTask.GIT_RESET,
        );
        this.servicesService.setServiceRunningTask(service.name, '');
        this.eventsGateway.sendStatusUpdateToClient();
        return;
      }

      await this.runCommandWithLog(
        `git reset --hard ${remoteBranch}`,
        serviceName,
        cwd,
      );
      if (!this.servicesService.serviceHasBranch(service)) {
        this.servicesService.removeRunningTask(
          serviceName,
          DefaultTask.GIT_RESET,
        );
        this.servicesService.setServiceRunningTask(service.name, '');
        this.eventsGateway.sendStatusUpdateToClient();
        return;
      }

      const change = await this.updateServiceStatus(service, cwd);
      if (change) {
        this.eventsGateway.sendStatusUpdateToClient();
      }
    } catch (error) {
      this.logError(serviceName, error);
    }
    this.servicesService.setServiceRunningTask(serviceName, '');
    this.servicesService.removeRunningTask(serviceName, DefaultTask.GIT_RESET);
    this.eventsGateway.sendStatusUpdateToClient();
  }

  async gitCheckout(
    serviceName: string,
    branch: string | undefined,
    cwd: string,
  ) {
    const service = this.servicesService
      .getServices()
      .find((s) => s.name === serviceName);
    if (!service || !this.servicesService.serviceHasBranch(service)) {
      return;
    }
    if (branch === undefined) {
      if (!service.defaultGitBranch) {
        console.log(
          'GIT_CHECKOUT: no branch provided and no defaultBranch configured, not running',
        );
        this.servicesService.removeRunningTask(
          serviceName,
          DefaultTask.GIT_CHECKOUT,
        );
        this.servicesService.setServiceRunningTask(service.name, '');
        this.eventsGateway.sendStatusUpdateToClient();
        return;
      }
      branch = service.defaultGitBranch;
    }
    const command = `git checkout ${branch}`;
    await this.runCommandWithLog(command, serviceName, cwd, true);
    await this.updateServiceStatus(service, cwd);
    await this.gitReset(serviceName, cwd);
    this.servicesService.removeRunningTask(
      serviceName,
      DefaultTask.GIT_CHECKOUT,
    );
    this.servicesService.setServiceRunningTask(service.name, '');
    this.eventsGateway.sendStatusUpdateToClient();
  }

  async updateServiceStatus(
    service: BaseService,
    cwd: string,
    withLogging = true,
  ) {
    let change = false;

    try {
      if (!this.servicesService.serviceHasBranch(service)) {
        return false;
      }

      await this.runCommandWithLog(
        'git fetch origin',
        service.name,
        cwd,
        withLogging,
      );

      if (!this.servicesService.serviceHasBranch(service)) {
        return false;
      }

      const status = await this.runCommandWithLog(
        'git status -s -b',
        service.name,
        cwd,
        withLogging,
      );

      if (!this.servicesService.serviceHasBranch(service)) {
        return false;
      }

      const ahead = this.getStatusValue(status, 'ahead');
      if (service.currentGitBranchAhead !== ahead) {
        service.currentGitBranchAhead = ahead;
        change = true;
      }

      const behind = this.getStatusValue(status, 'behind');
      if (service.currentGitBranchBehind !== behind) {
        service.currentGitBranchBehind = behind;
        change = true;
      }
    } catch (error) {
      if (this.servicesService.serviceHasBranch(service)) {
        console.error(error);
      }
    }

    return change;
  }

  private getStatusValue(status: string, value: string) {
    const match = status.match(new RegExp(`${value} \\d+`))?.[0];
    if (!match) {
      return 0;
    }
    const result = Number(match.replace(new RegExp(`${value} `), ''));
    return isNaN(result) ? 0 : result;
  }

  private async runCommandWithLog(
    command: string,
    service: string,
    cwd: string,
    withLogging = true,
  ) {
    if (withLogging) {
      this.logRunningCommand(command, service);
    }

    const result = await runCommand(command, cwd);

    if (withLogging) {
      this.logCommandFinnished(command, service);
    }

    return result;
  }

  private logError(serviceName: string, error) {
    console.error(error);
    const data =
      typeof error?.toString === 'function' ? error.toString() : undefined;
    if (data) {
      this.logData(data, (line) => {
        this.eventsGateway.sendLogsToClient(line, serviceName);
      });
    }
  }

  private logData(data: string, callback: (line: string) => void) {
    data
      .toString()
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i !== '')
      .forEach(callback);
  }

  private logRunningCommand(command: string, service: string) {
    this.eventsGateway.sendLogsToClient(
      `Running command: "${command}"`,
      service,
      true,
    );
  }

  private logCommandFinnished(command: string, service: string) {
    this.eventsGateway.sendLogsToClient(
      `Command finished: "${command}"`,
      service,
      true,
    );
  }
}
