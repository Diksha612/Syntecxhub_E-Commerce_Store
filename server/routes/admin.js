import { Router } from 'express';
import { Product, Order, User, Category, Coupon } from '../models/index.js'; import { protect, admin, wrap } from '../middleware/auth.js';
const r = Router(); r.use(protect, admin);
r.get('/stats', wrap(async (_q, res) => {
  const [rev] = await Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]);
  const daily = await Order.aggregate([{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } }, { $sort: { _id: 1 } }, { $limit: 14 }]);
  res.json({ revenue: rev?.revenue || 0, orders: rev?.orders || 0, users: await User.countDocuments(), products: await Product.countDocuments(),
    lowStock: await Product.find({ stock: { $lte: 5 } }).select('name stock'), top: await Product.find().sort('-sold').limit(5).select('name sold'), daily });
}));
r.get('/users', wrap(async (_q, res) => res.json(await User.find().select('-password -cart'))));
r.post('/products', wrap(async (req, res) => res.status(201).json(await Product.create(req.body))));
r.put('/products/:id', wrap(async (req, res) => res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }))));
r.delete('/products/:id', wrap(async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
r.get('/orders', wrap(async (_q, res) => res.json(await Order.find().populate('user', 'name email').sort('-createdAt'))));
r.put('/orders/:id', wrap(async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }))));
r.get('/categories', wrap(async (_q, res) => res.json(await Category.find())));
r.post('/categories', wrap(async (req, res) => res.status(201).json(await Category.create(req.body))));
r.post('/coupons', wrap(async (req, res) => res.status(201).json(await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() }))));
export default r;
