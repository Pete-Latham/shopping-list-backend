import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfisicalSDK } from '@infisical/sdk';

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

export interface FrontendConfig {
  apiUrl: string;
  enableMockApi: boolean;
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
      const infisicalToken = this.configService.get('INFISICAL_TOKEN');
      
      if (!infisicalToken) {
        throw new Error('INFISICAL_TOKEN is required - secure secrets management is mandatory');
      }

      // Initialize with correct SDK v4 API
      this.infisicalClient = new InfisicalSDK({
        siteUrl: this.configService.get('INFISICAL_SITE_URL', 'https://eu.infisical.com'),
      });

      // Authenticate with service token (note: method is private in types but works in practice)
      (this.infisicalClient as any).authenticate(infisicalToken);
      
      this.logger.log('✓ Infisical client initialized and authenticated successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Infisical client:', error.message);
      this.logger.error('🚫 Application cannot start without proper Infisical configuration');
      throw error;
    }
  }

  async getSecrets(): Promise<AppSecrets> {
    const now = Date.now();
    
    // Return cached secrets if still valid
    if (this.cachedSecrets && (now - this.lastFetchTime) < this.cacheExpiry) {
      return this.cachedSecrets;
    }

    // Require Infisical to be available
    if (!this.infisicalClient) {
      throw new Error('Infisical client not available - secure secrets management is required');
    }

    try {
      const environment = this.configService.get('INFISICAL_ENV', 'Production');
      const projectId = this.configService.get('INFISICAL_PROJECT_ID');

      if (!projectId) {
        throw new Error('INFISICAL_PROJECT_ID is required');
      }

      this.logger.log(`🔍 Fetching secrets from Infisical: project=${projectId}, env=${environment}, path=/backend`);

      // Fetch secrets using the correct SDK v4 API
      const secretsResponse = await this.infisicalClient.secrets().listSecrets({
        environment,
        projectId,
        secretPath: '/backend',
      });

      // Transform Infisical secrets to our format - response has a 'secrets' array
      const secretsMap = secretsResponse.secrets.reduce((acc, secret) => {
        acc[secret.secretKey] = secret.secretValue;
        return acc;
      }, {} as Record<string, string>);

      // Only validate critical secrets in production
      const nodeEnv = this.configService.get('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        const requiredSecrets = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET'];
        const missingSecrets = requiredSecrets.filter(key => !secretsMap[key]);
        
        if (missingSecrets.length > 0) {
          throw new Error(`Missing required secrets in Infisical: ${missingSecrets.join(', ')}`);
        }
      } else {
        this.logger.log('Development mode: Using fallback values for missing secrets');
      }

      const appSecrets: AppSecrets = {
        // Database configuration - prioritize explicit env vars, then Infisical, then fallbacks  
        dbHost: this.configService.get('DB_HOST') || secretsMap.DB_HOST || 'postgres-dev',
        dbPort: parseInt(this.configService.get('DB_PORT') || secretsMap.DB_PORT || '5432'),
        dbUsername: this.configService.get('DB_USERNAME') || secretsMap.DB_USERNAME || 'postgres',
        dbPassword: this.configService.get('DB_PASSWORD') || secretsMap.DB_PASSWORD || 'password',
        dbDatabase: this.configService.get('DB_DATABASE') || secretsMap.DB_DATABASE || 'shopping_list',
        
        // Authentication configuration - from Infisical with dev fallbacks
        authEnabled: (secretsMap.AUTH_ENABLED || 'true') === 'true',
        jwtSecret: secretsMap.JWT_SECRET || this.configService.get('JWT_SECRET', 'dev-jwt-secret-change-me'),
        jwtExpiresIn: secretsMap.JWT_EXPIRES_IN || '24h',
        
        // Application configuration - non-sensitive can have defaults
        port: parseInt(secretsMap.PORT || this.configService.get('PORT', '3000')),
        nodeEnv: secretsMap.NODE_ENV || this.configService.get('NODE_ENV', 'development'),
      };

      // Validate critical secrets
      if (!appSecrets.jwtSecret || appSecrets.jwtSecret === 'fallback-secret') {
        this.logger.error('JWT_SECRET not properly configured in Infisical');
        throw new Error('Critical secret missing: JWT_SECRET');
      }

      // Cache the secrets
      this.cachedSecrets = appSecrets;
      this.lastFetchTime = now;

      this.logger.log('🔒 SECRETS SOURCE: Infisical (EU region)');
      this.logger.log(`📋 Configuration loaded from Infisical: DB=${appSecrets.dbHost}:${appSecrets.dbPort}/${appSecrets.dbDatabase}, Auth=${appSecrets.authEnabled}, Env=${appSecrets.nodeEnv}`);
      
      return appSecrets;

    } catch (error) {
      this.logger.error('Failed to fetch secrets from Infisical:', error.message);
      this.logger.error('🚫 Application cannot start without secure secrets from Infisical');
      throw error;
    }
  }

  // Helper method to get individual secrets
  async getSecret(key: keyof AppSecrets): Promise<string | number | boolean> {
    const secrets = await this.getSecrets();
    return secrets[key];
  }

  // Method to refresh secrets manually
  async refreshSecrets(): Promise<void> {
    this.cachedSecrets = null;
    await this.getSecrets();
  }

  // Get frontend configuration from Infisical
  async getFrontendConfig(): Promise<FrontendConfig> {
    if (!this.infisicalClient) {
      throw new Error('Infisical client not available - secure secrets management is required');
    }

    try {
      const environment = this.configService.get('INFISICAL_ENV', 'Production');
      const projectId = this.configService.get('INFISICAL_PROJECT_ID');

      if (!projectId) {
        throw new Error('INFISICAL_PROJECT_ID is required');
      }

      this.logger.log(`🔍 Fetching frontend config from Infisical: project=${projectId}, env=${environment}, path=/frontend`);

      // Fetch frontend secrets using the correct SDK v4 API
      const secretsResponse = await this.infisicalClient.secrets().listSecrets({
        environment,
        projectId,
        secretPath: '/frontend',
      });

      // Transform Infisical secrets to our format
      const secretsMap = secretsResponse.secrets.reduce((acc, secret) => {
        acc[secret.secretKey] = secret.secretValue;
        return acc;
      }, {} as Record<string, string>);

      const frontendConfig: FrontendConfig = {
        // Map the secrets we know exist in Infisical
        apiUrl: secretsMap.VITE_APP_URL || secretsMap.VITE_API_URL || '/api',
        enableMockApi: secretsMap.VITE_USE_MOCK_API === 'true',
      };

      this.logger.log(`📋 Frontend configuration loaded from Infisical:`, {
        apiUrl: frontendConfig.apiUrl,
        mockApi: frontendConfig.enableMockApi
      });

      return frontendConfig;

    } catch (error) {
      this.logger.error('Failed to fetch frontend config from Infisical:', error.message);
      throw error;
    }
  }
}
