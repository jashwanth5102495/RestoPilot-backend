import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { Restaurant } from '../modules/restaurants/restaurant.model';
import { DrinkItem, DrinkStockLog } from '../modules/drinks/drink.model';

dotenv.config();

const drinksData = [
  // Beer & Breezer (from Screenshot Rows 3-14)
  { name: 'Kingfisher Strong', price: 180, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Kingfisher Premium', price: 110, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Kingfisher Ultra', price: 150, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Budweiser Magnum', price: 250, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Budweiser Premium', price: 200, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Tuborg Strong', price: 175, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Tuborg Premium', price: 150, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Tuborg Classic', price: 250, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Corona Extra', price: 130, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Carlsberg Elephant strong', price: 240, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Bacardi +', price: 115, category: 'Beer', unit: 'bottle', currentStock: 24 },
  { name: 'Breezer', price: 130, category: 'Beer', unit: 'bottle', currentStock: 24 },

  // Spirits / Liquor (from Screenshot Rows 16-32)
  { name: 'Old Traveller (OT)', price: 135, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Hywards', price: 110, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Old Monk', price: 165, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Bagpiper (BP)', price: 155, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Mcdowells Brandy (MCB)', price: 175, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Mcdowells Wisky', price: 200, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Mansion House (MH)', price: 205, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Blenders Pride', price: 345, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Black & White', price: 580, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: '100 Pipers', price: 580, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Morpheus', price: 325, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Royal Stag', price: 280, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Romanov Vodka', price: 195, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Magic Moments', price: 265, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'Imperial Blue (IB)', price: 205, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'DSP Black', price: 205, category: 'Spirits', unit: 'bottle', currentStock: 24 },
  { name: 'After Dark', price: 200, category: 'Spirits', unit: 'bottle', currentStock: 24 }
];

async function seedDrinks() {
  try {
    await connectDatabase();
    console.log('Connected to database safely.');

    // Find Mystery Roaster Cafe restaurant
    const restaurant = await Restaurant.findOne({
      $or: [
        { billingSlug: 'mystery-roaster-cafe' },
        { billingSlug: 'mystery-roaster-cafe-billing' },
        { onlineSlug: 'mystery-roaster-cafe' },
        { email: 'mystery01@gmail.com' },
        { name: /Mystery Roaster Cafe/i }
      ]
    });

    if (!restaurant) {
      console.log('Restaurant not found in this database instance. Skipping.');
      process.exit(0);
    }

    console.log(`Processing drinks for restaurant: ${restaurant.name} (${restaurant._id})`);

    let addedCount = 0;
    let existingCount = 0;

    for (const d of drinksData) {
      const existing = await DrinkItem.findOne({
        restaurantId: restaurant._id,
        name: { $regex: new RegExp(`^${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        isDeleted: { $ne: true }
      });

      if (existing) {
        // Update price to match screenshot without modifying other data or deleting anything
        existing.price = d.price;
        existing.category = d.category;
        await existing.save();
        existingCount++;
      } else {
        // Create new drink safely
        const newDrink = new DrinkItem({
          restaurantId: restaurant._id,
          name: d.name,
          price: d.price,
          category: d.category,
          currentStock: d.currentStock,
          unit: d.unit,
          cost: 0,
          minStock: 5,
          isAvailable: true,
          isDeleted: false
        });
        await newDrink.save();

        await DrinkStockLog.create({
          restaurantId: restaurant._id,
          drinkId: newDrink._id,
          drinkName: newDrink.name,
          type: 'RESTOCK',
          quantityChange: d.currentStock,
          stockAfter: d.currentStock,
          notes: 'Initial stock on creation'
        });

        addedCount++;
        console.log(`+ Added drink: ${d.name} (Rs. ${d.price})`);
      }
    }

    console.log(`Safe drink sync complete! Added: ${addedCount}, Updated: ${existingCount}. Zero data was deleted.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during safe drink seed:', error);
    process.exit(1);
  }
}

seedDrinks();
