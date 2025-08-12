import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsGateway } from './shopping-lists.gateway';
import { ShoppingList, ShoppingListItem } from '../entities';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, ShoppingListItem]),
    JwtModule.register({}), // Empty config since JWT settings come from main app
    ConfigModule // Import the global config module for Infisical access
  ],
  providers: [ShoppingListsService, ShoppingListsGateway],
  controllers: [ShoppingListsController],
  exports: [ShoppingListsService, ShoppingListsGateway]
})
export class ShoppingListsModule {}
