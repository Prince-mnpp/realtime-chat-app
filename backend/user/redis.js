import "dotenv/config";
import { createClient } from "redis";
const client = createClient({
    url: process.env.REDIS_URL,
});
client.on("error", (err) => {
    console.log("REDIS ERROR:", err);
});
client.on("connect", () => {
    console.log("CONNECTING");
});
client.on("ready", () => {
    console.log("READY");
});
client.on("reconnecting", () => {
    console.log("RECONNECTING");
});
try {
    await client.connect();
    console.log("CONNECTED");
    console.log(await client.ping());
    await client.set("test", "hello");
    console.log(await client.get("test"));
    await client.quit();
}
catch (error) {
    console.log("FAILED:", error);
}
//# sourceMappingURL=redis.js.map