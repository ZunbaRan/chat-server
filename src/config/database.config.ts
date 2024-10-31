import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AIProfile } from './entities/aiprofile.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || '192.168.164.128',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_DATABASE || 'chatdemo',
  entities: [AIProfile, ChatMessage, ChatSession],
  synchronize: process.env.NODE_ENV !== 'production', // 开发环境下自动同步数据库结构
  logging: process.env.NODE_ENV !== 'production',
  ssl: false,
}; 