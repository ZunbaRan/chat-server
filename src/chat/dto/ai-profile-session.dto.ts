import { ApiProperty } from '@nestjs/swagger';

export class AiProfileSessionDto {
 

  @ApiProperty({ 
    description: '助手id',
  })
  readonly id: string ;
  
  @ApiProperty({
    description: '助手名称',
  })
  readonly name: string
}
