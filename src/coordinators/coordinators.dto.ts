import { Type, Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsByteLength, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export class CoordinatorEmailDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(255) email: string;
}
export class CoordinatorLoginDto extends CoordinatorEmailDto {
  @IsString() @MinLength(8) @MaxLength(72) @IsByteLength(8, 72, { message: 'Password must be 8–72 UTF-8 bytes. Use fewer characters if your password contains emoji.' }) password: string;
}
export class CoordinatorRegisterDto extends CoordinatorLoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(2) @MaxLength(150) name: string;
  @Matches(/^\d{6}$/) otp: string;
}
export class CoordinatorResetDto extends CoordinatorLoginDto {
  @Matches(/^\d{6}$/) otp: string;
}
export class CoordinatorUserDto extends CoordinatorLoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(2) @MaxLength(150) name: string;
  @IsDateString({ strict: true }) birthDate: string;
  @IsIn(['male', 'female', 'non-binary', 'prefer-not']) gender: string;
  @IsString() @MinLength(2) @MaxLength(150) city: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(150) profession?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) spokenLanguages?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) @MaxLength(1500000, { each: true }) photos?: string[];
}
export class CoordinatorBulkUsersDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(25)
  @ValidateNested({ each: true }) @Type(() => CoordinatorUserDto) users: CoordinatorUserDto[];
  @IsBoolean() consentConfirmed: boolean;
}
export class CoordinatorUsersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 12;
  @IsOptional() @IsString() @MaxLength(150) search = '';
}

export class CoordinatorPhotoDto {
  @IsString() @MaxLength(1500000)
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, { message: 'Upload a JPG, PNG or WebP photo.' })
  photo: string;
}
