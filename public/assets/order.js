function readQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function orderRowTemplate(order) {
  const item = order.items[0];
  const statusClass =
    order.status === "accepted" ? "chip-accepted" : order.status === "rejected" ? "chip-rejected" : "chip-new";

  const statusLabel =
    order.status === "accepted" ? "Qabul qilingan" : order.status === "rejected" ? "Bekor qilingan" : "Yangi";

  return `
    <tr>
      <td>${new Date(order.createdAt).toLocaleString("uz-UZ")}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${window.app.formatPrice(order.total)}</td>
      <td><span class="chip ${statusClass}">${statusLabel}</span></td>
    </tr>
  `;
}

async function fillProducts(selectEl) {
  const { products } = await window.app.api("/api/products");
  if (!products.length) {
    selectEl.innerHTML = "<option value=''>Loyiha topilmadi</option>";
    return;
  }

  selectEl.innerHTML = products
    .map((p) => `<option value="${p._id}">${p.name} - Investitsiya: ${window.app.formatPrice(p.price)}</option>`)
    .join("");

  const preselected = readQueryParam("productId");
  if (preselected) {
    const item = products.find((p) => p._id === preselected);
    if (item) selectEl.value = preselected;
  }
}

async function renderMyOrders(tableBody) {
  const { orders } = await window.app.api("/api/orders/my");
  if (!orders.length) {
    tableBody.innerHTML = "<tr><td colspan='5' class='muted'>Sizda hali Arizalar yo'q.</td></tr>";
    return;
  }
  tableBody.innerHTML = orders.map(orderRowTemplate).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.authReady) await window.authReady;

  if (!window.currentUser) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
    return;
  }

  const form = document.getElementById("orderForm");
  const productsSelect = document.getElementById("productId");
  const myOrdersBody = document.getElementById("myOrdersBody");

  try {
    await fillProducts(productsSelect);
    await renderMyOrders(myOrdersBody);
  } catch (error) {
    alert(error.message);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      productId: data.get("productId"),
      quantity: Number(data.get("quantity")),
      note: data.get("note"),
    };

    const errorEl = document.getElementById("orderError");
    const okEl = document.getElementById("orderOk");
    errorEl.textContent = "";
    okEl.textContent = "";

    try {
      await window.app.api("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      okEl.textContent = "Ariza muvaffaqiyatli yuborildi.";
      form.reset();
      await fillProducts(productsSelect);
      await renderMyOrders(myOrdersBody);
    } catch (error) {
      errorEl.textContent = error.message;
    }
  });
});

