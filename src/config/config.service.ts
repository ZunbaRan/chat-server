// src/config/config.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIProfile } from './entities/aiprofile.entity';
import OpenAI from 'openai';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(AIProfile)
    private aiProfileRepository: Repository<AIProfile>,
  ) { }

  async callAIAPI(
    profileId: string,
    userInput: string,
    previousMessages: Message[] = []
  ): Promise<string> {
    // 1. 获取 AI 配置
    const profile = await this.aiProfileRepository.findOne({
      where: { id: profileId }
    });

    if (!profile) {
      throw new Error('AI Profile not found');
    }

    // 2. 创建 OpenAI 实例
    const openai = new OpenAI({
      baseURL: profile.engineEndpoint,
      apiKey: profile.apiKey,
    });

    // 3. 准备请求数据
    const requestData = this.prepareRequestData(
      profile.personality,
      userInput,
      previousMessages,
      profile.modelName
    );

    // try {
    // 4. 调用 API
    const completion = await openai.chat.completions.create(requestData);

    // 5. 解析响应
    let response = completion;
    let result: string = ''; // Explicitly define the type as string
    if (profile.responseFormat?.rule) {
      result = this.parseResponse(response, profile.responseFormat.rule);
    }

    return result as unknown as string;

    // } catch (error) {
    //   console.error('AI API call failed:', error);
    //   throw new Error(`AI API call failed: ${error.message}`);
    // }
  }

  private prepareRequestData(
    personality: string,
    userInput: string,
    previousMessages: Message[],
    modelName: string
  ): ChatCompletionCreateParamsNonStreaming {
    const messages = [
      {
        role: 'system' as const,
        content: personality
      },
      ...previousMessages,
      {
        role: 'user' as const,
        content: userInput
      }
    ];

    return {
      model: modelName,
      messages: messages,
      stream: false
    };
  }

  private parseResponse(response: any, rule: string): string {
    // 移除开头的 $ 符号（如果存在）
    const path = rule.startsWith('$') ? rule.slice(2) : rule;
    
    // 分割路径
    const segments = path.split('.')
      .map(segment => {
        // 处理数组访问，例如 choices[0] => choices,0
        const match = segment.match(/(\w+)(?:\[(\d+)\])?/);
        if (match) {
          const [, prop, index] = match;
          return index !== undefined ? [prop, index] : [prop];
        }
        return [segment];
      })
      .flat();
  
    // 遍历路径获取值
    let result = response;
    for (const segment of segments) {
      if (result === undefined || result === null) {
        throw new Error(`Cannot read property '${segment}' of ${result}`);
      }
      result = result[segment];
    }
  
    // 确保返回字符串
    if (typeof result !== 'string') {
      throw new Error('Final result must be a string');
    }
  
    return result;
  }

  /**
   * 创建新的 AI 配置文件
   */
  async create(createAIProfileDto: Partial<AIProfile>): Promise<AIProfile> {
    const profile = this.aiProfileRepository.create(createAIProfileDto);
    return await this.aiProfileRepository.save(profile);
  }

  /**
   * 获取所有 AI 配置文件
   */
  async findAll(): Promise<AIProfile[]> {
    return await this.aiProfileRepository.find();
  }

  /**
   * 根据 ID 获取单个 AI 配置文件
   */
  async findOne(id: string): Promise<AIProfile> {
    const profile = await this.aiProfileRepository.findOne({
      where: { id }
    });

    if (!profile) {
      throw new Error('AI Profile not found');
    }

    return profile;
  }

  /**
   * 更新 AI 配置文件
   */
  async update(id: string, updateAIProfileDto: Partial<AIProfile>): Promise<AIProfile> {
    const profile = await this.findOne(id);

    // 合并更新的数据
    Object.assign(profile, updateAIProfileDto);

    return await this.aiProfileRepository.save(profile);
  }

  /**
   * 删除 AI 配置文件
   */
  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.aiProfileRepository.remove(profile);
  }
}
