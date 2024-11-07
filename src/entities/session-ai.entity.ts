import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn, Column } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { AIProfile } from '../config/entities/aiprofile.entity';

@Entity('session_ai')
export class SessionAI {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChatSession)
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @Column()
  sessionId: number;

  @ManyToOne(() => AIProfile)
  @JoinColumn({ name: 'aiProfileId' })
  aiProfile: AIProfile;

  @Column()
  aiProfileId: string;

  @CreateDateColumn()
  createdAt: Date;
} 