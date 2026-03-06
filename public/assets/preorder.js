function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function preorderStatusClass(status) {
  if (status === "approved") return "chip-accepted";
  if (status === "rejected") return "chip-rejected";
  return "chip-new";
}

function preorderStatusText(status) {
  if (status === "approved") return "Tasdiqlangan";
  if (status === "rejected") return "Rad etilgan";
  return "Kutilmoqda";
}

function preorderRowTemplate(item) {
  return `
    <tr>
      <td>${new Date(item.createdAt).toLocaleString("uz-UZ")}</td>
      <td>${escapeHtml(item.projectName)}</td>
      <td>${item.quantity}</td>
      <td>${window.app.formatPrice(item.totalAmount)}</td>
      <td><span class="chip ${preorderStatusClass(item.status)}">${preorderStatusText(item.status)}</span></td>
      <td><a class="btn btn-sm btn-glass" href="${item.paymentScreenshot}" target="_blank" rel="noopener noreferrer">Ko'rish</a></td>
      <td>${escapeHtml(item.adminNote || "-")}</td>
    </tr>
  `;
}

function fillPaymentConfig(config) {
  const holder = document.getElementById("cardHolder");
  const cardNumber = document.getElementById("cardNumber");
  const bank = document.getElementById("bankName");

  if (holder) holder.textContent = config.cardHolder || "-";
  if (cardNumber) cardNumber.textContent = config.cardNumber || "-";
  if (bank) bank.textContent = config.bankName || "-";
}

function calculateTotal(products, productId, quantity) {
  const product = products.find((item) => item._id === productId);
  if (!product) return 0;
  const qty = Number(quantity || 1);
  if (Number.isNaN(qty) || qty < 1) return 0;
  return product.price * qty;
}

function renderProductOptions(selectEl, products, selectedId) {
  if (!products.length) {
    selectEl.innerHTML = "<option value=''>Loyiha topilmadi</option>";
    return;
  }

  selectEl.innerHTML = products
    .map(
      (item) =>
        `<option value="${item._id}" ${item._id === selectedId ? "selected" : ""}>${escapeHtml(item.name)} - ${window.app.formatPrice(
          item.price
        )}</option>`
    )
    .join("");
}

function updateTotalLabel(products) {
  const selectEl = document.getElementById("preorderProductId");
  const qtyEl = document.getElementById("preorderQuantity");
  const totalEl = document.getElementById("calcTotal");
  if (!selectEl || !qtyEl || !totalEl) return;

  const total = calculateTotal(products, selectEl.value, qtyEl.value);
  totalEl.textContent = window.app.formatPrice(total);
}

async function renderMyPreorders() {
  const tbody = document.getElementById("myPreordersBody");
  if (!tbody) return;

  const { preorders } = await window.app.api("/api/preorders/my");
  if (!preorders.length) {
    tbody.innerHTML = "<tr><td colspan='7' class='muted'>Hali oldindan to'lov arizangiz yo'q.</td></tr>";
    return;
  }

  tbody.innerHTML = preorders.map(preorderRowTemplate).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.authReady) await window.authReady;

  if (!window.currentUser) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
    return;
  }

  const form = document.getElementById("preorderForm");
  const productSelect = document.getElementById("preorderProductId");
  const qtyInput = document.getElementById("preorderQuantity");
  const payerFullNameInput = document.getElementById("payerFullName");
  const errorEl = document.getElementById("preorderError");
  const okEl = document.getElementById("preorderOk");

  if (payerFullNameInput && window.currentUser) {
    payerFullNameInput.value = `${window.currentUser.firstName} ${window.currentUser.lastName}`.trim();
  }

  let products = [];
  try {
    const [productsPayload, paymentConfig] = await Promise.all([
      window.app.api("/api/products"),
      window.app.api("/api/payment-config"),
    ]);

    products = productsPayload.products || [];
    const preselected = readQueryParam("productId");
    renderProductOptions(productSelect, products, preselected);
    fillPaymentConfig(paymentConfig);
    updateTotalLabel(products);
    await renderMyPreorders();
  } catch (error) {
    if (errorEl) errorEl.textContent = error.message;
  }

  productSelect.addEventListener("change", () => updateTotalLabel(products));
  qtyInput.addEventListener("input", () => updateTotalLabel(products));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";
    if (okEl) okEl.textContent = "";

    const data = new FormData(form);
    const quantity = Number(data.get("quantity") || 1);
    if (Number.isNaN(quantity) || quantity < 1) {
      if (errorEl) errorEl.textContent = "Soni noto'g'ri";
      return;
    }

    try {
      await window.app.api("/api/preorders", {
        method: "POST",
        body: data,
      });

      if (okEl) okEl.textContent = "Oldindan to'lov arizasi yuborildi";
      const selectedProductId = productSelect.value;
      form.reset();
      if (payerFullNameInput && window.currentUser) {
        payerFullNameInput.value = `${window.currentUser.firstName} ${window.currentUser.lastName}`.trim();
      }
      renderProductOptions(productSelect, products, selectedProductId);
      updateTotalLabel(products);
      await renderMyPreorders();
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message;
    }
  });
});
