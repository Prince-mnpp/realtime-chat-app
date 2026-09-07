import express from "express";
import dotenv from "dotenv";
import { startSendOtpCustomer } from "./consumer.js";

dotenv.config();

startSendOtpCustomer();

const app = express();

const PORT = process.env.PORT ?? 5001;

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
})