import {IsString} from "class-validator";

export class RunNpmScriptDto {
  @IsString()
  service: string;

  @IsString()
  npmScript: string;
}
