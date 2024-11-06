// src/config/dto/create-aiprofile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAIProfileDto {
    @ApiProperty({ 
        description: 'AI助手名称',
        example: 'Claude Assistant'
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ 
        description: 'AI助手描述',
        example: '这是一个专业的AI助手，擅长编程和技术讨论'
    })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    // base64 编码的图片
    @ApiProperty({ 
        description: '头像',
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIA...'
    })
    @IsString()
    @IsOptional()
    readonly avatar?: string;

    @ApiProperty({ 
        description: 'AI助手个性化设置(JSON格式)',
        example: '{"tone": "professional", "style": "friendly"}'
    })
    @IsString()
    @IsNotEmpty()
    readonly personality: string;

    @ApiProperty({ 
        description: 'API密钥',
        example: 'sk-xxxxxx',
        required: false
    })
    @IsString()
    @IsOptional()
    readonly apiKey?: string;

    @ApiProperty({ 
        description: 'AI引擎接口地址',
        example: 'https://api.anthropic.com/v1/messages',
        required: false
    })
    @IsString()
    @IsOptional()
    readonly engineEndpoint?: string;

    @ApiProperty({ 
        description: '请求格式配置',
        example: { 
            model: 'claude-3-opus-20240229',
            max_tokens: 1000
        },
        required: false
    })
    @IsObject()
    @IsOptional()
    readonly requestFormat?: Record<string, any>;

    @ApiProperty({ 
        description: '响应格式配置',
        example: {
            format: 'markdown',
            structure: { response: 'string' }
        },
        required: false
    })
    @IsObject()
    @IsOptional()
    readonly responseFormat?: Record<string, any>;
}
  