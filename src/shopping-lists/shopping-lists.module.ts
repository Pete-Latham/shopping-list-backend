import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingList, ShoppingListItem } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingList, ShoppingListItem])],
  providers: [ShoppingListsService],
  controllers: [ShoppingListsController]
})
export class ShoppingListsModule {}
