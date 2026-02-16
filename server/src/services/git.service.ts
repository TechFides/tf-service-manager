import { ServicesService } from './services.service';
import { CommandService, DefaultTask } from './command.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EventsGateway } from '../events.gateway';

@Injectable()
export class GitService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => CommandService))
    private readonly commandService: CommandService,
  ) { }
  /**
   * Asynchronously pulls the latest changes from a git repository.
   *
   * @param {string} serviceName - The name of the service.
   * @return {Promise<void>} - A Promise that resolves when the git pull operation is completed.
   */
  async pull(serviceName: string): Promise<void> {
    try {
      const service = this.servicesService
        .getServices()
        .find((s) => s.name === serviceName);
      if (service) {
        const cwd = this.servicesService.getServicePath(serviceName);
        const currentBranch = await this.commandService.runCommandWithLog(
          'git symbolic-ref --short HEAD',
          serviceName,
          cwd,
          false,
        );

        await this.commandService.runProcess(
          DefaultTask.GIT_PULL,
          `git fetch origin refs/heads/${currentBranch.trim()}`,
          '',
          serviceName,
          cwd,
        );

        await this.commandService.runProcess(
          DefaultTask.GIT_PULL,
          `git merge --ff-only FETCH_HEAD`,
          '',
          serviceName,
          cwd,
        );

        const change = await this.commandService.updateServiceStatus(
          service,
          cwd,
        );



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

  /**
   * Pushes the specified branch to the remote repository.
   *
   * @param {string} serviceName - The name of the service.
   * @param {string} branchName - The name of the branch.
   * @param {string} [upstream] - The name of the upstream repository (optional).
   * @returns {Promise<void>} - A Promise that resolves when the push operation is complete.
   */
  async push(
    serviceName: string,
    branchName: string,
    upstream?: string,
  ): Promise<void> {
    const service = this.servicesService
      .getServices()
      .find((s) => s.name === serviceName);
    if (!service || !this.servicesService.serviceHasBranch(service)) {
      return;
    }

    const cwd = this.servicesService.getServicePath(serviceName);
    const command = `git push ${upstream ? '--set-upstream ' + upstream : ''
      } ${branchName}`;

    await this.commandService.runCommandWithLog(
      command,
      serviceName,
      cwd,
      true,
    );
    await this.commandService.updateServiceStatus(service, cwd);
    this.eventsGateway.sendStatusUpdateToClient();
  }

  /**
   * Resets the git repository for a given service asynchronously.
   *
   * @param {string} serviceName - The name of the service.
   *
   * @return {Promise<void>} - A promise that resolves when the git reset is complete.
   */
  async reset(serviceName: string): Promise<void> {
    try {
      const service = this.servicesService
        .getServices()
        .find((s) => s.name === serviceName);
      if (!service || !this.servicesService.serviceHasBranch(service)) {
        return;
      }
      const cwd = this.servicesService.getServicePath(serviceName);

      const remoteBranch = await this.commandService.runCommandWithLog(
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

      await this.commandService.runCommandWithLog(
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

      const change = await this.commandService.updateServiceStatus(
        service,
        cwd,
      );
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

  /**
   * Asynchronously checks out a Git branch for a given service.
   *
   * @param {string} serviceName - The name of the service.
   * @param {string | undefined} branch - The branch to check out. If undefined, the default branch of the service will be used.
   *
   * @return {Promise<void>} A promise that resolves when the Git checkout operation is complete.
   */
  async checkout(
    serviceName: string,
    branch: string | undefined,
  ): Promise<void> {
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
    const cwd = this.servicesService.getServicePath(serviceName);
    const command = `git checkout ${branch}`;
    await this.commandService.runCommandWithLog(
      command,
      serviceName,
      cwd,
      true,
    );
    await this.commandService.updateServiceStatus(service, cwd);
    await this.reset(serviceName);
    this.servicesService.removeRunningTask(
      serviceName,
      DefaultTask.GIT_CHECKOUT,
    );
    this.servicesService.setServiceRunningTask(service.name, '');
    this.eventsGateway.sendStatusUpdateToClient();
  }

  /**
   * Creates a new branch for a given service.
   *
   * @param {string} serviceName - The name of the service.
   * @param {string} branchName - The name of the new branch.
   * @returns {Promise<void>} - A promise that resolves once the branch is created.
   */
  async createBranch(serviceName: string, branchName: string): Promise<void> {
    const service = this.servicesService
      .getServices()
      .find((s) => s.name === serviceName);
    if (!service || !this.servicesService.serviceHasBranch(service)) {
      return;
    }
    const cwd = this.servicesService.getServicePath(serviceName);

    const command = `git branch ${branchName}`;
    await this.commandService.runCommandWithLog(
      command,
      serviceName,
      cwd,
      true,
    );
    await this.commandService.updateServiceStatus(service, cwd);
    this.eventsGateway.sendStatusUpdateToClient();
  }

  /**
   * Adds all files in the current working directory to the specified service.
   *
   * @param {string} serviceName - The name of the service to add files to.
   * @returns {Promise<void>} - A Promise that resolves when the operation is completed.
   */
  async addAll(serviceName: string): Promise<void> {
    const service = this.servicesService
      .getServices()
      .find((s) => s.name === serviceName);
    if (!service || !this.servicesService.serviceHasBranch(service)) {
      return;
    }
    const cwd = this.servicesService.getServicePath(serviceName);
    const command = `git add .`;
    await this.commandService.runCommandWithLog(
      command,
      serviceName,
      cwd,
      true,
    );
    await this.commandService.updateServiceStatus(service, cwd);
    this.eventsGateway.sendStatusUpdateToClient();
  }

  /**
   * Commit changes to the git repository of a service.
   *
   * @param {string} serviceName - The name of the service to commit changes for.
   * @param {string} commitMessage - The commit message to use for the commit.
   * @return {Promise<void>} - A promise that resolves when the commit is complete.
   */
  async commit(serviceName: string, commitMessage: string): Promise<void> {
    const service = this.servicesService
      .getServices()
      .find((s) => s.name === serviceName);
    if (!service || !this.servicesService.serviceHasBranch(service)) {
      return;
    }
    const cwd = this.servicesService.getServicePath(serviceName);
    const command = `git commit -m "${commitMessage}"`;
    await this.commandService.runCommandWithLog(
      command,
      serviceName,
      cwd,
      true,
    );
    await this.commandService.updateServiceStatus(service, cwd);
    this.eventsGateway.sendStatusUpdateToClient();
  }

  private logError(serviceName: string, error) {
    console.error(error);
    const data =
      typeof error?.toString === 'function' ? error.toString() : undefined;
    if (data) {
      this.commandService.logData(data, (line) => {
        this.eventsGateway.sendLogsToClient(line, serviceName);
      });
    }
  }
}
