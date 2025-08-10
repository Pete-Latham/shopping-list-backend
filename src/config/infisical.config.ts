import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfisicalSDK, LogLevel } from '@infisical/sdk';

export interface AppSecrets {
  dbPassword: string;
  dbUsername: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

@Injectable()
export class InfisicalConfigService {
  private readonly logger = new Logger(InfisicalConfigService.name);
  private infisicalClient: InfisicalSDK | null = null;
  private cachedSecrets: AppSecrets | null = null;
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetchTime = 0;

  constructor(private readonly configService: ConfigService) {
    this.initializeInfisical();
  }

  private async initializeInfisical() {
    try {
      // Skip Infisical in development if not configured
      const infisicalToken = this.configService.get('INFISICAL_TOKEN');
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      
      if (!infisicalToken && !isProduction) {
        this.logger.warn('Infisical not configured - using environment variables');
        return;
      }

      if (!infisicalToken) {
        throw new Error('INFISICAL_TOKEN is required in production');
      }

      this.infisicalClient = new InfisicalSDK({
        token: infisicalToken,
        siteURL: this.configService.get('INFISICAL_SITE_URL', 'https://app.infisical.com'),
        logLevel: LogLevel.Error,
      });

      this.logger.log('Infisical client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Infisical client:', error.message);
      throw error;
    }
  }

  async getSecrets(): Promise<AppSecrets> {
    const now = Date.now();
    
    // Return cached secrets if still valid
    if (this.cachedSecrets && (now - this.lastFetchTime) < this.cacheExpiry) {
      return this.cachedSecrets;
    }

    // Fallback to environment variables if Infisical not available
    if (!this.infisicalClient) {
      this.logger.warn('Using fallback environment variables');
      return this.getSecretsFromEnv();
    }

    try {
      const environment = this.configService.get('INFISICAL_ENV', 'production');
      const projectId = this.configService.get('INFISICAL_PROJECT_ID');

      if (!projectId) {
        throw new Error('INFISICAL_PROJECT_ID is required');
      }

      // Fetch secrets from Infisical
      const secrets = await this.infisicalClient.listSecrets({
        environment,
        projectId,
        path: '/backend', // Backend secrets path within the project
      });

      // Transform Infisical secrets to our format
      const secretsMap = secrets.reduce((acc, secret) => {
        acc[secret.secretKey] = secret.secretValue;
        return acc;
      }, {} as Record<string, string>);

      const appSecrets: AppSecrets = {
        dbPassword: secretsMap.DB_PASSWORD || this.configService.get('DB_PASSWORD', 'password'),
        dbUsername: secretsMap.DB_USERNAME || this.configService.get('DB_USERNAME', 'postgres'),
        jwtSecret: secretsMap.JWT_SECRET || this.configService.get('JWT_SECRET', 'fallback-secret'),
        jwtExpiresIn: secretsMap.JWT_EXPIRES_IN || this.configService.get('JWT_EXPIRES_IN', '24h'),
      };

      // Validate critical secrets
      if (!appSecrets.jwtSecret || appSecrets.jwtSecret === 'fallback-secret') {
        this.logger.error('JWT_SECRET not properly configured in Infisical');
        throw new Error('Critical secret missing: JWT_SECRET');
      }

      // Cache the secrets
      this.cachedSecrets = appSecrets;
      this.lastFetchTime = now;

      this.logger.log('Successfully fetched secrets from Infisical');
      return appSecrets;

    } catch (error) {
      this.logger.error('Failed to fetch secrets from Infisical:', error.message);
      
      // Fallback to environment variables on error
      this.logger.warn('Falling back to environment variables');
      return this.getSecretsFromEnv();
    }
  }

  private getSecretsFromEnv(): AppSecrets {
    return {
      dbPassword: this.configService.get('DB_PASSWORD', 'password'),
      dbUsername: this.configService.get('DB_USERNAME', 'postgres'), 
      jwtSecret: this.configService.get('JWT_SECRET', 'fallback-secret'),
      jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
    };
  }

  // Helper method to get individual secrets
  async getSecret(key: keyof AppSecrets): Promise<string> {
    const secrets = await this.getSecrets();
    return secrets[key];
  }

  // Method to refresh secrets manually
  async refreshSecrets(): Promise<void> {
    this.cachedSecrets = null;
    await this.getSecrets();
  }
}
