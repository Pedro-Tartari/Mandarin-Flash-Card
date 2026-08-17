import {serverConfig} from "./config/env.js";
import app from './app.js'

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});