"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const restaurant_model_1 = require("../modules/restaurants/restaurant.model");
const user_model_1 = require("../modules/users/user.model");
const category_model_1 = require("../modules/categories/category.model");
const dish_model_1 = require("../modules/dishes/dish.model");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restopilot';
const menuData = [
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
        ],
        isVeg: true
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
        ],
        isVeg: false
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
        ],
        isVeg: false
    },
    {
        category: "Add On's",
        dishes: [
            { name: 'Chicken Pop Corn', price: 180, isVeg: false },
            { name: 'Chicken Lollipop', price: 220, isVeg: false },
            { name: 'Chicken Lollipop Manchurian', price: 280, isVeg: false },
            { name: 'Fried Chicken', price: 220, isVeg: false },
            { name: 'Chicken Kabab', price: 200, isVeg: false },
            { name: 'Egg Bhurji', price: 100, isVeg: false },
            { name: 'Boiled Egg', price: 30, isVeg: false },
            { name: 'Aloo Corn Tikka', price: 220, isVeg: true },
            { name: 'Fried Kaju', price: 300, isVeg: true },
            { name: 'French Fries', price: 150, isVeg: true },
            { name: 'French Fries Peri Peri', price: 170, isVeg: true },
            { name: 'Crispy Corn', price: 220, isVeg: true },
            { name: 'Green Salad', price: 70, isVeg: true },
            { name: 'Onion Pakoda', price: 120, isVeg: true },
            { name: 'Paneer Pakoda', price: 200, isVeg: true },
            { name: 'Peanut Masala', price: 100, isVeg: true },
        ],
        isVeg: null // Mixed category
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
        ],
        isVeg: true
    }
];
async function seedMysteryRoaster() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        // 1. Create Restaurant
        const restaurant = new restaurant_model_1.Restaurant({
            name: 'Mystery Roaster Cafe',
            email: 'mystery01',
            phone: '9999999999',
            address: 'Mystery Street',
            city: 'Unknown',
            state: 'Unknown',
            pincode: '000000',
            restaurantType: 'Cafe',
            status: restaurant_model_1.RestaurantStatus.ACTIVE,
        });
        await restaurant.save();
        console.log(`Created Restaurant: ${restaurant.name}`);
        // 2. Create Owner User
        const passwordHash = await bcryptjs_1.default.hash('cafe01', 12);
        const owner = new user_model_1.User({
            restaurantId: restaurant._id,
            name: 'Mystery Owner',
            email: 'mystery01',
            phone: '9999999999',
            passwordHash,
            role: user_model_1.UserRole.OWNER,
            status: user_model_1.UserStatus.ACTIVE,
        });
        await owner.save();
        console.log(`Created Owner User: ${owner.email} / cafe01`);
        // 3. Create Categories & Dishes
        let displayOrder = 1;
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
                    description: dishData.name,
                    price: dishData.price,
                    isAvailable: true,
                });
                await dish.save();
            }
            console.log(`Added ${catData.dishes.length} dishes to ${category.name}`);
        }
        console.log('Successfully seeded Mystery Roaster Cafe!');
    }
    catch (err) {
        console.error('Error seeding data:', err);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
}
seedMysteryRoaster();
