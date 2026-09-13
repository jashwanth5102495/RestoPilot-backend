const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.routes.ts", "utf8");

// Add QR tables route after the online-orders lines
content = content.replace(
  "router.patch('/billing/:slug/dishes/:dishId/availability', PublicController.toggleDishAvailability);",
  "router.patch('/billing/:slug/dishes/:dishId/availability', PublicController.toggleDishAvailability);\nrouter.get('/billing/:slug/qr-table-orders', PublicController.getBillingQrTableOrders);\nrouter.post('/billing/:slug/qr-table-orders/:orderId/settle', PublicController.settleBillingQrTableOrder);"
);

fs.writeFileSync("src/modules/public/public.routes.ts", content);
console.log("done");
