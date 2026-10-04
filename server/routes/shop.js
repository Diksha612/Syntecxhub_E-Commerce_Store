import { Router } from 'express';
import { Product, Order, Coupon, Review } from '../models/index.js'; import { protect, customerOnly, wrap } from '../middleware/auth.js';
const r = Router();
r.get('/products', wrap(async (req, res) => {
  const { q, category, min, max, sort } = req.query; const f = {};
  if (q) f.name = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (category) f.category = category;
  if (min || max) f.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  const s = { price_asc: { price: 1 }, price_desc: { price: -1 }, best: { sold: -1 } }[sort] || { createdAt: -1 };
  res.json(await Product.find(f).sort(s).limit(60));
}));
r.get('/products/:id', wrap(async (req, res) => {
  const p = await Product.findById(req.params.id); if (!p) return res.status(404).json({ message: 'Not found' });
  const related = await Product.find({ category: p.category, _id: { $ne: p._id } }).limit(4);
  res.json({ product: p, related, reviews: await Review.find({ product: p._id }).sort('-createdAt') });
}));
r.post('/products/:id/reviews', protect, wrap(async (req, res) => {
  await Review.create({ product: req.params.id, user: req.user._id, name: req.user.name, rating: +req.body.rating, comment: req.body.comment });
  const all = await Review.find({ product: req.params.id });
  await Product.findByIdAndUpdate(req.params.id, { rating: all.reduce((a, x) => a + x.rating, 0) / all.length, numReviews: all.length });
  res.status(201).json({ ok: true });
}));
r.get('/cart', protect, wrap(async (req, res) => res.json((await req.user.populate('cart.product')).cart.filter(i => i.product))));
r.put('/cart', protect, customerOnly, wrap(async (req, res) => {
  const { product, qty } = req.body; const c = req.user.cart; const i = c.findIndex(x => String(x.product) === product);
  if (qty <= 0) { if (i >= 0) c.splice(i, 1); } else if (i >= 0) c[i].qty = qty; else c.push({ product, qty });
  await req.user.save(); res.json((await req.user.populate('cart.product')).cart);
}));
r.get('/coupons/:code', wrap(async (req, res) => {
  const c = await Coupon.findOne({ code: req.params.code.toUpperCase(), active: true });
  c ? res.json({ percent: c.percent }) : res.status(404).json({ message: 'Invalid coupon' });
}));
r.post('/orders', protect, customerOnly, wrap(async (req, res) => {
  await req.user.populate('cart.product');
  const lines = req.user.cart.filter(i => i.product); if (!lines.length) return res.status(400).json({ message: 'Cart empty' });
  for (const l of lines) if (l.product.stock < l.qty) return res.status(400).json({ message: `${l.product.name} out of stock` });
  let total = lines.reduce((a, l) => a + l.product.price * l.qty, 0), discount = 0;
  const c = req.body.coupon && await Coupon.findOne({ code: req.body.coupon.toUpperCase(), active: true });
  if (c) { discount = +(total * c.percent / 100).toFixed(2); total -= discount; }
  const order = await Order.create({ user: req.user._id, address: req.body.address, total, discount,
    items: lines.map(l => ({ product: l.product._id, name: l.product.name, price: l.product.price, qty: l.qty })) });
  for (const l of lines) await Product.findByIdAndUpdate(l.product._id, { $inc: { stock: -l.qty, sold: l.qty } });
  req.user.cart = []; await req.user.save(); res.status(201).json(order);
}));
r.get('/orders', protect, wrap(async (req, res) => res.json(await Order.find({ user: req.user._id }).sort('-createdAt'))));
export default r;
