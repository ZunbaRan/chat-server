import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { MessageType } from './dto/Message.type';
import { ChatMessageListDto } from './dto/chat-message-list.dto';

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
  async addMessage(sessionId: number, aiId: string, content: string): Promise<ChatMessage> {
    const session = await this.chatSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new Error('Session not found');
    }

    const newMessage = this.chatMessageRepository.create({ aiId, content, session });
    return this.chatMessageRepository.save(newMessage);
  }

  // 获取会话及其消息列表
  async getSessionMessages(sessionId: number): Promise<ChatMessageListDto> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['messages', 'messages.aiProfile'],
      select: {
        id: true,
        topic: true,
        createdAt: true,
        messages: {
          id: true,
          content: true,
          type: true,
          createdAt: true,
          aiProfile: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }

    // 将查询结果映射到 ChatMessageListDto
    const messageListDtos = session.messages.map(message => ({
      id: message.id,
      aiName: message.aiProfile?.name || null,
      aiId: message.aiProfile?.id || null,
      type: message.type,
      content: message.content,
      createdAt: message.createdAt
    }));

    const topic = session.topic;
    return { topic, messages: messageListDtos };
  }

  // 获取所有会话
  async getAllSessions(): Promise<ChatSession[]> {
    return this.chatSessionRepository.find();
  }

  async saveMessage(messageData: {
    content: string;
    sessionId: number;
    aiId: string;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      content: messageData.content,
      aiId: messageData.aiId,
      type: !messageData.aiId ? MessageType.USER : MessageType.AI,
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

  async getRecentUserMessages(sessionId: number): Promise<ChatMessage> {
    return await this.chatMessageRepository.find({
      where: { session: { id: sessionId }, type: MessageType.USER },
      order: { createdAt: 'DESC' },
      take: 1,
    }).then(messages => messages[0]);
  }
}
