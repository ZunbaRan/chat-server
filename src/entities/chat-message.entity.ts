import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class ChatMessage {
  @ApiProperty({ 
    description: '消息 ID',
    example: 1
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'AI助手名称',
    example: 'Claude'
  })
  @Column()
  aiName: string;

  @ApiProperty({ 
    description: '消息内容',
    example: '你好，我是 Claude，有什么可以帮助你的吗？'
  })
  @Column()
  content: string;

  @ApiProperty({ 
    description: '消息创建时间',
    example: '2024-03-20T12:00:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ 
    description: '所属会话',
    type: () => ChatSession
  })
  @ManyToOne(() => ChatSession, (session) => session.messages)
  session: ChatSession;
}
