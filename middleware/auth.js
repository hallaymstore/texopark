function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Avval tizimga kiring" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.status(403).json({ message: "Faqat admin uchun" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
