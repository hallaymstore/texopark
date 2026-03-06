(function () {
  let resolveAuthReady = null;
  window.authReady = new Promise((resolve) => {
    resolveAuthReady = resolve;
  });

  const authOnlyNodes = () => document.querySelectorAll("[data-auth-only]");
  const guestOnlyNodes = () => document.querySelectorAll("[data-guest-only]");
  const adminOnlyNodes = () => document.querySelectorAll("[data-admin-only]");

  function setVisibility(nodes, visible) {
    nodes.forEach((node) => {
      if (visible) node.classList.remove("hidden");
      else node.classList.add("hidden");
    });
  }

  function formatPrice(price) {
    return `${Number(price).toLocaleString("uz-UZ")} so'm`;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "include",
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "So'rov bajarilmadi");
    }
    return payload;
  }

  async function initAuth() {
    try {
      const payload = await api("/api/auth/me");
      window.currentUser = payload.authenticated ? payload.user : null;
    } catch (_error) {
      window.currentUser = null;
    }

    setVisibility(authOnlyNodes(), Boolean(window.currentUser));
    setVisibility(guestOnlyNodes(), !window.currentUser);
    setVisibility(adminOnlyNodes(), window.currentUser && window.currentUser.role === "admin");

    const userLabel = document.getElementById("userLabel");
    if (userLabel) {
      if (window.currentUser) {
        userLabel.textContent = `${window.currentUser.firstName} ${window.currentUser.lastName}`;
      } else {
        userLabel.textContent = "Mehmon";
      }
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function injectOfficialStrip() {
    const shell = document.querySelector(".site-shell");
    const nav = shell?.querySelector(".navbar");
    if (!shell || !nav || shell.querySelector("#officialStrip")) return;

    const block = document.createElement("section");
    block.id = "officialStrip";
    block.className = "official-strip glass fade-up";
    block.innerHTML = `
      <div class="official-title">Rasmiy axborot bloki: davlat boshqaruvi bilan hamkor xizmatlar portali</div>
      <div class="official-grid">
        <div class="official-item">
          <img src="/assets/images/official-emblem.svg" alt="Rasmiy belgi" />
          <div>
            <h6>Rasmiy maqom</h6>
            <p>Tashkilot faoliyati davlat me'yoriy hujjatlari asosida yuritiladi.</p>
          </div>
        </div>
        <div class="official-item">
          <img src="/assets/images/state-building.svg" alt="Davlat tashkiloti" />
          <div>
            <h6>Davlat bilan hamkorlik</h6>
            <p>Hududiy davlat organlari bilan elektron murojaat va hisobot almashinuvi yo'lga qo'yilgan.</p>
          </div>
        </div>
        <div class="official-item">
          <img src="/assets/images/public-service.svg" alt="Jamoat xizmati" />
          <div>
            <h6>Ochiq xizmatlar</h6>
            <p>Ishonch telefoni, fuqarolar qabuli va axborotga ochiq kirish tartibi amal qiladi.</p>
          </div>
        </div>
      </div>
    `;
    nav.insertAdjacentElement("afterend", block);
  }

  function appendOfficialMeta() {
    const footer = document.querySelector(".footer");
    if (!footer || footer.querySelector(".official-meta")) return;
    const meta = document.createElement("div");
    meta.className = "official-meta";
    meta.textContent =
      "Ishonch telefoni: +998 91 470 30 08 | Fuqarolar qabuli: Dushanba-Juma 09:00-18:00";
    footer.appendChild(meta);
  }

  function enhanceNavigation() {
    const nav = document.querySelector(".navbar-nav");
    if (!nav) return;

    const extraLinks = [
      { href: "/preorder", label: "Oldindan to'lov" },
      { href: "/news", label: "Yangiliklar" },
      { href: "/blog", label: "Blog" },
      { href: "/gallery", label: "Galereya" },
    ];

    const existing = new Set(
      Array.from(nav.querySelectorAll("a.nav-link"))
        .map((item) => item.getAttribute("href"))
        .filter(Boolean)
    );

    const adminNode = nav.querySelector("li[data-admin-only]");
    for (const link of extraLinks) {
      if (existing.has(link.href)) continue;
      const li = document.createElement("li");
      li.className = "nav-item";
      li.innerHTML = `<a class="nav-link" href="${link.href}">${link.label}</a>`;
      if (adminNode) nav.insertBefore(li, adminNode);
      else nav.appendChild(li);
    }

    const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
    nav.querySelectorAll("a.nav-link").forEach((item) => {
      const href = item.getAttribute("href");
      if (!href || href === "#") return;
      const normalizedHref = href.replace(/\/$/, "") || "/";
      if (normalizedHref === currentPath) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    enhanceNavigation();
    injectOfficialStrip();
    appendOfficialMeta();
    await initAuth();
    resolveAuthReady(window.currentUser);
    document.querySelectorAll("[data-logout-btn]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await logout();
        } catch (error) {
          alert(error.message);
        }
      });
    });
  });

  window.app = {
    api,
    formatPrice,
    initAuth,
  };
})();

