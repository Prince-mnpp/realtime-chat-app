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

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

export const redisClient = createClient({
  url: redisUrl,
  pingInterval: 30000,
  socket: {
    tls: true,
    connectTimeout: 20000, // Give Upstash TLS 20 seconds to establish
    reconnectStrategy: (retries) => Math.min(retries * 500, 3000)
  }
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

redisClient.connect()
  .then(() => {
    console.log("connected to redis");
  })
  .catch(console.error);

const app = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.json("hello");
})

app.use("/api/v1", UserRouter);

const port = process.env.PORT ?? 5000;

app.listen(port, () => {
  console.log(`server is running at port http://localhost:${port}`)
});