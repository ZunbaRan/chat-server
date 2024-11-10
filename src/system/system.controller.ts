import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '../config/config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { MessageType } from '../chat/dto/Message.type';

@ApiTags('系统')
@Controller('system')
export class SystemController {
  // AI配置ID数组
  private readonly keyWordCreator = ['def8103f-5ec0-4ef8-8f33-fa066efd1c3a'];
  private readonly simpleStoryCreator = ['96379f34-896b-4a19-afca-1e3d4806ed91'];

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private readonly configService: ConfigService,
  ) {}

  @Post('session/:sessionId/process')
  @ApiOperation({ summary: '处理会话内容', description: '分析会话内容并生成故事' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async processSession(
    @Param('sessionId') sessionId: number
  ): Promise<{ keywords: string; story: string }> {
    try {
      // 1. 获取会话中的所有用户消息
      const userMessages = await this.chatMessageRepository.find({
        where: {
          session: { id: sessionId },
          type: MessageType.USER
        },
        order: {
          createdAt: 'ASC'
        }
      });

      if (!userMessages.length) {
        throw new Error('No user messages found in session');
      }

      // 2. 准备第一次调用的消息
      const firstCallMessages = userMessages.map(msg => ({
        role: 'user' as const,
        content: msg.content
      }));

      // 3. 随机选择一个关键词生成器
      const keyWordCreatorId = this.keyWordCreator[
        Math.floor(Math.random() * this.keyWordCreator.length)
      ];
      
      // 4. 第一次调用AI获取关键词
      const keywordsResponse = await this.configService.callAIAPI(
        keyWordCreatorId,
        '',  // 不需要额外的用户输入
        firstCallMessages
      );

      // 5. 准备第二次调用的消息
      // 去掉 keywordsResponse.content 中的某些字， “提取的”，“如下”
      const secondCallMessages = [{
        role: 'user' as const,
        content: keywordsResponse.content.replace(/提取的|如下/g, '')
      }];

      // 6. 随机选择一个故事生成器
      const storyCreatorId = this.simpleStoryCreator[
        Math.floor(Math.random() * this.simpleStoryCreator.length)
      ];

      // 7. 第二次调用AI生成故事
      const storyResponse = await this.configService.callAIAPI(
        storyCreatorId,
        '',  // 不需要额外的用户输入
        secondCallMessages
      );

      // 8. 返回结果
      return {
        keywords: keywordsResponse.content,
        story: storyResponse.content
      };

    } catch (error) {
      console.error('Session process error:', error);
      throw error;
    }
  }
} 