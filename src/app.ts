import express from "express";
import wordRoutes from "./routes/wordRoutes.js";

const app = express();
app.use("/words", wordRoutes);

app.get("/", (req, res) => {
   res.json(`Server connected`)
})

export default app;