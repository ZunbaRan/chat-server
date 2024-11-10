import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { AIProfile } from '../config/entities/aiprofile.entity';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { ChatMessage } from '../entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIProfile, ChatMessage]),
    ConfigModule,
  ],
  controllers: [SystemController],
  providers: [ConfigService],
})
export class SystemModule {} 