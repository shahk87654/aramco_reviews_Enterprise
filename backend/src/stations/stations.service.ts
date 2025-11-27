import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from '../database/entities/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
  ) {}

  async findAll(): Promise<Station[]> {
    return this.stationsRepository.find({
      where: { isActive: true },
      order: { stationCode: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Station> {
    return this.stationsRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByCode(stationCode: string): Promise<Station> {
    return this.stationsRepository.findOne({
      where: { stationCode, isActive: true },
    });
  }

  async createStation(createStationDto: any): Promise<Station> {
    // Check if station code already exists
    const existingStation = await this.stationsRepository.findOne({
      where: { stationCode: createStationDto.stationCode },
    });

    if (existingStation) {
      throw new BadRequestException('Station code already exists');
    }

    const stationData = {
      name: createStationDto.name,
      stationCode: createStationDto.stationCode,
      city: createStationDto.city,
      address: createStationDto.address,
      contact: createStationDto.contact,
      regionId: createStationDto.regionId,
      geoLat: createStationDto.geoLat,
      geoLng: createStationDto.geoLng,
      managerId: createStationDto.managerId,
      isActive: true,
    };

    const station = this.stationsRepository.create(stationData);
    return await this.stationsRepository.save(station);
  }

  async updateStation(id: string, updateStationDto: any): Promise<Station> {
    const station = await this.stationsRepository.findOne({ where: { id } });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    // Check if new station code conflicts with another station
    if (updateStationDto.stationCode && updateStationDto.stationCode !== station.stationCode) {
      const conflictingStation = await this.stationsRepository.findOne({
        where: { stationCode: updateStationDto.stationCode },
      });

      if (conflictingStation) {
        throw new BadRequestException('Station code already exists');
      }
    }

    Object.assign(station, updateStationDto);
    return await this.stationsRepository.save(station);
  }

  async deleteStation(id: string): Promise<{ message: string }> {
    const station = await this.stationsRepository.findOne({ where: { id } });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    // Soft delete by marking as inactive
    station.isActive = false;
    await this.stationsRepository.save(station);

    return { message: 'Station deleted successfully' };
  }

  async getAllStationsIncludingInactive(): Promise<Station[]> {
    return this.stationsRepository.find({
      order: { stationCode: 'ASC' },
    });
  }
}

