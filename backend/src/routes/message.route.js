import express from "express";
import mongoose from "mongoose";
import {
  addReaction,
  deleteMessage,
  editMessage,
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  markMessagesSeen,
  pinMessage,
  sendVoiceMessage,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.param("id", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  next();
});

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.post(
  "/send-voice/:id",
  express.raw({ type: ["audio/webm", "audio/ogg", "audio/mp4", "audio/m4a", "audio/x-m4a"], limit: "10mb" }),
  sendVoiceMessage
);
router.patch("/:id/seen", markMessagesSeen);
router.post("/reaction/:id", addReaction);
router.put("/edit/:id", editMessage);
router.delete("/delete/:id", deleteMessage);
router.post("/pin/:id", pinMessage);

export default router;
