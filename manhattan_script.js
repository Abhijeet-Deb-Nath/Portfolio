/* ===============================
   Front-end CRUD Scaffolding
   Entities: projects, achievements, blogs
   Storage: localStorage (no backend yet)
   =============================== */

(() => {
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const STORE = {
    projects: 'adm.projects',
    achievements: 'adm.achievements',
    blogs: 'adm.blogs',
  };

  // ---- Adapter (swap this later with PHP+MySQL) ----
  const adapter = {
    load(entity) {
      try { return JSON.parse(localStorage.getItem(STORE[entity]) || '[]'); }
      catch { return []; }
    },
    save(entity, rows) {
      localStorage.setItem(STORE[entity], JSON.stringify(rows));
    },
    create(entity, row) {
      const rows = this.load(entity);
      rows.unshift({ id: Date.now().toString(), ...row });
      this.save(entity, rows);
      return rows[0];
    },
    update(entity, id, patch) {
      const rows = this.load(entity);
      const i = rows.findIndex(r => r.id === id);
      if (i >= 0) { rows[i] = { ...rows[i], ...patch }; this.save(entity, rows); return rows[i]; }
      return null;
    },
    remove(entity, id) {
      const rows = this.load(entity).filter(r => r.id !== id);
      this.save(entity, rows);
    },
    removeMany(entity, ids) {
      const set = new Set(ids);
      const rows = this.load(entity).filter(r => !set.has(r.id));
      this.save(entity, rows);
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
    update(entity) {
      const count = adapter.load(entity).length;
      if (this[entity]) this[entity].textContent = count;
    },
    refreshAll() { ['projects', 'achievements', 'blogs'].forEach(e => this.update(e)); }
  };

  // ---- Panel Controller ----
  function initPanel(panelEl) {
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

    // Template
    const tpl = $(`#row-template-${entity}`);

    // Render rows
    const render = (query='') => {
      const rows = adapter.load(entity).filter(r => {
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

        // Edit
        $('.edit', tr).addEventListener('click', () => {
          openModal(modal);
          titleEl.textContent = `Edit ${entity.slice(0,1).toUpperCase()+entity.slice(1, -1)}`;
          fillForm(form, row);
        });

        // Delete
        $('.delete', tr).addEventListener('click', () => {
          adapter.remove(entity, row.id);
          render(search.value);
          KPIs.update(entity);
          toast('Deleted');
          updateBulkState();
        });

        // Row checkbox
        $('.row-check', tr).addEventListener('change', updateBulkState);

        tbody.append(tr);
      });

      KPIs.update(entity);
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

    bulkDeleteBtn.addEventListener('click', () => {
      const ids = $$('.row-check', tbody)
        .filter(c => c.checked)
        .map(c => c.closest('tr').dataset.id);
      if (ids.length === 0) return;
      adapter.removeMany(entity, ids);
      render(search.value);
      KPIs.update(entity);
      toast('Deleted selected');
    });

    // Export / Import JSON
    exportBtn.addEventListener('click', () => {
      const data = adapter.load(entity);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${entity}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            if (!Array.isArray(parsed)) throw new Error('Invalid JSON format');
            adapter.save(entity, parsed.map(normalize(entity)));
            render(search.value);
            KPIs.update(entity);
            toast('Imported JSON');
          } catch {
            toast('Import failed', 'error');
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });

    // Create
    openCreateBtn.addEventListener('click', () => {
      form.reset();
      form.querySelector('[name="id"]').value = '';
      titleEl.textContent = `New ${entity.slice(0,1).toUpperCase()+entity.slice(1, -1)}`;
      openModal(modal);
    });

    // Submit (Create/Update)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = getFormData(form);
      const id = data.id;
      delete data.id;

      // Normalize fields per entity
      const clean = normalize(entity)(data);

      if (id) {
        adapter.update(entity, id, clean);
        toast('Updated');
      } else {
        adapter.create(entity, clean);
        toast('Created');
      }

      closeModal(modal);
      render(search.value);
      KPIs.update(entity);
    });

    // Initial seed (optional) if empty
    if (adapter.load(entity).length === 0) {
      const seeds = {
        projects: [
          { title: 'Portfolio Website', tech: 'Laravel, MySQL', github: '', live: '', description: '' },
          { title: 'CP Helper CLI', tech: 'C++', github: '', live: '', description: '' },
        ],
        achievements: [
          { title: 'Math Olympiad Medal', organization: 'Regional', issued: '2020-06', link: '', description: '' },
        ],
        blogs: [
          { title: 'Laravel Project Structure', status: 'published', excerpt: 'How I structure Laravel apps.' },
          { title: 'Competitive Programming Notes', status: 'draft', excerpt: 'Quick patterns and tips.' },
        ],
      };
      adapter.save(entity, seeds[entity] || []);
    }

    render();
  }

  // ---- Helpers ----
  function getFormData(form) {
    const data = {};
    new FormData(form).forEach((v, k) => data[k] = (typeof v === 'string' ? v.trim() : v));
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
        excerpt: o.excerpt || '',
        id: o.id || undefined
      });
    }
    return (o) => o;
  }

  // Modal open/close
  function openModal(m) {
    m.hidden = false;
    m.setAttribute('data-open', 'true');
    // close on overlay click / Esc
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

  // Init all panels
  document.addEventListener('DOMContentLoaded', () => {
    $$('.card[data-entity]').forEach(initPanel);
    KPIs.refreshAll();
  });
})();
