import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EmailDto { @IsEmail({}, { message: 'Please enter a valid email address.' }) email: string; }
export class EmailOtpDto extends EmailDto { @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code.' }) otp: string; }
export class GuestUpgradeDto {
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code.' }) otp: string;
  @IsString() @MinLength(8, { message: 'Password must be at least 8 characters.' }) @MaxLength(128) password: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(60) name?: string;
}

export class OtpDto { @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code.' }) otp: string; }
