import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InfisicalConfigService } from './config/infisical.config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly infisicalConfig: InfisicalConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('secrets-status')
  async getSecretsStatus() {
    try {
      const secrets = await this.infisicalConfig.getSecrets();
      return {
        status: 'ok',
        secretsSource: 'Check server logs for source details',
        secretsLoaded: {
          dbHost: secrets.dbHost,
          dbDatabase: secrets.dbDatabase,
          jwtConfigured: secrets.jwtSecret !== 'fallback-secret',
          authEnabled: secrets.authEnabled,
          environment: secrets.nodeEnv,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
