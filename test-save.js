const mongoose = require('mongoose');
const { Restaurant } = require('./dist/modules/restaurants/restaurant.model');

mongoose.connect('mongodb://127.0.0.1:27017/restopilot', { serverSelectionTimeoutMS: 2000 })
  .then(async () => {
    try {
      const rest = await Restaurant.findOne();
      if (rest) {
        console.log("Restaurant:", rest);
        rest.isBillingEnabled = true;
        await rest.save();
        console.log("Save successful!");
      } else {
        console.log("No restaurants found.");
      }
    } catch (e) {
      console.error("Save error:", e);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Mongo error:", err);
    process.exit(1);
  });
