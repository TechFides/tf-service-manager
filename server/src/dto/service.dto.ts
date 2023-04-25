import { ServiceRunStatus } from '../services/services.service';

export class ServiceDto {
  name: string;
  appUrl: string;
  color: string;
  coverageBadge: string;
  pipelineBadge: string;
  npmScripts: string[];
  tasks: TaskDto[];
}

export class TaskDto {
  name: string;
  color: string;
  icon: string;
  runIfNotCloned: boolean;
  runIfRunStatusIs: ServiceRunStatus[];
}

export class ServicesDto {
  services: ServiceDto[];
}
