function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function galleryTemplate(item) {
  const images = item.images || [];
  const cover = images[0] || "https://placehold.co/1000x560?text=HALLAYM+GALLERY";

  return `
    <div class="col-md-6 col-lg-4">
      <article class="card-glass glass h-100 gallery-card">
        <img class="gallery-cover" src="${cover}" alt="${escapeHtml(item.title)}" />
        <div class="pt-3 d-flex flex-column h-100">
          <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
            <span class="chip-lite">${escapeHtml(item.category || "Loyiha")}</span>
            <span class="muted small">${formatDate(item.completedAt)}</span>
          </div>
          <h5>${escapeHtml(item.title)}</h5>
          <p class="muted">${escapeHtml(item.description)}</p>
          <div class="gallery-thumbs mt-auto">
            ${images
              .map(
                (image, index) => `<a href="${image}" target="_blank" rel="noopener noreferrer"><img src="${image}" alt="${escapeHtml(
                  item.title
                )} ${index + 1}" /></a>`
              )
              .join("")}
          </div>
        </div>
      </article>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  try {
    const { works } = await window.app.api("/api/gallery");
    if (!works.length) {
      grid.innerHTML = "<p class='muted'>Hozircha galereya materiali joylanmagan.</p>";
      return;
    }
    grid.innerHTML = works.map(galleryTemplate).join("");
  } catch (error) {
    grid.innerHTML = `<p class='text-danger'>${error.message}</p>`;
  }
});
