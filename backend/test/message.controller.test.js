import test from 'node:test';
import assert from 'node:assert/strict';
import Message from '../src/models/Message.js';

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_FROM_NAME = 'Test';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.ARCJET_KEY = 'test';
process.env.ARCJET_ENV = 'development';
process.env.NODE_ENV = 'test';

const { hasValidAudioSignature, isSupportedAudioMimeType, isValidImageDataUri, markMessagesSeen, sendVoiceMessage } = await import('../src/controllers/message.controller.js');
const { default: User } = await import('../src/models/User.js');
const { default: cloudinary } = await import('../src/lib/cloudinary.js');

const toDataUri = (mimeType, buffer) => `data:${mimeType};base64,${buffer.toString('base64')}`;

const createPngBuffer = () => {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const footer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  return Buffer.concat([header, Buffer.from([0x00, 0x00]), footer]);
};

const createJpegBuffer = () => Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

const createWebpBuffer = () => Buffer.from([0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

const createOversizedPngBuffer = () => {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const footer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  return Buffer.concat([header, Buffer.alloc(3 * 1024 * 1024 + 1), footer]);
};

test('accepts valid PNG, JPEG, and WebP uploads', () => {
  assert.equal(isValidImageDataUri(toDataUri('image/png', createPngBuffer())), true);
  assert.equal(isValidImageDataUri(toDataUri('image/jpeg', createJpegBuffer())), true);
  assert.equal(isValidImageDataUri(toDataUri('image/webp', createWebpBuffer())), true);
});

test('rejects oversized, malformed, and unsupported uploads', () => {
  assert.equal(isValidImageDataUri(toDataUri('image/png', createOversizedPngBuffer())), false);
  assert.equal(isValidImageDataUri('data:image/png;base64,Zm9v!'), false);
  assert.equal(isValidImageDataUri('data:image/png;base64,'), false);
  assert.equal(isValidImageDataUri('data:image/gif;base64,AA=='), false);
  assert.equal(isValidImageDataUri(toDataUri('image/png', Buffer.from('not-a-real-png'))), false);
});

test('adds a compound index for message history lookups', () => {
  const indexes = Message.schema.indexes();
  const hasMessageHistoryIndex = indexes.some(([definition]) => {
    return definition.senderId === 1 && definition.receiverId === 1 && definition.createdAt === -1;
  });

  assert.equal(hasMessageHistoryIndex, true);
});

test('message status supports only sent and seen', () => {
  assert.deepEqual(Message.schema.path('messageStatus').enumValues, ['sent', 'seen']);
  assert.equal(Message.schema.path('messageStatus').defaultValue, 'sent');
});

test('accepts browser voice MIME types and rejects unsupported formats', () => {
  assert.equal(isSupportedAudioMimeType('audio/webm;codecs=opus'), true);
  assert.equal(isSupportedAudioMimeType('audio/ogg'), true);
  assert.equal(isSupportedAudioMimeType('audio/mp4'), true);
  assert.equal(isSupportedAudioMimeType('audio/m4a'), true);
  assert.equal(isSupportedAudioMimeType('audio/mpeg'), false);
  assert.equal(hasValidAudioSignature(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), 'audio/webm'), true);
  assert.equal(hasValidAudioSignature(Buffer.from('OggS'), 'audio/ogg'), true);
  assert.equal(hasValidAudioSignature(Buffer.from('not-audio'), 'audio/webm'), false);
});

test('marks multiple incoming messages seen in one persistent update', async () => {
  const originalFind = Message.find;
  const originalUpdateMany = Message.updateMany;
  Message.find = () => Promise.resolve([{ _id: '507f1f77bcf86cd799439011' }, { _id: '507f1f77bcf86cd799439012' }]);
  Message.updateMany = async () => ({ modifiedCount: 2 });
  let body;
  try {
    await markMessagesSeen(
      { user: { _id: '507f191e810c19729de860ea' }, params: { id: '507f1f77bcf86cd799439010' } },
      { status(code) { assert.equal(code, 200); return this; }, json(value) { body = value; } }
    );
    assert.deepEqual(body.messageIds, ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
  } finally {
    Message.find = originalFind;
    Message.updateMany = originalUpdateMany;
  }
});

test('voice endpoint rejects empty recordings and persists supported binary audio', async () => {
  const originalExists = User.exists;
  const originalCreate = Message.create;
  const originalUploadStream = cloudinary.uploader.upload_stream;
  User.exists = async () => true;
  Message.create = async (value) => ({ _id: '507f1f77bcf86cd799439013', ...value });
  cloudinary.uploader.upload_stream = (_options, callback) => ({ end() { callback(null, { secure_url: 'https://example.test/voice.webm' }); } });
  const senderId = { equals: () => false, toString: () => '507f1f77bcf86cd799439011' };
  const invoke = async (body) => {
    let statusCode;
    let responseBody;
    await sendVoiceMessage(
      { user: { _id: senderId }, params: { id: '507f1f77bcf86cd799439010' }, headers: { 'content-type': 'audio/webm', 'x-audio-duration': '3' }, body },
      { status(code) { statusCode = code; return this; }, json(value) { responseBody = value; } }
    );
    return { statusCode, body: responseBody };
  };
  try {
    assert.equal((await invoke(Buffer.alloc(0))).statusCode, 400);
    const response = await invoke(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01]));
    assert.equal(response.statusCode, 201);
    assert.equal(response.body.messageType, 'audio');
    assert.equal(response.body.metadata.duration, 3);
    assert.equal(response.body.metadata.audioUrl, 'https://example.test/voice.webm');
  } finally {
    User.exists = originalExists;
    Message.create = originalCreate;
    cloudinary.uploader.upload_stream = originalUploadStream;
  }
});
