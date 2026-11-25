import { MaxLength, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @MinLength(20)
  credential: string;

  /** Share code of the member who invited this person (from a ?ref= link). */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  referralCode?: string;
}
