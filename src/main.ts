import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://127.0.0.1:5173', 'http://127.0.0.1:3001', // Vite and other common dev ports
      'http://localhost:5173', 'http://localhost:8080', // Frontend URLs
      'http://shopping-list-frontend:5173', // Container name
      'http://shopping-list-frontend-devcontainer:5173', // DevContainer name
      /^http:\/\/localhost:\d+$/, // All localhost ports
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
