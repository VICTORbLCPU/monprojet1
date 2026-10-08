/* Intermed Exportation — animations et interactions.
   Sans effet si l'utilisateur demande moins de mouvement : le contenu reste
   visible et statique, seules les couleurs au survol sont conservées. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("motion-ready");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;
  var motion = root.classList.contains("motion") && !reduce && hasIO;
  if (!motion) root.classList.remove("motion");

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- Découpage d'un titre en mots ---------- */
  function splitWords(el, cls) {
    var words = el.textContent.trim().split(/[ \t\r\n]+/);
    var spans = [];
    el.textContent = "";
    words.forEach(function (word, i) {
      var inner = document.createElement("span");
      inner.textContent = word;
      inner.style.setProperty("--wi", i);
      var node = inner;
      if (cls === "w") {
        node = document.createElement("span");
        node.className = "w";
        node.appendChild(inner);
      } else {
        inner.className = cls;
      }
      el.appendChild(node);
      spans.push(inner);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return spans;
  }

  /* ---------- Apparition au défilement ---------- */
  var callbacks = typeof WeakMap === "function" ? new WeakMap() : null;
  var io = motion ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add("is-in");
      io.unobserve(el);
      var cb = callbacks && callbacks.get(el);
      if (cb) cb(el);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }) : null;

  function watch(el, cb) {
    if (!el || !io) return;
    if (cb && callbacks) callbacks.set(el, cb);
    io.observe(el);
  }
  function reveal(el, i, type) {
    if (!el) return;
    el.setAttribute("data-reveal", type || "");
    el.style.setProperty("--i", i || 0);
    watch(el);
  }

  /* ---------- Compteurs ---------- */
  function counter(el) {
    var final = el.textContent.trim();
    var m = final.match(/^(\D*?)(\d+(?:,\d+)?)(\D*)$/);
    if (!m) return function () {};
    var target = parseFloat(m[2].replace(",", "."));
    var dec = m[2].indexOf(",") > -1 ? m[2].split(",")[1].length : 0;
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = final;
    var vis = document.createElement("span");
    vis.className = "count";
    vis.setAttribute("aria-hidden", "true");
    el.textContent = "";
    el.appendChild(sr);
    el.appendChild(vis);
    function show(v) {
      vis.textContent = m[1] + v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3];
    }
    show(0);
    return function start(delay) {
      setTimeout(function () {
        var t0 = performance.now(), dur = 1800;
        requestAnimationFrame(function step(now) {
          var p = clamp((now - t0) / dur, 0, 1);
          var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          if (p < 1) {
            show(target * e);
            requestAnimationFrame(step);
          } else {
            vis.textContent = final;
          }
        });
      }, delay || 0);
    };
  }

  var quote = $(".mission__card p");
  var quoteWords = [];

  if (motion) {
    /* Hero : ouverture */
    var h1 = $(".hero .display");
    if (h1 && !h1.children.length) {
      splitWords(h1, "w");
      h1.classList.add("split-words");
    }
    var heroCounters = $$(".widget__value, .pill-delta").map(counter);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add("is-loaded");
        if (h1) h1.classList.add("is-in");
        heroCounters.forEach(function (start) { start(1000); });
      });
    });

    /* Titres de section mot par mot */
    $$(".section .h2, .legal .h2").forEach(function (h) {
      if (h.children.length) return;
      splitWords(h, "w");
      h.classList.add("split-words");
      watch(h);
    });

    /* Textes, cartes et listes en cascade */
    $$(".section__head, .split__text, .products__intro").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (!child.classList.contains("h2")) reveal(child, i);
      });
    });
    $$(".grid, .stats, .awards, .contact-cards, .accreditations, .finance, .mission").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) { reveal(child, i); });
    });
    $$(".products__list li").forEach(function (li, i) { reveal(li, i + 1); });
    reveal($(".code-card"), 1, "right");
    reveal($(".easymed-card"), 1, "right");
    reveal($(".trust__title"), 0, "fade");
    $$(".legal .tag, .legal__updated, .legal__block").forEach(function (el) { reveal(el, 0); });

    /* Frise, graphique, logotype du pied de page */
    var timeline = $(".timeline");
    if (timeline) {
      $$("li", timeline).forEach(function (li, i) { li.style.setProperty("--i", i); });
      watch(timeline);
    }
    watch($("#revenue-chart"));
    // Le logotype est collé au bas de la page : on le déclenche quand le pied de page arrive.
    var megaText = $(".footer__mega");
    if (megaText) watch($(".footer"), function () { megaText.classList.add("is-in"); });

    /* Compteurs des chiffres clés */
    $$(".stats dd, .commit__figure").forEach(function (el) {
      var start = counter(el);
      watch(el, function () { start(250); });
    });

    /* Bloc de code : une ligne après l'autre */
    var code = $(".code-card code");
    if (code) {
      code.innerHTML = code.innerHTML.split("\n").map(function (line, i) {
        return '<span class="ln" style="--i:' + i + '">' + line + "</span>";
      }).join("\n");
      var caret = document.createElement("span");
      caret.className = "caret";
      caret.setAttribute("aria-hidden", "true");
      code.lastElementChild.appendChild(caret);
    }

    /* Raison d'être : mots allumés au fil du défilement */
    if (quote) quoteWords = splitWords(quote, "w2");

    /* Distinctions en défilement continu */
    var trust = $(".trust");
    var list = trust && $(".trust__list", trust);
    if (list) {
      var viewport = document.createElement("div");
      viewport.className = "trust__viewport";
      var track = document.createElement("div");
      track.className = "trust__track";
      list.parentNode.insertBefore(viewport, list);
      viewport.appendChild(track);
      track.appendChild(list);
      for (var k = 0; k < 3; k++) {
        var copy = list.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      }
      trust.classList.add("trust--marquee");
    }
  }

  /* ---------- Menu mobile : ordre de la cascade ---------- */
  $$(".nav__links > a").forEach(function (a, i) { a.style.setProperty("--i", i); });

  /* ---------- Navigation : section active et pastille ---------- */
  var nav = $("#nav");
  var linksWrap = $(".nav__links");
  var spy = $$('.nav__links a[href^="#"]:not(.btn)').map(function (a) {
    return { link: a, sec: document.getElementById(a.getAttribute("href").slice(1)) };
  }).filter(function (s) { return s.sec; });
  var activeLink = null, hoverLink = null, indicator = null;

  function placeIndicator(a) {
    if (!indicator) return;
    if (!a || window.innerWidth <= 980) {
      indicator.classList.remove("is-on");
      return;
    }
    if (!indicator.classList.contains("is-on")) {
      indicator.style.transition = "none";
      indicator.style.setProperty("--ix", a.offsetLeft + "px");
      indicator.style.setProperty("--iw", a.offsetWidth + "px");
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
    indicator.style.setProperty("--ix", a.offsetLeft + "px");
    indicator.style.setProperty("--iw", a.offsetWidth + "px");
    indicator.classList.add("is-on");
  }

  if (fine && linksWrap && spy.length) {
    indicator = document.createElement("span");
    indicator.className = "nav__indicator";
    indicator.setAttribute("aria-hidden", "true");
    linksWrap.insertBefore(indicator, linksWrap.firstChild);
    linksWrap.classList.add("has-indicator");
    spy.forEach(function (s) {
      s.link.addEventListener("mouseenter", function () { hoverLink = s.link; placeIndicator(s.link); });
    });
    linksWrap.addEventListener("mouseleave", function () { hoverLink = null; placeIndicator(activeLink); });
  }

  /* ---------- Défilement : progression, navigation, parallaxe ---------- */
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  var hero = $(".hero");
  var heroCopy = $(".hero__copy");
  var heroVisual = $(".hero__visual");
  var lastY = window.scrollY;
  var ticking = false;

  function onScrollFrame() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    progress.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
    root.classList.toggle("has-scrolled", y > 40);

    if (motion && nav) {
      var keep = nav.classList.contains("is-open") || nav.contains(document.activeElement);
      if (!keep && y > lastY + 6 && y > 480) nav.classList.add("is-hidden");
      else if (keep || y < lastY - 6 || y <= 480) nav.classList.remove("is-hidden");
    }
    lastY = y;

    if (spy.length) {
      var current = null;
      spy.forEach(function (s) {
        var r = s.sec.getBoundingClientRect();
        if (r.top <= vh * 0.4 && r.bottom > vh * 0.4) current = s.link;
      });
      if (current !== activeLink) {
        if (activeLink) activeLink.classList.remove("is-active");
        if (current) current.classList.add("is-active");
        activeLink = current;
        if (!hoverLink) placeIndicator(activeLink);
      }
    }

    if (motion && hero && y < vh * 1.3) {
      if (heroCopy) {
        heroCopy.style.translate = "0 " + (y * 0.16).toFixed(1) + "px";
        heroCopy.style.opacity = clamp(1 - y / (vh * 0.85), 0, 1).toFixed(3);
      }
      if (heroVisual) heroVisual.style.translate = "0 " + (y * 0.07).toFixed(1) + "px";
    }

    if (quoteWords.length) {
      var q = quote.getBoundingClientRect();
      var p = clamp((vh * 0.85 - q.top) / (vh * 0.45), 0, 1);
      var lit = Math.round(p * quoteWords.length);
      quoteWords.forEach(function (w, i) { w.classList.toggle("is-lit", i < lit); });
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }, { passive: true });
  window.addEventListener("resize", function () {
    placeIndicator(hoverLink || activeLink);
    onScrollFrame();
  });
  onScrollFrame();

  /* ---------- Effets à la souris (ordinateur uniquement) ---------- */
  if (!fine) return;

  // Cartes : halo + bordure lumineuse ; inclinaison sur les cartes de grille
  var tiltSel = ".grid > .card, .accreditation, .easymed-card";
  $$(tiltSel + ", .contact-card, .chart-card, .table-card").forEach(function (card) {
    var tilt = motion && card.matches(tiltSel);
    card.classList.add("fx-card");
    if (tilt) card.classList.add("fx-tilt");
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--px", x.toFixed(0) + "px");
      card.style.setProperty("--py", y.toFixed(0) + "px");
      if (tilt) {
        card.style.setProperty("--rx", ((y / r.height - 0.5) * -5).toFixed(2) + "deg");
        card.style.setProperty("--ry", ((x / r.width - 0.5) * 5).toFixed(2) + "deg");
      }
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  if (!motion) return;

  // Boutons magnétiques
  $$(".btn--lg, .nav__actions .btn, .nav__back").forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      b.style.translate = (dx * 0.18).toFixed(1) + "px " + (dy * 0.3).toFixed(1) + "px";
    });
    b.addEventListener("pointerleave", function () { b.style.translate = ""; });
  });

  // Halo qui suit la souris
  $$(".hero, .section--deep").forEach(function (sec) {
    sec.addEventListener("pointermove", function (e) {
      var r = sec.getBoundingClientRect();
      sec.style.setProperty("--sx", (e.clientX - r.left).toFixed(0) + "px");
      sec.style.setProperty("--sy", (e.clientY - r.top).toFixed(0) + "px");
      sec.classList.add("is-pointer");
    });
    sec.addEventListener("pointerleave", function () { sec.classList.remove("is-pointer"); });
  });

  // Logotype du pied de page éclairé par la souris
  var footer = $(".footer");
  var mega = $(".footer__mega");
  if (footer && mega) {
    footer.addEventListener("pointermove", function (e) {
      var r = mega.getBoundingClientRect();
      mega.style.setProperty("--px", (e.clientX - r.left).toFixed(0) + "px");
      mega.style.setProperty("--py", (e.clientY - r.top).toFixed(0) + "px");
    });
    footer.addEventListener("pointerleave", function () {
      mega.style.removeProperty("--px");
      mega.style.removeProperty("--py");
    });
  }

  // Hero : profondeur (carte et cartes flottantes suivent la souris)
  if (hero) {
    var map = $(".map");
    var layers = [
      { el: map, x: -12, y: -8 },
      { el: $(".widget--revenue"), x: 20, y: 14 },
      { el: $(".widget--cold"), x: 30, y: 20 }
    ].filter(function (l) { return l.el; });
    var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, raf = null;
    var tick = function () {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      layers.forEach(function (l) {
        l.el.style.translate = (cur.x * l.x).toFixed(2) + "px " + (cur.y * l.y).toFixed(2) + "px";
      });
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.002 ? requestAnimationFrame(tick) : null;
    };
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () {
      target.x = 0;
      target.y = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }
})();
