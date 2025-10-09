import { ServicesService, PackageManager } from './services.service';
import { CommandService } from './command.service';
import { Injectable } from '@nestjs/common';
import { GitService } from './git.service';
import { PckgAutofixDto } from '../dto/pckg-autofix.dto';

@Injectable()
export class PckgAuditService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly commandService: CommandService,
    private readonly gitService: GitService,
  ) {}

  /**
   * Retrieves the package audit for a given service.
   *
   * @param {string} serviceName - The name of the service to retrieve the audit for.
   * @return {Promise<string>} - A promise that resolves with the audit JSON string for the service.
   */
  async getPackageAuditForService(serviceName: string): Promise<string> {
    const cwd = this.servicesService.getServicePath(serviceName);
    const service = this.servicesService.getServices().find(s => s.name === serviceName);
    const packageManagerCommand = this.commandService.getPackageManagerCommand(serviceName);
    
    let command: string;
    switch (service.packageManager) {
      case PackageManager.NPM:
        command = `${packageManagerCommand} audit --json`;
        break;
      case PackageManager.PNPM:
        command = `${packageManagerCommand} audit --json`;
        break;
      default:
        throw new Error(`Audit not supported for package manager: ${service.packageManager}`);
    }

    const result = await this.commandService.runProcess(
      '__PACKAGE_AUDIT',
      command,
      serviceName,
      serviceName,
      cwd,
    );

    return result as string;
  }

  /**
   * Automatically fix package audit vulnerabilities for a given service.
   *
   * @param {string} serviceName - The name of the service to perform the fix on.
   * @param {PckgAutofixDto} dto - The DTO object containing the branch name and push flag.
   * @returns {Promise<string>} - A promise that resolves to the string 'OK' if the fix is successful.
   */
  async packageAuditAutoFix(
    serviceName: string,
    dto: PckgAutofixDto,
  ): Promise<string> {
    const cwd = this.servicesService.getServicePath(serviceName);
    const service = this.servicesService.getServices().find(s => s.name === serviceName);
    const packageManagerCommand = this.commandService.getPackageManagerCommand(serviceName);

    await this.gitService.createBranch(serviceName, dto.branch);
    await this.gitService.checkout(serviceName, dto.branch);

    let command: string;
    switch (service.packageManager) {
      case PackageManager.NPM:
        command = `${packageManagerCommand} audit fix ${dto.useForce ? '--force' : ''}`;
        break;
      case PackageManager.PNPM:
        command = `${packageManagerCommand} audit --fix`;
        break;
      default:
        throw new Error(`Audit fix not supported for package manager: ${service.packageManager}`);
    }

    await this.commandService.runProcess(
      '__PACKAGE_AUDIT_FIX',
      command,
      serviceName,
      serviceName,
      cwd,
    );

    await this.gitService.addAll(serviceName);
    await this.gitService.commit(
      serviceName,
      `package audit autofix by tf-service-manager (${service.packageManager})`,
    );
    
    if (dto.pushToOrigin) {
      await this.gitService.push(serviceName, dto.branch, 'origin');
    }

    return 'OK';
  }

  /**
   * Checks if audit fix is supported for the given service's package manager.
   *
   * @param {string} serviceName - The name of the service.
   * @returns {boolean} - True if audit fix is supported, false otherwise.
   */
  isAuditFixSupported(serviceName: string): boolean {
    const service = this.servicesService.getServices().find(s => s.name === serviceName);
    return true; // Currently supports all package managers with audit fix commands
  }
}