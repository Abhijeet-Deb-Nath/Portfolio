/* Minimal Admin Key Gate
   IMPORTANT: Real validation must be done server-side.
   - DEV_MODE lets you test without a backend.
   - When your PHP endpoint is ready, set DEV_MODE=false.
*/
(function () {
  const $ = (s, c = document) => c.querySelector(s);

  const CFG = {
    DEV_MODE: true,                // set to false when backend is ready
    DEV_KEY: "123",      // change/remove in production
    VERIFY_ENDPOINT: "/auth/verify_key.php", // POST 'key' -> {ok:true}
    REDIRECT_TO: "manhattan.html",
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
  input.addEventListener("paste", () => {
    setTimeout(() => form.requestSubmit(), 0);
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = (input.value || "").trim();

    if (!key) {
      show("Key required.", "error");
      input.focus();
      return;
    }

    setBusy(true);
    show("Verifying…", "neutral");

    try {
      if (CFG.DEV_MODE) {
        // Front-end only check for quick testing (NOT secure)
        if (key === CFG.DEV_KEY) {
          show("Verified. Redirecting…", "success");
          return setTimeout(() => (window.location.href = CFG.REDIRECT_TO), 300);
        }
        show("Invalid key.", "error");
      } else {
        // Real flow: post to your PHP endpoint
        const body = new FormData();
        body.append("key", key);

        const res = await fetch(CFG.VERIFY_ENDPOINT, { method: "POST", body });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          show("Verified. Redirecting…", "success");
          setTimeout(() => (window.location.href = CFG.REDIRECT_TO), 300);
        } else {
          show(data.message || "Invalid key.", "error");
        }
      }
    } catch {
      show("Network error. Try again.", "error");
    } finally {
      setBusy(false);
    }
  });
})();
