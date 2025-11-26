import { IsArray, IsUUID } from 'class-validator';

export class UpdateManagerStationsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  stationIds: string[];
}

