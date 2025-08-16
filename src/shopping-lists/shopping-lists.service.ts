import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList, ShoppingListItem } from '../entities';
import { ShoppingListsGateway } from './shopping-lists.gateway';

@Injectable()
export class ShoppingListsService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    @InjectRepository(ShoppingListItem)
    private shoppingListItemRepository: Repository<ShoppingListItem>,
    @Inject(forwardRef(() => ShoppingListsGateway))
    private shoppingListsGateway: ShoppingListsGateway,
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
    const savedList = await this.shoppingListRepository.save(shoppingList);
    
    // Broadcast to all connected clients (they can filter on their end)
    this.shoppingListsGateway.server?.emit('list-created', savedList);
    
    return savedList;
  }

  async update(id: number, updateShoppingListDto: { name?: string; description?: string }): Promise<ShoppingList | null> {
    await this.shoppingListRepository.update(id, updateShoppingListDto);
    const updatedList = await this.findOne(id);
    
    if (updatedList) {
      this.shoppingListsGateway.broadcastListUpdated(id, updatedList);
    }
    
    return updatedList;
  }

  async remove(id: number): Promise<void> {
    await this.shoppingListRepository.delete(id);
    this.shoppingListsGateway.broadcastListDeleted(id);
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
    const savedItem = await this.shoppingListItemRepository.save(item);
    
    this.shoppingListsGateway.broadcastItemAdded(listId, savedItem);
    
    return savedItem;
  }

  async updateItem(itemId: number, updateItemDto: { name?: string; quantity?: number; unit?: string; completed?: boolean; notes?: string }): Promise<ShoppingListItem | null> {
    await this.shoppingListItemRepository.update(itemId, updateItemDto);
    const updatedItem = await this.shoppingListItemRepository.findOne({ 
      where: { id: itemId },
      relations: ['shoppingList']
    });
    
    if (updatedItem) {
      this.shoppingListsGateway.broadcastItemUpdated(updatedItem.shoppingList.id, updatedItem);
    }
    
    return updatedItem;
  }

  async removeItem(itemId: number): Promise<void> {
    // Get the item first to know which list it belongs to
    const item = await this.shoppingListItemRepository.findOne({ 
      where: { id: itemId },
      relations: ['shoppingList']
    });
    
    await this.shoppingListItemRepository.delete(itemId);
    
    if (item) {
      this.shoppingListsGateway.broadcastItemDeleted(item.shoppingList.id, itemId);
    }
  }
}
