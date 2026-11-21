import { IsDateString, IsEmail, IsLatitude, IsLongitude, IsNumber, IsOptional, IsIn, IsString, MaxLength, MinLength, Max, Min, IsArray, ArrayMaxSize } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'non-binary', 'prefer-not'])
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  city?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  spokenLanguages?: string[];

  @IsOptional()
  @IsLatitude()
  locationLatitude?: number;

  @IsOptional()
  @IsLongitude()
  locationLongitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1500)
  locationAccuracy?: number;
}
