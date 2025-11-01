import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('ProxyHub Rotator API')
    .setDescription('API for managing proxy providers, proxies, usage, and notifications. MCP-optimized for AI tool integration.')
    .setVersion('1.0')
    .addServer('http://localhost:8080', 'Development server')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'X-Access-Token')
    .addTag('proxies', 'Proxy management and leasing - MCP compatible')
    .addTag('providers', 'Proxy provider configuration - MCP compatible')
    .addTag('webhooks', 'Webhook and notification management - MCP compatible')
    .addTag('notifications', 'Notification configuration')
    .addTag('usage', 'Usage statistics and monitoring')
    .setExternalDoc('MCP Configuration', './mcp-server.json')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log('ProxyHub API on :' + port);
  console.log('OpenAPI docs at http://localhost:' + port + '/api-docs');
}
bootstrap();
