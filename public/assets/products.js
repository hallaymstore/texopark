function productCardTemplate(product) {
  const description =
    String(product.description || "").trim().length > 130
      ? `${String(product.description).trim().slice(0, 130)}...`
      : String(product.description || "");

  return `
    <div class="col-md-6 col-lg-4">
      <div class="card-glass glass product-card h-100">
        <img src="${product.images?.[0] || "https://placehold.co/640x440?text=No+Image"}" alt="${product.name}">
        <div class="pt-3 d-flex flex-column h-100">
          <span class="chip-lite mb-2">Mavjud</span>
          <h5>${product.name}</h5>
          <p class="muted small flex-grow-1">${description}</p>
          <div class="d-flex justify-content-between align-items-center mt-2 gap-2 flex-wrap">
            <span class="price-tag">Investitsiya: ${window.app.formatPrice(product.price)}</span>
            <div class="d-flex gap-2">
              <a href="/order?productId=${product._id}" class="btn btn-sm btn-solid">Ariza</a>
              <a href="/preorder?productId=${product._id}" class="btn btn-sm btn-glass">Oldindan to'lov</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  try {
    const { products } = await window.app.api("/api/products");
    if (!products.length) {
      grid.innerHTML = "<p class='muted'>Hozircha Loyihalar mavjud emas.</p>";
      return;
    }
    grid.innerHTML = products.map(productCardTemplate).join("");
  } catch (error) {
    grid.innerHTML = `<p class='text-danger'>${error.message}</p>`;
  }
});

