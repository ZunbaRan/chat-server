import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { MessageType } from './dto/Message.type';
import { ChatMessageListDto } from './dto/chat-message-list.dto';
import { SessionAI } from '../entities/session-ai.entity';
import { AIProfile } from '../config/entities/aiprofile.entity';
import { AiOrderResponseDto } from './dto/ai-order.dto';
import { AiBusinessType } from '../config/dto/ai.business.type';
import { ConfigService } from '../config/config.service';
import { messageList } from '../config/bak.message.list';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(SessionAI)
    private sessionAIRepository: Repository<SessionAI>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private readonly configService: ConfigService,
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
  // messages 只查询 limit 1
  async getSessionMessages(sessionId: number): Promise<ChatMessageListDto> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      select: {
        id: true,
        topic: true,
        createdAt: true
      }
    });

    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }

    // 将查询结果映射到 ChatMessageListDto
    // const messageListDtos = session.messages.map(message => ({
      // id: message.id,
      // aiName: message.aiProfile?.name || null,
      // aiId: message.aiProfile?.id || null,
      // type: message.type,
      // content: message.content,
      // createdAt: message.createdAt  
    // }));



    // const sessionAIs = await this.sessionAIRepository.find({
    //   where: { sessionId: sessionId },
    //   relations: ['aiProfile'],
    //   select: {
    //     id: true,
    //     aiProfileId: true,
    //     aiProfile: {
    //       id: true,
    //       name: true
    //     }
    //   }
    // });

    // const sessionAIsDtos = sessionAIs.map(ai => ({
    //   id: ai.aiProfile.id,
    //   name: ai.aiProfile.name
    // })) ;
  
    const topic = session.topic;
    return { topic, messages: [], aiProfiles: [] };
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

  // 需要把关联的 ChatMessage.aiProfile.businessType 也查出
  async getRecentMessages(sessionId: number, limit: number): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: {
        session: { id: sessionId },
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      relations: {
        session: true,
        aiProfile: true  // 确保加载 aiProfile 关系
      },
      select: {         // 明确指定要查询的字段
        id: true,
        content: true,
        type: true,
        createdAt: true,
        aiId: true,
        aiProfile: {
          id: true,
          name: true,
          businessType: true  // 确保包含 businessType 字段
        }
      }
    });
  }

  async getRecentUserMessages(sessionId: number): Promise<ChatMessage> {
    return await this.chatMessageRepository.find({
      where: { session: { id: sessionId }, type: MessageType.USER },
      order: { createdAt: 'DESC' },
      take: 1,
    }).then(messages => messages[0]);
  }

  // 获取最新的消息中 ChatMessage.aiProfile.businessType: AiBusinessType.CONTENT_CREATOR 的消息
  async getRecentContentCreatorMessages(sessionId: number): Promise<ChatMessage> {
    return await this.chatMessageRepository.find({
      where: { session: { id: sessionId }, aiProfile: { businessType: AiBusinessType.CONTENT_CREATOR } },
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
      if (aiCount >= 40) {
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


  // 添加 AI 角色到会话
  async deleteAIFromSession(sessionId: number, aiProfileId: string): Promise<{ code: number; message: string }> {
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
      if (!aiExists) {
        return { 
          code: 400, 
          message: 'This AI is not in the session' 
        };
      }

      // 删除 session 和 AI 的关系
      this.sessionAIRepository.delete({
        sessionId,
        aiProfileId
      });
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
      relations: ['aiProfile'],
      select: {
        aiProfile: {
          id: true,
          name: true,
          avatar: true,
          description: true,
          businessType: true,
          modelName: true
        }
      }
    });

    if (!sessionAIs.length) {
      return [];
    }

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

  async generateAIOrder(sessionId: number, length: number = 50): Promise<AiOrderResponseDto> {
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
      const contentCreatorAIs = sessionAIs.filter(sa => 
        sa.aiProfile.businessType === AiBusinessType.CONTENT_CREATOR
      );
      const normalAIs = sessionAIs.filter(sa => 
        sa.aiProfile.businessType !== AiBusinessType.CONTENT_CREATOR
      );

      // 生成顺序数组
      const orderArray: string[] = []; 
      let normalCount = 0;
      
      while (orderArray.length < length) {
        // 没有内容创作者 AI 则全部为普通 AI，并且重新进入循环
        if (!contentCreatorAIs.length) {
          orderArray.push(normalAIs[Math.floor(Math.random() * normalAIs.length)].aiProfileId);
          normalCount++;
          continue;
        }
        // 添加普通 AI
        if (normalAIs.length &&normalCount < 10) {
          const randomNormalAI = normalAIs[Math.floor(Math.random() * normalAIs.length)];
          orderArray.push(randomNormalAI.aiProfileId);
          normalCount++;
        }
        // 添加内容创作者 AI
        else {
          const randomContentCreatorAI = contentCreatorAIs[
            Math.floor(Math.random() * contentCreatorAIs.length)
          ];
          orderArray.push(randomContentCreatorAI.aiProfileId);
          normalCount = 0; // 重置计数器
        }
      }

      return {
        code: 200,
        message: 'AI order generated successfully',
        data: orderArray
      };

    } catch (error) {
      console.error('Generate AI order error:', error);
      return {
        code: 500,
        message: 'Internal server error'
      };
    }
  }

  async handleUserMessage(
    sessionId: number, 
    message: string, 
    profileId?: string
  ): Promise<ChatMessage> {
    return await this.saveMessage({
      content: message,
      sessionId: sessionId,
      aiId: profileId,
    });
  }

  // 处理 AI 响应
  async handleAIResponse(
    sessionId: number, 
    profileId: string
  ): Promise<ChatMessage> {
    // 获取当前AI配置
    const currentAIProfile = await this.configService.findOne(profileId);
    
    // 获取最近的消息
    const recentMessages = await this.getRecentMessages(sessionId, 3);
    // 判断是否有用户消息
    const hasUserMessage = recentMessages.some(msg => msg.type === MessageType.USER);
    let recentUserMessages: ChatMessage;
    if (!hasUserMessage) {
      // 获取最近的用户消息
      recentUserMessages = await this.getRecentUserMessages(sessionId);
    }

    // 最近的消息中，是否有内容创作者的消息
    const hasContentCreatorMessage = recentMessages.some(msg => 
      msg.aiProfile && msg.aiProfile.businessType === AiBusinessType.CONTENT_CREATOR
    );
    let recentContentCreatorMessages: ChatMessage;
    if (!hasContentCreatorMessage) {
      // 获取最近的内容创作者消息
      recentContentCreatorMessages = await this.getRecentContentCreatorMessages(sessionId);
    }
    
    // 准备消息，传入当前AI配置
    const modifiedMessages = await this.prepareMessagesForAI(
      recentMessages,
      recentUserMessages,
      recentContentCreatorMessages,
      currentAIProfile  // 传入当前AI配置
    );

    // 格式化消息
    const previousMessages = this.formatMessagesForAI(modifiedMessages);
    // 调用 AI API
    const aiResponse = await this.configService.callAIAPI(
      profileId,
      '',
      previousMessages,
    );
    // 获取 AI 响应内容
    const content = this.getResponseContent(aiResponse.content);

    return await this.saveMessage({
      content: content,
      sessionId: sessionId,
      aiId: profileId,
    });
  }

  /**
   * 准备AI对话的消息列表
   * 消息顺序（从前到后）：
   * 1. 内容创作者消息（如果存在且需要）
   * 2. 最近的消息列表
   * 3. 最近的用户消息（如果存在）
   */
  private async prepareMessagesForAI(
    recentMessages: ChatMessage[],
    recentUserMessages: ChatMessage,
    recentContentCreatorMessages: ChatMessage,
    currentAIProfile?: AIProfile  // 添加当前AI配置参数
  ): Promise<ChatMessage[]> {
    const messages = [...recentMessages]; // 复制最近的消息列表

    // 如果当前AI是内容创作者
    if (currentAIProfile?.businessType === AiBusinessType.CONTENT_CREATOR) {
      // 用户消息放在首位
      if (recentUserMessages) {
        messages.unshift(recentUserMessages);
      }
      // 其他步骤照常执行
      this.addContentCreatorMessageIfNeeded(messages, recentContentCreatorMessages);
    } else {
      // 普通AI的处理逻辑
      this.addUserMessageIfNeeded(messages, recentUserMessages);
      this.addContentCreatorMessageIfNeeded(messages, recentContentCreatorMessages);
    }

    // 步骤3: 确保至少有一条用户消息
    this.ensureUserMessage(messages);

    // 步骤4: 处理连续的AI消息
    this.handleConsecutiveAIMessages(messages);

    return messages;
  }

  /**
   * 添加用户消息（如果存在）
   */
  private addUserMessageIfNeeded(
    messages: ChatMessage[], 
    userMessage: ChatMessage
  ): void {
    if (userMessage) {
      messages.push(userMessage);
    }
  }

  /**
   * 添加内容创作者消息（如果需要）
   */
  private addContentCreatorMessageIfNeeded(
    messages: ChatMessage[],
    contentCreatorMessage: ChatMessage
  ): void {
    if (contentCreatorMessage && messages[0]?.type !== MessageType.USER) {
      contentCreatorMessage.type = MessageType.USER;
      messages.unshift(contentCreatorMessage);
    }
  }

  /**
   * 确保消息列表中至少有一条用户消息
   */
  private ensureUserMessage(messages: ChatMessage[]): void {
    if (messages.length > 0 && !messages.some(msg => msg.type === MessageType.USER)) {
      messages[messages.length - 1].type = MessageType.USER;
    }
  }

  /**
   * 处理连续的AI消息
   * 如果有连续三条AI消息，将中间的消息改为用户消息
   */
  private handleConsecutiveAIMessages(messages: ChatMessage[]): void {
    for (let i = 0; i < messages.length - 2; i++) {
      const consecutive = messages.slice(i, i + 3);
      if (consecutive.every(msg => msg.type === MessageType.AI)) {
        // 将中间的消息改为用户消息
        messages[i + 1].type = MessageType.USER;
        // 跳过已处理的消息
        i += 2;
      }
    }
  }

  private formatMessagesForAI(messages: ChatMessage[]): Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> {
    return messages.reverse().map(msg => ({
      role: msg.type === MessageType.USER ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  // 获取 AI 响应内容
  private getResponseContent(aiResponseContent: string): string {
    return aiResponseContent || messageList[Math.floor(Math.random() * messageList.length)];
  }

  async getSessionMessagesByPage(
    sessionId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: ChatMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // 构建查询条件
      const where: any = {
        session: { id: sessionId }
      };

      // 获取总数
      const total = await this.chatMessageRepository.count({
        where
      });

      // 获取分页数据
      const messages = await this.chatMessageRepository.find({
        where,
        order: {
          createdAt: 'ASC'
        },
        skip: (page - 1) * limit,
        take: limit,
        relations: {
          aiProfile: true
        },
        select: {
          id: true,
          content: true,
          type: true,
          createdAt: true,
          aiId: true,
          aiProfile: {
            id: true,
            name: true,
            avatar: true,
            businessType: true
          }
        }
      });

      return {
        data: messages,
        total,
        page,
        limit
      };

    } catch (error) {
      console.error('Get session messages error:', error);
      throw error;
    }
  }

  async addAIsToSession(
    sessionId: number, 
    aiProfileIds: string[]
  ): Promise<{ 
    code: number; 
    message: string; 
    results?: Array<{ id: string; success: boolean }> 
  }> {
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

      // 检查 AI 数量限制
      const currentAiCount = await this.getSessionAICount(sessionId);
      const totalAfterAdd = currentAiCount + aiProfileIds.length;
      
      if (totalAfterAdd > 40) {
        return { 
          code: 400, 
          message: `Adding ${aiProfileIds.length} AIs would exceed the maximum limit of 40` 
        };
      }

      // 记录每个 AI 的添加结果
      const results = await Promise.all(
        aiProfileIds.map(async (aiProfileId) => {
          try {
            // 检查 AI 是否已在会话中
            const exists = await this.isAIInSession(sessionId, aiProfileId);
            if (exists) {
              return { id: aiProfileId, success: false };
            }

            // 保存 session 和 AI 的关系
            const sessionAI = this.sessionAIRepository.create({
              sessionId,
              aiProfileId
            });
            await this.sessionAIRepository.save(sessionAI);
            return { id: aiProfileId, success: true };

          } catch (error) {
            console.error(`Error adding AI ${aiProfileId}:`, error);
            return { id: aiProfileId, success: false };
          }
        })
      );

      const successCount = results.filter(r => r.success).length;

      return { 
        code: 200, 
        message: `Successfully added ${successCount} out of ${aiProfileIds.length} AIs`,
        results
      };

    } catch (error) {
      console.error('Add AIs to session error:', error);
      return { 
        code: 500, 
        message: 'Internal server error' 
      };
    }
  }
}
