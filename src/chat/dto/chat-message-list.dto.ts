import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageDto } from './chat-message.dto';

export class ChatMessageListDto {
  @ApiProperty({ 
    description: '话题',
  })
  readonly topic: string;

  @ApiProperty({ 
    description: '消息内容',
  })
  readonly messages: ChatMessageDto[];

}
