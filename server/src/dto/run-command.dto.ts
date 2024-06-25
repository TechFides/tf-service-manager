import { IsString } from 'class-validator';

export class RunCommandDto {
  @IsString()
  command = 'pwd';

  @IsString()
  service: string;
}
