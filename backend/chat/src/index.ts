import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import cors from "cors";
import chatRoutes from "./routes/chat.js";
import { app, server } from "./config/socket.js";

dotenv.config();

connectdb();

app.use(express.json());

app.use(cors());

app.use("/api/v1", chatRoutes);

const port = process.env.PORT ?? 5002;

server.listen(port, () => {
  console.log(`server is running at http:localhost:${port}`);
})