import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { ServicesService } from './services/services.service';

interface Log {
  service: string;
  color: string;
  line: string;
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

  sendLogsToClient(line: string, service: string, info = false) {
    const baseService = this.servicesService
      .getServices()
      .find((s) => s.name === service);
    this.logsBuffer.push({
      uuid: uuid(),
      ts: new Date(),
      line: line,
      service: service,
      color: baseService ? baseService.color : 'brown-10',
      info,
    });
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
