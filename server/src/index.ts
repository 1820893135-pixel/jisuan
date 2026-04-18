import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`lvyou server is running at http://localhost:${config.port}`);
});
