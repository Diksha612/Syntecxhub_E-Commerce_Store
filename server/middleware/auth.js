import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
export const protect = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    req.user = await User.findById(id);
    if (!req.user) throw new Error();
    next();
  } catch { res.status(401).json({ message: 'Not authorized' }); }
};
export const admin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin only' });
export const customerOnly = (req, res, next) => req.user.role === 'admin' ? res.status(403).json({ message: 'Admins cannot place orders' }) : next();
export const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
