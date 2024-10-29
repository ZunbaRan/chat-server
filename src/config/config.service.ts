// src/config/config.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIProfile } from './entities/aiprofile.entity';
import { CreateAIProfileDto } from './dto/create-aiprofile.dto';
import { UpdateAIProfileDto } from './dto/update-aiprofile.dto';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(AIProfile)
    private aiProfileRepository: Repository<AIProfile>,
  ) {}

  async create(createAIProfileDto: CreateAIProfileDto): Promise<AIProfile> {
    const aiProfile = this.aiProfileRepository.create(createAIProfileDto);
    return this.aiProfileRepository.save(aiProfile);
  }

  async findAll(): Promise<AIProfile[]> {
    return this.aiProfileRepository.find();
  }

  async findOne(id: string): Promise<AIProfile> {
    return this.aiProfileRepository.findOne({ where: { id } });
  }

  async update(id: string, updateAIProfileDto: UpdateAIProfileDto): Promise<void> {
    await this.aiProfileRepository.update(id, updateAIProfileDto);
  }

  async remove(id: string): Promise<void> {
    await this.aiProfileRepository.delete(id);
  }
}
