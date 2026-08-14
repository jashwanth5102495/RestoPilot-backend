"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
const restaurant_model_1 = require("../modules/restaurants/restaurant.model");
const user_model_1 = require("../modules/users/user.model");
const category_model_1 = require("../modules/categories/category.model");
const dish_model_1 = require("../modules/dishes/dish.model");
const ingredient_model_1 = require("../modules/ingredients/ingredient.model");
const recipe_model_1 = require("../modules/recipes/recipe.model");
const billing_service_1 = require("../modules/billing/billing.service");
const order_model_1 = require("../modules/orders/order.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const runSeed = async () => {
    await (0, database_1.connectDatabase)();
    console.log('Seeding Butter Chicken Scenario...');
    await mongoose_1.default.connection.dropDatabase();
    const restaurant = await restaurant_model_1.Restaurant.create({
        name: 'Spice Garden Restaurant',
        phone: '9876543210',
        email: 'spicegarden@restopilot.demo',
        address: '123 Main St',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        restaurantType: 'Casual Dining',
        status: restaurant_model_1.RestaurantStatus.ACTIVE,
    });
    const owner = await user_model_1.User.create({
        restaurantId: restaurant._id,
        name: 'Owner Name',
        email: 'owner@restopilot.demo',
        passwordHash: await bcryptjs_1.default.hash('password123', 10),
        role: user_model_1.UserRole.OWNER,
        status: user_model_1.UserStatus.ACTIVE,
    });
    restaurant.ownerId = owner._id;
    await restaurant.save();
    const category = await category_model_1.Category.create({
        restaurantId: restaurant._id,
        name: 'Main Course',
    });
    const dish = await dish_model_1.Dish.create({
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
    const createdIngredients = await Promise.all(ingredientsData.map(ing => ingredient_model_1.Ingredient.create({
        restaurantId: restaurant._id,
        name: ing.name,
        unit: ing.unit,
        currentStock: ing.currentStock,
    })));
    const getIng = (name) => createdIngredients.find(i => i.name === name);
    const recipe = await recipe_model_1.Recipe.create({
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
    const { bill } = await billing_service_1.BillingService.processSale(restaurant._id, owner._id, [{ dishId: dish._id.toString(), quantity: 2 }], order_model_1.PaymentMethod.CASH);
    console.log(`Sale complete! Bill ID: ${bill.billNumber}`);
    console.log('\n--- Final Stock ---');
    const finalStock = await ingredient_model_1.Ingredient.find({ restaurantId: restaurant._id });
    for (const ing of finalStock) {
        console.log(`${ing.name}: ${ing.currentStock} ${ing.unit}`);
    }
    process.exit(0);
};
runSeed().catch(console.error);
