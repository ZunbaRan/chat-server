import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../chat/dto/Message.type';
import { AIProfile } from '../config/entities/aiprofile.entity';

@Entity()
export class ChatMessage {
  @ApiProperty({ 
    description: '消息 ID',
    example: 1
  })
  @PrimaryGeneratedColumn()
  id: number;

  // 可以为 null
  @ApiProperty({ 
    description: 'AI 助手 ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ nullable: true })
  aiId: string;

  @ApiProperty({ 
    description: '消息类型',
    example: 'ai|user'
  })
  @Column({ nullable: true, default: MessageType.USER })
  type: MessageType ;

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

  @ManyToOne(() => AIProfile)
  @JoinColumn({ name: 'aiId' })
  aiProfile: AIProfile;
}
