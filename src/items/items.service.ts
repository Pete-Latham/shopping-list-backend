import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ShoppingListItem } from '../entities';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(ShoppingListItem)
    private shoppingListItemRepository: Repository<ShoppingListItem>,
  ) {}

  // Common grocery items for autocomplete suggestions
  private readonly commonGroceryItems = [
    'Milk', 'Bread', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Chicken', 'Beef', 'Pork', 'Fish', 'Salmon',
    'Apples', 'Bananas', 'Oranges', 'Strawberries', 'Blueberries', 'Grapes', 'Tomatoes', 'Carrots', 'Onions',
    'Potatoes', 'Bell peppers', 'Broccoli', 'Spinach', 'Lettuce', 'Cucumbers', 'Mushrooms', 'Garlic', 'Ginger',
    'Rice', 'Pasta', 'Cereal', 'Oats', 'Flour', 'Sugar', 'Salt', 'Pepper', 'Olive oil', 'Vegetable oil',
    'Vinegar', 'Soy sauce', 'Ketchup', 'Mayonnaise', 'Mustard', 'Honey', 'Jam', 'Peanut butter', 'Nuts',
    'Coffee', 'Tea', 'Orange juice', 'Water', 'Soda', 'Beer', 'Wine', 'Ice cream', 'Chocolate', 'Cookies',
    'Crackers', 'Chips', 'Pretzels', 'Popcorn', 'Frozen pizza', 'Frozen vegetables', 'Canned beans',
    'Canned tomatoes', 'Canned soup', 'Toilet paper', 'Paper towels', 'Dish soap', 'Laundry detergent',
    'Shampoo', 'Conditioner', 'Toothpaste', 'Deodorant', 'Soap', 'Tissues'
  ];

  async getSuggestions(query?: string): Promise<string[]> {
    if (!query || query.trim().length === 0) {
      // Return most common items when no query
      return this.commonGroceryItems.slice(0, 10);
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Get items from existing shopping lists that match the query
    const existingItems = await this.shoppingListItemRepository
      .createQueryBuilder('item')
      .select('DISTINCT item.name', 'name')
      .where('LOWER(item.name) LIKE :query', { query: `%${normalizedQuery}%` })
      .limit(20)
      .getRawMany();

    const existingItemNames = existingItems.map(item => item.name);

    // Get common items that match the query
    const matchingCommonItems = this.commonGroceryItems
      .filter(item => item.toLowerCase().includes(normalizedQuery));

    // Combine and deduplicate, prioritizing existing items
    const allSuggestions = [...new Set([...existingItemNames, ...matchingCommonItems])];

    // Sort by relevance (starts with query first, then contains query)
    const sortedSuggestions = allSuggestions.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStartsWith = aLower.startsWith(normalizedQuery);
      const bStartsWith = bLower.startsWith(normalizedQuery);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return a.localeCompare(b);
    });

    // Return up to 8 suggestions
    return sortedSuggestions.slice(0, 8);
  }
}
