import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe());

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('Chat API')
    .setDescription('聊天服务器 API 文档')
    .setVersion('1.0')
    .addTag('AI配置管理')
    .addTag('聊天')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // CORS配置
  app.enableCors();

  await app.listen(3000);
  console.log(`应用已启动: ${await app.getUrl()}`);
}
bootstrap();
