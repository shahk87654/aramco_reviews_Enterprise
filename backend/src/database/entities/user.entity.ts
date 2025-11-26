import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Station } from './station.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  STATION_MANAGER = 'station_manager',
  REGIONAL_MANAGER = 'regional_manager',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 50, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string; // 'local', 'google', 'azure', etc.

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verificationToken: string;

  @Column({ type: 'datetime', nullable: true })
  verificationTokenExpiresAt: Date;

  @Column({ type: 'varchar', length: 6, nullable: true })
  otpCode: string;

  @Column({ type: 'datetime', nullable: true })
  otpExpiresAt: Date;

  @Column({ type: 'integer', default: 0 })
  otpAttempts: number;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaSecret: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Station, (station) => station.manager)
  managedStations: Station[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
