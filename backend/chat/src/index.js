import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import cors from "cors";
import chatRoutes from "./routes/chat.js";
dotenv.config();
connectdb();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/v1", chatRoutes);
const port = process.env.PORT ?? 5002;
app.listen(port, () => {
    console.log(`server is running at http:localhost:${port}`);
});
//# sourceMappingURL=index.js.map