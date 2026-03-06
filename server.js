require("dotenv").config({ quiet: true });

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const multer = require("multer");

const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const News = require("./models/News");
const BlogPost = require("./models/BlogPost");
const GalleryWork = require("./models/GalleryWork");
const Preorder = require("./models/Preorder");
const { requireAuth, requireAdmin } = require("./middleware/auth");

// Temporary runtime defaults: .env bo'lmasa ham server ishga tushishi uchun.
const RUNTIME_DEFAULTS = {
  PORT: "5000",
  MONGODB_URI:
    "mongodb+srv://abumafia0:abumafia0@abumafia.h1trttg.mongodb.net/texnopark?appName=abumafia",
  SESSION_SECRET: "change_this_secret",
  CLOUDINARY_CLOUD_NAME: "dh3heagct",
  CLOUDINARY_API_KEY: "564992594627199",
  CLOUDINARY_API_SECRET: "GzOEMTuo7k2bwYQjLqcFXyHOu2A",
  ADMIN_PHONE: "998901234567",
  ADMIN_PASSWORD: "admin123",
  ADMIN_FIRST_NAME: "HALLAYM",
  ADMIN_LAST_NAME: "Admin",
  ADMIN_CARD_HOLDER: "Abdurahmon Qoryogdiyev",
  ADMIN_CARD_NUMBER: "5614 6887 0520 2686",
  ADMIN_BANK_NAME: "Aloqabank",
  MONGO_TIMEOUT_MS: "15000",
};

for (const [key, fallbackValue] of Object.entries(RUNTIME_DEFAULTS)) {
  const current = String(process.env[key] || "").trim();
  if (!current) {
    process.env[key] = fallbackValue;
  }
}

const { uploadBuffer } = require("./config/cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_IMAGE_COUNT = 5;
const MAX_GALLERY_IMAGE_COUNT = 8;
const MONGO_TIMEOUT_MS = Number(process.env.MONGO_TIMEOUT_MS || 15000);

function sanitizeEnvValue(value = "") {
  return String(value).trim().replace(/^['"]|['"]$/g, "");
}

function resolveMongoUri() {
  const keys = ["MONGODB_URI", "MONGO_URL", "MONGO_URI", "DATABASE_URL"];
  for (const key of keys) {
    const value = sanitizeEnvValue(process.env[key] || "");
    if (value) return { uri: value, key };
  }
  return { uri: "", key: "" };
}

const { uri: MONGODB_URI, key: MONGODB_KEY } = resolveMongoUri();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: MAX_GALLERY_IMAGE_COUNT,
  },
});

function normalizePhone(phone = "") {
  const trimmed = phone.trim().replace(/[^\d+]/g, "");
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }
  return trimmed.replace(/\D/g, "");
}

function safeUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  };
}

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadFilesToCloudinary(files, folder) {
  const urls = [];
  for (const file of files) {
    const uploadedUrl = await uploadBuffer(file.buffer, folder);
    urls.push(uploadedUrl);
  }
  return urls;
}

async function ensureAdminUser() {
  const adminPhoneRaw = process.env.ADMIN_PHONE;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPhoneRaw || !adminPassword) return;

  const adminPhone = normalizePhone(adminPhoneRaw);
  const existingAdmin = await User.findOne({ phone: adminPhone });
  if (existingAdmin) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    firstName: process.env.ADMIN_FIRST_NAME || "Site",
    lastName: process.env.ADMIN_LAST_NAME || "Admin",
    phone: adminPhone,
    passwordHash,
    role: "admin",
  });
  console.log(`Admin user created: ${adminPhone}`);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sessionStore = null;
if (MONGODB_URI) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 30,
      mongoOptions: {
        serverSelectionTimeoutMS: MONGO_TIMEOUT_MS,
        connectTimeoutMS: MONGO_TIMEOUT_MS,
      },
    });

    sessionStore.on("error", (error) => {
      console.error("Session store error:", error.message);
    });

    if (sessionStore.collectionP && typeof sessionStore.collectionP.catch === "function") {
      sessionStore.collectionP.catch((error) => {
        console.error("Session store init failed:", error.message);
      });
    }
  } catch (error) {
    console.error("Session store setup failed, memory session ishlatiladi:", error.message);
  }
}

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "texnopark-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

if (sessionStore) {
  sessionOptions.store = sessionStore;
}

if (MONGODB_URI) {
  app.use(session(sessionOptions));
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "texnopark-api" });
});

app.get("/api/payment-config", (_req, res) => {
  res.json({
    cardHolder: process.env.ADMIN_CARD_HOLDER || "HALLAYM TEXNOPARK",
    cardNumber: process.env.ADMIN_CARD_NUMBER || "8600 0000 0000 0000",
    bankName: process.env.ADMIN_BANK_NAME || "Tijorat banki",
  });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, phone, password } = req.body;
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lsin" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 7) {
      return res.status(400).json({ message: "Telefon raqam noto'g'ri" });
    }

    const exists = await User.findOne({ phone: normalizedPhone });
    if (exists) {
      return res.status(409).json({ message: "Bu telefon allaqachon ro'yxatdan o'tgan" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: normalizedPhone,
      passwordHash,
      role: "user",
    });

    req.session.userId = String(user._id);
    req.session.role = user.role;

    res.status(201).json({
      message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("register error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Telefon va parolni kiriting" });
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return res.status(401).json({ message: "Login yoki parol noto'g'ri" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Login yoki parol noto'g'ri" });
    }

    req.session.userId = String(user._id);
    req.session.role = user.role;

    res.json({ message: "Tizimga kirildi", user: safeUser(user) });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ authenticated: false });
    }

    res.json({ authenticated: true, user: safeUser(user) });
  } catch (error) {
    console.error("auth me error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Chiqishda xatolik" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Akkountdan chiqildi" });
  });
});

app.get("/api/products", async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    console.error("list products error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.post("/api/products", requireAdmin, upload.array("images", MAX_IMAGE_COUNT), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    if (!name || !description || !price) {
      return res.status(400).json({ message: "Nom, tavsif va narx majburiy" });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: "Narx noto'g'ri" });
    }

    if (!cloudinaryConfigured()) {
      return res.status(500).json({ message: "Cloudinary sozlamalari topilmadi" });
    }

    const files = req.files || [];
    const imageUrls = [];
    for (const file of files) {
      const url = await uploadBuffer(file.buffer);
      imageUrls.push(url);
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: numericPrice,
      images: imageUrls,
    });

    res.status(201).json({ message: "Loyiha joylandi", product });
  } catch (error) {
    console.error("create product error:", error);
    res.status(500).json({ message: "Loyiha yaratishda xatolik" });
  }
});

app.patch("/api/products/:id", requireAdmin, upload.array("images", MAX_IMAGE_COUNT), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Loyiha topilmadi" });
    }

    const { name, description, price } = req.body;
    if (name) product.name = String(name).trim();
    if (description) product.description = String(description).trim();
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Narx noto'g'ri" });
      }
      product.price = numericPrice;
    }

    if ((req.files || []).length > 0) {
      if (!cloudinaryConfigured()) {
        return res.status(500).json({ message: "Cloudinary sozlamalari topilmadi" });
      }
      const imageUrls = [];
      for (const file of req.files) {
        const url = await uploadBuffer(file.buffer);
        imageUrls.push(url);
      }
      product.images = imageUrls;
    }

    await product.save();
    res.json({ message: "Loyiha yangilandi", product });
  } catch (error) {
    console.error("update product error:", error);
    res.status(500).json({ message: "Loyiha yangilashda xatolik" });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Loyiha topilmadi" });
    }
    res.json({ message: "Loyiha o'chirildi" });
  } catch (error) {
    console.error("delete product error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.get("/api/news", async (_req, res) => {
  try {
    const news = await News.find().sort({ isPinned: -1, publishedAt: -1, createdAt: -1 });
    res.json({ news });
  } catch (error) {
    console.error("list news error:", error);
    res.status(500).json({ message: "Yangiliklarni olishda xatolik" });
  }
});

app.post("/api/news", requireAdmin, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, excerpt, content, isPinned } = req.body;
    if (!title || !excerpt || !content) {
      return res.status(400).json({ message: "Sarlavha, qisqa matn va to'liq matn majburiy" });
    }

    let coverImage = "";
    if (req.file) {
      if (!cloudinaryConfigured()) {
        return res.status(500).json({ message: "Cloudinary sozlamalari topilmadi" });
      }
      coverImage = await uploadBuffer(req.file.buffer, "texnopark/news");
    }

    const created = await News.create({
      title: String(title).trim(),
      excerpt: String(excerpt).trim(),
      content: String(content).trim(),
      coverImage,
      isPinned: String(isPinned) === "true",
      publishedAt: new Date(),
    });

    res.status(201).json({ message: "Yangilik qo'shildi", news: created });
  } catch (error) {
    console.error("create news error:", error);
    res.status(500).json({ message: "Yangilik yaratishda xatolik" });
  }
});

app.delete("/api/news/:id", requireAdmin, async (req, res) => {
  try {
    const removed = await News.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Yangilik topilmadi" });
    res.json({ message: "Yangilik o'chirildi" });
  } catch (error) {
    console.error("delete news error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.get("/api/blog", async (_req, res) => {
  try {
    const posts = await BlogPost.find().sort({ publishedAt: -1, createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    console.error("list blog error:", error);
    res.status(500).json({ message: "Blog yozuvlarini olishda xatolik" });
  }
});

app.post("/api/blog", requireAdmin, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, excerpt, content, author } = req.body;
    if (!title || !excerpt || !content) {
      return res.status(400).json({ message: "Sarlavha, qisqa matn va to'liq matn majburiy" });
    }

    let coverImage = "";
    if (req.file) {
      if (!cloudinaryConfigured()) {
        return res.status(500).json({ message: "Cloudinary sozlamalari topilmadi" });
      }
      coverImage = await uploadBuffer(req.file.buffer, "texnopark/blog");
    }

    const created = await BlogPost.create({
      title: String(title).trim(),
      excerpt: String(excerpt).trim(),
      content: String(content).trim(),
      coverImage,
      author: author ? String(author).trim() : undefined,
      publishedAt: new Date(),
    });

    res.status(201).json({ message: "Blog yozuvi qo'shildi", post: created });
  } catch (error) {
    console.error("create blog error:", error);
    res.status(500).json({ message: "Blog yaratishda xatolik" });
  }
});

app.delete("/api/blog/:id", requireAdmin, async (req, res) => {
  try {
    const removed = await BlogPost.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Blog yozuvi topilmadi" });
    res.json({ message: "Blog yozuvi o'chirildi" });
  } catch (error) {
    console.error("delete blog error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.get("/api/gallery", async (_req, res) => {
  try {
    const works = await GalleryWork.find().sort({ completedAt: -1, createdAt: -1 });
    res.json({ works });
  } catch (error) {
    console.error("list gallery error:", error);
    res.status(500).json({ message: "Galereyani olishda xatolik" });
  }
});

app.post("/api/gallery", requireAdmin, upload.array("images", MAX_GALLERY_IMAGE_COUNT), async (req, res) => {
  try {
    const { title, description, category, completedAt } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Nomi va tavsif majburiy" });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "Galereya uchun kamida 1 ta rasm yuklang" });
    }

    if (!cloudinaryConfigured()) {
      return res.status(500).json({ message: "Cloudinary sozlamalari topilmadi" });
    }

    const imageUrls = await uploadFilesToCloudinary(files, "texnopark/gallery");
    const created = await GalleryWork.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category: category ? String(category).trim() : "Real loyiha",
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      images: imageUrls,
    });

    res.status(201).json({ message: "Galereya materiali qo'shildi", work: created });
  } catch (error) {
    console.error("create gallery error:", error);
    res.status(500).json({ message: "Galereya yaratishda xatolik" });
  }
});

app.delete("/api/gallery/:id", requireAdmin, async (req, res) => {
  try {
    const removed = await GalleryWork.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Galereya elementi topilmadi" });
    res.json({ message: "Galereya elementi o'chirildi" });
  } catch (error) {
    console.error("delete gallery error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.post("/api/preorders", requireAuth, upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const { productId, quantity, payerFullName, transactionId, note } = req.body;
    if (!productId || !payerFullName || !transactionId) {
      return res.status(400).json({ message: "Loyiha, to'lovchi F.I.Sh va tranzaksiya ID majburiy" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "To'lov screenshotini yuklang" });
    }

    const qty = Number(quantity || 1);
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "Jamoa soni noto'g'ri" });
    }

    const project = await Product.findById(productId);
    if (!project) {
      return res.status(404).json({ message: "Loyiha topilmadi" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    }

    if (!cloudinaryConfigured()) {
      return res.status(500).json({ message: "Cloudinary sozlamalari topilmadi" });
    }

    const paymentScreenshot = await uploadBuffer(req.file.buffer, "texnopark/preorders");
    const totalAmount = project.price * qty;
    const preorder = await Preorder.create({
      user: user._id,
      product: project._id,
      projectName: project.name,
      quantity: qty,
      unitPrice: project.price,
      totalAmount,
      payerFullName: String(payerFullName).trim(),
      payerPhone: user.phone,
      transactionId: String(transactionId).trim(),
      note: note ? String(note).trim() : "",
      paymentScreenshot,
      status: "pending",
    });

    res.status(201).json({ message: "Oldindan to'lov arizasi yuborildi", preorder });
  } catch (error) {
    console.error("create preorder error:", error);
    res.status(500).json({ message: "Oldindan to'lov arizasini yuborishda xatolik" });
  }
});

app.get("/api/preorders/my", requireAuth, async (req, res) => {
  try {
    const preorders = await Preorder.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.json({ preorders });
  } catch (error) {
    console.error("my preorders error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.get("/api/preorders", requireAdmin, async (_req, res) => {
  try {
    const preorders = await Preorder.find()
      .populate("user", "firstName lastName phone")
      .sort({ createdAt: -1 });
    res.json({ preorders });
  } catch (error) {
    console.error("list preorders error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.patch("/api/preorders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status noto'g'ri" });
    }

    const preorder = await Preorder.findById(req.params.id);
    if (!preorder) {
      return res.status(404).json({ message: "Oldindan to'lov arizasi topilmadi" });
    }

    preorder.status = status;
    if (adminNote !== undefined) {
      preorder.adminNote = String(adminNote).trim();
    }
    await preorder.save();

    res.json({ message: "To'lov ariza statusi yangilandi", preorder });
  } catch (error) {
    console.error("update preorder status error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Loyiha tanlanmadi" });
    }

    const qty = Number(quantity || 1);
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "Miqdor noto'g'ri" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Loyiha topilmadi" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    }

    const total = product.price * qty;
    const order = await Order.create({
      user: user._id,
      customerName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone,
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: qty,
        },
      ],
      total,
      note: note ? String(note).trim() : "",
      status: "new",
    });

    res.status(201).json({ message: "Ariza qabul qilindi", order });
  } catch (error) {
    console.error("create order error:", error);
    res.status(500).json({ message: "Ariza yuborishda xatolik" });
  }
});

app.get("/api/orders/my", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    console.error("my orders error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.get("/api/orders", requireAdmin, async (_req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    console.error("admin orders error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["new", "accepted", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status noto'g'ri" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Ariza topilmadi" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Ariza statusi yangilandi", order });
  } catch (error) {
    console.error("update order status error:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
});

const pageRoutes = [
  "index",
  "home",
  "about",
  "history",
  "products",
  "order",
  "preorder",
  "news",
  "blog",
  "gallery",
  "login",
  "register",
  "contact",
  "admin",
];

for (const page of pageRoutes) {
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(path.join(__dirname, "public", `${page}.html`));
  });
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Maksimal 8 ta rasm yuklash mumkin" });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Har bir rasm 5MB dan oshmasligi kerak" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Rasm soni yoki fayl maydoni noto'g'ri" });
    }
  }
  if (err) {
    console.error("global error:", err);
    return res.status(500).json({ message: "Kutilmagan server xatosi" });
  }
  next();
});

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route topilmadi" });
});

async function start() {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        "Mongo URI topilmadi. Environment ga MONGODB_URI (yoki MONGO_URL / MONGO_URI / DATABASE_URL) kiriting"
      );
    }
    if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
      throw new Error("MONGODB_URI formati noto'g'ri. Atlas uchun mongodb+srv://... kiriting");
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: MONGO_TIMEOUT_MS,
      connectTimeoutMS: MONGO_TIMEOUT_MS,
      socketTimeoutMS: Math.max(MONGO_TIMEOUT_MS * 2, 30000),
    });
    console.log(`MongoDB connected (${MONGODB_KEY || "MONGODB_URI"})`);

    await ensureAdminUser();

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("startup error:", error.message);
    if (/timed out|whitelist|could not connect|econnrefused|enotfound|querysrv|socket/i.test(error.message)) {
      console.error(
        "Atlas tekshiruv: 1) Cluster Network Access da 0.0.0.0/0 qo'shing, 2) DB user login/parolini tekshiring, 3) URIda db nomi yozilgan bo'lsin"
      );
    }
    process.exit(1);
  }
}

start();


