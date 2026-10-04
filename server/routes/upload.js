import { Router } from 'express'; import multer from 'multer'; import path from 'path'; import fs from 'fs'; import crypto from 'crypto';
import { protect, admin, wrap } from '../middleware/auth.js';
const r = Router();
const up = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_q, f, cb) => /^image\/(png|jpe?g|webp|gif)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only PNG, JPG, WEBP or GIF images allowed')) });
r.post('/', protect, admin, up.single('image'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    const url = await new Promise((ok, bad) => cloudinary.uploader.upload_stream({ folder: 'smartmart' }, (e, x) => e ? bad(e) : ok(x.secure_url)).end(req.file.buffer));
    return res.json({ url });
  }
  const dir = path.resolve('uploads'); fs.mkdirSync(dir, { recursive: true });
  const name = crypto.randomUUID() + path.extname(req.file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
  fs.writeFileSync(path.join(dir, name), req.file.buffer);
  res.json({ url: `${req.protocol}://${req.get('host')}/uploads/${name}` });
}));
export default r;
