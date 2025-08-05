import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';

@Controller('shopping-lists')
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Get()
  findAll() {
    return this.shoppingListsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shoppingListsService.findOne(id);
  }

  @Post()
  create(@Body() createShoppingListDto: { name: string; description?: string }) {
    return this.shoppingListsService.create(createShoppingListDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShoppingListDto: { name?: string; description?: string },
  ) {
    return this.shoppingListsService.update(id, updateShoppingListDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shoppingListsService.remove(id);
  }

  @Post(':id/items')
  addItem(
    @Param('id', ParseIntPipe) listId: number,
    @Body() createItemDto: { name: string; quantity?: number; unit?: string; notes?: string },
  ) {
    return this.shoppingListsService.addItem(listId, createItemDto);
  }

  @Patch(':listId/items/:itemId')
  updateItem(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateItemDto: { name?: string; quantity?: number; unit?: string; completed?: boolean; notes?: string },
  ) {
    return this.shoppingListsService.updateItem(itemId, updateItemDto);
  }

  @Delete(':listId/items/:itemId')
  removeItem(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.shoppingListsService.removeItem(itemId);
  }
}
