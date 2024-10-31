import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
// import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { AIProfile } from '../config/entities/aiprofile.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, AIProfile]),
    // ConfigModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ConfigService],
})
export class ChatModule {}
