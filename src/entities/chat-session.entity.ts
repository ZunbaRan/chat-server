import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class ChatSession {
  @ApiProperty({ 
    description: '会话 ID',
    example: 1
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: '会话主题',
    example: '关于 AI 的讨论'
  })
  @Column()
  topic: string;

  @ApiProperty({ 
    description: '会话创建时间',
    example: '2024-03-20T12:00:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ 
    description: '会话中的消息列表',
    type: () => [ChatMessage]
  })
  @OneToMany(() => ChatMessage, (message) => message.session)
  messages: ChatMessage[];
}
