import { Injectable } from '@nestjs/common';
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
      order: { name: 'ASC' },
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
}

