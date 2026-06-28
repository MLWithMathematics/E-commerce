import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Cloudinary config (for avatar uploads) ───────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Local disk (for product images — unchanged) ───────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
};

// ── Product image upload (disk) — unchanged ───────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

export async function processImage(req, _res, next) {
  if (!req.file) return next();
  try {
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
    const outPath  = path.join(UPLOADS_DIR, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);

    req.file.filename = filename;
    req.file.path     = outPath;
    req.file.size     = fs.statSync(outPath).size;

    next();
  } catch (err) {
    next(err);
  }
}

export const uploadAndProcess = [upload.single('image'), processImage];

// ── Avatar upload (Cloudinary) ────────────────────────────────
export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Wraps Cloudinary's callback-based upload_stream in a Promise
function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id:      publicId,
        folder:         'wipsom/avatars',
        overwrite:      true,
        resource_type:  'image',
        format:         'webp',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Middleware: Sharp resize → Cloudinary → attaches req.cloudinaryUrl
export async function processAndUploadAvatar(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'No image file provided.' });
  try {
    // Sharp: crop square, convert to WebP
    const processedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    const publicId = 'user_' + req.user.id;
    const result   = await uploadBufferToCloudinary(processedBuffer, publicId);

    req.cloudinaryUrl = result.secure_url;
    next();
  } catch (err) {
    console.error('Avatar upload error:', err);
    next(err);
  }
}
