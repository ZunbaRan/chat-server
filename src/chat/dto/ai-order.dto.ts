import { ApiProperty } from '@nestjs/swagger';

export class AiOrderResponseDto {
  @ApiProperty({
    description: '操作状态码',
    example: 200
  })
  code: number;

  @ApiProperty({
    description: '操作消息',
    example: 'AI order generated successfully'
  })
  message: string;

  @ApiProperty({
    description: 'AI发言顺序',
    example: ['ai-id-1', 'ai-id-2']
  })
  data?: string[];
} 