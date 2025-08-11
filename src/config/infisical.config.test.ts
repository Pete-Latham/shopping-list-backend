import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppSecrets {
  // Database secrets
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
  dbDatabase: string;
  
  // Authentication secrets
  authEnabled: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // Application config
  port: number;
  nodeEnv: string;
}

@Injectable()
export class InfisicalConfigService {
  private readonly logger = new Logger(InfisicalConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  async getSecrets(): Promise<AppSecrets> {
    // For now, just use environment variables with a warning
    this.logger.warn('Using environment variables - Infisical integration not yet active');
    return this.getSecretsFromEnv();
  }

  private getSecretsFromEnv(): AppSecrets {
    return {
      // Database configuration
      dbHost: this.configService.get('DB_HOST', '127.0.0.1'),
      dbPort: parseInt(this.configService.get('DB_PORT', '5432')),
      dbUsername: this.configService.get('DB_USERNAME', 'postgres'),
      dbPassword: this.configService.get('DB_PASSWORD', 'password'),
      dbDatabase: this.configService.get('DB_DATABASE', 'shopping_list'),
      
      // Authentication configuration
      authEnabled: this.configService.get('AUTH_ENABLED', 'true') === 'true',
      jwtSecret: this.configService.get('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production-12345'),
      jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
      
      // Application configuration
      port: parseInt(this.configService.get('PORT', '3000')),
      nodeEnv: this.configService.get('NODE_ENV', 'development'),
    };
  }

  // Helper method to get individual secrets
  async getSecret(key: keyof AppSecrets): Promise<string | number | boolean> {
    const secrets = await this.getSecrets();
    return secrets[key];
  }

  // Method to refresh secrets manually
  async refreshSecrets(): Promise<void> {
    // No-op for now
  }
}
