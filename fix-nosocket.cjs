const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");

content = content.replace(
  `      // Emit event for real-time updates\n      try {\n        const { emitToTenant } = await import('../../config/socket');\n        emitToTenant(restaurant._id.toString(), 'order_sent', { order });\n      } catch (e) { console.error('Socket emit error:', e); }`,
  `      // Real-time updates handled via polling on frontend`
);

fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("Removed socket import!");
