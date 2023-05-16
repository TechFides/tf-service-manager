import {IsArray, IsObject, IsString} from "class-validator";

export class RunTaskDto {
  @IsString()
  task: string;

  @IsString()
  service: string;

  @IsObject()
  attributes: { [key: string]: string };
}
