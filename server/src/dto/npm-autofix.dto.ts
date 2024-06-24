import { IsBoolean, IsString } from 'class-validator';

export class NpmAutofixDto {
  @IsString()
  branch = '';

  @IsBoolean()
  pushToOrigin: boolean;

  @IsBoolean()
  useForce: boolean;
}
