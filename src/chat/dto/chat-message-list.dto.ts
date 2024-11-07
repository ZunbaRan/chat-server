import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageDto } from './chat-message.dto';
import { AiProfileSessionDto } from './ai-profile-session.dto';

export class ChatMessageListDto {
  @ApiProperty({ 
    description: '话题',
  })
  readonly topic: string;

  @ApiProperty({ 
    description: '消息内容',
  })
  readonly messages: ChatMessageDto[];

  @ApiProperty({
    description: '助手列表',
  })
  readonly aiProfiles: AiProfileSessionDto[];
}
