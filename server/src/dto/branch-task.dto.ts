import { DefaultTask } from '../services/command.service';

export class BranchTasksDto {
  branchTasks: BranchTaskDto[];
}

export class BranchTaskDto {
  name: DefaultTask;
  color: string;
  icon: string;
  confirmText?: string;
}
