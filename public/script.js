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
