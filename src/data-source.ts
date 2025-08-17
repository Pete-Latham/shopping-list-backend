import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { User } from './auth/entities/user.entity';

// Load environment variables
config();

// Check if we're in production (compiled) environment
const isProduction = process.env.NODE_ENV === 'production';
const migrationsPath = isProduction 
  ? [__dirname + '/migrations/*.js']  // Compiled JS files in production
  : ['src/migrations/*.ts'];           // TypeScript files in development

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432') || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'shopping_list',
  entities: [ShoppingList, ShoppingListItem, User],
  migrations: migrationsPath,
  synchronize: false, // Always false when using migrations
  logging: true,
});
