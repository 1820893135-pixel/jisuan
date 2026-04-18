import dotenv from "dotenv";
import { config } from "./config.js";
import { createApp } from "./app.js";

dotenv.config({ override: true });

const app = createApp();

app.listen(config.port, () => {
  console.log(`lvyou server is running at http://localhost:${config.port}`);
});
