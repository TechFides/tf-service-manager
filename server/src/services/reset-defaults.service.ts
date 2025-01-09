import { Injectable } from '@nestjs/common';
import { CommandService, DefaultTask } from './command.service';
import { ServicesService } from './services.service';

@Injectable()
export class ResetDefaultsService {
  constructor(
    private readonly commandService: CommandService,
    private readonly servicesService: ServicesService,
  ) {}

  async resetAllServices(): Promise<string> {
    // reset repozitářů (clone pokud neexistují)
    console.log('started procedure');
    const serviceStatuses = this.servicesService.getServicesStatus();
    const clonePromises: Promise<string>[] = [];
    const resetPromises: Promise<string>[] = [];
    const checkoutPromises: Promise<string>[] = [];
    const pullPromises: Promise<string>[] = [];

    for (const service of serviceStatuses) {
      if (!service.cloned) {
        clonePromises.push(
          this.commandService.runTask(DefaultTask.GIT_CLONE, service.name, {
            gitCheckoutType: 'ssh',
          }),
        );
        continue;
      }

      if (service.currentGitBranchHasChanges) {
        resetPromises.push(
          this.commandService.runTask(DefaultTask.GIT_RESET, service.name, {}),
        );
      }

      checkoutPromises.push(
        this.commandService.runTask(DefaultTask.GIT_CHECKOUT, service.name, {}),
      );
      pullPromises.push(
        this.commandService.runTask(DefaultTask.GIT_PULL, service.name, {}),
      );
    }

    await Promise.all(clonePromises);
    await Promise.all(resetPromises);
    await Promise.all(checkoutPromises);
    await Promise.all(pullPromises);

    //npm install
    const npmInstallPromises: Promise<string>[] = [];
    for (const service of serviceStatuses) {
      npmInstallPromises.push(
        this.commandService.runTask(DefaultTask.NPM_INSTALL, service.name, {}),
      );
    }
    await Promise.all(npmInstallPromises);

    //vykopírování envů / db reset
    const copyEnvTaskName = 'COPY_ENV';
    const envPromises: Promise<string>[] = [];
    const dbResetTaskName = 'RESET_DATABASE';
    const dbResetPromises: Promise<string>[] = [];

    for (const service of this.servicesService.getServices()) {
      if (service.genericTasks.includes(copyEnvTaskName)) {
        envPromises.push(
          this.commandService.runTask(copyEnvTaskName, service.name, {}),
        );
      }

      if (service.genericTasks.includes(dbResetTaskName)) {
        dbResetPromises.push(
          this.commandService.runTask(dbResetTaskName, service.name, {}),
        );
      }
    }

    await Promise.all(envPromises);
    console.log(`awaiting env promises: count: ${envPromises.length}`);
    await Promise.all(dbResetPromises);
    console.log(`awaiting dbreset promises: count: ${dbResetPromises.length}`);

    //nějak notifikuje
    console.log('everything done');
    return 'OK';
  }
}
