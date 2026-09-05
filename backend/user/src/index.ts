import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";


dotenv.config();
console.log(process.env.MONGO_URL);
connectdb();
const app = express();

const port = process.env.PORT ?? 5000;

app.listen(port, () => {
  console.log(`server is running at port http://localhost:${port}`)
});