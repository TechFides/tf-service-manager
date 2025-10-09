import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { ServiceDto, TaskDto } from '../dto/service.dto';
import { ServiceStatusDto } from '../dto/service-status.dto';
import * as fs from 'fs';
import * as waitOn from 'wait-on';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { ConfigService } from '@nestjs/config';
import * as console from 'node:console';

export enum ServiceRunStatus {
  RUNNING = 'RUNNING',
  PENDING = 'PENDING',
  STOPPED = 'STOPPED',
}

export enum PackageManager {
  NPM = 'npm',
  PNPM = 'pnpm',
  YARN = 'yarn',
}

export interface BaseService {
  name: string;
  runStatus: ServiceRunStatus;
  color: string; //see https://quasar.dev/style/color-palette#brand-colors
  npmRunLifecycle: string;
  gitUrl: string;
  appUrlSuffix: string;
  packageManager: PackageManager; // povinné na runtime level
  genericTasks: string[];
  tasks: Task[];
  process?: ChildProcessWithoutNullStreams;
  monitorStats: {
    cpuPercent: number;
    memoryMegaBytes: number;
  };
  runningScript: string;
  runningTask: string;
  runningTasks: string[];
  port: number;
  defaultGitBranch?: string;
  currentGitBranch?: string;
  currentGitBranchHasChanges?: boolean;
  currentGitBranchAhead?: number;
  currentGitBranchBehind?: number;
}

export interface Task {
  name: string;
  command: string;
  icon: string;
  color?: string;
  runIfNotCloned: boolean;
  runIfRunStatusIs?: ServiceRunStatus[];
}

export interface BaseServiceConfig {
  name: string;
  npmRunLifecycle: string;
  gitUrl: string;
  port: number;
  appUrlSuffix: string;
  color: string; //see https://quasar.dev/style/color-palette#brand-colors
  packageManager?: PackageManager; // optional for backward compatibility
  genericTasks?: string[];
  tasks?: Task[];
  defaultGitBranch?: string;
}

const ensureTaskHasRequiredFields = (task: Task): void => {
  if (task.color === undefined) {
    task.color = 'grey-8';
  }
  if (task.runIfRunStatusIs === undefined) {
    task.runIfRunStatusIs = [];
    // if runIfRunStatusIs isn't specified, assume that the task can be run whenever
    for (const status in ServiceRunStatus) {
      task.runIfRunStatusIs.push(status as ServiceRunStatus);
    }
  }
};

@Injectable()
export class ServicesService {
  private readonly services: BaseService[] = [];
  private readonly genericTasks: Task[] = [];
  private readonly servicesDirectory: string;
  constructor(configService: ConfigService) {
    this.genericTasks = configService.get<Task[]>('generic_tasks');
    for (const task of this.genericTasks) {
      ensureTaskHasRequiredFields(task);
    }
    for (const service of configService.get<BaseServiceConfig[]>('services')) {
      const baseService: BaseService = service as BaseService;
      baseService.runningScript = '';
      baseService.runningTask = '';
      baseService.runStatus = ServiceRunStatus.STOPPED;
      baseService.packageManager = service.packageManager?.toLowerCase() as PackageManager || PackageManager.NPM; // default NPM for backward compatibility
      baseService.monitorStats = {
        cpuPercent: 0,
        memoryMegaBytes: 0,
      };
      if (service.tasks == null) {
        service.tasks = [];
      }
      for (const task of service.tasks) {
        ensureTaskHasRequiredFields(task);
      }
      baseService.runningTasks = [];
      this.services.push(service as BaseService);
    }
    const directory = configService.get<string>('services_directory');
    if (path.isAbsolute(directory)) {
      this.servicesDirectory = path.resolve(directory);
    } else {
      this.servicesDirectory = path.resolve(
        `${__dirname}/../../../${directory}`,
      );
    }
  }
  async getServicesDto(): Promise<ServiceDto[]> {
    const result = [];
    for (const service of this.services) {
      const tasks: TaskDto[] = this.genericTasks.filter((task) =>
        service.genericTasks?.includes(task.name),
      ) as TaskDto[];

      for (const task of service.tasks) {
        tasks.push(task as TaskDto);
      }

      result.push({
        name: service.name,
        color: service.color,
        appUrl: `http://localhost:${service.port}/${service.appUrlSuffix}`,
        pipelineBadge: `https://${service.gitUrl}/badges/develop/pipeline.svg`,
        coverageBadge: `https://${service.gitUrl}/badges/develop/coverage.svg`,
        pckgScripts: await this.getServicePckgScripts(service.name),
        gitUrl: service.gitUrl,
        packageManager: service.packageManager,
        tasks: tasks,
      });
    }

    return result;
  }

  getServices(): BaseService[] {
    return this.services;
  }

  getGenericTasks(): Task[] {
    return this.genericTasks;
  }

  setServiceMonitorStats(
    service: string,
    cpuPercent: number,
    memoryMegaBytes: number,
  ) {
    this.services.find((s) => s.name === service).monitorStats = {
      cpuPercent,
      memoryMegaBytes,
    };
  }

  getServicesStatus(): ServiceStatusDto[] {
    return this.services.map((service) => {
      return {
        name: service.name,
        runStatus: service.runStatus,
        cloned: this.serviceIsCloned(service),
        runningScript: service.runningScript,
        runningTask: service.runningTask,
        runningTasks: service.runningTasks,
        currentGitBranch: service.currentGitBranch,
        currentGitBranchHasChanges: service.currentGitBranchHasChanges,
        currentGitBranchAhead: service.currentGitBranchAhead,
        currentGitBranchBehind: service.currentGitBranchBehind,
      };
    });
  }

  async getServicePckgScripts(service: string): Promise<string[]> {
    try {
      const packageJsonPath = path.resolve(
        `${this.servicesDirectory}/${service
          .toLowerCase()
          .split('_')
          .join('-')}/package.json`,
      );
      const packageJson = fs.readFileSync(packageJsonPath);
      if (packageJson) {
        const data = JSON.parse(packageJson.toString());
        return Object.keys(data.scripts);
      } else {
        return [];
      }
    } catch (e) {
      console.log(`Can not load npm scripts for service: ${service}`);
    }
  }

  async waitOnService(serviceName: string) {
    const service = this.services.find((s) => s.name === serviceName);
    const serviceUrl = `http-get://localhost:${service.port}/${service.appUrlSuffix}`;
    return waitOn({
      resources: [serviceUrl],
      headers: {
        accept: 'text/html',
      },
    })
      .then(() => {
        this.setServiceRunStatus(serviceName, ServiceRunStatus.RUNNING);
      })
      .catch((err) => {
        console.log(err);
        this.setServiceRunStatus(serviceName, ServiceRunStatus.STOPPED);
      });
  }

  setServiceRunningScript(service: string, script: string): void {
    this.services.find((s) => s.name === service).runningScript = script;
  }

  setServiceRunningTask(service: string, task: string): void {
    this.services.find((s) => s.name === service).runningTask = task;
  }

  setServiceRunStatus(service: string, status: ServiceRunStatus): void {
    this.services.find((s) => s.name === service).runStatus = status;
  }

  setServiceProcess(service: string, process?: ChildProcessWithoutNullStreams) {
    const serviceItem = this.services.find((s) => s.name === service);
    serviceItem.process = process;
    if (process === null) {
      serviceItem.monitorStats = {
        cpuPercent: 0,
        memoryMegaBytes: 0,
      };
    }
  }

  addRunningTask(service: string, task: string) {
    const serviceItem = this.services.find((s) => s.name === service);
    serviceItem.runningTasks.push(task);
  }

  removeRunningTask(service: string, task: string) {
    const serviceItem = this.services.find((s) => s.name === service);
    const index = serviceItem.runningTasks.indexOf(task);
    if (index != -1) {
      serviceItem.runningTasks.splice(index, 1);
    }
  }

  getServiceProcess(service: string): ChildProcessWithoutNullStreams {
    return this.services.find((s) => s.name === service).process;
  }

  getServicePath(service: string): string {
    return path.resolve(
      `${this.servicesDirectory}/${service.toLowerCase().split('_').join('-')}`,
    );
  }

  serviceIsCloned(service: BaseService) {
    const cwd = this.getServicePath(service.name);
    return fs.existsSync(cwd) && fs.readdirSync(cwd).length > 1;
  }

  serviceHasBranch(service: BaseService) {
    return this.serviceIsCloned(service) && service.currentGitBranch;
  }

  resetServiceBranchStatus(service: BaseService) {
    service.currentGitBranch = undefined;
    service.currentGitBranchHasChanges = false;
    service.currentGitBranchAhead = 0;
    service.currentGitBranchBehind = 0;
  }
}
