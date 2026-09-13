const fs = require('fs');
let content = fs.readFileSync('src/modules/dishes/dish.controller.ts', 'utf8');

content = content.replace(
  'if (name !== undefined && typeof name === \'string\' && name.trim() !== \'\') updateData.name = name.trim();',
  `if (name !== undefined && typeof name === 'string' && name.trim() !== '') {
        const existingDish = await Dish.findOne({ restaurantId: req.tenantId, name: name.trim(), _id: { $ne: req.params.id }, isDeleted: false });
        if (existingDish) {
          return res.status(400).json({ success: false, message: 'A dish with this name already exists' });
        }
        updateData.name = name.trim();
      }`
);

fs.writeFileSync('src/modules/dishes/dish.controller.ts', content);
