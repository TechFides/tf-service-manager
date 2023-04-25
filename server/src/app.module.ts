import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandService } from './services/command.service';
import { EventsGateway } from './events.gateway';
import { ServicesService } from './services/services.service';
import { MonitorService } from './services/monitor.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  controllers: [AppController],
  providers: [
    EventsGateway,
    AppService,
    CommandService,
    ServicesService,
    MonitorService,
  ],
})
export class AppModule {}
