import express from "express";
import { loginUser, myProfile, updateName, verifyUser } from "../controllers/User.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);

router.post("/verify", verifyUser);

router.get("/me", isAuth, myProfile);

router.post("/update/user", isAuth, updateName);

export default router;