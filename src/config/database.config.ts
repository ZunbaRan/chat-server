import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AIProfile } from './entities/aiprofile.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { SessionAI } from '../entities/session-ai.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  // host: process.env.DB_HOST || '192.168.164.128',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_DATABASE || 'chat_demo',
  entities: [AIProfile, ChatMessage, ChatSession, SessionAI],
  synchronize: process.env.NODE_ENV !== 'production', // 开发环境下自动同步数据库结构
  logging: process.env.NODE_ENV !== 'production',
  ssl: false,
}; 