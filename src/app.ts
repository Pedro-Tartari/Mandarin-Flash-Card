import express from "express";

const app = express();

app.get("/", (req, res) => {
   res.send(`Server connected`)
})

export default app;