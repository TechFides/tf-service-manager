import { Injectable } from '@nestjs/common';
import { CommandService } from './services/command.service';

@Injectable()
export class AppService {
  constructor(private readonly commandService: CommandService) {}

  async getHello(): Promise<string> {
    return 'Hello World!';
  }

  runCommand(command: string, service: string): string {
    this.commandService.runProcess(
      '__NPM_COMMAND',
      command,
      '[TEST]',
      service,
      './',
    );
    return 'OK';
  }
}
