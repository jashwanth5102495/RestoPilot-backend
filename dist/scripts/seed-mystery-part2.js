"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const restaurant_model_1 = require("../modules/restaurants/restaurant.model");
const category_model_1 = require("../modules/categories/category.model");
const dish_model_1 = require("../modules/dishes/dish.model");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restopilot';
const menuData = [
    {
        category: 'Chinese Non Veg',
        dishes: [
            { name: 'Chicken Manchurian', price: 220 },
            { name: 'Chicken 65', price: 220 },
            { name: 'Chicken Pepper Dry', price: 220 },
            { name: 'Chilly Chicken', price: 220 },
            { name: 'Chinese Special (Chef Special)', price: 260 },
            { name: 'Dragon Chicken', price: 260 },
            { name: 'Egg Chilly', price: 220 },
            { name: 'Egg Manchurian', price: 220 },
            { name: 'Guntur Chicken', price: 220 },
            { name: 'Lemon Chicken', price: 220 },
            { name: 'Andhra Style Chilly Chicken', price: 250 },
        ]
    },
    {
        category: 'Breads',
        dishes: [
            { name: 'Roti', price: 35 },
            { name: 'Butter Roti', price: 40 },
            { name: 'Kulcha', price: 55 },
            { name: 'Butter Kulcha', price: 60 },
            { name: 'Naan', price: 50 },
            { name: 'Butter Naan', price: 55 },
            { name: 'Cheese Garlic Naan', price: 80 },
            { name: 'Butter Garlic Naan', price: 75 },
            { name: 'Lachha Parota', price: 40 },
            { name: 'Butter Lachha Parota', price: 45 },
        ]
    },
    {
        category: 'Indian Curry Veg',
        dishes: [
            { name: 'Paneer Lababdar', price: 180 },
            { name: 'Paneer Kholapuri', price: 180 },
            { name: 'Paneer Tikka Masala', price: 200 },
            { name: 'Paneer Butter Masala', price: 180 },
            { name: 'Khadai Paneer', price: 180 },
            { name: 'Mutter Paneer', price: 180 },
            { name: 'Mushroom Mutter', price: 180 },
            { name: 'Mushroom Masala', price: 180 },
            { name: 'Khadai Mushroom', price: 170 },
            { name: 'Mix Veg Curry', price: 170 },
            { name: 'Veg Hyderbadi', price: 180 },
            { name: 'Dal Tadka', price: 160 },
            { name: 'Dal Fry', price: 140 },
            { name: 'Sambje Melone', price: 180 },
            { name: 'Kaju Masala', price: 260 },
            { name: 'Veg Khadai', price: 180 },
        ]
    },
    {
        category: 'Indian Curry Non Veg',
        dishes: [
            { name: 'Khadai Chicken', price: 180 },
            { name: 'Chicken Tikka Masala', price: 200 },
            { name: 'Chicken Kolhapuri', price: 180 },
            { name: 'Chicken Do Pyaza', price: 180 },
            { name: 'Chicken Lababdar', price: 180 },
            { name: 'Chicken Handi', price: 180 },
            { name: 'Bhuna Chicken', price: 180 },
            { name: 'Mutton Rogan Josh', price: 300 },
            { name: 'Mutton Curry', price: 280 },
            { name: 'Mutton Bhuna Josh', price: 300 },
            { name: 'Fish Curry', price: 280 },
            { name: 'Fish Koliwada', price: 320 },
            { name: 'Prawn Curry', price: 300 },
            { name: 'Prawn Jhinga Jhal Fareji', price: 300 },
            { name: 'Chicken Butter Masala', price: 200 },
            { name: 'Chicken Mughlai', price: 260 },
            { name: 'Egg Curry', price: 180 },
        ]
    },
    {
        category: 'Biriyani (Hyderabadi Style)',
        dishes: [
            { name: 'Veg Biriyani', price: 220 },
            { name: 'Mushroom Biriyani', price: 220 },
            { name: 'Mystery Chicken Dum Biriyani', price: 250 },
            { name: 'Mystery Mutton Dum Biriyani', price: 360 },
            { name: 'Fish Biriyani', price: 360 },
            { name: 'Prawn Biriyani', price: 360 },
        ]
    },
    {
        category: 'Rice',
        dishes: [
            { name: 'Chicken Fried Rice', price: 180 },
            { name: 'Egg Fried Rice', price: 160 },
            { name: 'Curd Rice', price: 130 },
            { name: 'Dal Kichadi', price: 150 },
            { name: 'Ghee Rice', price: 150 },
            { name: 'Jeera Rice', price: 140 },
            { name: 'Kaju Fried Rice', price: 200 },
            { name: 'Mushroom Fried Rice', price: 180 },
            { name: 'Steam Rice', price: 120 },
            { name: 'Veg Fried Rice', price: 150 },
        ]
    },
    {
        category: 'Beverages',
        dishes: [
            { name: 'Tea', price: 30 },
            { name: 'Coffee', price: 30 },
            { name: 'Lemon Tea', price: 30 },
            { name: 'Green Tea', price: 30 },
            { name: 'Lemon Ice Tea', price: 130 },
            { name: 'Peach Ice Tea', price: 130 },
            { name: 'Fresh Lime Soda', price: 110 },
            { name: 'Soft Drinks', price: 50 },
            { name: 'Soft Drinks 1L', price: 100 },
            { name: 'Water', price: 30 },
        ]
    },
    {
        category: 'Milk Shakes',
        dishes: [
            { name: 'Cold Coffee', price: 120 },
            { name: 'Ferrorocher Shake', price: 170 },
            { name: 'Redvelvet Shake', price: 150 },
            { name: 'Black Berry Shake', price: 140 },
            { name: 'Oreo Milk Shake', price: 140 },
            { name: 'Kit Kat Shake', price: 150 },
            { name: 'Black Forrest Shake', price: 160 },
            { name: 'Chocolate Shake', price: 120 },
            { name: 'Vanilla Shake', price: 120 },
            { name: 'Butter Scotch Shake', price: 150 },
        ]
    },
    {
        category: 'Mocktail Drinks',
        dishes: [
            { name: 'Berry Berry Surprise', price: 140, description: 'Blue berry cross, rase berry juice, lemon juice, ice cube, and mint leaves.' },
            { name: 'Black Beauty', price: 130, description: 'Black currant, sugar syrup, grapes juice, lemon juice and soda.' },
            { name: 'Bull Power', price: 180, description: 'Red bull, lemon juice, ice cube, sugar syrup and blue currant.' },
            { name: 'Kiwi Kiss', price: 140, description: 'Kiwi creass, pineapple juice, lemon juice, sugar syrup and soda.' },
        ]
    }
];
async function seedMysteryPart2() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        const restaurant = await restaurant_model_1.Restaurant.findOne({ email: 'mystery01' });
        if (!restaurant) {
            console.log('Restaurant not found!');
            return;
        }
        // Get current max display order
        const lastCategory = await category_model_1.Category.findOne({ restaurantId: restaurant._id }).sort({ displayOrder: -1 });
        let displayOrder = (lastCategory?.displayOrder || 0) + 1;
        for (const catData of menuData) {
            const category = new category_model_1.Category({
                restaurantId: restaurant._id,
                name: catData.category,
                description: `${catData.category} dishes`,
                displayOrder: displayOrder++,
                isActive: true,
            });
            await category.save();
            console.log(`Created Category: ${category.name}`);
            for (const dishData of catData.dishes) {
                const dish = new dish_model_1.Dish({
                    restaurantId: restaurant._id,
                    categoryId: category._id,
                    name: dishData.name,
                    description: dishData.description || dishData.name,
                    price: dishData.price,
                    isAvailable: true,
                });
                await dish.save();
            }
            console.log(`Added ${catData.dishes.length} dishes to ${category.name}`);
        }
        console.log('Successfully added Part 2 of the menu!');
    }
    catch (err) {
        console.error('Error seeding data:', err);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
}
seedMysteryPart2();
