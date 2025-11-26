import { Injectable, BadRequestException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../database/entities/user.entity';
import { Station } from '../database/entities/station.entity';
import { CreateUserDto, CreateManagerDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      name: createUserDto.firstName + ' ' + createUserDto.lastName,
      passwordHash: hashedPassword,
      role: createUserDto.role,
      isActive: true,
      provider: 'local',
      isVerified: true,
    });

    const savedUser = await this.usersRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRY') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async requestOtp(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.usersRepository.update(user.id, {
      otpCode: otp,
      otpExpiresAt: otpExpiresAt,
    });

    // TODO: Send OTP via email/SMS service
    this.logger.debug(`OTP for ${email}: ${otp}`);

    return { message: 'OTP sent to your registered email/phone' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersRepository.findOne({
      where: { email: verifyOtpDto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.otpCode || user.otpCode !== verifyOtpDto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Verify MFA if enabled
    if (user.mfaEnabled && verifyOtpDto.mfaCode) {
      // TODO: Verify MFA code from authenticator app
    }

    // Clear OTP after verification
    await this.usersRepository.update(user.id, {
      otpCode: null,
      otpExpiresAt: null,
    });

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRY') || '1h',
    });

    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const newAccessToken = this.jwtService.sign(
        { email: payload.email, sub: payload.sub, role: payload.role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRY') || '1h',
        }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getAllManagers() {
    const managers = await this.usersRepository.find({
      where: [
        { role: UserRole.STATION_MANAGER },
        { role: UserRole.REGIONAL_MANAGER },
      ],
      relations: ['managedStations'],
    });

    return managers.map((manager) => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.role,
      isActive: manager.isActive,
      stations: manager.managedStations?.map((s) => ({
        id: s.id,
        name: s.name,
        stationCode: s.stationCode,
      })) || [],
      createdAt: manager.createdAt,
    }));
  }

  async createManager(createManagerDto: CreateManagerDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createManagerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createManagerDto.password, 10);

    const user = this.usersRepository.create({
      email: createManagerDto.email,
      name: createManagerDto.firstName + ' ' + createManagerDto.lastName,
      passwordHash: hashedPassword,
      role: UserRole.STATION_MANAGER,
      isActive: true,
      provider: 'local',
      isVerified: true,
    });

    const savedUser = await this.usersRepository.save(user);

    // Assign stations to manager if provided
    if (createManagerDto.stationIds && createManagerDto.stationIds.length > 0) {
      for (const stationId of createManagerDto.stationIds) {
        const station = await this.stationsRepository.findOne({
          where: { id: stationId },
        });

        if (!station) {
          this.logger.warn(`Station ${stationId} not found, skipping assignment`);
          continue;
        }

        await this.stationsRepository.update(stationId, {
          managerId: savedUser.id,
        });
      }
    }

    // Fetch stations assigned to this manager
    const assignedStations = await this.stationsRepository.find({
      where: { managerId: savedUser.id },
    });

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      stations: assignedStations.map((s) => ({
        id: s.id,
        name: s.name,
        stationCode: s.stationCode,
      })),
    };
  }

  async removeManager(managerId: string) {
    const manager = await this.usersRepository.findOne({
      where: { id: managerId },
      relations: ['managedStations'],
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    if (manager.role !== UserRole.STATION_MANAGER && manager.role !== UserRole.REGIONAL_MANAGER) {
      throw new BadRequestException('User is not a manager');
    }

    // Unassign stations from this manager
    if (manager.managedStations && manager.managedStations.length > 0) {
      for (const station of manager.managedStations) {
        await this.stationsRepository.update(station.id, {
          managerId: null,
        });
      }
    }

    // Deactivate the manager account
    await this.usersRepository.update(managerId, {
      isActive: false,
    });

    return { message: 'Manager removed successfully' };
  }

  async updateManagerStations(managerId: string, stationIds: string[]) {
    const manager = await this.usersRepository.findOne({
      where: { id: managerId },
      relations: ['managedStations'],
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    if (manager.role !== UserRole.STATION_MANAGER && manager.role !== UserRole.REGIONAL_MANAGER) {
      throw new BadRequestException('User is not a manager');
    }

    // Get current assigned stations
    const currentStations = await this.stationsRepository.find({
      where: { managerId: manager.id },
    });

    // Unassign all current stations
    for (const station of currentStations) {
      await this.stationsRepository.update(station.id, {
        managerId: null,
      });
    }

    // Assign new stations
    if (stationIds && stationIds.length > 0) {
      for (const stationId of stationIds) {
        const station = await this.stationsRepository.findOne({
          where: { id: stationId },
        });

        if (!station) {
          this.logger.warn(`Station ${stationId} not found, skipping assignment`);
          continue;
        }

        await this.stationsRepository.update(stationId, {
          managerId: manager.id,
        });
      }
    }

    // Fetch updated stations assigned to this manager
    const assignedStations = await this.stationsRepository.find({
      where: { managerId: manager.id },
    });

    return {
      message: 'Manager stations updated successfully',
      stations: assignedStations.map((s) => ({
        id: s.id,
        name: s.name,
        stationCode: s.stationCode,
      })),
    };
  }
}
