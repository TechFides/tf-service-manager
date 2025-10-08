import { ServiceRunStatus } from '../services/services.service';

export class ServiceStatusDto {
  name: string;
  runStatus: ServiceRunStatus;
  cloned: boolean;
  runningScript: string;
  runningTasks: string[];
  currentGitBranch: string;
  currentGitBranchHasChanges: boolean;
  currentGitBranchAhead: number;
  currentGitBranchBehind: number;
}

export class ServicesStatusDto {
  services: ServiceStatusDto[];
}
