import { Controller, Post, Body, Param, Get, Patch, Delete, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessageListDto } from './dto/chat-message-list.dto';
import { AiOrderResponseDto } from './dto/ai-order.dto';
import { AIProfile } from '../config/entities/aiprofile.entity';

/**
 * 聊天控制器
 * 处理与聊天会话和消息相关的HTTP请求
 */
@ApiTags('聊天')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) { }

  /**
   * 创建新的聊天会话
   * @param topic 会话主题
   * @returns 新创建的会话信息
   */
  @ApiOperation({ summary: '创建聊天会话' })
  @ApiBody({ type: String, description: '会话主题' })
  @ApiResponse({ status: 201, description: '会话创建成功', type: ChatSession })
  @Post('session')
  async createSession(@Body('topic') topic: string) {
    return this.chatService.createSession(topic);
  }


  @ApiOperation({ summary: '更新聊天会话主题' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiBody({ type: String, description: '新的会话主题' })
  @ApiResponse({ status: 200, description: '会话更新成功' })
  @Patch('session/:sessionId')
  @ApiOperation({summary: '更新聊天会话信息',description: '更新指定会话的主题'})
  @ApiParam({name: 'sessionId',description: '会话ID',type: 'number'})
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
  @ApiOperation({ summary: '添加新消息到会话' })
  @ApiParam({ name: 'id', description: '会话ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aiId: { type: 'string', description: 'AI助手名称' },
        content: { type: 'string', description: '消息内容' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '消息添加成功', type: ChatMessage })
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
  @ApiOperation({ summary: '获取会话所有消息' })
  @ApiParam({ name: 'id', description: '会话ID' })
  @ApiResponse({ status: 200, description: '成功获取消息', type: [ChatMessageListDto] })
  @Get('session/:id')
  async getSessionMessages(@Param('id') sessionId: number) {
    return this.chatService.getSessionMessages(sessionId);
  }

  /**
   * 获取所有聊天会话列表
   * @returns 所有会话的列表
   */
  @ApiOperation({ summary: '获取所有聊天会话' })
  @ApiResponse({ status: 200, description: '成功获取会话列表', type: [ChatSession] })
  @Get('sessions')
  async getAllSessions() {
    return this.chatService.getAllSessions();
  }

  @ApiOperation({ summary: '发送消息或获取AI回复' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '用户消息' },
        profileId: { type: 'string', description: 'AI配置ID' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '成功', type: ChatMessage })
  @Post(':sessionId/message')
  async handleMessage(
    @Param('sessionId') sessionId: number,
    @Body() body: { message?: string; profileId?: string },
  ): Promise<ChatMessage> {
    if (body.message) {
      return await this.chatService.handleUserMessage(sessionId, body.message, body.profileId);
    }
    
    if (body.profileId) {
      return await this.chatService.handleAIResponse(sessionId, body.profileId);
    }

    throw new Error('必须提供 message 或 profileId 参数之一');
  }

  @Post('session/:sessionId/ai')
  @ApiOperation({ summary: '批量添加 AI 角色到会话' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aiProfileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'AI配置ID数组'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'AI成功添加到会话' })
  async addAIsToSession(
    @Param('sessionId') sessionId: number,
    @Body('aiProfileIds') aiProfileIds: string[]
  ): Promise<{ code: number; message: string; results?: Array<{ id: string; success: boolean }> }> {
    return await this.chatService.addAIsToSession(sessionId, aiProfileIds);
  }


  @ApiOperation({ summary: '删除 AI 角色到会话' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiParam({ name: 'aiProfileId', description: 'AI配置ID' })
  @ApiResponse({ status: 200, description: 'AI成功从会话中删除' })
  @Delete('session/:sessionId/ai/:aiProfileId')
  async deleteAIFromSession(
    @Param('sessionId') sessionId: number,
    @Param('aiProfileId') aiProfileId: string
  ): Promise<{ code: number; message: string }> {
    return await this.chatService.deleteAIFromSession(sessionId, aiProfileId);
  }

  @Post('session/:sessionId/generate-order')
  @ApiOperation({summary: '生成AI发言顺序', description: '为会话中的AI生成随机发言顺序'})
  @ApiParam({ name: 'sessionId', description: '会话ID', type: 'number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        length: {
          type: 'number',
          description: '生成的顺序数组长度',
          default: 50
        }
      }
    }
  })
  @ApiResponse({status: 200, description: '操作结果', type: AiOrderResponseDto})
  async generateAIOrder(
    @Param('sessionId') sessionId: number,
    @Body('length') length: number = 50
  ): Promise<AiOrderResponseDto> {
    return await this.chatService.generateAIOrder(sessionId, length);
  }

  @Post('session/:sessionId/page')
  @ApiOperation({ summary: '分页获取会话消息', description: '获取指定会话的消息列表' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: '页码', default: 1 },
        limit: { type: 'number', description: '每页数量', default: 10 },
      },
    },
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSessionMessagesByPage(
    @Param('sessionId') sessionId: number,
    @Body('page') page: number = 1,
    @Body('limit') limit: number = 10
  ): Promise<{
    data: ChatMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.chatService.getSessionMessagesByPage(sessionId, page, limit);
  }

  @Get('session/:sessionId/ai-profiles')
  @ApiOperation({ summary: '获取会话中的所有AI配置', description: '获取指定会话中所有的AI助手配置信息' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    type: AIProfile,
    isArray: true
  })
  async getSessionAIProfiles(
    @Param('sessionId') sessionId: number
  ): Promise<AIProfile[]> {
    return this.chatService.getSessionAIs(sessionId);
  }

}
