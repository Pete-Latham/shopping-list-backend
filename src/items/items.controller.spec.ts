import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

describe('ItemsController', () => {
  let controller: ItemsController;
  let mockItemsService: Partial<ItemsService>;

  beforeEach(async () => {
    mockItemsService = {
      getSuggestions: jest.fn().mockImplementation((query?: string) => {
        if (!query || query.trim().length === 0) {
          return Promise.resolve(['Milk', 'Bread', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Chicken', 'Beef', 'Pork', 'Fish']);
        }
        if (query === 'milk') {
          return Promise.resolve(['Milk', 'Milkshake']);
        }
        return Promise.resolve([]);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return suggestions when no query is provided', async () => {
    const result = await controller.getSuggestions();
    
    expect(result).toHaveLength(10);
    expect(result).toContain('Milk');
    expect(result).toContain('Bread');
    expect(mockItemsService.getSuggestions).toHaveBeenCalledWith(undefined);
  });

  it('should return filtered suggestions when query is provided', async () => {
    const result = await controller.getSuggestions('milk');
    
    expect(result).toHaveLength(2);
    expect(result).toContain('Milk');
    expect(result).toContain('Milkshake');
    expect(mockItemsService.getSuggestions).toHaveBeenCalledWith('milk');
  });

  it('should handle empty query parameter', async () => {
    const result = await controller.getSuggestions('');
    
    expect(result).toHaveLength(10); // Empty query should return common items
    expect(result).toContain('Milk');
    expect(mockItemsService.getSuggestions).toHaveBeenCalledWith('');
  });
});
