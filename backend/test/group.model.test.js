import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Group from "../src/models/Group.js";
import Message from "../src/models/Message.js";

const creatorId = new mongoose.Types.ObjectId();
const memberOneId = new mongoose.Types.ObjectId();
const memberTwoId = new mongoose.Types.ObjectId();

const validMembers = [
  { userId: creatorId, role: "admin", addedBy: creatorId },
  { userId: memberOneId, role: "member", addedBy: creatorId },
  { userId: memberTwoId, role: "moderator", addedBy: creatorId },
];

test("group requires a name, valid roles, and unique member IDs", async () => {
  const validGroup = new Group({ name: "Project team", createdBy: creatorId, members: validMembers });
  assert.equal(validGroup.validateSync(), undefined);

  const duplicateGroup = new Group({ name: "Duplicates", createdBy: creatorId, members: [...validMembers, validMembers[1]] });
  assert.match(duplicateGroup.validateSync().errors.members.message, /unique/i);

  const invalidRoleGroup = new Group({ name: "Roles", createdBy: creatorId, members: [{ userId: creatorId, role: "owner", addedBy: creatorId }] });
  assert.match(invalidRoleGroup.validateSync().errors["members.0.role"].message, /not a valid enum/i);
});

test("group membership lookup index is present", () => {
  const indexes = Group.schema.indexes();
  assert.equal(indexes.some(([definition]) => definition["members.userId"] === 1 && definition.updatedAt === -1), true);
});

test("messages target exactly one direct recipient or one group", async () => {
  const direct = new Message({ senderId: creatorId, receiverId: memberOneId, text: "direct" });
  const group = new Message({ senderId: creatorId, groupId: new mongoose.Types.ObjectId(), text: "group" });
  const neither = new Message({ senderId: creatorId, text: "invalid" });
  const both = new Message({ senderId: creatorId, receiverId: memberOneId, groupId: new mongoose.Types.ObjectId(), text: "invalid" });

  await direct.validate();
  await group.validate();
  await assert.rejects(neither.validate(), /exactly one user or group/);
  await assert.rejects(both.validate(), /exactly one user or group/);
});

test("group message history index is present", () => {
  const indexes = Message.schema.indexes();
  assert.equal(indexes.some(([definition]) => definition.groupId === 1 && definition.createdAt === -1), true);
});
