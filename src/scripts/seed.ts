import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Restaurant, RestaurantStatus } from '../modules/restaurants/restaurant.model';
import { User, UserRole, UserStatus } from '../modules/users/user.model';
import { Category } from '../modules/categories/category.model';
import { Dish } from '../modules/dishes/dish.model';
import { Ingredient } from '../modules/ingredients/ingredient.model';
import { Recipe } from '../modules/recipes/recipe.model';
import { BillingService } from '../modules/billing/billing.service';
import { PaymentMethod } from '../modules/orders/order.model';
import bcrypt from 'bcryptjs';

const runSeed = async () => {
  await connectDatabase();
  console.log('Seeding Butter Chicken Scenario...');

  await mongoose.connection.dropDatabase();

  const restaurant = await Restaurant.create({
    name: 'Spice Garden Restaurant',
    phone: '9876543210',
    email: 'spicegarden@restopilot.demo',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'MH',
    pincode: '400001',
    restaurantType: 'Casual Dining',
    status: RestaurantStatus.ACTIVE,
  });

  const owner = await User.create({
    restaurantId: restaurant._id,
    name: 'Owner Name',
    email: 'owner@restopilot.demo',
    passwordHash: await bcrypt.hash('password123', 10),
    role: UserRole.OWNER,
    status: UserStatus.ACTIVE,
  });

  restaurant.ownerId = owner._id as any;
  await restaurant.save();

  const category = await Category.create({
    restaurantId: restaurant._id,
    name: 'Main Course',
  });

  const dish = await Dish.create({
    restaurantId: restaurant._id,
    categoryId: category._id,
    name: 'Butter Chicken',
    price: 350,
    taxRate: 5,
  });

  const ingredientsData = [
    { name: 'Chicken', currentStock: 25000, unit: 'g' }, // 25kg
    { name: 'Butter', currentStock: 5000, unit: 'g' }, // 5kg
    { name: 'Tomato', currentStock: 20000, unit: 'g' }, // 20kg
    { name: 'Cream', currentStock: 8000, unit: 'ml' }, // 8L
    { name: 'Onion', currentStock: 10000, unit: 'g' }, // 10kg
    { name: 'Spices', currentStock: 2000, unit: 'g' }, // 2kg
  ];

  const createdIngredients = await Promise.all(
    ingredientsData.map(ing => Ingredient.create({
      restaurantId: restaurant._id,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.currentStock,
    }))
  );

  const getIng = (name: string) => createdIngredients.find(i => i.name === name)!;

  const recipe = await Recipe.create({
    restaurantId: restaurant._id,
    dishId: dish._id,
    items: [
      { ingredientId: getIng('Chicken')._id, quantity: 250, unit: 'g' },
      { ingredientId: getIng('Butter')._id, quantity: 30, unit: 'g' },
      { ingredientId: getIng('Tomato')._id, quantity: 100, unit: 'g' },
      { ingredientId: getIng('Cream')._id, quantity: 50, unit: 'ml' },
      { ingredientId: getIng('Onion')._id, quantity: 50, unit: 'g' },
      { ingredientId: getIng('Spices')._id, quantity: 10, unit: 'g' },
    ]
  });

  console.log('--- Initial Stock ---');
  for (const ing of createdIngredients) {
    console.log(`${ing.name}: ${ing.currentStock} ${ing.unit}`);
  }

  console.log('\n--- Processing Sale (Butter Chicken x 2) ---');
  
  const { bill } = await BillingService.processSale(
    restaurant._id,
    owner._id,
    [{ dishId: dish._id.toString(), quantity: 2 }],
    PaymentMethod.CASH
  );

  console.log(`Sale complete! Bill ID: ${bill.billNumber}`);

  console.log('\n--- Final Stock ---');
  const finalStock = await Ingredient.find({ restaurantId: restaurant._id });
  for (const ing of finalStock) {
    console.log(`${ing.name}: ${ing.currentStock} ${ing.unit}`);
  }

  process.exit(0);
};

runSeed().catch(console.error);
