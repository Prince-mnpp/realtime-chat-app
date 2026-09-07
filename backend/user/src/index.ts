import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import { createClient } from "redis";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import UserRouter from "./routes/user.js";
import cors from "cors";


dotenv.config();

connectdb();

connectRabbitMQ();

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

const app = express();

app.use(express.json());

app.use(cors());

app.use("/api/v1", UserRouter);

const port = process.env.PORT ?? 5000;

app.listen(port, () => {
  console.log(`server is running at port http://localhost:${port}`)
});