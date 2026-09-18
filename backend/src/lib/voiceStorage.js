import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const VOICE_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/voice");

const AUDIO_EXTENSIONS = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
};

export const saveVoiceBuffer = async (buffer, mimeType) => {
  const extension = AUDIO_EXTENSIONS[mimeType];
  if (!extension) throw new Error("Unsupported local audio format");
  await mkdir(VOICE_UPLOAD_DIR, { recursive: true });
  const fileName = `${randomUUID()}.${extension}`;
  await writeFile(path.join(VOICE_UPLOAD_DIR, fileName), buffer, { flag: "wx" });
  return fileName;
};
