import 'dotenv/config'; import mongoose from 'mongoose'; import bcrypt from 'bcryptjs'; import { User, Product, Coupon } from './models/index.js';
await mongoose.connect(process.env.MONGO_URI);
await User.deleteMany({}); await Product.deleteMany({}); await Coupon.deleteMany({});
await User.create({ name: 'Admin', email: 'admin@smartmart.com', password: await bcrypt.hash('Admin@123', 10), role: 'admin' });
await Coupon.create({ code: 'WELCOME10', percent: 10 });
const cats = ['Electronics', 'Fashion', 'Home'];
await Product.insertMany(Array.from({ length: 12 }, (_, i) => ({ name: `Product ${i + 1}`, description: 'Quality item from SmartMart.', price: 499 + i * 150, category: cats[i % 3], stock: 20, image: `https://picsum.photos/seed/sm${i}/500/400` })));
console.log('Seeded. Admin: admin@smartmart.com / Admin@123'); process.exit();
