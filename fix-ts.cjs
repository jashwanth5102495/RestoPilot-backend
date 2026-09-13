const fs = require("fs");
let content = fs.readFileSync("src/modules/public/public.controller.ts", "utf8");
content = content.replace("{ status: TableStatus.AVAILABLE }", "{ status: TableStatus.FREE }");
fs.writeFileSync("src/modules/public/public.controller.ts", content);
console.log("done");
