import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('ProxyHub Rotator API')
    .setDescription('API for managing proxy providers, proxies, usage, and notifications. MCP-optimized with tool tags.')
    .setVersion('1.0')
    .addTag('providers', 'mcp-tool')
    .addTag('proxies', 'mcp-tool')
    .addTag('usage')
    .addTag('notifications')
    .addTag('webhooks', 'mcp-tool')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log('ProxyHub API on :' + port);
  console.log('OpenAPI docs at http://localhost:' + port + '/api-docs');
}
bootstrap();
