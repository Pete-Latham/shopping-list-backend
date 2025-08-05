# Database Seeding

This project includes a database seeding script to populate your database with sample data.

## What the seed script does

The seeding script (`scripts/seed.ts`) creates sample data including:

1. **4 Shopping Lists**:
   - Weekly Groceries (8 items)
   - Party Supplies (6 items) 
   - Home Office Setup (5 items)
   - Garden Supplies (5 items)

2. **24 Shopping List Items** with realistic data including:
   - Item names
   - Quantities and units
   - Completion status (some marked as completed)
   - Notes for some items

## How to run the seed script

### Prerequisites
- Make sure your PostgreSQL database is running
- Ensure your database migrations have been run: `npm run migration:run`
- Configure your database connection in your `.env` file or use the defaults

### Running the seed script

```bash
npm run seed
```

### What happens when you run the seed script

1. **Database Connection**: Establishes connection to your PostgreSQL database
2. **Data Cleanup**: Clears existing shopping list items and shopping lists (optional - you can comment this out in the script)
3. **Data Creation**: Creates new sample shopping lists and items
4. **Success Message**: Shows a summary of what was created
5. **Cleanup**: Closes the database connection

### Sample Output

```
Database connection established.
Clearing existing data...
Creating sample shopping lists and items...
Created shopping list: Weekly Groceries
  Added 8 items to Weekly Groceries
Created shopping list: Party Supplies
  Added 6 items to Party Supplies
Created shopping list: Home Office Setup
  Added 5 items to Home Office Setup
Created shopping list: Garden Supplies
  Added 5 items to Garden Supplies

✅ Database seeding completed successfully!
Created 4 shopping lists with a total of 24 items.
Database connection closed.
```

## Customizing the seed data

You can modify the sample data by editing the `sampleData` array in `scripts/seed.ts`. The structure for each shopping list is:

```typescript
{
  name: 'Shopping List Name',
  description: 'Description of the shopping list',
  items: [
    {
      name: 'Item Name',
      quantity: 1,
      unit: 'piece', // or 'kg', 'liters', 'grams', etc.
      completed: false, // true or false
      notes: 'Optional notes about the item'
    }
    // ... more items
  ]
}
```

## Troubleshooting

### Database Connection Issues
- Verify your database is running
- Check your environment variables (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)
- Ensure your database exists

### Migration Issues
- Run migrations first: `npm run migration:run`
- Check that your database schema is up to date

### TypeScript Issues
- Make sure all dependencies are installed: `npm install`
- Check that `ts-node` is available in your dev dependencies
