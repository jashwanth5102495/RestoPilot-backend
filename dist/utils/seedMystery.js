"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMysterySeedIfMissing = runMysterySeedIfMissing;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const restaurant_model_1 = require("../modules/restaurants/restaurant.model");
const user_model_1 = require("../modules/users/user.model");
const category_model_1 = require("../modules/categories/category.model");
const dish_model_1 = require("../modules/dishes/dish.model");
const menuData = [
    // PART 1
    {
        category: 'Tandoor Veg',
        dishes: [
            { name: 'Paneer Tikka', price: 220 },
            { name: 'Mushroom Achari', price: 220 },
            { name: 'Mushroom Malai Tikka', price: 220 },
            { name: 'Mushroom Nilgiri', price: 220 },
            { name: 'Mushroom Tandoori', price: 220 },
            { name: 'Mushroom Special (Stuffed)', price: 280 },
            { name: 'Mushroom Duplex (Mystery Special)', price: 280 },
            { name: 'Paneer Malai Tikka', price: 220 },
            { name: 'Paneer Nilgiri', price: 220 },
            { name: 'Paneer Special (Stuffed)', price: 300 },
            { name: 'Paneer Tikka Peri Peri', price: 220 },
            { name: 'Veg Tandoor Platter', price: 800 },
            { name: 'Baby Corn Tikka', price: 200 },
            { name: 'Baby Corn Peshawari', price: 200 },
            { name: 'Hara Bara Kebab', price: 220 },
        ]
    },
    {
        category: 'Tandoor Non Veg',
        dishes: [
            { name: 'Chicken Malai (Bone)', price: 220 },
            { name: 'Chicken Malai (Boneless)', price: 260 },
            { name: 'Chicken Nilgiri (Bone)', price: 220 },
            { name: 'Chicken Nilgiri (Boneless)', price: 260 },
            { name: 'Chicken Sholay Kebab', price: 220 },
            { name: 'Chicken Peshawari', price: 220 },
            { name: 'Chicken Tikka (Bone)', price: 220 },
            { name: 'Chicken Tikka (Boneless)', price: 260 },
            { name: 'Chicken Alfaham', price: 650 },
            { name: 'Chicken BBQ', price: 650 },
            { name: 'Hariyali Kebab', price: 220 },
            { name: 'Chicken Tandoor Half', price: 300 },
            { name: 'Chicken Tandoor Full', price: 500 },
            { name: 'Non Veg Tandoor Platter', price: 900 },
            { name: 'Tandoor Special', price: 300 },
        ]
    },
    {
        category: 'Tandoori Sea Food',
        dishes: [
            { name: 'Fish Tikka', price: 300 },
            { name: 'Fish Fingers', price: 320 },
            { name: 'Amritsari Fish Tikka', price: 300 },
            { name: 'Prawn Popcorn', price: 360 },
            { name: 'Prawn Tikka', price: 350 },
            { name: 'Prawn Hungary Kebab', price: 350 },
            { name: 'Prawn Ghee Roast', price: 380 },
            { name: 'Fish Ghee Roast', price: 380 },
        ]
    },
    {
        category: "Add On's",
        dishes: [
            { name: 'Chicken Pop Corn', price: 180 },
            { name: 'Chicken Lollipop', price: 220 },
            { name: 'Chicken Lollipop Manchurian', price: 280 },
            { name: 'Fried Chicken', price: 220 },
            { name: 'Chicken Kabab', price: 200 },
            { name: 'Egg Bhurji', price: 100 },
            { name: 'Boiled Egg', price: 30 },
            { name: 'Aloo Corn Tikka', price: 220 },
            { name: 'Fried Kaju', price: 300 },
            { name: 'French Fries', price: 150 },
            { name: 'French Fries Peri Peri', price: 170 },
            { name: 'Crispy Corn', price: 220 },
            { name: 'Green Salad', price: 70 },
            { name: 'Onion Pakoda', price: 120 },
            { name: 'Paneer Pakoda', price: 200 },
            { name: 'Peanut Masala', price: 100 },
        ]
    },
    {
        category: 'Chinese Veg',
        dishes: [
            { name: 'Baby Corn Chilly', price: 220 },
            { name: 'Baby Corn Manchurian', price: 220 },
            { name: 'Baby Corn Pepper Dry', price: 220 },
            { name: 'Mushroom Chilly', price: 220 },
            { name: 'Mushroom Manchurian', price: 220 },
            { name: 'Mushroom Pepper Dry', price: 250 },
            { name: 'Mushroom Duplex (Chef Special)', price: 300 },
            { name: 'Paneer Chilly', price: 220 },
            { name: 'Paneer Manchurian', price: 220 },
            { name: 'Paneer Pepper Dry', price: 220 },
            { name: 'Gobi Manchurian', price: 200 },
        ]
    },
    // PART 2
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
    },
    // PART 3 (New Image)
    {
        category: 'Desserts',
        dishes: [
            { name: 'Chocolate Ice Cream', price: 100 },
            { name: 'Vanilla Ice Cream', price: 80 },
            { name: 'Butter Scotch Ice Cream', price: 120 },
            { name: 'Brownie With Ice Cream', price: 180 },
            { name: 'Sizzling Brownie', price: 250 },
        ]
    },
    {
        category: 'Breakfast',
        dishes: [
            { name: 'Veg Sandwich', price: 120 },
            { name: 'Paneer Paratha', price: 120 },
            { name: 'Aloo Paratha', price: 100 },
            { name: 'Plain Paratha With Curd', price: 70 },
            { name: 'Bread Omelette', price: 100 },
            { name: 'Egg Omelette', price: 60 },
        ]
    }
];
async function runMysterySeedIfMissing() {
    try {
        const existing = await restaurant_model_1.Restaurant.findOne({ email: 'mystery01@gmail.com' });
        let restaurant;
        if (existing) {
            existing.address = 'Foot Hills of SKANDAGIRI, kalavara, Chickballapur-562101';
            existing.phone = '8260217213, 9035910552';
            existing.name = 'Mystery Roaster Cafe';
            await existing.save();
            restaurant = existing;
        }
        else {
            console.log('Seeding Mystery Roaster Cafe...');
            // 1. Create Restaurant
            restaurant = new restaurant_model_1.Restaurant({
                name: 'Mystery Roaster Cafe',
                email: 'mystery01@gmail.com',
                phone: '8260217213, 9035910552',
                address: 'Foot Hills of SKANDAGIRI, kalavara, Chickballapur-562101',
                city: 'Chickballapur',
                state: 'Karnataka',
                pincode: '562101',
                restaurantType: 'Cafe',
                status: restaurant_model_1.RestaurantStatus.ACTIVE,
            });
            await restaurant.save();
            // 2. Create Owner User
            const passwordHash = await bcryptjs_1.default.hash('cafe01', 12);
            const owner = new user_model_1.User({
                restaurantId: restaurant._id,
                name: 'Mystery Owner',
                email: 'mystery01@gmail.com',
                phone: '8260217213',
                passwordHash,
                role: user_model_1.UserRole.OWNER,
                status: user_model_1.UserStatus.ACTIVE,
            });
            await owner.save();
            restaurant.ownerId = owner._id;
            await restaurant.save();
        }
        // 3. Create Categories & Dishes (Only if they don't exist)
        const lastCategory = await category_model_1.Category.findOne({ restaurantId: restaurant._id }).sort({ displayOrder: -1 });
        let displayOrder = (lastCategory?.displayOrder || 0) + 1;
        for (const catData of menuData) {
            const catExists = await category_model_1.Category.findOne({ restaurantId: restaurant._id, name: catData.category });
            if (catExists)
                continue; // Skip already seeded categories
            const category = new category_model_1.Category({
                restaurantId: restaurant._id,
                name: catData.category,
                description: `${catData.category} dishes`,
                displayOrder: displayOrder++,
                isActive: true,
            });
            await category.save();
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
        }
        console.log('Successfully seeded Mystery Roaster Cafe on boot!');
    }
    catch (err) {
        console.error('Error seeding Mystery Roaster Cafe:', err);
    }
}
