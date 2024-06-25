import { Injectable } from '@nestjs/common';
import { BaseService, ServicesService } from './services.service';
import { Cron } from '@nestjs/schedule';
import * as pidusage from 'pidusage';
import { EventsGateway } from '../events.gateway';
import { runCommand } from 'src/utils/process';
import { CommandService } from './command.service';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pidtree = require('pidtree');

@Injectable()
export class MonitorService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly commandService: CommandService,
    private readonly eventsGateway: EventsGateway,
    configService: ConfigService,
  ) {
    for (const service of servicesService.getServices()) {
      const gitInterval = configService.get<number>('git_interval');
      if (gitInterval > 0) {
        // required to call function on THIS object, cannot just pass this.functionName
        setInterval(() => {
          this.loadCurrentBranchStatus(service);
        }, gitInterval * 1000);
      }
    }
  }

  @Cron('* * * * * *')
  async loadCurrentBranches() {
    let change = false;
    for (const service of this.servicesService.getServices()) {
      if (this.servicesService.serviceIsCloned(service)) {
        const cwd = this.servicesService.getServicePath(service.name);
        const branch = await runCommand('git rev-parse --abbrev-ref HEAD', cwd);
        if (service.currentGitBranch !== branch) {
          if (branch) {
            service.currentGitBranch = branch;
          } else {
            this.servicesService.resetServiceBranchStatus(service);
          }
          change = true;
        }
      } else if (service.currentGitBranch !== undefined) {
        this.servicesService.resetServiceBranchStatus(service);
        change = true;
      }
    }
    if (change) {
      this.eventsGateway.sendStatusUpdateToClient();
    }
  }

  @Cron('* * * * * *')
  async loadCurrentBranchesHasChanges() {
    let change = false;
    for (const service of this.servicesService.getServices()) {
      if (this.servicesService.serviceHasBranch(service)) {
        try {
          const cwd = this.servicesService.getServicePath(service.name);

          const changedFiles = await runCommand('git status -s', cwd);

          const hasChanges = changedFiles.length > 0;
          if (
            this.servicesService.serviceHasBranch(service) &&
            service.currentGitBranchHasChanges !== hasChanges
          ) {
            service.currentGitBranchHasChanges = hasChanges;
            change = true;
          }
        } catch (error) {
          if (this.servicesService.serviceHasBranch(service)) {
            console.error(error);
          }
        }
      }
    }
    if (change) {
      this.eventsGateway.sendStatusUpdateToClient();
    }
  }

  async loadCurrentBranchStatus(service: BaseService) {
    if (this.servicesService.serviceHasBranch(service)) {
      const cwd = this.servicesService.getServicePath(service.name);

      const change = await this.commandService.updateServiceStatus(
        service,
        cwd,
        false,
      );

      if (change) {
        this.eventsGateway.sendStatusUpdateToClient();
      }
    }
  }

  @Cron('* * * * * *')
  processSystemMonitor() {
    for (const service of this.servicesService.getServices()) {
      if (service.process) {
        pidtree(service.process.pid, (_, pids) => {
          if (!pids) {
            return;
          }
          pidusage([...pids, service.process.pid], (_, stats) => {
            let memory = 0;
            let cpu = 0;

            // count stats for subprocesses

            if (!!stats) {
              Object.keys(stats).forEach((subProcessPid) => {
                let subProcessMemory = 0;
                let subProcessCpu = 0;
                if (stats[subProcessPid]) {
                  subProcessMemory = stats[subProcessPid].memory / 1024 / 1024;
                  subProcessCpu = stats[subProcessPid].cpu;
                }
                memory = memory + subProcessMemory;
                cpu = cpu + subProcessCpu;
              });

              this.servicesService.setServiceMonitorStats(
                service.name,
                cpu,
                memory,
              );
            }
          });
        });
      }
    }
  }

  @Cron('* * * * * *')
  sendMonitorDataToClient() {
    const data = this.servicesService.getServices().map((service) => {
      return {
        service: service.name,
        cpuPercent: Math.round(service.monitorStats.cpuPercent),
        memoryMegaBytes: Math.round(service.monitorStats.memoryMegaBytes),
      };
    });

    this.eventsGateway.sendMonitorStatsToClient(data);
  }
}
