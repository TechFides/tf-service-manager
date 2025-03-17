import { ServicesService } from './services.service';
import { CommandService } from './command.service';
import { Injectable } from '@nestjs/common';
import { GitService } from './git.service';
import { NpmAutofixDto } from '../dto/npm-autofix.dto';

@Injectable()
export class NpmAuditService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly commandService: CommandService,
    private readonly gitService: GitService,
  ) {}
  /**
   * Retrieves the NPM audit for a given service.
   *
   * @param {string} serviceName - The name of the service to retrieve the NPM audit for.
   * @return {Promise<string>} - A promise that resolves with the NPM audit JSON string for the service.
   */
  async getNpmAuditForService(serviceName: string): Promise<string> {
    const cwd = this.servicesService.getServicePath(serviceName);
    const result = await this.commandService.runProcess(
      '__NPM_COMMAND',
      'npm audit -json',
      serviceName,
      serviceName,
      cwd,
    );

    return result as string;
  }

  /**
   * Automatically fix npm audit vulnerabilities for a given service.
   *
   * @param {string} serviceName - The name of the service to perform the fix on.
   * @param {NpmAutofixDto} dto - The DTO object containing the branch name and push flag.
   * @returns {Promise<string>} - A promise that resolves to the string 'OK' if the fix is successful.
   */
  async npmAuditAutoFix(
    serviceName: string,
    dto: NpmAutofixDto,
  ): Promise<string> {
    const cwd = this.servicesService.getServicePath(serviceName);

    await this.gitService.createBranch(serviceName, dto.branch);
    await this.gitService.checkout(serviceName, dto.branch);
    await this.commandService.runProcess(
      '__NPM_COMMAND',
      `npm audit fix ${dto.useForce ? '--force' : ''}`,
      serviceName,
      serviceName,
      cwd,
    );
    await this.gitService.addFiles(serviceName, ['package-lock.json']);
    await this.gitService.commit(
      serviceName,
      'npm audit autofix by tf-service-manager',
    );
    if (dto.pushToOrigin) {
      await this.gitService.push(serviceName, dto.branch, 'origin');
    }

    return 'OK';
  }
}
