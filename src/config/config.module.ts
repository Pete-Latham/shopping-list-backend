import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { InfisicalConfigService } from './infisical.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [InfisicalConfigService],
  exports: [InfisicalConfigService, NestConfigModule],
})
export class ConfigModule {}
