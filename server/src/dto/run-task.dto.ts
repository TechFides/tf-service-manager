export class RunTaskDto {
  task: string;

  service: string;

  attributes: { [key: string]: string };
}
