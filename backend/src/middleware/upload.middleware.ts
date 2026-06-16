import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from './error.middleware';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const RECORDINGS_DIR = path.join(UPLOAD_DIR, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed.`, 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export const uploadSingle = (field: string) => upload.single(field);
export const uploadMultiple = (field: string, max = 5) => upload.array(field, max);

/* ─── Recording-specific upload pipeline ──────────────────────────────────
   MediaRecorder produces webm by default; we accept mp4 too for teachers who
   convert before upload. 500 MB cap fits ~2 h of 720p webm at reasonable
   bitrate — bigger than that and we should be streaming to object storage
   anyway, not POSTing the whole blob.
*/

const recordingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype === 'video/webm' ? '.webm' : '');
    const name = `rec-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const recordingFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['video/webm', 'video/mp4', 'audio/webm'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Recording type ${file.mimetype} is not supported. Use webm or mp4.`, 400));
  }
};

export const uploadRecording = multer({
  storage: recordingStorage,
  fileFilter: recordingFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
}).single('recording');
