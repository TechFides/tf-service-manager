import { IsBoolean, IsString } from 'class-validator';

export class PckgAutofixDto {
  @IsString()
  branch = '';

  @IsBoolean()
  pushToOrigin: boolean;

  @IsBoolean()
  useForce: boolean;
}
