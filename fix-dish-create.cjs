const fs = require('fs');
let content = fs.readFileSync('src/modules/dishes/dish.controller.ts', 'utf8');

content = content.replace(
  'const dish = await Dish.create({\n        ...req.body,\n        restaurantId: req.tenantId,\n      });',
  `const existingDish = await Dish.findOne({ restaurantId: req.tenantId, name: req.body.name, isDeleted: false });
      if (existingDish) {
        return res.status(400).json({ success: false, message: 'A dish with this name already exists' });
      }

      const dish = await Dish.create({
        ...req.body,
        restaurantId: req.tenantId,
      });`
);

fs.writeFileSync('src/modules/dishes/dish.controller.ts', content);
