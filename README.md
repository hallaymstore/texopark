# HALLAYM TEXNOPARK MVP

Node.js + MongoDB asosida yaratilgan rasmiy landing page MVP.

## Texnologiyalar
- Node.js (Express)
- MongoDB (Mongoose)
- Session auth (`express-session` + `connect-mongo`)
- Cloudinary API (rasm yuklash)
- Bootstrap CDN + custom glassmorphism CSS

## Imkoniyatlar
- Landing page va kerakli sahifalar (`home`, `products`, `order`, `about`, `history`, `contact`)
- Register: ism, familiya, telefon, parol
- Login: telefon + parol
- Session cookie bilan keyingi tashriflarda avtomatik kirish
- Admin panel:
  - Mahsulot qo'shish (max 5 ta rasm, nom, tavsif, narx)
  - Mahsulot o'chirish
  - Buyurtmalarni ko'rish va statusni yangilash (qabul/rad)
- User panel:
  - Mahsulotdan buyurtma berish
  - O'z buyurtmalarini ko'rish

## Ishga tushirish
1. `.env.example` ni `.env` qilib to'ldiring.
2. Paketlarni o'rnating:
   ```bash
   npm install
   ```
3. Dev rejim:
   ```bash
   npm run dev
   ```
4. Production:
   ```bash
   npm start
   ```

## Muhim env o'zgaruvchilar
- `MONGODB_URI`
- `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_PHONE`
- `ADMIN_PASSWORD`

`ADMIN_PHONE` va `ADMIN_PASSWORD` berilsa, server startda admin user avtomatik yaratiladi (mavjud bo'lmasa).

