import "dotenv/config";
import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    host: "rapid-basilisk-74412.upstash.io",
    port: 6379,
    tls: true,
    connectTimeout: 10000,
  },
  username: "default",
  password: process.env.REDIS_PASSWORD!,
});

redisClient.on("error", (err) => {
  console.error("REDIS ERROR:", err);
});

redisClient.on("connect", () => {
  console.log("CONNECTING");
});

redisClient.on("ready", () => {
  console.log("READY");
});

try {
  await redisClient.connect();

  console.log("✅ CONNECTED");

  console.log("PING:", await redisClient.ping());

  await redisClient.set("test", "hello");

  console.log("GET:", await redisClient.get("test"));

  await redisClient.quit();
} catch (error) {
  console.error("FAILED:", error);
}