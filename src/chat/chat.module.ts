import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
// import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { AIProfile } from '../config/entities/aiprofile.entity';
import { SessionAI } from 'src/entities/session-ai.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, AIProfile, ChatMessage, SessionAI]),
    // ConfigModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ConfigService],
})
export class ChatModule {}
