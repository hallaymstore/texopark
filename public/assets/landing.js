document.addEventListener("DOMContentLoaded", async () => {
  const previewWrap = document.getElementById("productPreview");
  if (!previewWrap) return;

  const shortText = (value = "", max = 98) => {
    const text = String(value).trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
  };

  try {
    const { products } = await window.app.api("/api/products");
    const topProducts = products.slice(0, 3);

    if (!topProducts.length) {
      previewWrap.innerHTML = "<p class='muted mb-0'>Hozircha Loyihalar joylanmagan.</p>";
      return;
    }

    previewWrap.innerHTML = topProducts
      .map(
        (p) => `
          <div class="col-md-4">
            <div class="card-glass glass product-card h-100">
              <img src="${p.images?.[0] || "https://placehold.co/640x440?text=HALLAYM"}" alt="${p.name}" />
              <div class="pt-3">
                <span class="chip-lite mb-2">Faol startup</span>
                <h5>${p.name}</h5>
                <p class="muted small">${shortText(p.description)}</p>
                <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                  <span class="price-tag">Investitsiya: ${window.app.formatPrice(p.price)}</span>
                  <div class="d-flex gap-2">
                    <a class="btn btn-sm btn-glass" href="/order?productId=${p._id}">Ariza</a>
                    <a class="btn btn-sm btn-solid" href="/preorder?productId=${p._id}">Oldindan to'lov</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  } catch (_error) {
    previewWrap.innerHTML = "<p class='text-danger mb-0'>Loyihalarni yuklab bo'lmadi.</p>";
  }
});

