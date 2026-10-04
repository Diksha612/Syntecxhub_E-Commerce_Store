# SmartMart AI
MERN e-commerce: JWT auth + RBAC, products (search/filter/sort), cart, coupons, checkout, orders, reviews, admin dashboard (stats, stock, orders), dark mode.
## Run locally
```
cd server && npm i && npm run seed && npm run dev
cd client && npm i && npm run dev
```
Admin: admin@smartmart.com / Admin@123 · Coupon: WELCOME10
## Image uploads
Admin > Products > choose file. Set CLOUDINARY_* in server/.env to store on Cloudinary; if unset, files save to server/uploads (mounted as a Docker volume; use Cloudinary on Render, whose disk is ephemeral).
## Docker
`docker compose up --build` then `docker compose exec server npm run seed`
## Deploy
API → Render (root `server`, start `npm start`, env: MONGO_URI (Atlas), JWT_SECRET, CLIENT_URL). Client → Vercel (root `client`, env VITE_API_URL=https://<api>/api).
