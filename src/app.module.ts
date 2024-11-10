import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule as AIConfigModule } from './config/config.module';
import { databaseConfig } from './config/database.config';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AIProfile } from './config/entities/aiprofile.entity';
import { SessionAI } from './entities/session-ai.entity';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([ChatSession, ChatMessage, AIProfile, SessionAI]),
    ChatModule,
    AIConfigModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}