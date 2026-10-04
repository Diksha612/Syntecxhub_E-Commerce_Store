import { Router } from 'express';
import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import { z } from 'zod';
import { User } from '../models/index.js'; import { protect, wrap } from '../middleware/auth.js';
const r = Router();
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
r.post('/register', wrap(async (req, res) => {
  const b = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) }).parse(req.body);
  if (await User.findOne({ email: b.email })) return res.status(400).json({ message: 'Email already used' });
  const u = await User.create({ ...b, password: await bcrypt.hash(b.password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));
r.post('/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: sign(u), user: pub(u) });
}));
r.get('/me', protect, (req, res) => res.json(pub(req.user)));
export default r;
