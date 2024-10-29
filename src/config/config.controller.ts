// src/config/config.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateAIProfileDto } from './dto/create-aiprofile.dto';
import { UpdateAIProfileDto } from './dto/update-aiprofile.dto';
import { AIProfile } from './entities/aiprofile.entity';

/**
 * AI配置控制器
 * 提供AI助手配置文件的CRUD操作接口
 * 包括创建、查询、更新和删除AI助手的个性化配置
 * 基础路径: /config
 */
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 创建新的AI助手配置文件
   * POST /config
   * 
   * @param createAIProfileDto - AI助手配置信息，包含：
   *                            - name: AI助手名称
   *                            - description: AI助手描述
   *                            - systemMessage: AI助手的系统预设消息
   *                            - temperature: AI响应的随机性程度
   * @returns {Promise<AIProfile>} 返回创建成功的AI助手配置信息
   */
  @Post()
  create(@Body() createAIProfileDto: CreateAIProfileDto): Promise<AIProfile> {
    return this.configService.create(createAIProfileDto);
  }

  /**
   * 获取所有AI助手配置文件
   * GET /config
   * 
   * @returns {Promise<AIProfile[]>} 返回所有可用的AI助手配置列表
   */
  @Get()
  findAll(): Promise<AIProfile[]> {
    return this.configService.findAll();
  }

  /**
   * 获取指定ID的AI助手配置文件
   * GET /config/:id
   * 
   * @param id - AI助手配置文件的唯一标识符
   * @returns {Promise<AIProfile>} 返回指定ID的AI助手配置信息
   *                              如果未找到则可能抛出NotFoundException
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<AIProfile> {
    return this.configService.findOne(id);
  }

  /**
   * 更新指定ID的AI助手配置文件
   * PATCH /config/:id
   * 
   * @param id - 要更新的AI助手配置文件ID
   * @param updateAIProfileDto - 需要更新的配置字段，可以包含：
   *                            - name: AI助手名称
   *                            - description: AI助手描述
   *                            - systemMessage: AI助手的系统预设消息
   *                            - temperature: AI响应的随机性程度
   * @returns {Promise<void>} 更新成功返回void
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAIProfileDto: UpdateAIProfileDto): Promise<void> {
    return this.configService.update(id, updateAIProfileDto);
  }

  /**
   * 删除指定ID的AI助手配置文件
   * DELETE /config/:id
   * 
   * @param id - 要删除的AI助手配置文件ID
   * @returns {Promise<void>} 删除成功返回void
   */
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.configService.remove(id);
  }
}
