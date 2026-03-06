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

function postTemplate(post) {
  const image = post.coverImage || "https://placehold.co/1000x560?text=Qarshi+yoshlar+Texnoparki+Blog";

  return `
    <div class="col-md-6 col-lg-4">
      <article class="card-glass glass h-100 news-card">
        <img class="news-cover" src="${image}" alt="${escapeHtml(post.title)}" />
        <div class="pt-3 d-flex flex-column h-100">
          <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
            <span class="chip-lite">${escapeHtml(post.author || "Matbuot xizmati")}</span>
            <span class="muted small">${formatDate(post.publishedAt)}</span>
          </div>
          <h5>${escapeHtml(post.title)}</h5>
          <p class="muted">${escapeHtml(post.excerpt)}</p>
          <details class="mt-auto details-clean">
            <summary>To'liq matn</summary>
            <p class="muted mt-2 mb-0">${escapeHtml(post.content)}</p>
          </details>
        </div>
      </article>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("blogGrid");
  if (!grid) return;

  try {
    const { posts } = await window.app.api("/api/blog");
    if (!posts.length) {
      grid.innerHTML = "<p class='muted'>Hozircha blog post joylanmagan.</p>";
      return;
    }
    grid.innerHTML = posts.map(postTemplate).join("");
  } catch (error) {
    grid.innerHTML = `<p class='text-danger'>${error.message}</p>`;
  }
});
