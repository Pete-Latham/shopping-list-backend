import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList, ShoppingListItem } from '../entities';

@Injectable()
export class ShoppingListsService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    @InjectRepository(ShoppingListItem)
    private shoppingListItemRepository: Repository<ShoppingListItem>,
  ) {}

  async findAll(): Promise<ShoppingList[]> {
    return this.shoppingListRepository.find({
      relations: ['items'],
    });
  }

  async findOne(id: number): Promise<ShoppingList | null> {
    return this.shoppingListRepository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async create(createShoppingListDto: { name: string; description?: string }): Promise<ShoppingList> {
    const shoppingList = this.shoppingListRepository.create(createShoppingListDto);
    return this.shoppingListRepository.save(shoppingList);
  }

  async update(id: number, updateShoppingListDto: { name?: string; description?: string }): Promise<ShoppingList | null> {
    await this.shoppingListRepository.update(id, updateShoppingListDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.shoppingListRepository.delete(id);
  }

  async addItem(listId: number, createItemDto: { name: string; quantity?: number; unit?: string; notes?: string }): Promise<ShoppingListItem> {
    const shoppingList = await this.findOne(listId);
    if (!shoppingList) {
      throw new Error('Shopping list not found');
    }
    const item = this.shoppingListItemRepository.create({
      ...createItemDto,
      shoppingList,
    });
    return this.shoppingListItemRepository.save(item);
  }

  async updateItem(itemId: number, updateItemDto: { name?: string; quantity?: number; unit?: string; completed?: boolean; notes?: string }): Promise<ShoppingListItem | null> {
    await this.shoppingListItemRepository.update(itemId, updateItemDto);
    return this.shoppingListItemRepository.findOne({ where: { id: itemId } });
  }

  async removeItem(itemId: number): Promise<void> {
    await this.shoppingListItemRepository.delete(itemId);
  }
}
