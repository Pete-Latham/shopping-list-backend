import { Controller, Get, Logger } from '@nestjs/common';
import { InfisicalConfigService, FrontendConfig } from './infisical.config';

@Controller('config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly infisicalConfigService: InfisicalConfigService) {}

  @Get('frontend')
  async getFrontendConfig(): Promise<FrontendConfig> {
    try {
      this.logger.log('📤 Serving frontend configuration request');
      const config = await this.infisicalConfigService.getFrontendConfig();
      
      this.logger.log('✅ Frontend configuration served successfully');
      return config;
    } catch (error) {
      this.logger.error('❌ Failed to serve frontend configuration:', error.message);
      throw error;
    }
  }
}
