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

function newsCard(item) {
  const image = item.coverImage || "https://placehold.co/1000x560?text=Qarshi+yoshlar+Texnoparki+News";
  return `
    <div class="col-md-6 col-lg-4">
      <article class="card-glass glass h-100 news-card">
        <img class="news-cover" src="${image}" alt="${escapeHtml(item.title)}" />
        <div class="pt-3 d-flex flex-column h-100">
          <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
            <span class="chip-lite">${item.isPinned ? "Muhim" : "Yangilik"}</span>
            <span class="muted small">${formatDate(item.publishedAt)}</span>
          </div>
          <h5>${escapeHtml(item.title)}</h5>
          <p class="muted">${escapeHtml(item.excerpt)}</p>
          <details class="mt-auto details-clean">
            <summary>Batafsil o'qish</summary>
            <p class="muted mt-2 mb-0">${escapeHtml(item.content)}</p>
          </details>
        </div>
      </article>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;

  try {
    const { news } = await window.app.api("/api/news");
    if (!news.length) {
      grid.innerHTML = "<p class='muted'>Hozircha yangilik joylanmagan.</p>";
      return;
    }
    grid.innerHTML = news.map(newsCard).join("");
  } catch (error) {
    grid.innerHTML = `<p class='text-danger'>${error.message}</p>`;
  }
});
