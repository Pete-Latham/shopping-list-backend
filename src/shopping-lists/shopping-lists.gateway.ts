import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InfisicalConfigService } from '../config/infisical.config';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:8080', // Production frontend port
      'http://shopping-list-frontend', // Container name
      'http://frontend', // Docker compose service name
      'http://shopping-list-frontend-devcontainer', // DevContainer name
      // Allow all localhost origins for development
      /^http:\/\/localhost:\d+$/,
      // Allow internal container communication
      /^http:\/\/shopping-list-frontend.*$/,
    ],
    credentials: true,
  },
  namespace: '/shopping-lists',
})
export class ShoppingListsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ShoppingListsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: InfisicalConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`WebSocket connection attempt from client ${(client as any).id}`);
    
    try {
      // Extract token from the auth object sent by the client
      const token = (client as any).handshake?.auth?.token;
      
      if (!token) {
        this.logger.warn(`Connection rejected - no auth token provided from client ${(client as any).id}`);
        client.disconnect();
        return;
      }

      // Verify the JWT token using the same secret as the REST API
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token);
        this.logger.log(`✅ JWT verification successful for client ${(client as any).id}`);
      } catch (jwtError) {
        this.logger.error(`❌ JWT verification details for client ${(client as any).id}:`, {
          error: jwtError.message,
          tokenPrefix: token.substring(0, 20) + '...',
        });
        throw jwtError;
      }
      
      // Extract user ID from the JWT payload
      client.userId = payload.sub || payload.userId;
      
      if (!client.userId) {
        this.logger.warn(`Connection rejected - invalid token payload from client ${(client as any).id}`);
        client.disconnect();
        return;
      }

      this.logger.log(`✅ User ${client.userId} authenticated and connected with client ${(client as any).id}`);
      
    } catch (error) {
      this.logger.warn(`Connection rejected - JWT verification failed for client ${(client as any).id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`User ${client.userId} disconnected (client ${(client as any).id})`);
  }

  @SubscribeMessage('join-list')
  async handleJoinList(
    @MessageBody() data: { listId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`🔗 Received join-list event from client ${(client as any).id} for list ${data.listId}`);
    const room = `list-${data.listId}`;
    await (client as any).join(room);
    this.logger.log(`✅ User ${client.userId} joined room ${room}`);
    
    // Notify other users in the room
    (client as any).to(room).emit('user-joined', {
      userId: client.userId,
      listId: data.listId,
    });
  }

  @SubscribeMessage('leave-list')
  async handleLeaveList(
    @MessageBody() data: { listId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const room = `list-${data.listId}`;
    await (client as any).leave(room);
    this.logger.log(`User ${client.userId} left room ${room}`);
    
    // Notify other users in the room
    (client as any).to(room).emit('user-left', {
      userId: client.userId,
      listId: data.listId,
    });
  }

  // Broadcast methods to be called by the service
  broadcastListUpdated(listId: number, data: any) {
    const room = `list-${listId}`;
    this.logger.log(`Broadcasting list update to room ${room}`);
    this.server.to(room).emit('list-updated', {
      listId,
      ...data,
    });
  }

  broadcastItemAdded(listId: number, item: any) {
    const room = `list-${listId}`;
    this.logger.log(`Broadcasting item added to room ${room}`);
    this.server.to(room).emit('item-added', {
      listId,
      item,
    });
  }

  broadcastItemUpdated(listId: number, item: any) {
    const room = `list-${listId}`;
    this.logger.log(`Broadcasting item updated to room ${room}`);
    this.server.to(room).emit('item-updated', {
      listId,
      item,
    });
  }

  broadcastItemDeleted(listId: number, itemId: number) {
    const room = `list-${listId}`;
    this.logger.log(`Broadcasting item deleted to room ${room}`);
    this.server.to(room).emit('item-deleted', {
      listId,
      itemId,
    });
  }

  broadcastListDeleted(listId: number) {
    const room = `list-${listId}`;
    this.logger.log(`Broadcasting list deleted to room ${room}`);
    this.server.to(room).emit('list-deleted', {
      listId,
    });
  }
}
