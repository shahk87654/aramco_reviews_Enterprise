import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  stationId?: string;
}

export class CreateManagerDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stationIds?: string[];
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class OtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsOptional()
  @IsString()
  mfaCode?: string;
}
