import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { AIProfile } from './entities/aiprofile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AIProfile])],
  providers: [ConfigService],
  controllers: [ConfigController],
})
export class ConfigModule {}
