import { AppDataSource } from '../src/data-source';
import { ShoppingList } from '../src/entities/shopping-list.entity';
import { ShoppingListItem } from '../src/entities/shopping-list-item.entity';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established.');

    const shoppingListRepo = AppDataSource.getRepository(ShoppingList);
    const shoppingListItemRepo = AppDataSource.getRepository(ShoppingListItem);

    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('Clearing existing data...');
    await AppDataSource.query('TRUNCATE TABLE shopping_list_items, shopping_lists RESTART IDENTITY CASCADE;');

    // Sample shopping lists with items
    const sampleData = [
      {
        name: 'Weekly Groceries',
        description: 'Regular weekly shopping list',
        items: [
          { name: 'Milk', quantity: 2, unit: 'liters', completed: false, notes: 'Organic if available' },
          { name: 'Bread', quantity: 1, unit: 'loaf', completed: true, notes: 'Whole wheat' },
          { name: 'Eggs', quantity: 12, unit: 'pieces', completed: false },
          { name: 'Bananas', quantity: 6, unit: 'pieces', completed: false },
          { name: 'Chicken Breast', quantity: 500, unit: 'grams', completed: true },
          { name: 'Rice', quantity: 1, unit: 'kg', completed: false, notes: 'Basmati rice' },
          { name: 'Tomatoes', quantity: 4, unit: 'pieces', completed: false },
          { name: 'Yogurt', quantity: 2, unit: 'cups', completed: false }
        ]
      },
      {
        name: 'Party Supplies',
        description: 'Items needed for weekend party',
        items: [
          { name: 'Pizza', quantity: 3, unit: 'pieces', completed: false, notes: 'Mixed toppings' },
          { name: 'Soft Drinks', quantity: 6, unit: 'bottles', completed: false },
          { name: 'Ice Cream', quantity: 2, unit: 'tubs', completed: true, notes: 'Vanilla and chocolate' },
          { name: 'Paper Plates', quantity: 20, unit: 'pieces', completed: false },
          { name: 'Napkins', quantity: 1, unit: 'pack', completed: false },
          { name: 'Chips', quantity: 3, unit: 'bags', completed: true }
        ]
      },
      {
        name: 'Home Office Setup',
        description: 'Office supplies and equipment',
        items: [
          { name: 'Wireless Mouse', quantity: 1, unit: 'piece', completed: false, notes: 'Ergonomic preferred' },
          { name: 'Notebook', quantity: 3, unit: 'pieces', completed: true },
          { name: 'Pens', quantity: 10, unit: 'pieces', completed: false, notes: 'Blue ink' },
          { name: 'Desk Lamp', quantity: 1, unit: 'piece', completed: false },
          { name: 'Coffee', quantity: 2, unit: 'packs', completed: true, notes: 'Medium roast' }
        ]
      },
      {
        name: 'Garden Supplies',
        description: 'Spring gardening essentials',
        items: [
          { name: 'Tomato Seeds', quantity: 3, unit: 'packets', completed: false },
          { name: 'Potting Soil', quantity: 2, unit: 'bags', completed: false, notes: '10kg bags' },
          { name: 'Garden Gloves', quantity: 1, unit: 'pair', completed: true },
          { name: 'Watering Can', quantity: 1, unit: 'piece', completed: false },
          { name: 'Fertilizer', quantity: 1, unit: 'bottle', completed: false, notes: 'Organic preferred' }
        ]
      }
    ];

    console.log('Creating sample shopping lists and items...');
    
    for (const listData of sampleData) {
      // Create shopping list
      const shoppingList = new ShoppingList();
      shoppingList.name = listData.name;
      shoppingList.description = listData.description;
      const savedList = await shoppingListRepo.save(shoppingList);
      
      console.log(`Created shopping list: ${savedList.name}`);

      // Create items for this list
      for (const itemData of listData.items) {
        const item = new ShoppingListItem();
        item.name = itemData.name;
        item.quantity = itemData.quantity;
        item.unit = itemData.unit;
        item.completed = itemData.completed;
        if (itemData.notes) {
          item.notes = itemData.notes;
        }
        item.shoppingList = savedList;
        
        await shoppingListItemRepo.save(item);
      }
      
      console.log(`  Added ${listData.items.length} items to ${savedList.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`Created ${sampleData.length} shopping lists with a total of ${sampleData.reduce((total, list) => total + list.items.length, 0)} items.`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
}

seed().catch(error => console.log('Seeding failed: ', error));

