import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ShoppingListItem } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingListItem])],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
