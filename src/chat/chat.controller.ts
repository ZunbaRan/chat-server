import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

/**
 * 聊天控制器
 * 处理与聊天会话和消息相关的HTTP请求
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 创建新的聊天会话
   * @param topic 会话主题
   * @returns 新创建的会话信息
   */
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
  @Get('session/:id')
  async getSessionMessages(@Param('id') sessionId: number) {
    return this.chatService.getSessionMessages(sessionId);
  }

  /**
   * 获取所有聊天会话列表
   * @returns 所有会话的列表
   */
  @Get('sessions')
  async getAllSessions() {
    return this.chatService.getAllSessions();
  }
}
