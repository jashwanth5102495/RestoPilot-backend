const fs = require('fs');

const dishes = [
  // Biryani
  { name: 'Chicken Biryani', aliases: ['chicken biriyani', 'chicken dum biryani', 'hyderabadi chicken biryani'], cat: 'Biryani', cu: 'Indian', main: 'Chicken', mainQty: 150 },
  { name: 'Mutton Biryani', aliases: ['mutton dum biryani'], cat: 'Biryani', cu: 'Indian', main: 'Mutton', mainQty: 150 },
  { name: 'Egg Biryani', aliases: [], cat: 'Biryani', cu: 'Indian', main: 'Egg', mainQty: 2, mainUnit: 'pcs' },
  { name: 'Veg Biryani', aliases: ['vegetable biryani', 'veg dum biryani', 'vegetable dum biryani'], cat: 'Biryani', cu: 'Indian', main: 'Mixed Vegetables', mainQty: 100 },
  { name: 'Paneer Biryani', aliases: [], cat: 'Biryani', cu: 'Indian', main: 'Paneer', mainQty: 100 },
  { name: 'Mushroom Biryani', aliases: [], cat: 'Biryani', cu: 'Indian', main: 'Mushroom', mainQty: 100 },
  { name: 'Fish Biryani', aliases: [], cat: 'Biryani', cu: 'Indian', main: 'Fish', mainQty: 150 },
  { name: 'Prawn Biryani', aliases: [], cat: 'Biryani', cu: 'Indian', main: 'Prawns', mainQty: 150 },
  
  // North Indian Chicken
  { name: 'Butter Chicken', aliases: ['murgh makhani', 'chicken makhani'], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },
  { name: 'Chicken Tikka Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },
  { name: 'Kadai Chicken', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry' },
  { name: 'Chicken Curry', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry' },
  { name: 'Chicken Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry' },
  { name: 'Chicken Handi', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },
  { name: 'Chicken Korma', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },
  { name: 'Chicken Do Pyaza', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry' },
  { name: 'Chicken Lababdar', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },
  { name: 'Chicken Kolhapuri', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_spicy' },
  { name: 'Chicken Saag', aliases: ['palak chicken'], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_palak' },
  { name: 'Chicken Keema', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Minced Chicken', mainQty: 150, type: 'curry' },
  { name: 'Chicken Afghani', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },
  { name: 'Chicken Kali Mirch', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'curry_rich' },

  // Mutton
  { name: 'Mutton Curry', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry' },
  { name: 'Mutton Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry' },
  { name: 'Mutton Rogan Josh', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry_spicy' },
  { name: 'Mutton Korma', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry_rich' },
  { name: 'Mutton Handi', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry_rich' },
  { name: 'Mutton Do Pyaza', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry' },
  { name: 'Mutton Keema', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Minced Mutton', mainQty: 150, type: 'curry' },
  { name: 'Mutton Kolhapuri', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mutton', mainQty: 150, type: 'curry_spicy' },

  // Paneer
  { name: 'Paneer Butter Masala', aliases: ['paneer makhani'], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_rich' },
  { name: 'Kadai Paneer', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry' },
  { name: 'Shahi Paneer', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_rich' },
  { name: 'Palak Paneer', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_palak' },
  { name: 'Paneer Tikka Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_rich' },
  { name: 'Paneer Lababdar', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_rich' },
  { name: 'Matar Paneer', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_matar' },
  { name: 'Paneer Do Pyaza', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry' },
  { name: 'Achari Paneer', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 120, type: 'curry_spicy' },

  // Dal
  { name: 'Dal Makhani', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Black Urad Dal', mainQty: 80, type: 'dal_rich' },
  { name: 'Dal Tadka', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Yellow Dal', mainQty: 80, type: 'dal' },
  { name: 'Dal Fry', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Yellow Dal', mainQty: 80, type: 'dal' },
  { name: 'Dal Palak', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Yellow Dal', mainQty: 80, type: 'dal_palak' },
  { name: 'Yellow Dal', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Yellow Dal', mainQty: 80, type: 'dal' },
  { name: 'Dal Panchratna', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mixed Dal', mainQty: 80, type: 'dal' },

  // Veg North Indian
  { name: 'Chole Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Chickpeas', mainQty: 100, type: 'curry' },
  { name: 'Rajma Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Kidney Beans', mainQty: 100, type: 'curry' },
  { name: 'Aloo Gobi', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Potato', mainQty: 100, main2: 'Cauliflower', main2Qty: 100, type: 'dry_veg' },
  { name: 'Aloo Jeera', aliases: ['jeera aloo'], cat: 'North Indian', cu: 'Indian', main: 'Potato', mainQty: 150, type: 'dry_veg' },
  { name: 'Aloo Matar', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Potato', mainQty: 100, main2: 'Green Peas', main2Qty: 50, type: 'curry' },
  { name: 'Bhindi Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Okra', mainQty: 150, type: 'dry_veg' },
  { name: 'Baingan Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Eggplant', mainQty: 150, type: 'dry_veg' },
  { name: 'Mix Veg', aliases: ['mixed veg', 'mixed vegetables'], cat: 'North Indian', cu: 'Indian', main: 'Mixed Vegetables', mainQty: 150, type: 'curry' },
  { name: 'Veg Kolhapuri', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mixed Vegetables', mainQty: 150, type: 'curry_spicy' },
  { name: 'Veg Korma', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mixed Vegetables', mainQty: 150, type: 'curry_rich' },
  { name: 'Malai Kofta', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Paneer', mainQty: 80, main2: 'Potato', main2Qty: 50, type: 'curry_rich' },
  { name: 'Dum Aloo', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Baby Potato', mainQty: 150, type: 'curry_rich' },
  { name: 'Mushroom Masala', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mushroom', mainQty: 150, type: 'curry' },
  { name: 'Matar Mushroom', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Mushroom', mainQty: 100, main2: 'Green Peas', main2Qty: 50, type: 'curry' },
  { name: 'Palak Corn', aliases: [], cat: 'North Indian', cu: 'Indian', main: 'Sweet Corn', mainQty: 80, type: 'curry_palak' },

  // Rice
  { name: 'Steamed Rice', aliases: ['plain rice', 'white rice'], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, type: 'plain_rice' },
  { name: 'Jeera Rice', aliases: [], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, type: 'flavored_rice' },
  { name: 'Ghee Rice', aliases: [], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, type: 'flavored_rice' },
  { name: 'Veg Pulao', aliases: ['vegetable pulao'], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, main2: 'Mixed Vegetables', main2Qty: 50, type: 'flavored_rice' },
  { name: 'Peas Pulao', aliases: [], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, main2: 'Green Peas', main2Qty: 50, type: 'flavored_rice' },
  { name: 'Kashmiri Pulao', aliases: [], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, type: 'flavored_rice' },
  { name: 'Lemon Rice', aliases: [], cat: 'Rice', cu: 'South Indian', main: 'Rice', mainQty: 150, type: 'flavored_rice' },
  { name: 'Tomato Rice', aliases: [], cat: 'Rice', cu: 'South Indian', main: 'Rice', mainQty: 150, type: 'flavored_rice' },
  { name: 'Curd Rice', aliases: [], cat: 'Rice', cu: 'South Indian', main: 'Rice', mainQty: 100, main2: 'Curd', main2Qty: 100, type: 'flavored_rice' },
  { name: 'Coconut Rice', aliases: [], cat: 'Rice', cu: 'South Indian', main: 'Rice', mainQty: 150, type: 'flavored_rice' },
  { name: 'Mushroom Rice', aliases: [], cat: 'Rice', cu: 'Indian', main: 'Rice', mainQty: 150, main2: 'Mushroom', main2Qty: 50, type: 'flavored_rice' },

  // Indo-Chinese Fried Rice
  { name: 'Veg Fried Rice', aliases: ['vegetable fried rice'], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, type: 'fried_rice' },
  { name: 'Chicken Fried Rice', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, main2: 'Chicken', main2Qty: 80, type: 'fried_rice' },
  { name: 'Egg Fried Rice', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, main2: 'Egg', main2Qty: 2, main2Unit: 'pcs', type: 'fried_rice' },
  { name: 'Schezwan Fried Rice', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, type: 'fried_rice_schezwan' },
  { name: 'Mixed Fried Rice', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, main2: 'Chicken', main2Qty: 40, type: 'fried_rice' },
  { name: 'Garlic Fried Rice', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, type: 'fried_rice' },
  { name: 'Paneer Fried Rice', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Rice', mainQty: 150, main2: 'Paneer', main2Qty: 80, type: 'fried_rice' },

  // Noodles
  { name: 'Veg Hakka Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, type: 'noodles' },
  { name: 'Chicken Hakka Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, main2: 'Chicken', main2Qty: 80, type: 'noodles' },
  { name: 'Egg Hakka Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, main2: 'Egg', main2Qty: 2, main2Unit: 'pcs', type: 'noodles' },
  { name: 'Schezwan Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, type: 'noodles_schezwan' },
  { name: 'Garlic Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, type: 'noodles' },
  { name: 'Mixed Hakka Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, main2: 'Chicken', main2Qty: 40, type: 'noodles' },
  { name: 'Chilli Garlic Noodles', aliases: [], cat: 'Chinese', cu: 'Indo-Chinese', main: 'Noodles', mainQty: 150, type: 'noodles_schezwan' },

  // Indo Chinese Starters
  { name: 'Veg Manchurian', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Mixed Vegetables', mainQty: 150, type: 'chinese_starter' },
  { name: 'Gobi Manchurian', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Cauliflower', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chicken Manchurian', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Paneer Manchurian', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Paneer', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chilli Chicken', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chilli Paneer', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Paneer', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chilli Gobi', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Cauliflower', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chilli Mushroom', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Mushroom', mainQty: 150, type: 'chinese_starter' },
  { name: 'Dragon Chicken', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Garlic Chicken', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Pepper Chicken', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Hot Garlic Chicken', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chicken 65', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 150, type: 'chinese_starter' },
  { name: 'Chicken Lollipop', aliases: [], cat: 'Starters', cu: 'Indo-Chinese', main: 'Chicken Wings', mainQty: 150, type: 'chinese_starter' },

  // Soups
  { name: 'Veg Manchow Soup', aliases: [], cat: 'Soup', cu: 'Indo-Chinese', main: 'Mixed Vegetables', mainQty: 50, type: 'soup' },
  { name: 'Chicken Manchow Soup', aliases: [], cat: 'Soup', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 50, type: 'soup' },
  { name: 'Veg Hot and Sour Soup', aliases: [], cat: 'Soup', cu: 'Indo-Chinese', main: 'Mixed Vegetables', mainQty: 50, type: 'soup' },
  { name: 'Chicken Hot and Sour Soup', aliases: [], cat: 'Soup', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 50, type: 'soup' },
  { name: 'Veg Sweet Corn Soup', aliases: [], cat: 'Soup', cu: 'Indo-Chinese', main: 'Sweet Corn', mainQty: 50, type: 'soup' },
  { name: 'Chicken Sweet Corn Soup', aliases: [], cat: 'Soup', cu: 'Indo-Chinese', main: 'Chicken', mainQty: 50, main2: 'Sweet Corn', main2Qty: 30, type: 'soup' },
  { name: 'Tomato Soup', aliases: [], cat: 'Soup', cu: 'Global', main: 'Tomato', mainQty: 100, type: 'soup' },
  { name: 'Cream of Mushroom Soup', aliases: [], cat: 'Soup', cu: 'Global', main: 'Mushroom', mainQty: 80, type: 'soup' },

  // Tandoor
  { name: 'Tandoori Chicken', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Chicken', mainQty: 250, type: 'tandoor' },
  { name: 'Chicken Tikka', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'tandoor' },
  { name: 'Chicken Malai Tikka', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'tandoor_malai' },
  { name: 'Hariyali Chicken Tikka', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Chicken', mainQty: 150, type: 'tandoor' },
  { name: 'Chicken Seekh Kebab', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Minced Chicken', mainQty: 150, type: 'tandoor' },
  { name: 'Mutton Seekh Kebab', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Minced Mutton', mainQty: 150, type: 'tandoor' },
  { name: 'Reshmi Kebab', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Minced Chicken', mainQty: 150, type: 'tandoor_malai' },
  { name: 'Paneer Tikka', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Paneer', mainQty: 150, type: 'tandoor' },
  { name: 'Tandoori Paneer', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Paneer', mainQty: 150, type: 'tandoor' },
  { name: 'Tandoori Mushroom', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Mushroom', mainQty: 150, type: 'tandoor' },
  { name: 'Tandoori Fish', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Fish', mainQty: 150, type: 'tandoor' },
  { name: 'Tandoori Prawns', aliases: [], cat: 'Tandoor', cu: 'Indian', main: 'Prawns', mainQty: 150, type: 'tandoor' },

  // Breads
  { name: 'Roti', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 50, type: 'bread' },
  { name: 'Butter Roti', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 50, type: 'bread_butter' },
  { name: 'Tandoori Roti', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 50, type: 'bread' },
  { name: 'Naan', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Maida', mainQty: 60, type: 'bread' },
  { name: 'Butter Naan', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Maida', mainQty: 60, type: 'bread_butter' },
  { name: 'Garlic Naan', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Maida', mainQty: 60, type: 'bread_butter' },
  { name: 'Cheese Naan', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Maida', mainQty: 60, type: 'bread_cheese' },
  { name: 'Rumali Roti', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Maida', mainQty: 50, type: 'bread' },
  { name: 'Plain Paratha', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 60, type: 'bread_butter' },
  { name: 'Lachha Paratha', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 60, type: 'bread_butter' },
  { name: 'Aloo Paratha', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 50, main2: 'Potato', main2Qty: 50, type: 'bread_butter' },
  { name: 'Paneer Paratha', aliases: [], cat: 'Breads', cu: 'Indian', main: 'Wheat Flour', mainQty: 50, main2: 'Paneer', main2Qty: 40, type: 'bread_butter' },

  // South Indian
  { name: 'Plain Dosa', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, type: 'dosa' },
  { name: 'Masala Dosa', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, main2: 'Potato', main2Qty: 80, type: 'dosa' },
  { name: 'Butter Dosa', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, type: 'dosa_butter' },
  { name: 'Mysore Masala Dosa', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, main2: 'Potato', main2Qty: 80, type: 'dosa_butter' },
  { name: 'Paneer Dosa', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, main2: 'Paneer', main2Qty: 50, type: 'dosa' },
  { name: 'Onion Dosa', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, main2: 'Onion', main2Qty: 40, type: 'dosa' },
  { name: 'Idli', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Idli Batter', mainQty: 150, type: 'idli' },
  { name: 'Medu Vada', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Urad Dal Batter', mainQty: 100, type: 'idli' },
  { name: 'Sambar', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Toor Dal', mainQty: 40, type: 'curry' },
  { name: 'Rasam', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Tomato', mainQty: 30, type: 'curry' },
  { name: 'Uttapam', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, type: 'dosa' },
  { name: 'Onion Uttapam', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Dosa Batter', mainQty: 150, main2: 'Onion', main2Qty: 40, type: 'dosa' },
  { name: 'Pongal', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Rice', mainQty: 80, main2: 'Moong Dal', main2Qty: 40, type: 'dosa_butter' },
  { name: 'Upma', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Semolina', mainQty: 100, type: 'dosa' },
  { name: 'Coconut Chutney', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Coconut', mainQty: 50, type: 'chutney' },
  { name: 'Tomato Chutney', aliases: [], cat: 'South Indian', cu: 'Indian', main: 'Tomato', mainQty: 50, type: 'chutney' },

  // Breakfast
  { name: 'Egg Omelette', aliases: ['omelette', 'masala omelette', 'egg omelet'], cat: 'Breakfast', cu: 'Global', main: 'Egg', mainQty: 2, mainUnit: 'pcs', type: 'omelette' },
  { name: 'Masala Omelette', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Egg', mainQty: 2, mainUnit: 'pcs', type: 'omelette' },
  { name: 'Cheese Omelette', aliases: [], cat: 'Breakfast', cu: 'Global', main: 'Egg', mainQty: 2, mainUnit: 'pcs', type: 'omelette_cheese' },
  { name: 'Plain Omelette', aliases: [], cat: 'Breakfast', cu: 'Global', main: 'Egg', mainQty: 2, mainUnit: 'pcs', type: 'omelette' },
  { name: 'Poha', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Flattened Rice', mainQty: 100, type: 'dosa' },
  { name: 'Poori Bhaji', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Wheat Flour', mainQty: 80, main2: 'Potato', main2Qty: 100, type: 'dosa' },
  { name: 'Chole Bhature', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Maida', mainQty: 100, main2: 'Chickpeas', main2Qty: 80, type: 'dosa' },
  { name: 'Pav Bhaji', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Pav', mainQty: 2, mainUnit: 'pcs', main2: 'Mixed Vegetables', main2Qty: 150, type: 'dosa_butter' },
  { name: 'Bread Omelette', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Egg', mainQty: 2, mainUnit: 'pcs', main2: 'Bread', main2Qty: 2, main2Unit: 'pcs', type: 'omelette' },
  { name: 'Egg Bhurji', aliases: [], cat: 'Breakfast', cu: 'Indian', main: 'Egg', mainQty: 2, mainUnit: 'pcs', type: 'omelette' },

  // Snacks
  { name: 'Samosa', aliases: [], cat: 'Snacks', cu: 'Indian', main: 'Maida', mainQty: 50, main2: 'Potato', main2Qty: 80, type: 'dosa' },
  { name: 'Paneer Pakora', aliases: [], cat: 'Snacks', cu: 'Indian', main: 'Paneer', mainQty: 100, main2: 'Besan', main2Qty: 40, type: 'dosa' },
  { name: 'Onion Pakora', aliases: [], cat: 'Snacks', cu: 'Indian', main: 'Onion', mainQty: 100, main2: 'Besan', main2Qty: 40, type: 'dosa' },
  { name: 'Aloo Pakora', aliases: [], cat: 'Snacks', cu: 'Indian', main: 'Potato', mainQty: 100, main2: 'Besan', main2Qty: 40, type: 'dosa' },
  { name: 'Chicken Pakora', aliases: [], cat: 'Snacks', cu: 'Indian', main: 'Chicken', mainQty: 150, main2: 'Besan', main2Qty: 40, type: 'dosa' },
  { name: 'Fish Fry', aliases: [], cat: 'Snacks', cu: 'Indian', main: 'Fish', mainQty: 150, type: 'dosa' },
  { name: 'Fish Fingers', aliases: [], cat: 'Snacks', cu: 'Global', main: 'Fish', mainQty: 150, type: 'dosa' },
  { name: 'French Fries', aliases: [], cat: 'Snacks', cu: 'Global', main: 'Potato', mainQty: 150, type: 'dosa' },
  { name: 'Masala Fries', aliases: [], cat: 'Snacks', cu: 'Global', main: 'Potato', mainQty: 150, type: 'dosa' },
  { name: 'Chilli Potato', aliases: [], cat: 'Snacks', cu: 'Indo-Chinese', main: 'Potato', mainQty: 150, type: 'chinese_starter' },
  { name: 'Veg Spring Roll', aliases: [], cat: 'Snacks', cu: 'Indo-Chinese', main: 'Spring Roll Wrapper', mainQty: 2, mainUnit: 'pcs', main2: 'Mixed Vegetables', main2Qty: 80, type: 'dosa' },
  { name: 'Chicken Spring Roll', aliases: [], cat: 'Snacks', cu: 'Indo-Chinese', main: 'Spring Roll Wrapper', mainQty: 2, mainUnit: 'pcs', main2: 'Chicken', main2Qty: 80, type: 'dosa' },
  { name: 'Paneer Spring Roll', aliases: [], cat: 'Snacks', cu: 'Indo-Chinese', main: 'Spring Roll Wrapper', mainQty: 2, mainUnit: 'pcs', main2: 'Paneer', main2Qty: 80, type: 'dosa' },

  // Seafood
  { name: 'Fish Masala', aliases: [], cat: 'Seafood', cu: 'Indian', main: 'Fish', mainQty: 150, type: 'curry' },
  { name: 'Fish Curry', aliases: [], cat: 'Seafood', cu: 'Indian', main: 'Fish', mainQty: 150, type: 'curry' },
  { name: 'Fish Tikka', aliases: [], cat: 'Seafood', cu: 'Indian', main: 'Fish', mainQty: 150, type: 'tandoor' },
  { name: 'Chilli Fish', aliases: [], cat: 'Seafood', cu: 'Indo-Chinese', main: 'Fish', mainQty: 150, type: 'chinese_starter' },
  { name: 'Prawn Fry', aliases: [], cat: 'Seafood', cu: 'Indian', main: 'Prawns', mainQty: 150, type: 'tandoor' },
  { name: 'Prawn Masala', aliases: [], cat: 'Seafood', cu: 'Indian', main: 'Prawns', mainQty: 150, type: 'curry' },
  { name: 'Prawn Curry', aliases: [], cat: 'Seafood', cu: 'Indian', main: 'Prawns', mainQty: 150, type: 'curry' },
  { name: 'Chilli Prawns', aliases: [], cat: 'Seafood', cu: 'Indo-Chinese', main: 'Prawns', mainQty: 150, type: 'chinese_starter' },
  { name: 'Garlic Prawns', aliases: [], cat: 'Seafood', cu: 'Indo-Chinese', main: 'Prawns', mainQty: 150, type: 'chinese_starter' },

  // Desserts
  { name: 'Gulab Jamun', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Gulab Jamun', mainQty: 2, mainUnit: 'pcs', type: 'dessert' },
  { name: 'Rasgulla', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Rasgulla', mainQty: 2, mainUnit: 'pcs', type: 'dessert' },
  { name: 'Jalebi', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Jalebi', mainQty: 100, type: 'dessert' },
  { name: 'Gajar Halwa', aliases: ['carrot halwa'], cat: 'Desserts', cu: 'Indian', main: 'Carrot', mainQty: 100, main2: 'Milk', main2Qty: 100, main2Unit: 'ml', type: 'dessert_rich' },
  { name: 'Kheer', aliases: ['rice kheer'], cat: 'Desserts', cu: 'Indian', main: 'Milk', mainQty: 150, mainUnit: 'ml', main2: 'Rice', main2Qty: 30, type: 'dessert_rich' },
  { name: 'Phirni', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Milk', mainQty: 150, mainUnit: 'ml', main2: 'Rice Flour', main2Qty: 30, type: 'dessert_rich' },
  { name: 'Kulfi', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Milk', mainQty: 150, mainUnit: 'ml', type: 'dessert_rich' },
  { name: 'Mango Kulfi', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Milk', mainQty: 150, mainUnit: 'ml', main2: 'Mango Pulp', main2Qty: 50, type: 'dessert_rich' },
  { name: 'Pista Kulfi', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Milk', mainQty: 150, mainUnit: 'ml', main2: 'Pistachio', main2Qty: 10, type: 'dessert_rich' },
  { name: 'Rabri', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Milk', mainQty: 200, mainUnit: 'ml', type: 'dessert_rich' },
  { name: 'Shahi Tukda', aliases: [], cat: 'Desserts', cu: 'Indian', main: 'Bread', mainQty: 2, mainUnit: 'pcs', main2: 'Milk', main2Qty: 100, main2Unit: 'ml', type: 'dessert_rich' },
  { name: 'Brownie', aliases: ['chocolate brownie'], cat: 'Desserts', cu: 'Global', main: 'Brownie', mainQty: 1, mainUnit: 'pcs', type: 'dessert' },
  { name: 'Fruit Custard', aliases: [], cat: 'Desserts', cu: 'Global', main: 'Milk', mainQty: 150, mainUnit: 'ml', main2: 'Mixed Fruits', main2Qty: 50, type: 'dessert' },

  // Beverages
  { name: 'Masala Chai', aliases: ['tea', 'ginger tea'], cat: 'Beverages', cu: 'Indian', main: 'Milk', mainQty: 100, mainUnit: 'ml', main2: 'Tea Leaves', main2Qty: 5, type: 'beverage_hot' },
  { name: 'Coffee', aliases: ['filter coffee'], cat: 'Beverages', cu: 'Global', main: 'Milk', mainQty: 100, mainUnit: 'ml', main2: 'Coffee Powder', main2Qty: 5, type: 'beverage_hot' },
  { name: 'Cold Coffee', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Milk', mainQty: 200, mainUnit: 'ml', main2: 'Coffee Powder', main2Qty: 5, type: 'beverage_cold' },
  { name: 'Sweet Lassi', aliases: ['lassi'], cat: 'Beverages', cu: 'Indian', main: 'Curd', mainQty: 150, type: 'beverage_cold' },
  { name: 'Salted Lassi', aliases: [], cat: 'Beverages', cu: 'Indian', main: 'Curd', mainQty: 150, type: 'beverage_cold' },
  { name: 'Mango Lassi', aliases: [], cat: 'Beverages', cu: 'Indian', main: 'Curd', mainQty: 150, main2: 'Mango Pulp', main2Qty: 50, type: 'beverage_cold' },
  { name: 'Buttermilk', aliases: [], cat: 'Beverages', cu: 'Indian', main: 'Curd', mainQty: 100, type: 'beverage_cold' },
  { name: 'Fresh Lime Soda', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Lemon', mainQty: 1, mainUnit: 'pcs', main2: 'Soda', main2Qty: 200, main2Unit: 'ml', type: 'beverage_cold' },
  { name: 'Fresh Lime Water', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Lemon', mainQty: 1, mainUnit: 'pcs', type: 'beverage_cold' },
  { name: 'Mango Milkshake', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Milk', mainQty: 200, mainUnit: 'ml', main2: 'Mango Pulp', main2Qty: 50, type: 'beverage_cold' },
  { name: 'Banana Milkshake', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Milk', mainQty: 200, mainUnit: 'ml', main2: 'Banana', main2Qty: 1, main2Unit: 'pcs', type: 'beverage_cold' },
  { name: 'Chocolate Milkshake', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Milk', mainQty: 200, mainUnit: 'ml', main2: 'Chocolate Syrup', main2Qty: 20, type: 'beverage_cold' },
  { name: 'Strawberry Milkshake', aliases: [], cat: 'Beverages', cu: 'Global', main: 'Milk', mainQty: 200, mainUnit: 'ml', main2: 'Strawberry Syrup', main2Qty: 20, type: 'beverage_cold' }
];

const standardBases = {
  curry: [
    { name: 'Onion', quantity: 50, unit: 'g' },
    { name: 'Tomato', quantity: 40, unit: 'g' }
  ],
  curry_spicy: [
    { name: 'Onion', quantity: 60, unit: 'g' },
    { name: 'Tomato', quantity: 40, unit: 'g' }
  ],
  curry_rich: [
    { name: 'Onion', quantity: 50, unit: 'g' },
    { name: 'Tomato', quantity: 40, unit: 'g' },
    { name: 'Butter', quantity: 20, unit: 'g' },
    { name: 'Cream', quantity: 30, unit: 'ml' },
    { name: 'Cashew', quantity: 10, unit: 'g' }
  ],
  curry_palak: [
    { name: 'Spinach', quantity: 100, unit: 'g' },
    { name: 'Onion', quantity: 30, unit: 'g' },
    { name: 'Tomato', quantity: 20, unit: 'g' }
  ],
  curry_matar: [
    { name: 'Green Peas', quantity: 50, unit: 'g' },
    { name: 'Onion', quantity: 50, unit: 'g' },
    { name: 'Tomato', quantity: 40, unit: 'g' }
  ],
  dal: [
    { name: 'Onion', quantity: 30, unit: 'g' },
    { name: 'Tomato', quantity: 30, unit: 'g' }
  ],
  dal_rich: [
    { name: 'Tomato', quantity: 50, unit: 'g' },
    { name: 'Butter', quantity: 20, unit: 'g' },
    { name: 'Cream', quantity: 20, unit: 'ml' }
  ],
  dal_palak: [
    { name: 'Spinach', quantity: 50, unit: 'g' },
    { name: 'Onion', quantity: 30, unit: 'g' },
    { name: 'Tomato', quantity: 30, unit: 'g' }
  ],
  dry_veg: [
    { name: 'Onion', quantity: 40, unit: 'g' },
    { name: 'Tomato', quantity: 30, unit: 'g' }
  ],
  plain_rice: [],
  flavored_rice: [],
  fried_rice: [
    { name: 'Carrot', quantity: 20, unit: 'g' },
    { name: 'Cabbage', quantity: 20, unit: 'g' },
    { name: 'Spring Onion', quantity: 10, unit: 'g' }
  ],
  fried_rice_schezwan: [
    { name: 'Carrot', quantity: 20, unit: 'g' },
    { name: 'Cabbage', quantity: 20, unit: 'g' },
    { name: 'Spring Onion', quantity: 10, unit: 'g' },
    { name: 'Schezwan Sauce', quantity: 15, unit: 'g' }
  ],
  noodles: [
    { name: 'Carrot', quantity: 20, unit: 'g' },
    { name: 'Cabbage', quantity: 30, unit: 'g' },
    { name: 'Capsicum', quantity: 20, unit: 'g' },
    { name: 'Spring Onion', quantity: 10, unit: 'g' }
  ],
  noodles_schezwan: [
    { name: 'Carrot', quantity: 20, unit: 'g' },
    { name: 'Cabbage', quantity: 30, unit: 'g' },
    { name: 'Capsicum', quantity: 20, unit: 'g' },
    { name: 'Spring Onion', quantity: 10, unit: 'g' },
    { name: 'Schezwan Sauce', quantity: 15, unit: 'g' }
  ],
  chinese_starter: [
    { name: 'Onion', quantity: 30, unit: 'g' },
    { name: 'Capsicum', quantity: 30, unit: 'g' },
    { name: 'Corn Flour', quantity: 10, unit: 'g' }
  ],
  soup: [
    { name: 'Corn Flour', quantity: 10, unit: 'g' }
  ],
  tandoor: [
    { name: 'Curd', quantity: 40, unit: 'g' },
    { name: 'Lemon', quantity: 0.5, unit: 'pcs' }
  ],
  tandoor_malai: [
    { name: 'Cream', quantity: 30, unit: 'ml' },
    { name: 'Cheese', quantity: 20, unit: 'g' }
  ],
  bread: [],
  bread_butter: [
    { name: 'Butter', quantity: 10, unit: 'g' }
  ],
  bread_cheese: [
    { name: 'Cheese', quantity: 20, unit: 'g' },
    { name: 'Butter', quantity: 10, unit: 'g' }
  ],
  dosa: [],
  dosa_butter: [
    { name: 'Butter', quantity: 15, unit: 'g' }
  ],
  idli: [],
  chutney: [
    { name: 'Green Chilli', quantity: 5, unit: 'g' }
  ],
  omelette: [
    { name: 'Onion', quantity: 20, unit: 'g' },
    { name: 'Tomato', quantity: 15, unit: 'g' },
    { name: 'Green Chilli', quantity: 5, unit: 'g' }
  ],
  omelette_cheese: [
    { name: 'Cheese', quantity: 20, unit: 'g' },
    { name: 'Butter', quantity: 10, unit: 'g' }
  ],
  dessert: [
    { name: 'Sugar', quantity: 20, unit: 'g' }
  ],
  dessert_rich: [
    { name: 'Sugar', quantity: 30, unit: 'g' },
    { name: 'Almonds', quantity: 5, unit: 'g' }
  ],
  beverage_hot: [
    { name: 'Sugar', quantity: 10, unit: 'g' }
  ],
  beverage_cold: [
    { name: 'Sugar', quantity: 15, unit: 'g' }
  ]
};

const finalTemplates = [];
const seen = new Set();

for (const d of dishes) {
  // avoid duplicates
  const norm = d.name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (seen.has(norm)) continue;
  seen.add(norm);

  const ingredients = [];
  
  // Add main ingredient
  if (d.main) {
    ingredients.push({ name: d.main, quantity: d.mainQty || 100, unit: d.mainUnit || 'g' });
  }
  if (d.main2) {
    ingredients.push({ name: d.main2, quantity: d.main2Qty || 50, unit: d.main2Unit || 'g' });
  }

  // Add base ingredients
  if (d.type && standardBases[d.type]) {
    ingredients.push(...standardBases[d.type]);
  }

  // Handle Biryani specifically if not covered by type
  if (d.cat === 'Biryani') {
    if (!ingredients.find(i => i.name === 'Basmati Rice')) ingredients.push({ name: 'Basmati Rice', quantity: 150, unit: 'g' });
    if (!ingredients.find(i => i.name === 'Curd')) ingredients.push({ name: 'Curd', quantity: 50, unit: 'g' });
    if (!ingredients.find(i => i.name === 'Onion')) ingredients.push({ name: 'Onion', quantity: 50, unit: 'g' });
    if (!ingredients.find(i => i.name === 'Tomato')) ingredients.push({ name: 'Tomato', quantity: 30, unit: 'g' });
  }

  finalTemplates.push({
    dishName: d.name,
    aliases: d.aliases || [],
    category: d.cat,
    cuisine: d.cu,
    ingredients
  });
}

const fileContent = `import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { RecipeTemplate } from '../modules/recipes/recipe-template.model';

const templates = ${JSON.stringify(finalTemplates, null, 2)};

const runSeed = async () => {
  try {
    await connectDatabase();
    console.log('Connected to database. Seeding global recipe templates...');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const t of templates) {
      const normalizedName = t.dishName.trim().toLowerCase().replace(/\\s+/g, ' ');
      
      const updateData = {
        dishName: t.dishName,
        normalizedDishName: normalizedName,
        aliases: t.aliases.map(a => a.trim().toLowerCase().replace(/\\s+/g, ' ')),
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

    console.log(\`Seeding complete. Inserted: \${insertedCount}, Updated: \${updatedCount}\`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding templates:', err);
    process.exit(1);
  }
};

runSeed();
`;

fs.writeFileSync('src/scripts/seed-recipe-templates.ts', fileContent);
console.log('Generated ' + finalTemplates.length + ' templates.');
