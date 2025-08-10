import { Injectable, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if authentication is disabled
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      // If auth is disabled, allow all requests
      return true;
    }

    // If auth is enabled, use the JWT guard
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      // If auth is disabled, return a mock user or null
      return { id: 1, email: 'dev@example.com', username: 'dev' };
    }

    // If auth is enabled, use normal JWT handling
    return super.handleRequest(err, user, info, context);
  }
}
