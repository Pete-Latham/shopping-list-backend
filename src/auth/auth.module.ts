import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { InfisicalConfigService } from '../config/infisical.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [InfisicalConfigService],
      useFactory: async (infisicalConfigService: InfisicalConfigService) => {
        const secrets = await infisicalConfigService.getSecrets();
        return {
          secret: secrets.jwtSecret,
          signOptions: { 
            expiresIn: secrets.jwtExpiresIn || '24h'
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, InfisicalConfigService],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
