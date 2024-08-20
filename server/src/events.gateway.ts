import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { ServicesService } from './services/services.service';
import * as console from 'console';

interface Log {
  service: string;
  color: string;
  line: string;
  isJson: boolean;
  info: boolean;
  uuid: string;
  ts: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  logsBuffer: Log[] = [];
  jsonLogsBuffer: { [service: string]: { lines: string[]; stack: string[] } } =
    {};

  constructor(private readonly servicesService: ServicesService) {
    let counter = 1;
    setInterval(() => {
      this.sendLogsToClient(`test message num ${counter}`, 'TEST');
      counter++;
    }, 5000);

    setInterval(() => {
      this.server.send({
        type: 'log',
        data: this.logsBuffer,
      });
      this.logsBuffer = [];
    }, 1000);
  }

  /**
   * Sends a log message to the client.
   *
   * @param {string} line - The log message.
   * @param {string} service - The name of the service.
   * @param {boolean} [info=false] - Indicates if the log contains additional info.
   */
  sendLogsToClient(line: string, service: string, info = false): void {
    if (this.isLogPartOfJson(line, service)) {
      this.updateJsonBuffer(line, service);
      return;
    }
    this.logsBuffer.push({
      uuid: uuid(),
      ts: new Date(),
      line: line,
      isJson: false,
      service: service,
      color: this.getServiceColor(service),
      info,
    });
  }

  /**
   * Determines if the log is part of a JSON object.
   *
   * @param {string} line - The log message.
   * @param {string} service - The name of the service.
   *
   * @return {boolean} - Returns true if the log is part of a JSON object, otherwise false.
   */
  private isLogPartOfJson(line: string, service: string): boolean {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('{')) {
      return true;
    }

    return !!this.jsonLogsBuffer[service];
  }

  /**
   * Updates or initialize the JSON buffer with a new log line and checks for completion.
   *
   * @param {string} line - The log message.
   * @param {string} service - The name of the service.
   */
  private updateJsonBuffer(line: string, service: string): void {
    const buffer = this.jsonLogsBuffer[service];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('{') && !buffer) {
      this.initializeJsonBuffer(line, service);
      return;
    }
    buffer.lines.push(line);

    for (const char of line) {
      if (char === '{') buffer.stack.push('{');
      if (char === '}') buffer.stack.pop();
    }

    if (buffer.stack.length === 0) {
      this.processCompleteJson(service);
    }
  }

  /**
   * Processes the complete JSON object and adds it to the logs buffer.
   *
   * @param {string} service - The name of the service.
   */
  private processCompleteJson(service: string): void {
    const jsonString = this.jsonLogsBuffer[service].lines.join('');

    try {
      const parsedJson = JSON.parse(jsonString);

      this.logsBuffer.push({
        uuid: uuid(),
        ts: new Date(),
        line: parsedJson,
        isJson: true,
        service: service,
        color: this.getServiceColor(service),
        info: false,
      });
    } catch (error) {
      console.error('JSON parsing error:', error);
    } finally {
      delete this.jsonLogsBuffer[service];
    }
  }

  /**
   * Initializes the JSON buffer for a given service.
   *
   * @param {string} line - The log message.
   * @param {string} service - The name of the service.
   */
  private initializeJsonBuffer(line: string, service: string): void {
    this.jsonLogsBuffer[service] = { lines: [line], stack: ['{'] };
  }

  /**
   * Retrieves the color associated with a service.
   *
   * @param {string} service - The name of the service.
   * @return {string} - The color of the service.
   */
  private getServiceColor(service: string): string {
    return (
      this.servicesService.getServices().find((s) => s.name === service)
        ?.color || 'brown-10'
    );
  }

  sendStatusUpdateToClient() {
    this.server.send({
      type: 'status-update',
      data: {},
    });
  }

  sendMonitorStatsToClient(
    data: {
      service: string;
      cpuPercent: number;
      memoryMegaBytes: number;
    }[],
  ) {
    this.server.send({
      type: 'monitor-stats',
      data: data,
    });
  }
}
