import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT ?? 5002;

app.listen(port, () => {
  console.log(`server is running at http:localhost:${port}`);
})