import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "test";
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_FROM_NAME = "Test";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
process.env.ARCJET_KEY = "test";
process.env.ARCJET_ENV = "development";
process.env.NODE_ENV = "test";

const { addReaction, deleteMessage, editMessage, pinMessage } = await import("../src/controllers/message.controller.js");
const { default: Message } = await import("../src/models/Message.js");

const senderId = "507f1f77bcf86cd799439011";
const receiverId = "507f191e810c19729de860ea";
const outsiderId = "507f1f77bcf86cd799439012";

const createMessage = () => ({
  _id: "507f1f77bcf86cd799439013",
  senderId,
  receiverId,
  text: "Original",
  image: undefined,
  attachment: null,
  metadata: {},
  reactions: [],
  edited: false,
  deleted: false,
  deletedFor: "none",
  hiddenFor: [],
  pinned: false,
  pinnedAt: null,
  async save() { return this; },
});

const invoke = async (controller, { userId = senderId, body = {} } = {}) => {
  let statusCode;
  let responseBody;
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { responseBody = value; return this; },
  };
  await controller({ params: { id: "507f1f77bcf86cd799439013" }, body, user: { _id: userId } }, response);
  return { statusCode, body: responseBody };
};

test("reactions toggle per emoji and reject outsiders and deleted messages", async () => {
  const message = createMessage();
  const originalFindById = Message.findById;
  Message.findById = async () => message;
  try {
    assert.equal((await invoke(addReaction, { body: { emoji: "👍" } })).statusCode, 200);
    assert.deepEqual(message.reactions, [{ emoji: "👍", userId: senderId }]);
    await invoke(addReaction, { userId: receiverId, body: { emoji: "👍" } });
    await invoke(addReaction, { body: { emoji: "❤️" } });
    assert.equal(message.reactions.length, 3);
    await invoke(addReaction, { body: { emoji: "👍" } });
    assert.deepEqual(message.reactions.map(({ emoji }) => emoji), ["👍", "❤️"]);
    assert.equal((await invoke(addReaction, { userId: outsiderId, body: { emoji: "👍" } })).statusCode, 403);
    message.deleted = true;
    message.deletedFor = "everyone";
    assert.equal((await invoke(addReaction, { body: { emoji: "👍" } })).statusCode, 409);
  } finally {
    Message.findById = originalFindById;
  }
});

test("editing validates ownership, content, and deleted state", async () => {
  const message = createMessage();
  const originalFindById = Message.findById;
  Message.findById = async () => message;
  try {
    assert.equal((await invoke(editMessage, { userId: receiverId, body: { text: "No" } })).statusCode, 403);
    assert.equal((await invoke(editMessage, { body: { text: "   " } })).statusCode, 400);
    assert.equal((await invoke(editMessage, { body: { text: "Updated" } })).statusCode, 200);
    assert.equal(message.text, "Updated");
    assert.equal(message.edited, true);
    message.deleted = true;
    message.deletedFor = "everyone";
    assert.equal((await invoke(editMessage, { body: { text: "Again" } })).statusCode, 409);
  } finally {
    Message.findById = originalFindById;
  }
});

test("delete-for-me is per user and delete-for-everyone clears sensitive state", async () => {
  const message = createMessage();
  message.image = "https://example.test/private.png";
  message.attachment = { url: "https://example.test/private.pdf" };
  message.metadata = { audioUrl: "https://example.test/private.webm" };
  message.reactions = [{ emoji: "👍", userId: receiverId }];
  message.pinned = true;
  const originalFindById = Message.findById;
  Message.findById = async () => message;
  try {
    const receiverDelete = await invoke(deleteMessage, { userId: receiverId, body: { scope: "me" } });
    assert.equal(receiverDelete.statusCode, 200);
    assert.deepEqual(message.hiddenFor, [receiverId]);
    assert.equal(message.text, "Original");
    assert.equal((await invoke(deleteMessage, { userId: receiverId, body: { scope: "everyone" } })).statusCode, 403);
    assert.equal((await invoke(deleteMessage, { body: { scope: "everyone" } })).statusCode, 200);
    assert.equal(message.deletedFor, "everyone");
    assert.equal(message.text, "");
    assert.equal(message.image, undefined);
    assert.equal(message.attachment, null);
    assert.deepEqual(message.metadata, {});
    assert.deepEqual(message.reactions, []);
    assert.equal(message.pinned, false);
  } finally {
    Message.findById = originalFindById;
  }
});

test("pin toggles for participants and rejects outsiders and deleted messages", async () => {
  const message = createMessage();
  const originalFindById = Message.findById;
  Message.findById = async () => message;
  try {
    assert.equal((await invoke(pinMessage, { userId: receiverId })).statusCode, 200);
    assert.equal(message.pinned, true);
    assert.equal((await invoke(pinMessage)).statusCode, 200);
    assert.equal(message.pinned, false);
    assert.equal((await invoke(pinMessage, { userId: outsiderId })).statusCode, 403);
    message.deleted = true;
    message.deletedFor = "everyone";
    assert.equal((await invoke(pinMessage)).statusCode, 409);
  } finally {
    Message.findById = originalFindById;
  }
});
