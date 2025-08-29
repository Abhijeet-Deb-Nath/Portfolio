/* Minimal Admin Key Gate (server-backed)
   - Posts the key to /app/auth/verify_key.php
   - Stores CSRF for later API calls
*/
(function () {
  const $ = (s, c = document) => c.querySelector(s);

  // NEW: dynamic root based on current URL
  const ROOT = location.pathname.includes('/public/')
    ? location.pathname.split('/public/')[0]
    : '';

  const CFG = {
    VERIFY_ENDPOINT: `${ROOT}/app/auth/verify_key.php`,
    REDIRECT_FALLBACK: `${ROOT}/public/manhattan.html`,
  };

  const form = $("#keyForm");
  const input = $("#adminKey");
  const btn = $("#enterBtn");
  const msg = $("#msg");

  const show = (t, type = "") => {
    msg.textContent = t;
    msg.className = `msg ${type}`;
  };
  const setBusy = (busy) => {
    btn.toggleAttribute("disabled", busy);
    btn.setAttribute("aria-busy", busy ? "true" : "false");
  };

  // Auto-submit on paste (fast admin flow)
  input?.addEventListener("paste", () => setTimeout(() => form.requestSubmit(), 0));

  // Submit to PHP
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = (input.value || "").trim();
    if (!key) { show("Key required.", "error"); input.focus(); return; }

    setBusy(true);
    show("Verifying…", "neutral");

    try {
      const body = new FormData();
      body.append("key", key);

      const res = await fetch(CFG.VERIFY_ENDPOINT, { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        // Persist CSRF for API calls from the dashboard
        if (data.csrf) sessionStorage.setItem("csrf", data.csrf);
        const to = data.redirect || CFG.REDIRECT_FALLBACK;
        show("Verified. Redirecting…", "success");
        setTimeout(() => (window.location.href = to), 250);
      } else {
        show(data.error || "Invalid key.", "error");
      }
    } catch {
      show("Network error. Try again.", "error");
    } finally {
      setBusy(false);
    }
  });
})();
