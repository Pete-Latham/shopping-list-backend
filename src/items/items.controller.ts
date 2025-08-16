import { Controller, Get, Query } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('suggestions')
  getSuggestions(@Query('q') query?: string): Promise<string[]> {
    return this.itemsService.getSuggestions(query);
  }
}
