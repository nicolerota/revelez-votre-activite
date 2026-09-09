document.addEventListener('DOMContentLoaded', () => {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document.documentElement;

  /* ── Anciens liens à ancre, du temps du site en une seule page ──
     Les liens et favoris qui traînent encore (#programme, #tarifs…)
     sont renvoyés vers la page qui porte désormais la section,
     au lieu de tomber dans le vide. */
  const LEGACY = {
    '#programme': '/formation#programme',
    '#deroulement': '/formation#deroulement',
    '#avis': '/formation#avis',
    '#financement': '/formation#tarifs',
    '#sur-mesure': '/formation#tarifs',
    '#module-1': '/formation#module-1',
    '#module-2': '/formation#module-2',
    '#module-3': '/formation#module-3',
    '#module-4': '/formation#module-4',
    '#faq': '/formation#faq',
    '#apropos': '/qui-je-suis',
    '#instagram': '/qui-je-suis#instagram',
    '#organismes': '/organismes',
    '#rdv': '/contact',
    '#reserver': '/contact',
    '#audit': '/contact'
  };
  const hash = window.location.hash;
  if (hash && LEGACY[hash] && !document.querySelector(hash)) {
    window.location.replace(LEGACY[hash]);
    return;
  }

  /* ── Menu overlay ── */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const toggleMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  burger.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ── Instagram — section affichée seulement si les photos existent ──
     Les tuiles sont en lazy-loading : on sonde donc insta-1.jpg avec une
     image hors DOM. Absente = la section entière est retirée, pour ne pas
     montrer une grille vide. Dès que les photos sont déposées à la racine,
     la section réapparaît d'elle-même, sans toucher au code. */
  const insta = document.getElementById('instagram');
  if (insta) {
    const probe = new Image();
    probe.onerror = () => {
      insta.remove();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    probe.src = 'insta-1.jpg';
  }

  /* ── Nav stuck ── */
  const nav = document.getElementById('nav');
  const onScrollNav = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ── Floating CTA ── */
  const floatCta = document.getElementById('floatCta');
  window.addEventListener('scroll', () => {
    floatCta.classList.toggle('show', window.scrollY > 700);
  }, { passive: true });

  /* ── Smooth anchor scroll (offset header) ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id === '#top') { if (id === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); } return; }
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    });
  });

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.height = open ? a.scrollHeight + 'px' : '0px';
    });
  });
  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.open .faq-a').forEach(a => { a.style.height = a.scrollHeight + 'px'; });
  });

  /* ── Split hero title into words ── */
  const splitWords = (el) => {
    const nodes = Array.from(el.childNodes);
    const out = document.createDocumentFragment();
    nodes.forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (!tok.trim()) { out.appendChild(document.createTextNode(tok)); return; }
          const w = document.createElement('span'); w.className = 'word'; w.textContent = tok;
          out.appendChild(w);
        });
      } else if (node.nodeType === 1) {
        const w = document.createElement('span'); w.className = 'word';
        w.appendChild(node.cloneNode(true));
        out.appendChild(w);
      }
    });
    el.textContent = '';
    el.appendChild(out);
  };
  const heroTitle = document.querySelector('[data-hero-title]');
  if (heroTitle) splitWords(heroTitle);

  /* ── Counters ── */
  const fmt = (n) => n.toLocaleString('fr-FR');
  const runCounter = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseInt(el.dataset.count, 10);
    if (RM || isNaN(target)) { el.textContent = isNaN(target) ? el.textContent : fmt(target); return; }
    const dur = 1300, t0 = performance.now();
    const step = (now) => {
      const p = Math.max(0, Math.min((now - t0) / dur, 1));
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ── Reveals (CSS transitions + IntersectionObserver) — indépendant de GSAP ── */
  const revealables = Array.from(document.querySelectorAll('[data-anim]'));
  const counters = Array.from(document.querySelectorAll('[data-count]'));
  const revealAll = () => {
    revealables.forEach(el => el.classList.add('in'));
    counters.forEach(runCounter);
    if (heroTitle) heroTitle.style.opacity = '1';
  };
  if (RM || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    const revIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        revIO.unobserve(e.target);
        if (e.target.matches('.hero__stats')) counters.forEach(runCounter);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
    revealables.forEach(el => { if (!el.closest('.hero')) revIO.observe(el); });
    const cntIO = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cntIO.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(el => cntIO.observe(el));
    /* Failsafe : tout révéler au bout de 3,5 s quoi qu'il arrive */
    setTimeout(revealAll, 3500);
  }

  /* ── Promesse : onglets verticaux ── */
  (() => {
    const root = document.getElementById('promiseTabs');
    if (!root) return;
    const tabs   = [...root.querySelectorAll('.vtab')];
    const slides = [...root.querySelectorAll('.vslide')];
    const frame  = root.querySelector('.vtabs__frame');
    if (!tabs.length) return;

    const DELAY = 6000;
    let i = 0, timer = null, paused = false, started = false;

    const show = (next) => {
      next = (next + tabs.length) % tabs.length;
      if (next === i) return;
      const prev = i; i = next;

      tabs.forEach((t, k) => {
        t.classList.toggle('is-active', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.classList.remove('is-running', 'is-paused');
      });
      slides.forEach((sl, k) => {
        sl.classList.toggle('is-active', k === i);
        sl.classList.toggle('is-leaving', k === prev);
      });
      run();
    };

    const run = () => {
      clearTimeout(timer);
      const active = tabs[i];
      active.classList.remove('is-running', 'is-paused');
      void active.offsetWidth;                 // relance l'animation de la barre
      if (RM || paused || !started) { active.classList.add('is-paused'); return; }
      active.classList.add('is-running');
      timer = setTimeout(() => show(i + 1), DELAY);
    };

    tabs.forEach((t, k) => t.addEventListener('click', () => { paused = false; started = true; show(k); }));
    root.querySelectorAll('.vtabs__btn').forEach(b =>
      b.addEventListener('click', () => { paused = false; started = true; show(i + Number(b.dataset.dir)); }));

    if (frame) {
      frame.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer);
        tabs[i].classList.remove('is-running'); tabs[i].classList.add('is-paused'); });
      frame.addEventListener('mouseleave', () => { paused = false; run(); });
    }

    /* Le carrousel attend d'être à l'écran : sinon, le temps qu'on fasse
       défiler jusqu'ici, il en serait déjà au 3e onglet. Il repart de
       l'onglet 1 tant que personne ne l'a encore vu, et se met en pause
       dès qu'il ressort du champ. */
    if (RM || !('IntersectionObserver' in window)) {
      started = true;
      run();
    } else {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            if (!started) { started = true; run(); }
            else if (!paused) run();
          } else {
            clearTimeout(timer);
            tabs[i].classList.remove('is-running');
            tabs[i].classList.add('is-paused');
          }
        });
      }, { threshold: 0.35 });
      vio.observe(root);
      run();   // affiche l'onglet 1 figé, barre à l'arrêt
    }
  })();

  /* ── Modules : où la première carte s'arrête, juste sous le titre collé ──
     Mesuré ici et pas dans le bloc GSAP : si la librairie ne charge pas,
     la valeur de repli du CSS laissait les cartes recouvrir le titre. */
  const modPin = document.querySelector('.modules__pin');
  const modHead = document.querySelector('.modules__head');
  if (modPin && modHead) {
    let stackTop = 0;
    const setStackTop = () => {
      const top = Math.round(88 + modHead.offsetHeight + 20);
      /* on n'écrit que si la valeur change : écrire à chaque passage
         modifiait la mise en page, ce qui relançait un refresh, en boucle */
      if (top !== stackTop) {
        stackTop = top;
        modPin.style.setProperty('--stack-top', top + 'px');
      }
    };
    setStackTop();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setStackTop);
    let stackResizeT;
    window.addEventListener('resize', () => {
      clearTimeout(stackResizeT);
      stackResizeT = setTimeout(setStackTop, 150);
    });
  }

  /* ── GSAP ── */
  const startGSAP = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      revealAll();
      document.querySelectorAll('.hero [data-anim]').forEach(el => el.classList.add('in'));
      if (heroTitle) heroTitle.style.opacity = '1';
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const EASE = 'expo.out';

    /* Hero intro — l'accueil est la seule page qui porte le grand hero */
    if (document.querySelector('.hero')) {
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.set('.hero__title', { opacity: 1 }, 0)
      .from('.hero__title .word', { opacity: 0, yPercent: 70, duration: 1, stagger: 0.055 }, 0.1)
      .to('.hero .eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.15)
      .to('.hero__promise', { opacity: 1, y: 0, duration: 0.85 }, 0.38)
      .to('.hero__sub', { opacity: 1, y: 0, duration: 0.9 }, 0.5)
      .to('.hero__tags', { opacity: 1, y: 0, duration: 0.9 }, 0.55)
      .to('.hero__stats', { opacity: 1, y: 0, duration: 0.9 }, 0.6)
      .to('.hero__cta', { opacity: 1, y: 0, duration: 0.8 }, 0.72)
      .to('.hero__note', { opacity: 1, y: 0, duration: 0.7 }, 0.84);
    }

    /* Aurora parallax */
    gsap.to('.aurora__blob--1', { yPercent: 18, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
    gsap.to('.aurora__blob--2', { yPercent: -22, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
    gsap.to('.aurora__blob--3', { yPercent: 14, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

    /* Hero fade on scroll */
    if (document.querySelector('.hero')) {
      gsap.to('.hero__inner', {
        y: 90, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    /* Modules — les cartes s'empilent sous le titre resté collé en haut. */
    const stackCards = gsap.utils.toArray('.modules__stack .module');
    if (modPin && modHead) {
      if (stackCards.length > 1 && window.matchMedia('(min-width: 901px)').matches) {
        stackCards.forEach((card, i) => {
          if (i === stackCards.length - 1) return;
          gsap.to(card, {
            scale: 0.965, opacity: 0.72, ease: 'none', transformOrigin: '50% 0%',
            scrollTrigger: {
              trigger: stackCards[i + 1],
              start: 'top bottom-=180',
              end: () => 'top top+=' + (parseInt(getComputedStyle(modPin).getPropertyValue('--stack-top'), 10) + 20),
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        });
      }
    }

    /* Timeline draw */
    const rail = document.querySelector('.process__rail');
    if (rail) {
      gsap.to(rail, {
        '--draw': 1, ease: 'none',
        scrollTrigger: { trigger: '#process', start: 'top 70%', end: 'bottom 80%', scrub: true }
      });
    }

    /* ── Animations de la moitié basse du site ── */

    /* Tarifs — les deux cartes montent en cascade (accompagnement complet d'abord) */
    const offerCards = gsap.utils.toArray('#tarifs .offer');
    if (offerCards.length) gsap.from(offerCards, {
      opacity: 0, y: 30, duration: 0.8, ease: EASE, stagger: 0.16,
      scrollTrigger: { trigger: '#tarifs .offers', start: 'top 82%', once: true }
    });
    document.querySelectorAll('#tarifs [data-count]').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => runCounter(el) });
    });

    /* CTA final — le titre se compose mot à mot */
    const finalTitle = document.querySelector('.final__title');
    if (finalTitle) {
      splitWords(finalTitle);
      gsap.from(finalTitle.querySelectorAll('.word'), {
        opacity: 0, yPercent: 80, duration: 0.9, ease: EASE, stagger: 0.06,
        scrollTrigger: { trigger: '.final', start: 'top 72%', once: true }
      });
    }

    /* Refresh after fonts + calendly */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  };

  let gsapTries = 0;
  const waitGSAP = () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') { startGSAP(); return; }
    if (++gsapTries > 40) { startGSAP(); return; } // fallback: reveal all
    setTimeout(waitGSAP, 80);
  };
  if (RM) {
    doc.classList.remove('anim');
    document.querySelectorAll('[data-count]').forEach(runCounter);
  } else {
    waitGSAP();
  }
});
