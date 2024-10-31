// src/config/config.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateAIProfileDto } from './dto/create-aiprofile.dto';
import { UpdateAIProfileDto } from './dto/update-aiprofile.dto';
import { AIProfile } from './entities/aiprofile.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

/**
 * AI配置控制器
 * 提供AI助手配置文件的CRUD操作接口
 * 包括创建、查询、更新和删除AI助手的个性化配置
 * 基础路径: /config
 */
@ApiTags('AI配置管理')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 创建新的AI助手配置文件
   * POST /config
   */
  @Post()
  @ApiOperation({ summary: '创建AI助手配置', description: '创建一个新的AI助手配置文件' })
  @ApiBody({ type: CreateAIProfileDto })
  @ApiResponse({ status: 201, description: '创建成功', type: AIProfile })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  create(@Body() createAIProfileDto: CreateAIProfileDto): Promise<AIProfile> {
    return this.configService.create(createAIProfileDto);
  }

  /**
   * 获取所有AI助手配置文件
   * GET /config
   */
  @Get()
  @ApiOperation({ summary: '获取所有AI配置', description: '获取所有可用的AI助手配置列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [AIProfile] })
  findAll(): Promise<AIProfile[]> {
    return this.configService.findAll();
  }

  /**
   * 获取指定ID的AI助手配置文件
   * GET /config/:id
   */
  @Get(':id')
  @ApiOperation({ summary: '获取指定AI配置', description: '根据ID获取特定的AI助手配置信息' })
  @ApiParam({ name: 'id', description: 'AI配置ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: AIProfile })
  @ApiResponse({ status: 404, description: '配置不存在' })
  findOne(@Param('id') id: string): Promise<AIProfile> {
    return this.configService.findOne(id);
  }

  /**
   * 更新指定ID的AI助手配置文件
   * PATCH /config/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新AI配置', description: '更新指定ID的AI助手配置信息' })
  @ApiParam({ name: 'id', description: 'AI配置ID' })
  @ApiBody({ type: UpdateAIProfileDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  update(@Param('id') id: string, @Body() updateAIProfileDto: UpdateAIProfileDto): Promise<AIProfile> {
    return this.configService.update(id, updateAIProfileDto);
  }

  /**
   * 删除指定ID的AI助手配置文件
   * DELETE /config/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除AI配置', description: '删除指定ID的AI助手配置' })
  @ApiParam({ name: 'id', description: 'AI配置ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  remove(@Param('id') id: string): Promise<void> {
    return this.configService.remove(id);
  }

  @Post('chat/:profileId')
  async chat(
    @Param('profileId') profileId: string,
    @Body() body: { 
      message: string;
      previousMessages?: Array<{ role: 'system' | 'user' | 'assistant', content: string }>;
    }
  ) {
    return await this.configService.callAIAPI(
      profileId, 
      body.message,
      body.previousMessages
    );
  }
}
