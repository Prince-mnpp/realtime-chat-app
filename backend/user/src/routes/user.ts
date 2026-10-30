import express from "express";
import { getAllUsers, getAUser, loginUser, logoutUser, myProfile, refreshAccessToken, registerUser, updateName, verifyUser } from "../controllers/User.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/refresh", refreshAccessToken);

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.post("/verify", verifyUser);

router.get("/me", isAuth, myProfile);

router.post("/update/user", isAuth, updateName);

router.get("/user/all", isAuth, getAllUsers);

router.get("/user/:id", getAUser);

export default router;