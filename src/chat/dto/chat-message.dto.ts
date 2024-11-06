import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from './Message.type';

export class ChatMessageDto {
  @ApiProperty({ 
    description: '消息 ID',
    example: 1
  })
  readonly id: number;

  @ApiProperty({ 
    description: 'AI 助手名称',
    example: 'Claude',
    required: false,
    nullable: true
  })
  readonly aiName: string | null;
  
  @ApiProperty({ 
    description: 'AI 助手 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    nullable: true
  })
  readonly aiId: string | null;

  @ApiProperty({ 
    description: '消息类型',
    example: 'ai|user'
  })
  readonly type: MessageType;

  @ApiProperty({ 
    description: '消息内容',
    example: '你好，我是 Claude，有什么可以帮助你的吗？'
  })
  readonly content: string;

  @ApiProperty({ 
    description: '消息创建时间',
    example: '2024-03-20T12:00:00Z'
  })
  readonly createdAt: Date;
}
