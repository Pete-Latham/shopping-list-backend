import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemsService } from './items.service';
import { ShoppingListItem } from '../entities';

describe('ItemsService', () => {
  let service: ItemsService;
  let mockRepository: Partial<Repository<ShoppingListItem>>;

  beforeEach(async () => {
    // Mock repository with createQueryBuilder
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { name: 'Milk' },
          { name: 'Milkshake' },
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: getRepositoryToken(ShoppingListItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return common items when no query is provided', async () => {
    const result = await service.getSuggestions();
    
    expect(result).toHaveLength(10);
    expect(result).toContain('Milk');
    expect(result).toContain('Bread');
    expect(result).toContain('Eggs');
  });

  it('should return common items when empty query is provided', async () => {
    const result = await service.getSuggestions('');
    
    expect(result).toHaveLength(10);
    expect(result).toContain('Milk');
    expect(result).toContain('Bread');
    expect(result).toContain('Eggs');
  });

  it('should return filtered suggestions for a query', async () => {
    const result = await service.getSuggestions('milk');
    
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Milk');
    expect(result).toContain('Milkshake'); // From mock repository
    
    // Should prioritize items that start with the query
    expect(result[0]).toBe('Milk');
  });

  it('should limit results to 8 suggestions', async () => {
    // Mock repository to return many results
    const manyResults = Array.from({ length: 20 }, (_, i) => ({ name: `Milk${i}` }));
    mockRepository.createQueryBuilder = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(manyResults),
    });

    const result = await service.getSuggestions('milk');
    
    expect(result).toHaveLength(8);
  });
});
