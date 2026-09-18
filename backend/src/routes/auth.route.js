import express from "express";
import { signup, login, logout, updateProfile, verifyEmail, resendVerification } from "../controllers/auth.controller.js";
import { startOAuthFlow, handleOAuthCallback } from "../controllers/oauth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { verificationResendRateLimit } from "../middleware/verificationRateLimit.middleware.js";

const router = express.Router();

router.get("/oauth/:provider", (req, res) => startOAuthFlow(req.params.provider)(req, res));
router.get("/oauth/:provider/callback", (req, res) => handleOAuthCallback(req.params.provider)(req, res));

router.use(arcjetProtection);

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", verificationResendRateLimit, resendVerification);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
