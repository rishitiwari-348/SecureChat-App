import mongoose from "mongoose";
import Group from "../models/Group.js";

const roleRank = { member: 0, moderator: 1, admin: 2 };

const requireGroupRole = (minimumRole) => async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findOne({ _id: req.params.groupId, deletedAt: null });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const membership = group.members.find(({ userId }) => userId.equals(req.user._id));
    if (!membership || roleRank[membership.role] < roleRank[minimumRole]) {
      return res.status(403).json({ message: "You do not have permission to access this group" });
    }

    req.group = group;
    req.groupMembership = membership;
    next();
  } catch {
    res.status(500).json({ message: "Unable to authorize group access" });
  }
};

export const requireGroupMember = requireGroupRole("member");
export const requireGroupModerator = requireGroupRole("moderator");
export const requireGroupAdmin = requireGroupRole("admin");
