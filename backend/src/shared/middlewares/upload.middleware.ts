import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist relative to the backend root directory
const uploadDirMemes = path.resolve(__dirname, '..', '..', '..', 'uploads', 'memes');
const uploadDirPosters = path.resolve(__dirname, '..', '..', '..', 'uploads', 'posters');

if (!fs.existsSync(uploadDirMemes)) fs.mkdirSync(uploadDirMemes, { recursive: true });
if (!fs.existsSync(uploadDirPosters)) fs.mkdirSync(uploadDirPosters, { recursive: true });

// Multer storage for Memes
const storageMemes = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirMemes),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

export const uploadMeme = multer({
  storage: storageMemes,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg allowed!'));
    }
  }
});

// Multer storage for Posters
const storagePosters = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirPosters),
  filename: (req, file, cb) => {
    cb(null, 'poster-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase());
  }
});

export const uploadPoster = multer({
  storage: storagePosters,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg, and .svg allowed!'));
    }
  }
});
