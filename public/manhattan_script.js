/* ===============================
   Admin Dashboard (PHP JSON APIs)
   Entities: projects, achievements, blogs(=posts)
   =============================== */
(() => {
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const API_BASE = "/portfolio/app/api";
  const LOGIN_URL = "/portfolio/public/login.html";

  // CSRF from login step (verify_key.php response)
  const CSRF = sessionStorage.getItem("csrf") || "";

  // Map UI entity -> API endpoint file name
  const endpointOf = (entity) => (entity === "blogs" ? "posts" : entity);

  // Map UI fields <-> API(DB) fields
  const toApi = {
    projects: (o) => ({
      title: o.title || "",
      description: o.description || "",
      tags: o.tech || o.tags || "",
      github_url: o.github || "",
      image_path: o.image_path || "",
      is_published: (o.status || "published").toLowerCase() === "published" ? 1 : 0,
      // live_url omitted (you deliberately skipped it in DB)
    }),

    achievements: (o) => ({
      title: o.title || "",
      issued_at: o.issued || null,
      image_path: o.link || "",       // using image_path column to store link (simple)
      description: o.description || "",
      is_published: (o.status || "published").toLowerCase() === "published" ? 1 : 0,
    }),

    
    blogs: (o) => ({
      // posts table: create a slug from title, store excerpt as body
      title: o.title || "",
      slug: slugify(o.title || ""),
      body: o.body || "",
      cover_image: "",
      is_published: (o.status || "draft").toLowerCase() === "published" ? 1 : 0,
    }),
  };

  const fromApi = {
    projects: (r) => ({
  id: String(r.id),
  title: r.title || "",
  tech: r.tags || "",
  github: r.github_url || "",
  live: "",
  description: r.description || "",
  image_path: r.image_path || "",
  status: r.is_published ? "published" : "draft",
}),

achievements: (r) => ({
  id: String(r.id),
  title: r.title || "",
  issued: r.issued_at || "",
  link: r.image_path || "",
  description: r.description || "",
  status: r.is_published ? "published" : "draft",
}),

    blogs: (r) => ({
  id: String(r.id),
  title: r.title || "",
  status: r.is_published ? "published" : "draft",
  body: r.body || "",
  // computed preview for the table’s “Excerpt” column:
  excerpt: (r.body || "").replace(/\s+/g, " ").trim().slice(0, 140) + ((r.body || "").length > 140 ? "…" : ""),
}),

  };

  // Small helpers
  const slugify = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const fetchJSON = async (url, opt = {}) => {
    const o = { credentials: "same-origin", ...opt, headers: { ...(opt.headers || {}) } };
    // Add CSRF to non-GET requests
    if (o.method && o.method !== "GET") o.headers["X-CSRF-Token"] = CSRF;
    const res = await fetch(url, o);
    if (res.status === 401) { window.location.href = LOGIN_URL; throw new Error("Unauthorized"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || "Request failed");
    return data;
  };

  // ---- API Adapter ----
  const adapter = {
    async list(entity) {
      const ep = endpointOf(entity);
      const { data } = await fetchJSON(`${API_BASE}/${ep}.php`);
      return (data || []).map(fromApi[entity]);
    },
    async create(entity, obj) {
      const ep = endpointOf(entity);
      const payload = toApi[entity](obj);
      const data = await fetchJSON(`${API_BASE}/${ep}.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Merge returned id with UI object
      return { id: String(data.id || Date.now()), ...obj };
    },
    async update(entity, id, patch) {
      const ep = endpointOf(entity);
      const payload = { id: Number(id), ...toApi[entity](patch) };
      await fetchJSON(`${API_BASE}/${ep}.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return true;
    },
    async remove(entity, id) {
      const ep = endpointOf(entity);
      await fetchJSON(`${API_BASE}/${ep}.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      return true;
    },
    async removeMany(entity, ids) {
      // Simple loop; tables are small
      for (const id of ids) await this.remove(entity, id);
    }
  };

  // ---- Toast ----
  const toastStack = $('.toast-stack');
  const toast = (msg, type='success') => {
    if (!toastStack) return;
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    toastStack.append(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
  };

  // ---- KPIs ----
  const KPIs = {
    projects: $('#kpiProjects'),
    achievements: $('#kpiAchievements'),
    blogs: $('#kpiBlogs'),
    async update(entity) {
      const rows = await adapter.list(entity);
      if (this[entity]) this[entity].textContent = rows.length;
    },
    refreshAll() { ['projects', 'achievements', 'blogs'].forEach(e => this.update(e)); }
  };

  // ---- Panel Controller ----
  async function initPanel(panelEl) {
    const entity = panelEl.dataset.entity; // projects | achievements | blogs
    const tbody  = $('.list-body', panelEl);
    const search = $('.search-input', panelEl);
    const selectAll = $('.select-all', panelEl);
    const bulkDeleteBtn = $('.bulk-delete', panelEl);
    const openCreateBtn = $('.open-create', panelEl);
    const exportBtn = $('.export-json', panelEl);
    const importBtn = $('.import-json', panelEl);

    const modal = $(`#modal-${entity}`);
    const form  = $('.entity-form', modal);
    const titleEl = $('h3', modal);

    const tpl = $(`#row-template-${entity}`);

    // Render rows
    const render = async (query='') => {
      const all = await adapter.list(entity);
      const rows = all.filter(r => {
        if (!query) return true;
        return JSON.stringify(r).toLowerCase().includes(query.toLowerCase());
      });

      tbody.innerHTML = '';
      rows.forEach(row => {
        const tr = tpl.content.firstElementChild.cloneNode(true);
        tr.dataset.id = row.id;

        if (entity === 'projects') {
          $('.col-title', tr).textContent = row.title || '';
          $('.col-tech', tr).textContent = row.tech || '';
          $('.col-github', tr).innerHTML = row.github ? `<a href="${row.github}" target="_blank" rel="noopener">GitHub</a>` : '';
          $('.col-live', tr).innerHTML = row.live ? `<a href="${row.live}" target="_blank" rel="noopener">Live</a>` : '';
        } else if (entity === 'achievements') {
          $('.col-title', tr).textContent = row.title || '';
          $('.col-org', tr).textContent = row.organization || '';
          $('.col-issued', tr).textContent = row.issued || '';
          $('.col-link', tr).innerHTML = row.link ? `<a href="${row.link}" target="_blank" rel="noopener">Link</a>` : '';
        } else if (entity === 'blogs') {
          $('.col-title', tr).textContent = row.title || '';
          $('.col-status', tr).textContent = (row.status || 'draft').toUpperCase();
          $('.col-excerpt', tr).textContent = row.excerpt || '';
        }

        $('.edit', tr).addEventListener('click', async () => {
          openModal(modal);
          titleEl.textContent = `Edit ${entity.slice(0,1).toUpperCase()+entity.slice(1, -1)}`;
          fillForm(form, row);
        });

        $('.delete', tr).addEventListener('click', async () => {
          await adapter.remove(entity, row.id);
          await render(search.value);
          await KPIs.update(entity);
          toast('Deleted');
          updateBulkState();
        });

        $('.row-check', tr).addEventListener('change', updateBulkState);
        tbody.append(tr);
      });

      await KPIs.update(entity);
      updateBulkState();
    };

    // Search
    search.addEventListener('input', () => render(search.value));

    // Select-all + bulk delete
    selectAll.addEventListener('change', () => {
      $$('.row-check', tbody).forEach(c => (c.checked = selectAll.checked));
      updateBulkState();
    });

    function updateBulkState() {
      const checks = $$('.row-check', tbody);
      const checked = checks.filter(c => c.checked);
      bulkDeleteBtn.disabled = checked.length === 0;
      selectAll.checked = checks.length > 0 && checked.length === checks.length;
    }

    bulkDeleteBtn.addEventListener('click', async () => {
      const ids = $$('.row-check', tbody)
        .filter(c => c.checked)
        .map(c => c.closest('tr').dataset.id);
      if (ids.length === 0) return;
      await adapter.removeMany(entity, ids);
      await render(search.value);
      await KPIs.update(entity);
      toast('Deleted selected');
    });

    // Export / Import JSON (exports what’s currently listed)
    exportBtn.addEventListener('click', async () => {
      const data = await adapter.list(entity);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${entity}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    // Note: Import button left as-is but now just pre-fills create form
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const parsed = JSON.parse(reader.result);
            if (!Array.isArray(parsed)) throw new Error('Invalid JSON format');
            for (const row of parsed) await adapter.create(entity, normalize(entity)(row));
            await render(search.value);
            await KPIs.update(entity);
            toast('Imported JSON');
          } catch { toast('Import failed', 'error'); }
        };
        reader.readAsText(file);
      });
      input.click();
    });

    // Create
    $('.open-create', panelEl).addEventListener('click', () => {
      form.reset();
      form.querySelector('[name="id"]').value = '';
      titleEl.textContent = `New ${entity.slice(0,1).toUpperCase()+entity.slice(1, -1)}`;
      openModal(modal);
    });

    // Submit (Create/Update)
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(form);
      const id = data.id;
      delete data.id;

      const clean = normalize(entity)(data);

      if (id) {
        await adapter.update(entity, id, clean);
        toast('Updated');
      } else {
        await adapter.create(entity, clean);
        toast('Created');
      }

      closeModal(modal);
      await render(search.value);
      await KPIs.update(entity);
    });

    // Initial render
    await render();
  }

  // ---- Helpers ----
  function getFormData(form) {
    const data = {};
    new FormData(form).forEach((v, k) => (data[k] = typeof v === 'string' ? v.trim() : v));
    return data;
  }

  function fillForm(form, row) {
    Object.entries(row).forEach(([k, v]) => {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) el.value = v ?? '';
    });
  }

  function normalize(entity) {
    if (entity === 'projects') {
      return (o) => ({
        title: o.title || '',
        tech: o.tech || '',
        github: o.github || '',
        live: o.live || '',
        description: o.description || '',
        id: o.id || undefined
      });
    }
    if (entity === 'achievements') {
      return (o) => ({
        title: o.title || '',
        organization: o.organization || '',
        issued: o.issued || '',
        link: o.link || '',
        description: o.description || '',
        id: o.id || undefined
      });
    }
    if (entity === 'blogs') {
      return (o) => ({
        title: o.title || '',
        status: (o.status || 'draft').toLowerCase(),
        body: o.body || '',
        id: o.id || undefined
      });
    }
    return (o) => o;
  }

  // Modal open/close
  function openModal(m) {
    m.hidden = false;
    m.setAttribute('data-open', 'true');
    m.addEventListener('click', overlayClose);
    document.addEventListener('keydown', escClose);
    $('[data-close-modal]', m)?.addEventListener('click', () => closeModal(m), { once: true });
  }
  function closeModal(m) {
    m.hidden = true;
    m.removeAttribute('data-open');
    m.removeEventListener('click', overlayClose);
    document.removeEventListener('keydown', escClose);
  }
  function overlayClose(e) {
    if (e.target.classList.contains('modal')) closeModal(e.currentTarget);
  }
  function escClose(e) {
    if (e.key === 'Escape') $$('.modal[data-open="true"]').forEach(closeModal);
  }

  // Optional: Logout button (if present in your HTML)
  const logoutBtn = $('#logoutBtn');
  logoutBtn?.addEventListener('click', async () => {
    try {
      await fetch('/portfolio/app/auth/logout.php');
    } finally {
      window.location.href = LOGIN_URL;
    }
  });

  // Init all panels
  document.addEventListener('DOMContentLoaded', () => {
    $$('.card[data-entity]').forEach(el => initPanel(el));
    KPIs.refreshAll();
  });
})();
