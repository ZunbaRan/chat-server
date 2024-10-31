import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  // 创建新会话
  async createSession(topic: string): Promise<ChatSession> {
    const newSession = this.chatSessionRepository.create({ topic });
    return this.chatSessionRepository.save(newSession);
  }

  // 添加消息到会话
  async addMessage(sessionId: number, aiName: string, content: string): Promise<ChatMessage> {
    const session = await this.chatSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new Error('Session not found');
    }

    const newMessage = this.chatMessageRepository.create({ aiName, content, session });
    return this.chatMessageRepository.save(newMessage);
  }

  // 获取会话及其消息
  async getSessionMessages(sessionId: number): Promise<ChatSession> {
    return this.chatSessionRepository.findOne({ 
      where: { id: sessionId },
      relations: ['messages']
    });
  }

  // 获取所有会话
  async getAllSessions(): Promise<ChatSession[]> {
    return this.chatSessionRepository.find();
  }

  async saveMessage(messageData: {
    content: string;
    sessionId: number;
    aiName: string;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      content: messageData.content,
      aiName: messageData.aiName,
      session: { id: messageData.sessionId },
    });
    return await this.chatMessageRepository.save(message);
  }

  async getRecentMessages(sessionId: number, limit: number): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: {
        session: { id: sessionId },
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      relations: ['session'],
    });
  }
}
