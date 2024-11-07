import { Controller, Post, Body, Param, Get, NotFoundException, BadRequestException, Patch } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConfigService } from '../config/config.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { MessageType } from './dto/Message.type';
import { ChatMessageListDto } from './dto/chat-message-list.dto';

/**
 * 聊天控制器
 * 处理与聊天会话和消息相关的HTTP请求
 */
@ApiTags('聊天')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * 创建新的聊天会话
   * @param topic 会话主题
   * @returns 新创建的会话信息
   */
  @ApiOperation({
    summary: '创建新的聊天会话',
    description: '创建一个新的聊天会话，需要提供会话主题'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          example: '关于 AI 的讨论',
          description: '会话主题'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '会话创建成功',
    type: ChatSession
  })
  @Post('session')
  async createSession(@Body('topic') topic: string) {
    return this.chatService.createSession(topic);
  }
  

  @Patch('session/:sessionId')
  @ApiOperation({
    summary: '更新聊天会话信息',
    description: '更新指定会话的主题'
  })
  @ApiParam({
    name: 'sessionId',
    description: '会话ID',
    type: 'number'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          example: '新的会话主题',
          description: '新的会话主题'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '操作结果',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Chat session updated successfully' }
      }
    }
  })
  async updateSession(
    @Param('sessionId') sessionId: number,
    @Body('topic') topic: string
  ): Promise<{ code: number; message: string }> {
    return await this.chatService.updateSession(sessionId, topic);
  }
  
  /**
   * 向指定会话添加新消息
   * @param sessionId 会话ID
   * @param aiName AI助手名称
   * @param content 消息内容
   * @returns 新添加的消息信息
   */
  @ApiOperation({
    summary: '向指定会话添加新消息',
    description: '在指定的会话中添加一条新的消息'
  })
  @ApiParam({
    name: 'id',
    description: '会话ID',
    type: 'number'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aiName: {
          type: 'string',
          example: 'Claude',
          description: 'AI助手名称'
        },
        content: {
          type: 'string',
          example: '你好，我能帮你什么？',
          description: '消息内容'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '消息添加成功',
    type: ChatMessage
  })
  @Post('session/:id/message')
  async addMessage(
    @Param('id') sessionId: number,
    @Body('aiId') aiId: string,
    @Body('content') content: string
  ) {
    return this.chatService.addMessage(sessionId, aiId, content);
  }

  /**
   * 获取指定会话的所有消息
   * @param sessionId 会话ID
   * @returns 会话中的所有消息列表
   */
  @ApiOperation({
    summary: '获取指定会话的所有消息',
    description: '获取某个会话的完整聊天记录'
  })
  @ApiParam({
    name: 'id',
    description: '会话ID',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取会话消息',
    type: [ChatMessageListDto]
  })
  @Get('session/:id')
  async getSessionMessages(@Param('id') sessionId: number) {
    return this.chatService.getSessionMessages(sessionId);
  }

  /**
   * 获取所有聊天会话列表
   * @returns 所有会话的列表
   */
  @ApiOperation({
    summary: '获取所有聊天会话列表',
    description: '获取系统中所有的聊天会话'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取会话列表',
    type: [ChatSession]
  })
  @Get('sessions')
  async getAllSessions() {
    return this.chatService.getAllSessions();
  }

  @Post(':sessionId/message')
  @ApiOperation({
    summary: '发送消息',
    description: '用于用户发送消息或获取AI回复'
  })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '用户消息，用户发送时必填',
          required: ['false']
        },
        profileId: {
          type: 'string',
          description: 'AI配置ID，获取AI回复时必填',
          required: ['false']
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '成功', type: ChatMessage })
  async handleMessage(
    @Param('sessionId') sessionId: number,
    @Body() body: { message?: string; profileId?: string },
  ): Promise<ChatMessage> {
    // 情况1：用户发送消息
    if (body.message) {
      return await this.chatService.saveMessage({
        content: body.message,
        sessionId: sessionId,
        aiId: body.profileId,
      });
    }

    // 情况2：获取AI回复
    if (body.profileId) {
      // 获取最近的5条消息
      const recentMessages = await this.chatService.getRecentMessages(sessionId, 5);

      // 最近的3条消息中是否有用户消息
      const hasUserMessage = recentMessages.some(msg => msg.type === MessageType.USER);

      // 如果最近的3条消息中是没有用户消息, 那么recentMessages.reverse后， 最后一个元素的 role 设置为user
      // 这是部分 api 的要求，要求最新的一条内容必须为用户发送
      let modifiedMessages = recentMessages;
      if (!hasUserMessage) {
        modifiedMessages = recentMessages.slice(); // 创建副本以避免修改原数组
        modifiedMessages[0].type = MessageType.USER;
      }

      // 准备previousMessages数组
      const previousMessages = modifiedMessages.reverse().map(msg => ({
        role: msg.type === MessageType.USER ? 'user' : 'assistant' as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

      // 调用AI API获取回复
      const aiResponse = await this.configService.callAIAPI(
        body.profileId,
        '', // 空字符串表示不需要添加新的用户输入
        previousMessages,
      );

      // 保存并返回AI回复
      const content = aiResponse.content || 
        ['呵呵', '哈哈', '太对了哥', "好好好,玩尬的是吧"][Math.floor(Math.random() * 3)]; // 随机选择一个字符串

      return await this.chatService.saveMessage({
        content: content,
        sessionId: sessionId,
        aiId: body.profileId,
      });
    }

    throw new Error('必须提供 message 或 profileId 参数之一');
  }

  @Post('session/:sessionId/ai/:aiProfileId')
  @ApiOperation({
    summary: '添加 AI 角色到会话',
    description: '向指定会话添加一个 AI 角色（最多20个）'
  })
  @ApiParam({
    name: 'sessionId',
    description: '会话ID',
    type: 'number'
  })
  @ApiParam({
    name: 'aiProfileId',
    description: 'AI配置ID',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: '操作结果',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'AI successfully added to session' }
      }
    }
  })
  async addAIToSession(
    @Param('sessionId') sessionId: number,
    @Param('aiProfileId') aiProfileId: string
  ): Promise<{ code: number; message: string }> {
    return await this.chatService.addAIToSession(sessionId, aiProfileId);
  }

}
