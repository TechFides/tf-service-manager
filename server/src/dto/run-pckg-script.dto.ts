import { IsString } from 'class-validator';

export class RunPckgScriptDto {
  @IsString()
  service: string;

  @IsString()
  script: string;
}