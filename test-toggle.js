const mongoose = require('mongoose');
const { Restaurant } = require('./dist/modules/restaurants/restaurant.model');
const { PublicController } = require('./dist/modules/public/public.controller');

mongoose.connect('mongodb://127.0.0.1:27017/restopilot', { serverSelectionTimeoutMS: 2000 })
  .then(async () => {
    try {
      const rest = await Restaurant.findOne();
      
      const req = {
        tenantId: rest._id,
        body: { enabled: true }
      };
      const res = {
        status: (s) => ({
          json: (d) => { console.log('Status', s, 'Data', d); }
        })
      };
      const next = (e) => { console.error('Next called with', e); };

      await PublicController.toggleBillingOrdering(req, res, next);
    } catch (e) {
      console.error("Save error:", e);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Mongo error:", err);
    process.exit(1);
  });
