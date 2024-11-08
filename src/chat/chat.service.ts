import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { MessageType } from './dto/Message.type';
import { ChatMessageListDto } from './dto/chat-message-list.dto';
import { SessionAI } from '../entities/session-ai.entity';
import { AIProfile } from '../config/entities/aiprofile.entity';
import { AiOrderResponseDto } from './dto/ai-order.dto';
import { AiBusinessType } from '../config/dto/ai.business.type';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(SessionAI)
    private sessionAIRepository: Repository<SessionAI>,
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
      },
      order: {
        messages: {
          id: 'ASC' // Order messages by id in ascending order
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



    const sessionAIs = await this.sessionAIRepository.find({
      where: { sessionId: sessionId },
      relations: ['aiProfile'],
      select: {
        id: true,
        aiProfileId: true,
        aiProfile: {
          id: true,
          name: true
        }
      }
    });

    console.log(sessionAIs);
    const sessionAIsDtos = sessionAIs.map(ai => ({
      id: ai.aiProfile.id,
      name: ai.aiProfile.name
    })) ;
  
    const topic = session.topic;
    return { topic, messages: messageListDtos, aiProfiles: sessionAIsDtos };
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

  // 获取会话中的 AI 角色数量
  async getSessionAICount(sessionId: number): Promise<number> {
    const count = await this.sessionAIRepository.count({
      where: { sessionId }
    });
    return count;
  }

  // 检查 AI 是否已经在会话中
  async isAIInSession(sessionId: number, aiProfileId: string): Promise<boolean> {
    const exists = await this.sessionAIRepository.findOne({
      where: { sessionId, aiProfileId }
    });
    return !!exists;
  }

  // 添加 AI 角色到会话
  async addAIToSession(sessionId: number, aiProfileId: string): Promise<{ code: number; message: string }> {
    try {
      // 检查会话是否存在
      const session = await this.chatSessionRepository.findOne({
        where: { id: sessionId }
      });

      if (!session) {
        return { 
          code: 404, 
          message: `Chat session with ID ${sessionId} not found` 
        };
      }

      // 检查 AI 是否已在会话中
      const aiExists = await this.isAIInSession(sessionId, aiProfileId);
      if (aiExists) {
        return { 
          code: 400, 
          message: 'This AI is already in the session' 
        };
      }

      // 检查 AI 数量限制
      const aiCount = await this.getSessionAICount(sessionId);
      if (aiCount >= 20) {
        return { 
          code: 400, 
          message: 'Maximum number of AI profiles (20) has been reached for this session' 
        };
      }

      // 保存 session 和 AI 的关系
      const sessionAI = this.sessionAIRepository.create({
        sessionId,
        aiProfileId
      });
      await this.sessionAIRepository.save(sessionAI);

      return { 
        code: 200, 
        message: 'AI successfully added to session' 
      };

    } catch (error) {
      return { 
        code: 500, 
        message: 'Internal server error' 
      };
    }
  }

  // 获取会话中的所有 AI
  async getSessionAIs(sessionId: number): Promise<AIProfile[]> {
    const sessionAIs = await this.sessionAIRepository.find({
      where: { sessionId },
      relations: ['aiProfile']
    });
    return sessionAIs.map(sa => sa.aiProfile);
  }

  async updateSession(
    sessionId: number, 
    topic: string
  ): Promise<{ code: number; message: string }> {
    try {
      const session = await this.chatSessionRepository.findOne({
        where: { id: sessionId }
      });

      if (!session) {
        return {
          code: 404,
          message: `Chat session with ID ${sessionId} not found`
        };
      }

      // 更新会话主题
      session.topic = topic;
      await this.chatSessionRepository.save(session);

      return {
        code: 200,
        message: 'Chat session updated successfully'
      };
    } catch (error) {
      return {
        code: 500,
        message: 'Internal server error'
      };
    }
  }

  async generateAIOrder(sessionId: number): Promise<AiOrderResponseDto> {
    try {
      // 获取会话中的所有 AI
      const sessionAIs = await this.sessionAIRepository.find({
        where: { sessionId },
        relations: ['aiProfile']
      });

      if (!sessionAIs.length) {
        return {
          code: 400,
          message: 'No AIs found in this session'
        };
      }

      // 将 AI 按业务类型分组
      const replayAIs = sessionAIs.filter(sa => sa.aiProfile.businessType === AiBusinessType.REPLAY);
      const questionAIs = sessionAIs.filter(sa => sa.aiProfile.businessType === AiBusinessType.QUESTION);

      if (!questionAIs.length) {
        return {
          code: 400,
          message: 'No question-type AI found in this session'
        };
      }

      // 生成顺序数组
      const orderArray: string[] = [];
      let replayCount = 0;
      
      while (orderArray.length < 20) {
        // 添加 4 个 REPLAY 类型的 AI
        for (let i = 0; i < 4 && orderArray.length < 20; i++) {
          const randomReplayAI = replayAIs[Math.floor(Math.random() * replayAIs.length)];
          if (randomReplayAI) {
            orderArray.push(randomReplayAI.aiProfileId);
            replayCount++;
          }
        }

        // 添加 1 个 QUESTION 类型的 AI
        if (orderArray.length < 20 && replayCount >= 4) {
          const randomQuestionAI = questionAIs[Math.floor(Math.random() * questionAIs.length)];
          if (randomQuestionAI) {
            orderArray.push(randomQuestionAI.aiProfileId);
            replayCount = 0; // 重置计数器
          }
        }
      }

      return {
        code: 200,
        message: 'AI order generated successfully',
        data: orderArray
      };

    } catch (error) {
      return {
        code: 500,
        message: 'Internal server error'
      };
    }
  }
}
