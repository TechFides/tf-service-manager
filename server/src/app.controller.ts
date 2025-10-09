import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { RunCommandDto } from './dto/run-command.dto';
import { ServicesDto, TaskDto } from './dto/service.dto';
import { CommandService } from './services/command.service';
import { RunTaskDto } from './dto/run-task.dto';
import { ServicesStatusDto } from './dto/service-status.dto';
import { ServicesService } from './services/services.service';
import { RunPckgScriptDto } from './dto/run-pckg-script.dto';
import { BranchTasksDto } from './dto/branch-task.dto';
import { PckgAuditService } from './services/pckg-audit.service';
import { PckgAutofixDto } from './dto/pckg-autofix.dto';
import { ResetDefaultsService } from './services/reset-defaults.service';
import * as console from 'node:console';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly servicesService: ServicesService,
    private readonly commandService: CommandService,
    private readonly pckgAuditService: PckgAuditService,
    private readonly resetDefaultsService: ResetDefaultsService,
  ) {}

  @Get()
  getHello(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('/services')
  async getAllServices(): Promise<ServicesDto> {
    const serviceDto = new ServicesDto();
    serviceDto.services = await this.servicesService.getServicesDto();
    return serviceDto;
  }

  @Get('/services/:serviceName/pckg-audit')
  async getPckgAuditForService(
    @Param('serviceName') serviceName: string,
  ): Promise<string> {
    const result = await this.pckgAuditService.getPackageAuditForService(
      serviceName,
    );
    return JSON.parse(result);
  }

  @Post('/services/:serviceName/pckg-audit-auto-fix')
  async getPckgAuditAutFixForService(
    @Param('serviceName') serviceName: string,
    @Body() dto: PckgAutofixDto,
  ): Promise<string> {
    return this.pckgAuditService.packageAuditAutoFix(serviceName, dto);
  }

  @Get('/services-status')
  getAllServicesStatus(): ServicesStatusDto {
    const servicesStatusDto = new ServicesStatusDto();
    servicesStatusDto.services = this.servicesService.getServicesStatus();
    return servicesStatusDto;
  }

  @Get('/tasks')
  getAllTasks(): TaskDto[] {
    return this.commandService.getTasks();
  }

  @Get('/branch-tasks')
  getAllBranchTasks(): BranchTasksDto {
    const branchTasksDto = new BranchTasksDto();
    branchTasksDto.branchTasks = this.commandService.getBranchTasks();
    return branchTasksDto;
  }

  @Post('run/command')
  runCommand(@Body() dto: RunCommandDto): string {
    return this.appService.runCommand(dto.command, dto.service);
  }

  @Post('run/task')
  async runTask(@Body() dto: RunTaskDto): Promise<string> {
    return await this.commandService.runTask(
      dto.task,
      dto.service,
      dto.attributes,
    );
  }

  @Post('run/pckg-script')
  runPckgScript(@Body() dto: RunPckgScriptDto): string {
    return this.commandService.runPckgScript(dto.service, dto.script);
  }

  @Post('run/reset-all-services')
  async runResetAllServices(
    @Body() body: { gitCheckoutType: string },
  ): Promise<string> {
    return await this.resetDefaultsService.resetAllServices(
      body.gitCheckoutType,
    );
  }
}
