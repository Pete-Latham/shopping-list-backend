import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { InfisicalConfigService } from './infisical.config';
import { ConfigController } from './config.controller';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ConfigController],
  providers: [InfisicalConfigService],
  exports: [InfisicalConfigService, NestConfigModule],
})
export class ConfigModule {}
