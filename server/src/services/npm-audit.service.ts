import { ServicesService } from './services.service';
import { CommandService } from './command.service';
import { Injectable } from '@nestjs/common';
import { GitService } from './git.service';

@Injectable()
export class NpmAuditService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly commandService: CommandService,
    private readonly gitService: GitService,
  ) {}
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

  async npmAuditAutoFix(serviceName: string): Promise<string> {
    const cwd = this.servicesService.getServicePath(serviceName);
    const branchName = `npm-audit-fix-${new Date()
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-')}`;

    await this.gitService.createBranch(serviceName, branchName);
    await this.gitService.checkout(serviceName, branchName);
    await this.commandService.runProcess(
      '__NPM_COMMAND',
      'npm audit fix',
      serviceName,
      serviceName,
      cwd,
    );
    await this.gitService.addAll(serviceName);
    await this.gitService.commit(
      serviceName,
      'npm audit autofix by tf-service-manager',
    );
    //await this.gitService.push(serviceName, branchName, 'origin');

    return 'OK';
  }
}
