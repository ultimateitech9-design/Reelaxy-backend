import { IsIn } from 'class-validator';

export class AdminCoordinatorStatusDto {
  @IsIn(['active', 'banned']) status: 'active' | 'banned';
}
