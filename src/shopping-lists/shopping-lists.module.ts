import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsGateway } from './shopping-lists.gateway';
import { ShoppingList, ShoppingListItem } from '../entities';
import { ConfigModule } from '../config/config.module';
import { InfisicalConfigService } from '../config/infisical.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, ShoppingListItem]),
    // Configure JWT with the same settings as AuthModule using Infisical secrets
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, InfisicalConfigService],
      useFactory: async (configService: ConfigService, infisicalConfig: InfisicalConfigService) => {
        const secrets = await infisicalConfig.getSecrets();
        return {
          secret: secrets.jwtSecret,
          signOptions: { 
            expiresIn: secrets.jwtExpiresIn
          },
        };
      },
    }),
    ConfigModule // Import the global config module for Infisical access
  ],
  providers: [ShoppingListsService, ShoppingListsGateway],
  controllers: [ShoppingListsController],
  exports: [ShoppingListsService, ShoppingListsGateway]
})
export class ShoppingListsModule {}
