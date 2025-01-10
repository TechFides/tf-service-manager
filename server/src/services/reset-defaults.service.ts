import { Injectable } from '@nestjs/common';
import { CommandService, DefaultTask } from './command.service';
import { BaseService, ServicesService } from './services.service';
import { EventsGateway } from '../events.gateway';

@Injectable()
export class ResetDefaultsService {
  private readonly copyEnvTaskName = 'COPY_ENV';
  private readonly dbResetTaskName = 'RESET_DATABASE';

  constructor(
    private readonly commandService: CommandService,
    private readonly servicesService: ServicesService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async resetAllServices(gitCheckoutType: string): Promise<string> {
    try {
      const services = this.servicesService.getServices();
      const promises = services.map((service) =>
        this.resetService(service, gitCheckoutType),
      );

      await Promise.all(promises);
      this.eventsGateway.sendResetDefaultsSuccess();
      return 'OK';
    } catch (error) {
      this.eventsGateway.sendResetDefaultsError(error);
      throw error;
    }
  }

  async resetService(
    service: BaseService,
    gitCheckoutType: string,
  ): Promise<string> {
    await this.resetServiceGit(service.name, gitCheckoutType);
    await this.commandService.runTask(
      DefaultTask.NPM_INSTALL,
      service.name,
      {},
    );

    if (service.genericTasks.includes(this.copyEnvTaskName)) {
      await this.commandService.runTask(this.copyEnvTaskName, service.name, {});
    }

    if (service.genericTasks.includes(this.dbResetTaskName)) {
      await this.commandService.runTask(this.dbResetTaskName, service.name, {});
    }

    return 'OK';
  }

  async resetServiceGit(
    serviceName: string,
    gitCheckoutType: string,
  ): Promise<void> {
    const serviceStatus = this.servicesService
      .getServicesStatus()
      .find((s) => s.name === serviceName);

    if (!serviceStatus.cloned) {
      await this.commandService.runTask(DefaultTask.GIT_CLONE, serviceName, {
        gitCheckoutType: gitCheckoutType,
      });
      return;
    }

    await this.commandService.runTask(DefaultTask.GIT_RESET, serviceName, {});
    await this.commandService.runTask(
      DefaultTask.GIT_CHECKOUT,
      serviceName,
      {},
    );
    await this.commandService.runTask(DefaultTask.GIT_PULL, serviceName, {});
  }
}
