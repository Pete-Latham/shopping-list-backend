import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { ItemsModule } from './items/items.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { InfisicalConfigService } from './config/infisical.config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService, infisicalConfig: InfisicalConfigService) => {
        const secrets = await infisicalConfig.getSecrets();
        
        // Allow Docker environment override for DB_HOST
        const dbHost = process.env.DB_HOST || secrets.dbHost;
        
        return {
          type: 'postgres',
          host: dbHost,
          port: secrets.dbPort,
          username: secrets.dbUsername,
          password: secrets.dbPassword,
          database: secrets.dbDatabase,
          autoLoadEntities: true,
          synchronize: false, // Disabled - using migrations instead
          migrationsRun: secrets.nodeEnv === 'production', // Auto-run migrations in production
        };
      },
      inject: [ConfigService, InfisicalConfigService],
    }),
    AuthModule,
    ShoppingListsModule,
    ItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
