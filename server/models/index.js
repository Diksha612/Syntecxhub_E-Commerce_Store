import mongoose from 'mongoose';
const { Schema, model } = mongoose;
export const User = model('User', new Schema({
  name: String, email: { type: String, unique: true, lowercase: true }, password: String,
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  cart: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, qty: Number }],
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  addresses: [{ line1: String, city: String, state: String, zip: String }],
}, { timestamps: true }));
export const Category = model('Category', new Schema({ name: { type: String, unique: true } }));
export const Product = model('Product', new Schema({
  name: String, description: String, price: Number, image: String, category: String,
  stock: { type: Number, default: 0 }, sold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }, numReviews: { type: Number, default: 0 },
}, { timestamps: true }));
export const Order = model('Order', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, qty: Number }],
  address: Object, total: Number, discount: { type: Number, default: 0 },
  status: { type: String, enum: ['placed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
}, { timestamps: true }));
export const Coupon = model('Coupon', new Schema({ code: { type: String, unique: true }, percent: Number, active: { type: Boolean, default: true } }));
export const Review = model('Review', new Schema({ product: Schema.Types.ObjectId, user: Schema.Types.ObjectId, name: String, rating: Number, comment: String }, { timestamps: true }));
