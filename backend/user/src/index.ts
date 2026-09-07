import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import { createClient } from "redis";


dotenv.config();
console.log(process.env.MONGO_URL);

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

export const redisClient = createClient({
  url: redisUrl
});

redisClient.connect()
  .then(() => {
    console.log("connected to redis");
  })
  .catch(console.error);

connectdb();
const app = express();

app.use(express.json());

const port = process.env.PORT ?? 5000;

app.listen(port, () => {
  console.log(`server is running at port http://localhost:${port}`)
});