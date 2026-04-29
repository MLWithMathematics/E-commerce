import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Use memoryStorage so Sharp can process buffer before writing to disk
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB raw input
});

// Express middleware: compresses + converts uploaded image to WebP, writes to disk
export async function processImage(req, _res, next) {
  if (!req.file) return next();
  try {
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
    const outPath  = path.join(UPLOADS_DIR, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);

    // Patch req.file so downstream code (upload route) finds the file normally
    req.file.filename = filename;
    req.file.path     = outPath;
    req.file.size     = fs.statSync(outPath).size;

    next();
  } catch (err) {
    next(err);
  }
}

// Convenience: single upload + process in one middleware stack
export const uploadAndProcess = [upload.single('image'), processImage];
