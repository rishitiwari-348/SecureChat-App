import express from "express";
import { createGroup, getGroupMessages, getMyGroups, sendGroupMessage } from "../controllers/group.controller.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireGroupMember } from "../middleware/group.auth.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:groupId/messages", requireGroupMember, getGroupMessages);
router.post("/:groupId/messages", requireGroupMember, sendGroupMessage);

export default router;
