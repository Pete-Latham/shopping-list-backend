import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432') || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'shopping_list',
      autoLoadEntities: true,
      synchronize: false, // Disabled - using migrations instead
      migrationsRun: process.env.NODE_ENV === 'production', // Auto-run migrations in production
    }),
    ShoppingListsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
