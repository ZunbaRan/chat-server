import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';

/**
 * 聊天控制器
 * 处理与聊天会话和消息相关的HTTP请求
 */
@ApiTags('聊天管理')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
    @Body('aiName') aiName: string, 
    @Body('content') content: string
  ) {
    return this.chatService.addMessage(sessionId, aiName, content);
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
    type: [ChatMessage]
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
}
