import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { ServicesService } from './services/services.service';

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
  jsonLogsBuffer: { [service: string]: string[] } = {};

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
   * Check if the log is part of JSON. If yes save it and when is complete push to logs buffer.
   *
   * @param {string} line - The log message.
   * @param {string} service - The name of the service.
   * @param {boolean} [info=false] - Indicates if the log contains additional info.
   *
   * @return {boolean} - Indicates if the log is part of JSON.
   */
  isLogPartOfJson(line: string, service: string, info = false): boolean {
    if (line.trim().startsWith('{')) {
      this.jsonLogsBuffer[service] = [line];
    } else if (line.trim().endsWith('}')) {
      this.jsonLogsBuffer[service].push(line);
      const jsonString = this.jsonLogsBuffer[service].join('');

      try {
        const parsedJson = JSON.parse(jsonString);

        this.logsBuffer.push({
          uuid: uuid(),
          ts: new Date(),
          line: parsedJson,
          isJson: true,
          service: service,
          color:
            this.servicesService.getServices().find((s) => s.name === service)
              ?.color || 'brown-10',
          info,
        });
      } catch (error) {
        console.error('JSON parsing error:', error);
      } finally {
        delete this.jsonLogsBuffer[service];
      }
    } else if (Object.keys(this.jsonLogsBuffer).includes(service)) {
      this.jsonLogsBuffer[service].push(line);
    } else {
      return false;
    }
    return true;
  }

  /**
   * Sends logs to the client.
   *
   * @param {string} line - The log message.
   * @param {string} service - The name of the service.
   * @param {boolean} [info=false] - Indicates if the log contains additional info.
   *
   * @return {void}
   */
  sendLogsToClient(line: string, service: string, info = false): void {
    if (!this.isLogPartOfJson(line, service, info)) {
      const baseService = this.servicesService
        .getServices()
        .find((s) => s.name === service);

      this.logsBuffer.push({
        uuid: uuid(),
        ts: new Date(),
        line: line,
        isJson: false,
        service: service,
        color: baseService ? baseService.color : 'brown-10',
        info,
      });
    }
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
