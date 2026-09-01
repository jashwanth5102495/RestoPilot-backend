"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const restaurant_model_1 = require("../modules/restaurants/restaurant.model");
const user_model_1 = require("../modules/users/user.model");
const category_model_1 = require("../modules/categories/category.model");
const dish_model_1 = require("../modules/dishes/dish.model");
const recipe_model_1 = require("../modules/recipes/recipe.model");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restopilot';
const newMenuData = [
    {
        category: 'Tandoor Starters (Veg)',
        description: 'Tandoor grilled vegetarian starters',
        isVeg: true,
        dishes: [
            { name: 'Paneer Tikka', price: 220, isVeg: true },
            { name: 'Peri Peri Paneer Tikka', price: 220, isVeg: true },
            { name: 'Paneer Malai Tikka', price: 220, isVeg: true },
            { name: 'Tandoori Mushroom', price: 220, isVeg: true },
            { name: 'Achari Mushroom', price: 220, isVeg: true },
            { name: 'Nilgiri Paneer/Mushroom', price: 220, isVeg: true },
            { name: 'Baby Corn Tikka', price: 200, isVeg: true },
            { name: 'Baby Corn Peshawari', price: 200, isVeg: true },
            { name: 'Veg Tandoor Platter', price: 700, isVeg: true },
        ]
    },
    {
        category: 'Tandoor Starters (Non-Veg)',
        description: 'Clay oven roasted chicken & meat starters',
        isVeg: false,
        dishes: [
            { name: 'Chicken Tikka', price: 220, isVeg: false },
            { name: 'Chicken Nilgiri', price: 220, isVeg: false },
            { name: 'Hariyali Kabab', price: 220, isVeg: false },
            { name: 'Chicken Peshawari', price: 220, isVeg: false },
            { name: 'Chicken Malai Kabab', price: 260, isVeg: false },
            { name: 'Sholay Kabab', price: 220, isVeg: false },
            { name: 'Tandoori Chicken (Half)', price: 220, isVeg: false },
            { name: 'Tandoori Chicken (Full)', price: 400, isVeg: false },
            { name: 'Non Veg Tandoor Platter', price: 900, isVeg: false },
        ]
    },
    {
        category: 'Chinese Starters (Veg)',
        description: 'Wok tossed Indo-Chinese vegetarian starters',
        isVeg: true,
        dishes: [
            { name: 'Paneer Chilli', price: 200, isVeg: true },
            { name: 'Paneer 65 Dry', price: 200, isVeg: true },
            { name: 'Paneer Pepper Dry', price: 200, isVeg: true },
            { name: 'Mushroom Chilli', price: 200, isVeg: true },
            { name: 'Mushroom Pepper Dry', price: 200, isVeg: true },
            { name: 'Mushroom 65 Dry', price: 200, isVeg: true },
            { name: 'Paneer Kurma (Special)', price: 220, isVeg: true },
            { name: 'Mushroom Duplex (Chef Special)', price: 260, isVeg: true },
        ]
    },
    {
        category: 'Chinese Starters (Non-Veg)',
        description: 'Wok tossed Indo-Chinese chicken starters',
        isVeg: false,
        dishes: [
            { name: 'Chicken Kabab', price: 200, isVeg: false },
            { name: 'Chicken Lollipop', price: 240, isVeg: false },
            { name: 'Chicken 65', price: 220, isVeg: false },
            { name: 'Chilli Chicken', price: 220, isVeg: false },
            { name: 'Chicken Pepper Dry', price: 220, isVeg: false },
            { name: 'Chicken Guntur Dry', price: 220, isVeg: false },
            { name: 'Pudina Chicken Dry', price: 220, isVeg: false },
        ]
    },
    {
        category: 'Mutton Items',
        description: 'Authentic mutton & boti delicacies',
        isVeg: false,
        dishes: [
            { name: 'Mutton Fry', price: 280, isVeg: false },
            { name: 'Mutton Pepper Dry', price: 280, isVeg: false },
            { name: 'Mutton Guntur Fry', price: 280, isVeg: false },
            { name: 'Boti Fry', price: 200, isVeg: false },
            { name: 'Egg Boti Fry', price: 200, isVeg: false },
            { name: 'Boti Pepper Dry', price: 200, isVeg: false },
        ]
    },
    {
        category: 'Special Chinese Non-Veg Starters',
        description: 'Chef special gourmet non-veg starters',
        isVeg: false,
        dishes: [
            { name: 'Kasthuri Chicken', price: 260, isVeg: false },
            { name: 'Chicken Kurma (Chef Special)', price: 260, isVeg: false },
            { name: 'Mutton Ghee Roast', price: 300, isVeg: false },
            { name: 'Boti Kabab Dry', price: 220, isVeg: false },
        ]
    },
    {
        category: 'Thithar Non-Veg (Kowju)',
        description: 'Special Thithar / Kowju game bird delicacies',
        isVeg: false,
        dishes: [
            { name: 'Thithar Tandoori', price: 220, isVeg: false },
            { name: 'Thithar Kabab', price: 200, isVeg: false },
            { name: 'Thithar Pepper Dry', price: 200, isVeg: false },
            { name: 'Thithar Chilly', price: 200, isVeg: false },
            { name: 'Thithar Ghee Roast', price: 220, isVeg: false },
        ]
    },
    {
        category: 'Sea Food (Seasonal)',
        description: 'Fresh seafood catch (Seasonal pricing)',
        isVeg: false,
        dishes: [
            { name: 'Fish Tikka', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Prawns Tikka', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Anjal Tawa Fry', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Basa Fish Boneless Kabab', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Bangda Fish (Tawa / Oil) Fry', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Squid Pepper Dry', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Squid Chilli', price: 0, description: 'Seasonal Price', isVeg: false },
        ]
    },
    {
        category: 'Special Sea Food Starters (Seasonal)',
        description: 'Signature coastal style seafood ghee roast & fries',
        isVeg: false,
        dishes: [
            { name: 'Fish Ghee Roast', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Fish Tawa', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Prawn Ghee Roast', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Butter Garlic Prawn', price: 0, description: 'Seasonal Price', isVeg: false },
            { name: 'Squid Ghee Roast', price: 0, description: 'Seasonal Price', isVeg: false },
        ]
    },
    {
        category: 'Add-Ons',
        description: 'Sides, salads and quick snacks',
        dishes: [
            { name: 'Green Salad', price: 80, isVeg: true },
            { name: 'French Fries', price: 150, isVeg: true },
            { name: 'Chicken Popcorn', price: 180, isVeg: false },
            { name: 'Peanut Masala', price: 120, isVeg: true },
            { name: 'Hara Bhara Veg Kabab', price: 200, isVeg: true },
            { name: 'Masala Papad', price: 80, isVeg: true },
        ]
    },
    {
        category: 'Egg Items',
        description: 'Scrambled, fried, and chilli egg dishes',
        isVeg: false,
        dishes: [
            { name: 'Egg Bhurji', price: 120, isVeg: false },
            { name: 'Egg Chilly', price: 180, isVeg: false },
            { name: 'Egg Pepper Dry', price: 180, isVeg: false },
            { name: 'Egg Pakoda', price: 170, isVeg: false },
        ]
    },
    {
        category: 'Breads',
        description: 'Fresh tandoor rotis, naans and parathas',
        isVeg: true,
        dishes: [
            { name: 'Roti', price: 30, isVeg: true },
            { name: 'Butter Roti', price: 35, isVeg: true },
            { name: 'Naan', price: 45, isVeg: true },
            { name: 'Butter Naan', price: 50, isVeg: true },
            { name: 'Lachha Paratha', price: 50, isVeg: true },
            { name: 'Butter Lachha Paratha', price: 55, isVeg: true },
            { name: 'Garlic Butter Naan', price: 70, isVeg: true },
            { name: 'Cheese Garlic Naan', price: 80, isVeg: true },
        ]
    },
    {
        category: 'Indian Veg Gravy',
        description: 'Rich vegetarian curries and dal preparations',
        isVeg: true,
        dishes: [
            { name: 'Hing Dal Tadka', price: 160, isVeg: true },
            { name: 'Dal Fry', price: 140, isVeg: true },
            { name: 'Paneer Lababdar', price: 180, isVeg: true },
            { name: 'Paneer Kolhapuri', price: 180, isVeg: true },
            { name: 'Paneer Tikka Masala', price: 180, isVeg: true },
            { name: 'Paneer Butter Masala', price: 200, isVeg: true },
            { name: 'Mutter Paneer', price: 180, isVeg: true },
            { name: 'Kadai Paneer', price: 200, isVeg: true },
            { name: 'Mushroom Mutter', price: 170, isVeg: true },
            { name: 'Mushroom Masala', price: 170, isVeg: true },
            { name: 'Kadai Mushroom', price: 170, isVeg: true },
            { name: 'Mix Veg Curry', price: 170, isVeg: true },
            { name: 'Veg Hyderabadi', price: 170, isVeg: true },
        ]
    },
    {
        category: 'Indian Non-Veg Gravy',
        description: 'Chicken, mutton, fish and prawn curries',
        isVeg: false,
        dishes: [
            { name: 'Kadai Chicken', price: 180, isVeg: false },
            { name: 'Chicken Tikka Masala', price: 200, isVeg: false },
            { name: 'Chicken Kolhapuri', price: 180, isVeg: false },
            { name: 'Chicken Do Pyaza', price: 180, isVeg: false },
            { name: 'Chicken Lababdar', price: 180, isVeg: false },
            { name: 'Chicken Handi', price: 180, isVeg: false },
            { name: 'Bhuna Chicken', price: 180, isVeg: false },
            { name: 'Mutton Rogan Josh', price: 260, isVeg: false },
            { name: 'Mutton Curry', price: 240, isVeg: false },
            { name: 'Basa Fish Curry', price: 280, isVeg: false },
            { name: 'Bangda Fish Curry', price: 200, isVeg: false },
            { name: 'Prawn Curry', price: 280, isVeg: false },
        ]
    },
    {
        category: 'Rice & Biryani',
        description: 'Flavored rices and aromatic biryanis',
        dishes: [
            { name: 'Steamed Rice', price: 130, isVeg: true },
            { name: 'Jeera Rice', price: 140, isVeg: true },
            { name: 'Curd Rice', price: 140, isVeg: true },
            { name: 'Ghee Rice', price: 150, isVeg: true },
            { name: 'Dal Khichdi', price: 150, isVeg: true },
            { name: 'Palak Khichdi', price: 160, isVeg: true },
            { name: 'Tomato Rice', price: 150, isVeg: true },
            { name: 'Egg Fried Rice', price: 170, isVeg: false },
            { name: 'Egg Schezwan Fried Rice', price: 180, isVeg: false },
            { name: 'Chicken Fried Rice', price: 200, isVeg: false },
            { name: 'Chicken Biryani', price: 200, isVeg: false },
            { name: 'Mutton Biryani', price: 300, isVeg: false },
            { name: 'Prawn Biryani', price: 320, isVeg: false },
        ]
    }
];
async function updateMenu() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        const email = 'mystery01@gmail.com';
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found!`);
            process.exit(1);
        }
        const restaurantId = user.restaurantId;
        const restaurant = await restaurant_model_1.Restaurant.findById(restaurantId);
        console.log(`Updating menu for Restaurant: ${restaurant?.name} (${restaurantId})`);
        // 1. Remove all existing recipes, dishes, and categories for this restaurant
        const deletedRecipes = await recipe_model_1.Recipe.deleteMany({ restaurantId });
        console.log(`Deleted ${deletedRecipes.deletedCount} old recipes`);
        const deletedDishes = await dish_model_1.Dish.deleteMany({ restaurantId });
        console.log(`Deleted ${deletedDishes.deletedCount} old dishes`);
        const deletedCategories = await category_model_1.Category.deleteMany({ restaurantId });
        console.log(`Deleted ${deletedCategories.deletedCount} old categories`);
        // 2. Insert new categories and dishes
        let totalCategories = 0;
        let totalDishes = 0;
        for (let i = 0; i < newMenuData.length; i++) {
            const catData = newMenuData[i];
            const category = new category_model_1.Category({
                restaurantId,
                name: catData.category,
                description: catData.description || `${catData.category} dishes`,
                displayOrder: i + 1,
                isActive: true,
                isDeleted: false,
            });
            await category.save();
            totalCategories++;
            for (let j = 0; j < catData.dishes.length; j++) {
                const dishItem = catData.dishes[j];
                const dish = new dish_model_1.Dish({
                    restaurantId,
                    categoryId: category._id,
                    name: dishItem.name,
                    description: dishItem.description || dishItem.name,
                    price: dishItem.price,
                    taxRate: 5,
                    isAvailable: true,
                    isDeleted: false,
                    displayOrder: j + 1,
                });
                await dish.save();
                totalDishes++;
            }
            console.log(`Added Category [${category.name}] with ${catData.dishes.length} dishes`);
        }
        console.log(`\n==============================================`);
        console.log(`MENU UPDATE COMPLETE!`);
        console.log(`Created ${totalCategories} Categories and ${totalDishes} Dishes for ${restaurant?.name}`);
        console.log(`==============================================`);
    }
    catch (err) {
        console.error('Error updating menu:', err);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
}
updateMenu();
