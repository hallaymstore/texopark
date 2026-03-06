function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dateText(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("uz-UZ");
}

function orderStatusText(status) {
  if (status === "accepted") return "Qabul qilingan";
  if (status === "rejected") return "Rad etilgan";
  return "Yangi";
}

function orderStatusClass(status) {
  if (status === "accepted") return "chip-accepted";
  if (status === "rejected") return "chip-rejected";
  return "chip-new";
}

function preorderStatusText(status) {
  if (status === "approved") return "Tasdiqlangan";
  if (status === "rejected") return "Rad etilgan";
  return "Kutilmoqda";
}

function preorderStatusClass(status) {
  if (status === "approved") return "chip-accepted";
  if (status === "rejected") return "chip-rejected";
  return "chip-new";
}

function setFormState(errorId, okId, errorText, okText) {
  const errorEl = document.getElementById(errorId);
  const okEl = document.getElementById(okId);
  if (errorEl) errorEl.textContent = errorText || "";
  if (okEl) okEl.textContent = okText || "";
}

function productRow(product) {
  return `
    <tr>
      <td>${escapeHtml(product.name)}</td>
      <td>${window.app.formatPrice(product.price)}</td>
      <td>${product.images?.length || 0}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-delete-product="${product._id}">O'chirish</button></td>
    </tr>
  `;
}

function newsRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${dateText(item.publishedAt)}</td>
      <td>${item.isPinned ? "Ha" : "Yo'q"}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-delete-news="${item._id}">O'chirish</button></td>
    </tr>
  `;
}

function blogRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.author || "-")}</td>
      <td>${dateText(item.publishedAt)}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-delete-blog="${item._id}">O'chirish</button></td>
    </tr>
  `;
}

function galleryRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category || "-")}</td>
      <td>${item.images?.length || 0}</td>
      <td>${dateText(item.completedAt)}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-delete-gallery="${item._id}">O'chirish</button></td>
    </tr>
  `;
}

function orderCard(order) {
  const item = order.items?.[0] || {};
  const userInfo = order.user
    ? `${order.user.firstName} ${order.user.lastName} (${order.user.phone})`
    : `${order.customerName} (${order.phone})`;

  return `
    <div class="card-glass glass mb-3">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <h6 class="mb-1">${escapeHtml(item.name || "-")}</h6>
          <div class="muted small">${escapeHtml(userInfo)}</div>
          <div class="muted small">Jamoa: ${item.quantity || 1} | Umumiy: ${window.app.formatPrice(order.total || 0)}</div>
          <div class="muted small">Sana: ${dateText(order.createdAt)}</div>
          ${order.note ? `<div class="muted small">Izoh: ${escapeHtml(order.note)}</div>` : ""}
        </div>
        <div class="text-end">
          <span class="chip ${orderStatusClass(order.status)}">${orderStatusText(order.status)}</span>
          <div class="d-flex gap-2 mt-2 justify-content-end">
            <button class="btn btn-sm btn-success" data-set-status="accepted" data-order-id="${order._id}">Qabul</button>
            <button class="btn btn-sm btn-danger" data-set-status="rejected" data-order-id="${order._id}">Rad etish</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function preorderCard(item) {
  const userInfo = item.user
    ? `${item.user.firstName} ${item.user.lastName} (${item.user.phone})`
    : `${item.payerFullName} (${item.payerPhone})`;

  return `
    <div class="card-glass glass mb-3">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div class="preorder-main">
          <h6 class="mb-1">${escapeHtml(item.projectName)}</h6>
          <div class="muted small">${escapeHtml(userInfo)}</div>
          <div class="muted small">Soni: ${item.quantity} | Birlik narx: ${window.app.formatPrice(item.unitPrice)}</div>
          <div class="muted small">Umumiy to'lov: ${window.app.formatPrice(item.totalAmount)}</div>
          <div class="muted small">Tranzaksiya: ${escapeHtml(item.transactionId)}</div>
          <div class="muted small">Sana: ${dateText(item.createdAt)}</div>
          ${item.note ? `<div class="muted small">Izoh: ${escapeHtml(item.note)}</div>` : ""}
          <div class="mt-2">
            <a class="btn btn-sm btn-glass" href="${item.paymentScreenshot}" target="_blank" rel="noopener noreferrer">Screenshotni ko'rish</a>
          </div>
        </div>
        <div class="text-end preorder-actions">
          <span class="chip ${preorderStatusClass(item.status)}">${preorderStatusText(item.status)}</span>
          <textarea class="form-control form-control-sm mt-2" rows="2" placeholder="Admin izohi" data-preorder-note="${item._id}">${escapeHtml(item.adminNote || "")}</textarea>
          <div class="d-flex gap-2 mt-2 justify-content-end">
            <button class="btn btn-sm btn-success" data-preorder-status="approved" data-preorder-id="${item._id}">Tasdiqlash</button>
            <button class="btn btn-sm btn-warning" data-preorder-status="pending" data-preorder-id="${item._id}">Kutilmoqda</button>
            <button class="btn btn-sm btn-danger" data-preorder-status="rejected" data-preorder-id="${item._id}">Rad etish</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderProducts() {
  const tbody = document.getElementById("adminProductsBody");
  const { products } = await window.app.api("/api/products");
  if (!products.length) {
    tbody.innerHTML = "<tr><td colspan='4' class='muted'>Loyihalar yo'q.</td></tr>";
    return;
  }
  tbody.innerHTML = products.map(productRow).join("");
}

async function renderOrders() {
  const wrap = document.getElementById("adminOrdersWrap");
  const { orders } = await window.app.api("/api/orders");
  if (!orders.length) {
    wrap.innerHTML = "<p class='muted'>Yangi arizalar yo'q.</p>";
    return;
  }
  wrap.innerHTML = orders.map(orderCard).join("");
}

async function renderNews() {
  const tbody = document.getElementById("adminNewsBody");
  const { news } = await window.app.api("/api/news");
  if (!news.length) {
    tbody.innerHTML = "<tr><td colspan='4' class='muted'>Yangiliklar yo'q.</td></tr>";
    return;
  }
  tbody.innerHTML = news.map(newsRow).join("");
}

async function renderBlog() {
  const tbody = document.getElementById("adminBlogBody");
  const { posts } = await window.app.api("/api/blog");
  if (!posts.length) {
    tbody.innerHTML = "<tr><td colspan='4' class='muted'>Blog postlar yo'q.</td></tr>";
    return;
  }
  tbody.innerHTML = posts.map(blogRow).join("");
}

async function renderGallery() {
  const tbody = document.getElementById("adminGalleryBody");
  const { works } = await window.app.api("/api/gallery");
  if (!works.length) {
    tbody.innerHTML = "<tr><td colspan='5' class='muted'>Galereya materiallari yo'q.</td></tr>";
    return;
  }
  tbody.innerHTML = works.map(galleryRow).join("");
}

async function renderPreorders() {
  const wrap = document.getElementById("adminPreordersWrap");
  const { preorders } = await window.app.api("/api/preorders");
  if (!preorders.length) {
    wrap.innerHTML = "<p class='muted'>Oldindan to'lov arizalari yo'q.</p>";
    return;
  }
  wrap.innerHTML = preorders.map(preorderCard).join("");
}

async function refreshAll() {
  await Promise.all([renderProducts(), renderOrders(), renderNews(), renderBlog(), renderGallery(), renderPreorders()]);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.authReady) await window.authReady;

  const gate = document.getElementById("adminGate");
  const dashboard = document.getElementById("adminDashboard");

  if (!window.currentUser || window.currentUser.role !== "admin") {
    gate.classList.remove("hidden");
    dashboard.classList.add("hidden");
    return;
  }

  gate.classList.add("hidden");
  dashboard.classList.remove("hidden");

  try {
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }

  const productForm = document.getElementById("productCreateForm");
  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(productForm);
    const files = document.getElementById("images").files;

    if (files.length > 5) {
      setFormState("productError", "productOk", "Maksimal 5 ta rasm yuklang", "");
      return;
    }

    for (const file of files) data.append("images", file);

    setFormState("productError", "productOk", "", "");
    try {
      await window.app.api("/api/products", {
        method: "POST",
        body: data,
      });
      setFormState("productError", "productOk", "", "Loyiha saqlandi");
      productForm.reset();
      await renderProducts();
    } catch (error) {
      setFormState("productError", "productOk", error.message, "");
    }
  });

  const newsForm = document.getElementById("newsCreateForm");
  newsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(newsForm);

    if (!data.get("isPinned")) {
      data.append("isPinned", "false");
    }

    setFormState("newsError", "newsOk", "", "");
    try {
      await window.app.api("/api/news", {
        method: "POST",
        body: data,
      });
      setFormState("newsError", "newsOk", "", "Yangilik qo'shildi");
      newsForm.reset();
      await renderNews();
    } catch (error) {
      setFormState("newsError", "newsOk", error.message, "");
    }
  });

  const blogForm = document.getElementById("blogCreateForm");
  blogForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(blogForm);

    setFormState("blogError", "blogOk", "", "");
    try {
      await window.app.api("/api/blog", {
        method: "POST",
        body: data,
      });
      setFormState("blogError", "blogOk", "", "Blog post qo'shildi");
      blogForm.reset();
      await renderBlog();
    } catch (error) {
      setFormState("blogError", "blogOk", error.message, "");
    }
  });

  const galleryForm = document.getElementById("galleryCreateForm");
  galleryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(galleryForm);
    const files = document.getElementById("galleryImages").files;

    if (!files.length) {
      setFormState("galleryError", "galleryOk", "Kamida 1 ta rasm yuklang", "");
      return;
    }

    if (files.length > 8) {
      setFormState("galleryError", "galleryOk", "Maksimal 8 ta rasm yuklang", "");
      return;
    }

    for (const file of files) data.append("images", file);

    setFormState("galleryError", "galleryOk", "", "");
    try {
      await window.app.api("/api/gallery", {
        method: "POST",
        body: data,
      });
      setFormState("galleryError", "galleryOk", "", "Galereya materiali saqlandi");
      galleryForm.reset();
      await renderGallery();
    } catch (error) {
      setFormState("galleryError", "galleryOk", error.message, "");
    }
  });

  document.addEventListener("click", async (event) => {
    const deleteProductBtn = event.target.closest("[data-delete-product]");
    const deleteNewsBtn = event.target.closest("[data-delete-news]");
    const deleteBlogBtn = event.target.closest("[data-delete-blog]");
    const deleteGalleryBtn = event.target.closest("[data-delete-gallery]");
    const setStatusBtn = event.target.closest("[data-set-status]");
    const setPreorderStatusBtn = event.target.closest("[data-preorder-status]");

    try {
      if (deleteProductBtn) {
        const productId = deleteProductBtn.getAttribute("data-delete-product");
        if (!confirm("Loyihani o'chirishni tasdiqlaysizmi?")) return;
        await window.app.api(`/api/products/${productId}`, { method: "DELETE" });
        await renderProducts();
        return;
      }

      if (deleteNewsBtn) {
        const newsId = deleteNewsBtn.getAttribute("data-delete-news");
        if (!confirm("Yangilikni o'chirishni tasdiqlaysizmi?")) return;
        await window.app.api(`/api/news/${newsId}`, { method: "DELETE" });
        await renderNews();
        return;
      }

      if (deleteBlogBtn) {
        const blogId = deleteBlogBtn.getAttribute("data-delete-blog");
        if (!confirm("Blog postni o'chirishni tasdiqlaysizmi?")) return;
        await window.app.api(`/api/blog/${blogId}`, { method: "DELETE" });
        await renderBlog();
        return;
      }

      if (deleteGalleryBtn) {
        const galleryId = deleteGalleryBtn.getAttribute("data-delete-gallery");
        if (!confirm("Galereya elementini o'chirishni tasdiqlaysizmi?")) return;
        await window.app.api(`/api/gallery/${galleryId}`, { method: "DELETE" });
        await renderGallery();
        return;
      }

      if (setStatusBtn) {
        const orderId = setStatusBtn.getAttribute("data-order-id");
        const status = setStatusBtn.getAttribute("data-set-status");
        await window.app.api(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        await renderOrders();
        return;
      }

      if (setPreorderStatusBtn) {
        const preorderId = setPreorderStatusBtn.getAttribute("data-preorder-id");
        const status = setPreorderStatusBtn.getAttribute("data-preorder-status");
        const noteInput = document.querySelector(`[data-preorder-note='${preorderId}']`);
        const adminNote = noteInput ? noteInput.value.trim() : "";

        await window.app.api(`/api/preorders/${preorderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status, adminNote }),
        });
        await renderPreorders();
      }
    } catch (error) {
      alert(error.message);
    }
  });
});
