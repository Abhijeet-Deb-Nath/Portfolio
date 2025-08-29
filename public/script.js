/* =======================================================
   Portfolio Front-End Interactions (no frameworks)
   - Mobile menu toggle
   - Smooth scroll with header offset
   - Active nav link on scroll (throttled)
   - Reveal-on-scroll animations
   - Skill bars animation
   - Back-to-top button
   - Contact form demo handler
   - Small typed text cycling (lightweight)
   ======================================================= */

(function () {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Elements
  const header = $('.header');
  const menuToggle = $('#menuToggle');
  const navMenu = $('#navMenu');
  const backToTop = $('#backToTop');

  // --- Mobile Menu Toggle
  menuToggle?.addEventListener('click', () => {
    const open = navMenu?.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', !!open);
  });

  // Close menu when a link is clicked (mobile)
  $$('.nav-menu a').forEach(a =>
    a.addEventListener('click', () => {
      navMenu?.classList.remove('active');
      document.body.classList.remove('nav-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    })
  );

  // --- Smooth Scroll (accounts for fixed header)
  const scrollWithOffset = (targetEl) => {
    const y = targetEl.getBoundingClientRect().top + window.pageYOffset;
    const headerH = header ? header.getBoundingClientRect().height : 0;
    window.scrollTo({ top: y - headerH - 12, behavior: 'smooth' });
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#') return; // ignore dummy anchors
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      scrollWithOffset(target);
    }
  });

  // --- Header compact on scroll
  const onScrollHeader = () => {
    if (!header) return;
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  // --- Active Nav Link Highlight
  const sections = $$('section[id]');
  const navLinks = $$('.nav-menu a');

  const setActiveLink = () => {
    const fromTop = window.scrollY + (header?.offsetHeight || 0) + 24;
    let currentId = sections[0]?.id || '';
    for (const sec of sections) {
      if (sec.offsetTop <= fromTop) currentId = sec.id;
    }
    navLinks.forEach(link => {
      const match = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('active', match);
      link.setAttribute('aria-current', match ? 'page' : 'false');
    });
  };

  // Throttle scroll handlers with rAF
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      setActiveLink();
      toggleBackToTop();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Reveal on Scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.addEventListener('DOMContentLoaded', () => {
    $$('.fade-in, .slide-in, .slide-in-right').forEach(el => revealObserver.observe(el));

    // --- Skill bars animation
    $$('.skill-progress').forEach(bar => {
      const pct = parseInt(bar.dataset.progress || '0', 10);
      // start at 0, then animate to data-progress
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = `${pct}%`; }, 200);
    });

    // --- Footer year
    const yEl = $('#year');
    if (yEl) yEl.textContent = new Date().getFullYear();

    // First paint logic
    onScrollHeader();
    setActiveLink();
    toggleBackToTop();

    // --- Tiny "typed" text cycler (no external lib)
    const typedEl = $('.typed');
    if (typedEl) {
      try {
        const phrases = JSON.parse(typedEl.getAttribute('data-typed') || '[]');
        if (phrases.length) cycleTyped(typedEl, phrases, 1700);
      } catch {}
    }
  });

  // --- Back to Top
  const toggleBackToTop = () => {
    if (!backToTop) return;
    const show = window.scrollY > 500;
    backToTop.classList.toggle('show', show);
  };
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // --- Contact Form (demo)
  const contactForm = $('#contactForm');
  const formNote = $('#formNote');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    // Basic validation (frontend only)
    if (!name || !email || !message) {
      showFormNote('Please fill in the required fields.', 'error');
      return;
    }

    // Demo: pretend we sent it
    contactForm.reset();
    showFormNote('Thanks! Your message has been queued. (Demo form)', 'success');
  });

  function showFormNote(text, type = 'success') {
    if (!formNote) return;
    formNote.textContent = text;
    formNote.className = `form-note ${type}`;
    setTimeout(() => { formNote.textContent = ''; formNote.className = 'form-note'; }, 3000);
  }

  // --- Tiny typed effect
  function cycleTyped(el, phrases, dwell = 1500) {
    let i = 0;
    const render = () => {
      el.textContent = phrases[i % phrases.length];
      i++;
    };
    render();
    setInterval(render, dwell);
  }
})();


document.addEventListener('DOMContentLoaded', async () => {
  const adminIcon  = document.querySelector('.admin-icon');  // shield link
  const frontLogout = document.getElementById('frontLogout');

  try {
    const res = await fetch('/portfolio/app/auth/me.php', { credentials: 'same-origin' });
    const me  = await res.json();

    if (me && me.is_admin) {
      if (adminIcon) adminIcon.setAttribute('href', '/portfolio/public/manhattan.html');
      if (frontLogout) {
        frontLogout.hidden = false;  // show only for admin
        frontLogout.addEventListener('click', async (e) => {
          e.preventDefault();
          try { await fetch('/portfolio/app/auth/logout.php', { credentials: 'same-origin' }); }
          finally {
            sessionStorage.removeItem('csrf');
            location.reload();
          }
        });
      }
    } else {
      // viewer: keep logout hidden
      if (frontLogout) frontLogout.hidden = true;
    }
  } catch {
    // on any failure, hide for safety
    if (frontLogout) frontLogout.hidden = true;
  }
});


// ---------- Public site: render DB content (read-only) ----------
(function () {
  const API_BASE = "/portfolio/app/api";
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const fetchJSON = async (url) => {
    const res = await fetch(url, { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || "Request failed");
    return data;
  };
  const esc = (s) => (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function loadProjects() {
    const wrap = $(".projects-grid");
    if (!wrap) return;
    try {
      const { data } = await fetchJSON(`${API_BASE}/projects.php`);
      wrap.innerHTML = "";
      (data || []).forEach(p => {
        const tags = (p.tags || "").split(",").map(s => s.trim()).filter(Boolean);
        const el = document.createElement("article");
        el.className = "project-card fade-in";
        el.innerHTML = `
          <div class="project-image">
            <div class="project-placeholder"><i class="fas fa-code"></i></div>
          </div>
          <div class="project-content">
            <h3>${esc(p.title)}</h3>
            <p>${esc((p.description || "").slice(0, 160))}${(p.description || "").length > 160 ? "…" : ""}</p>
            <div class="project-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
            <div class="project-links">
              ${p.github_url ? `<a class="project-link" href="${p.github_url}" target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a>` : ""}
            </div>
          </div>`;
        wrap.appendChild(el);
      });
    } catch (e) { console.warn("Projects load failed:", e); }
  }

  async function loadAchievements() {
    const wrap = $(".achievements-grid");
    if (!wrap) return;
    try {
      const { data } = await fetchJSON(`${API_BASE}/achievements.php`);
      wrap.innerHTML = "";
      (data || []).forEach(a => {
        const el = document.createElement("div");
        el.className = "achievements-card fade-in";
        el.innerHTML = `
          <div class="achievements-image">
            <div class="achievements-placeholder">
              <i class="fas fa-trophy"></i>
              <p>Achievement</p>
            </div>
          </div>
          <div class="achievements-content">
            <h3>${esc(a.title)}</h3>
            <p class="issue-date">Issued: ${esc(a.issued_at || "")}</p>
          </div>`;
        wrap.appendChild(el);
      });
    } catch (e) { console.warn("Achievements load failed:", e); }
  }

  async function loadBlogs() {
    const wrap = $(".blog-cards");
    if (!wrap) return;
    try {
      const { data } = await fetchJSON(`${API_BASE}/posts.php`);
      wrap.innerHTML = "";
      (data || []).forEach(b => {
        const excerpt = (b.body || "").replace(/\s+/g, " ").trim().slice(0, 160) + ((b.body || "").length > 160 ? "…" : "");
        const el = document.createElement("article");
        el.className = "card fade-in";
        el.innerHTML = `
          <a href="#" class="card-link" aria-label="Read blog post: ${esc(b.title || "")}">
            <div class="card-content">
              <h3>${esc(b.title || "")}</h3>
              <p>${esc(excerpt)}</p>
            </div>
          </a>`;
        wrap.appendChild(el);
      });
    } catch (e) { console.warn("Blogs load failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
    loadAchievements();
    loadBlogs();
  });
})();
