const fs = require('fs');
let content = fs.readFileSync('src/modules/public/public.controller.ts', 'utf8');

content = content.replace(
  'const reqAny = req as any;',
  'const reqAny = req as any;\n    console.log("RESOLVING RESTAURANT FOR:", reqAny.user, reqAny.tenantId, reqAny.body?.restaurantId, reqAny.query?.restaurantId);'
);

content = content.replace(
  'if (restaurantId) {',
  'console.log("Found restaurantId:", restaurantId);\n    if (restaurantId) {'
);

fs.writeFileSync('src/modules/public/public.controller.ts', content);
