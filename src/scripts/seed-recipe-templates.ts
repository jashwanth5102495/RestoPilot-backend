import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { RecipeTemplate } from '../modules/recipes/recipe-template.model';

const templates = [
  // BIRYANI
  {
    dishName: 'Chicken Biryani',
    aliases: ['chicken biriyani', 'chicken dum biryani', 'hyderabadi chicken biryani'],
    category: 'Biryani',
    cuisine: 'Indian',
    ingredients: [
      { name: 'Chicken', quantity: 150, unit: 'g' },
      { name: 'Basmati Rice', quantity: 150, unit: 'g' },
      { name: 'Curd', quantity: 50, unit: 'g' },
      { name: 'Onion', quantity: 50, unit: 'g' },
      { name: 'Tomato', quantity: 30, unit: 'g' },
      { name: 'Oil', quantity: 10, unit: 'g' },
      { name: 'Ginger Garlic Paste', quantity: 10, unit: 'g' },
      { name: 'Biryani Masala', quantity: 5, unit: 'g' },
      { name: 'Mint', quantity: 5, unit: 'g' },
      { name: 'Coriander', quantity: 5, unit: 'g' },
      { name: 'Salt', quantity: 3, unit: 'g' }
    ]
  },
  {
    dishName: 'Veg Biryani',
    aliases: ['vegetable biryani', 'veg dum biryani'],
    category: 'Biryani',
    cuisine: 'Indian',
    ingredients: [
      { name: 'Basmati Rice', quantity: 150, unit: 'g' },
      { name: 'Mixed Vegetables', quantity: 100, unit: 'g' },
      { name: 'Curd', quantity: 50, unit: 'g' },
      { name: 'Onion', quantity: 40, unit: 'g' },
      { name: 'Tomato', quantity: 30, unit: 'g' },
      { name: 'Oil', quantity: 10, unit: 'g' },
      { name: 'Ginger Garlic Paste', quantity: 10, unit: 'g' },
      { name: 'Biryani Masala', quantity: 5, unit: 'g' },
      { name: 'Mint', quantity: 5, unit: 'g' },
      { name: 'Coriander', quantity: 5, unit: 'g' },
      { name: 'Salt', quantity: 3, unit: 'g' }
    ]
  },
  // NORTH INDIAN
  {
    dishName: 'Butter Chicken',
    aliases: ['murgh makhani', 'chicken makhani'],
    category: 'North Indian',
    cuisine: 'Indian',
    ingredients: [
      { name: 'Chicken', quantity: 150, unit: 'g' },
      { name: 'Tomato', quantity: 100, unit: 'g' },
      { name: 'Butter', quantity: 20, unit: 'g' },
      { name: 'Cream', quantity: 30, unit: 'ml' },
      { name: 'Cashew', quantity: 10, unit: 'g' },
      { name: 'Ginger Garlic Paste', quantity: 10, unit: 'g' },
      { name: 'Garam Masala', quantity: 3, unit: 'g' },
      { name: 'Salt', quantity: 3, unit: 'g' },
      { name: 'Kasuri Methi', quantity: 1, unit: 'g' }
    ]
  },
  {
    dishName: 'Paneer Butter Masala',
    aliases: ['paneer makhani'],
    category: 'North Indian',
    cuisine: 'Indian',
    ingredients: [
      { name: 'Paneer', quantity: 120, unit: 'g' },
      { name: 'Tomato', quantity: 100, unit: 'g' },
      { name: 'Onion', quantity: 50, unit: 'g' },
      { name: 'Butter', quantity: 20, unit: 'g' },
      { name: 'Cream', quantity: 30, unit: 'ml' },
      { name: 'Cashew', quantity: 10, unit: 'g' },
      { name: 'Ginger Garlic Paste', quantity: 10, unit: 'g' },
      { name: 'Garam Masala', quantity: 3, unit: 'g' },
      { name: 'Salt', quantity: 3, unit: 'g' },
      { name: 'Kasuri Methi', quantity: 1, unit: 'g' }
    ]
  },
  {
    dishName: 'Dal Makhani',
    aliases: [],
    category: 'North Indian',
    cuisine: 'Indian',
    ingredients: [
      { name: 'Black Urad Dal', quantity: 80, unit: 'g' },
      { name: 'Kidney Beans', quantity: 20, unit: 'g' },
      { name: 'Tomato', quantity: 60, unit: 'g' },
      { name: 'Butter', quantity: 20, unit: 'g' },
      { name: 'Cream', quantity: 30, unit: 'ml' },
      { name: 'Ginger Garlic Paste', quantity: 10, unit: 'g' },
      { name: 'Garam Masala', quantity: 3, unit: 'g' },
      { name: 'Salt', quantity: 3, unit: 'g' }
    ]
  },
  // INDO-CHINESE
  {
    dishName: 'Veg Fried Rice',
    aliases: ['vegetable fried rice'],
    category: 'Chinese',
    cuisine: 'Indo-Chinese',
    ingredients: [
      { name: 'Rice', quantity: 150, unit: 'g' },
      { name: 'Carrot', quantity: 20, unit: 'g' },
      { name: 'Cabbage', quantity: 20, unit: 'g' },
      { name: 'Beans', quantity: 20, unit: 'g' },
      { name: 'Spring Onion', quantity: 10, unit: 'g' },
      { name: 'Soy Sauce', quantity: 5, unit: 'ml' },
      { name: 'Oil', quantity: 10, unit: 'g' },
      { name: 'Salt', quantity: 2, unit: 'g' }
    ]
  },
  {
    dishName: 'Chicken Fried Rice',
    aliases: [],
    category: 'Chinese',
    cuisine: 'Indo-Chinese',
    ingredients: [
      { name: 'Rice', quantity: 150, unit: 'g' },
      { name: 'Chicken', quantity: 80, unit: 'g' },
      { name: 'Egg', quantity: 1, unit: 'pcs' },
      { name: 'Carrot', quantity: 10, unit: 'g' },
      { name: 'Spring Onion', quantity: 10, unit: 'g' },
      { name: 'Soy Sauce', quantity: 5, unit: 'ml' },
      { name: 'Oil', quantity: 10, unit: 'g' },
      { name: 'Salt', quantity: 2, unit: 'g' }
    ]
  },
  // BREAKFAST
  {
    dishName: 'Egg Omelette',
    aliases: ['omelette', 'masala omelette', 'egg omelet'],
    category: 'Breakfast',
    cuisine: 'Global',
    ingredients: [
      { name: 'Egg', quantity: 2, unit: 'pcs' },
      { name: 'Onion', quantity: 20, unit: 'g' },
      { name: 'Tomato', quantity: 15, unit: 'g' },
      { name: 'Green Chilli', quantity: 5, unit: 'g' },
      { name: 'Coriander', quantity: 5, unit: 'g' },
      { name: 'Oil', quantity: 5, unit: 'g' },
      { name: 'Salt', quantity: 2, unit: 'g' }
    ]
  }
];

const runSeed = async () => {
  try {
    await connectDatabase();
    console.log('Connected to database. Seeding global recipe templates...');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const t of templates) {
      const normalizedName = t.dishName.trim().toLowerCase().replace(/\s+/g, ' ');
      
      const updateData = {
        dishName: t.dishName,
        normalizedDishName: normalizedName,
        aliases: t.aliases.map(a => a.trim().toLowerCase().replace(/\s+/g, ' ')),
        category: t.category,
        cuisine: t.cuisine,
        servingUnit: '1 serving',
        ingredients: t.ingredients
      };

      const result = await RecipeTemplate.updateOne(
        { normalizedDishName: normalizedName },
        { $set: updateData },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
      } else if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    console.log(`Seeding complete. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding templates:', err);
    process.exit(1);
  }
};

runSeed();
