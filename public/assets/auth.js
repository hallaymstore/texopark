function getNextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/")) return "/products";
  return next;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.authReady) await window.authReady;

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  if (window.currentUser) {
    window.location.href = getNextPath();
    return;
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        password: formData.get("password"),
      };
      const errorEl = document.getElementById("registerError");
      const okEl = document.getElementById("registerOk");
      errorEl.textContent = "";
      okEl.textContent = "";
      try {
        await window.app.api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        okEl.textContent = "Muvaffaqiyatli ro'yxatdan o'tdingiz. Yo'naltirilmoqda...";
        setTimeout(() => {
          window.location.href = getNextPath();
        }, 700);
      } catch (error) {
        errorEl.textContent = error.message;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const payload = {
        phone: formData.get("phone"),
        password: formData.get("password"),
      };

      const errorEl = document.getElementById("loginError");
      const okEl = document.getElementById("loginOk");
      errorEl.textContent = "";
      okEl.textContent = "";
      try {
        const result = await window.app.api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        okEl.textContent = `Xush kelibsiz, ${result.user.firstName}.`;
        setTimeout(() => {
          const target = result.user.role === "admin" ? "/admin" : getNextPath();
          window.location.href = target;
        }, 600);
      } catch (error) {
        errorEl.textContent = error.message;
      }
    });
  }
});

