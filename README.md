# HALLAYM TEXNOPARK

Node.js + MongoDB (Atlas) asosidagi rasmiy web platforma.

## Texnologiyalar
- Node.js (Express)
- MongoDB (Mongoose)
- Session auth (`express-session` + `connect-mongo`)
- Cloudinary API (rasm yuklash)
- Bootstrap CDN + custom glassmorphism CSS

## Asosiy imkoniyatlar
- Public sahifalar: `home`, `products`, `order`, `preorder`, `news`, `blog`, `gallery`, `about`, `history`, `contact`
- Auth: register/login + session orqali avtomatik kirish
- Admin panel:
  - Products CRUD (rasm max 5)
  - Orders ko'rish va status boshqarish
  - News CRUD
  - Blog CRUD
  - Gallery CRUD (rasm max 8)
  - Preorder to'lov screenshot arizalarini tasdiqlash/rad etish
- User panel:
  - Ariza yuborish va holatini kuzatish
  - Oldindan to'lov arizasi yuborish va holatini ko'rish

## Lokal ishga tushirish
1. `.env.example` ni `.env` qilib to'ldiring.
2. `npm install`
3. `npm start` (yoki `npm run dev`)

## Render deploy (muhim)
Render serverda `.env` fayl bo'lmaydi. `Environment` bo'limida quyidagi variable'larni qo'ying:
- `MONGODB_URI` (yoki `MONGO_URL` / `MONGO_URI` / `DATABASE_URL`)
- `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_PHONE`
- `ADMIN_PASSWORD`
- `ADMIN_FIRST_NAME`
- `ADMIN_LAST_NAME`
- `ADMIN_CARD_HOLDER`
- `ADMIN_CARD_NUMBER`
- `ADMIN_BANK_NAME`

## Atlas ulanish xatosi bo'lsa
Agar `Could not connect to any servers` yoki `timed out` chiqsa:
1. Atlas `Network Access` ga `0.0.0.0/0` qo'shing
2. Atlas DB user login/parolini tekshiring
3. URI ichida database nomi (`...mongodb.net/texnopark?...`) borligini tekshiring

## Muhim env
- `MONGODB_URI` (asosiy)
- `MONGO_TIMEOUT_MS` (ixtiyoriy, default `15000`)
- `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_PHONE`
- `ADMIN_PASSWORD`

`ADMIN_PHONE` va `ADMIN_PASSWORD` berilgan bo'lsa, server startda admin user avtomatik yaratiladi (mavjud bo'lmasa).
