// src/config/entities/aiprofile.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ai_profile')
export class AIProfile {
  @ApiProperty({ description: 'AI配置唯一标识符' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'AI助手名称' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'AI助手描述' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'AI助手个性化设置(JSON格式)' })
  @Column({ type: 'text' })
  personality: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ description: '最后更新时间' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
